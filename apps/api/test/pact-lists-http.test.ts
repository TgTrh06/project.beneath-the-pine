import { io, type Socket } from 'socket.io-client';
import { realtimeEvents } from '@beneath-the-pine/contracts';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
const base=process.env.BTP_SOLO_API_URL;
const database=process.env.BTP_SOLO_DATABASE_URL;
const origin=process.env.BTP_SOLO_WEB_ORIGIN ?? 'http://localhost:5173';
class Client {
  id=''; cookie=''; csrf=''; email=`pact-regression-${randomUUID()}@example.test`; password=randomBytes(24).toString('hex');
  async req(path:string,method='GET',body?:unknown,key?:string) {
    const result=await fetch(base+path,{method,signal:AbortSignal.timeout(15000),headers:{origin,cookie:this.cookie,'Content-Type':'application/json',...(method==='GET'?{}:{'X-XSRF-TOKEN':this.csrf}),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    for(const value of result.headers.getSetCookie())this.cookie=value.split(';')[0];
    const data= result.status===204?{}:await result.json(); if(data.csrfToken)this.csrf=data.csrfToken;
    return {status:result.status,data};
  }
}
test('pact lists, membership, invitation metadata and archive on existing local database',{skip:!base||!database},async t=>{
  for(const url of [base!,database!,origin])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname));
  const pool=new Pool({connectionString:database});const users:Client[]=[];const groups:string[]=[];const sockets:Socket[]=[];
  const receive=(socket:Socket,event:string)=>new Promise<any>((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error(`Missing realtime event: ${event}`)),3000);socket.once(event,value=>{clearTimeout(timeout);resolve(value);});});
  try {
    for(let i=0;i<4;i++){const client=new Client();await client.req('/auth/session');const result=await client.req('/auth/register','POST',{email:client.email,password:client.password});assert.equal(result.status,201);client.id=result.data.account.id;users.push(client);assert.equal((await pool.query('select id from identity_accounts where id=$1 and email=$2',[client.id,client.email])).rowCount,1);}
    const [a,b,c,d]=users;
    const makeGroup=async()=>{const result=await a.req('/circles','POST',{name:'Integration fixture'});assert.equal(result.status,201);groups.push(result.data.circle.id);return result.data.circle.id as string;};
    const invite=async(group:string)=>{const result=await a.req(`/circles/${group}/invites`,'POST',{});assert.equal(result.status,201);assert.equal(result.data.invite.tokenHash,undefined);return result.data.invite;};
    const group=await makeGroup();
    for(const user of [b,c]){const link=await invite(group);assert.equal((await user.req(`/circle-invites/${link.token}/accept`,'POST')).status,201);}
    const create=async(key=randomUUID())=>a.req(`/circles/${group}/pacts`,'POST',{participantIds:[b.id],startsAt:new Date().toISOString(),durationMinutes:5},key);
    let pact=''; let session='';
    await t.test('same-key creation and participant-only inbox',async()=>{
      const key=randomUUID();const results=await Promise.all([create(key),create(key)]);assert.deepEqual(results.map(r=>r.status),[201,201]);assert.equal(results[0].data.pact.id,results[1].data.pact.id);pact=results[0].data.pact.id;
      assert.equal((await b.req('/me/pacts?group=pending')).data.items[0].id,pact);
      assert.equal((await c.req(`/circles/${group}/pacts?group=pending`)).data.items.length,0);
      for(const user of [c,d])assert.equal((await user.req(`/pacts/${pact}`)).status,404);
      assert.equal((await d.req(`/circles/${group}/pacts`)).status,404);
      assert.equal((await b.req(`/circles/${group}/invites`)).status,403);
      assert.equal((await a.req('/me/pacts?limit=51')).status,400);
      assert.equal((await a.req('/me/pacts?cursor=invalid')).status,400);
    });
    await t.test('respond, start, join and removal revoke access',async()=>{
      assert.equal((await a.req(`/circles/${group}`,'PATCH',{status:'archived'})).status,409);
      assert.equal((await b.req(`/pacts/${pact}/respond`,'POST',{response:'accepted'})).status,201);
      assert.equal((await b.req('/me/pacts?group=upcoming')).data.items[0].id,pact);
      const start=await a.req(`/pacts/${pact}/start`,'POST',{},randomUUID());assert.equal(start.status,201);session=start.data.session.id;
      assert.equal((await b.req(`/focus-sessions/${session}/join`,'POST')).status,201);
      assert.equal((await b.req('/me/pacts?group=active')).data.items[0].sessionId,session);
      const socket=io(new URL(base!).origin+'/realtime',{transports:['websocket'],reconnection:false,extraHeaders:{Origin:origin,Cookie:b.cookie}});sockets.push(socket);await receive(socket,'connect');
      const snap=receive(socket,realtimeEvents.snapshot);socket.emit(realtimeEvents.subscribe,{sessionId:session});assert.equal((await snap).id,session);
      assert.equal((await a.req(`/circles/${group}/members/${b.id}`,'DELETE')).status,204);
      const denied=receive(socket,realtimeEvents.error);socket.emit(realtimeEvents.heartbeat,{sessionId:session});await denied;socket.close();
      for(const path of [`/pacts/${pact}`,`/focus-sessions/${session}`])assert.equal((await b.req(path)).status,404);
      assert.equal((await b.req(`/focus-sessions/${session}/join`,'POST')).status,404);
      assert.equal((await b.req(`/pacts/${pact}/respond`,'POST',{response:'accepted'})).status,404);
      assert.equal((await b.req('/me/pacts?group=active')).data.items.length,0);
      assert.equal((await b.req('/me/return')).status,200);
      const solo=await b.req('/focus-sessions','POST',{intention:'After removal',durationMinutes:5},randomUUID());assert.equal(solo.status,201);await b.req(`/focus-sessions/${solo.data.session.id}/check-out`,'POST',{outcome:'stopped'});
      // Accelerate only this test-owned session for archive verification.
      await pool.query("update focus_sessions set ends_at=now()-interval '1 second' where id=$1 and started_by_account_id=$2",[session,a.id]);
      await a.req(`/focus-sessions/${session}`);
    });
    await t.test('archive revokes invitations and restore does not revive tokens',async()=>{
      const link=await invite(group);
      assert.equal((await a.req(`/circles/${group}`,'PATCH',{status:'archived'})).status,200);
      assert.equal((await a.req(`/circles/${group}/invites`,'POST',{})).status,409);
      assert.equal((await d.req(`/circle-invites/${link.token}/accept`,'POST')).status,409);
      const metadata=await a.req(`/circles/${group}/invites`);assert.equal(metadata.status,200);assert.ok(metadata.data.items.every((item:any)=>!('token' in item)&&!('tokenHash' in item)));
      assert.equal(metadata.data.items.find((item:any)=>item.id===link.id).status,'revoked');
      assert.equal((await a.req(`/circles/${group}`,'PATCH',{status:'active'})).status,200);
      assert.equal((await d.req(`/circle-invites/${link.token}/accept`,'POST')).status,409);
      const fresh=await invite(group);assert.equal((await b.req(`/circle-invites/${fresh.token}/accept`,'POST')).status,201);
    });
    await t.test('stable pagination, filter cursor binding and invite owner transfer',async()=>{
      const startsAt=new Date(Date.now()+3600000).toISOString();
      for(let i=0;i<3;i++)assert.equal((await a.req(`/circles/${group}/pacts`,'POST',{participantIds:[b.id],startsAt,durationMinutes:5},randomUUID())).status,201);
      const first=await b.req('/me/pacts?group=pending&limit=2');assert.equal(first.data.items.length,2);assert.ok(first.data.nextCursor);
      const second=await b.req('/me/pacts?group=pending&limit=2&cursor='+encodeURIComponent(first.data.nextCursor));assert.equal(second.data.items.length,1);assert.equal(new Set([...first.data.items,...second.data.items].map((x:any)=>x.id)).size,3);
      assert.equal((await b.req('/me/pacts?group=past&cursor='+encodeURIComponent(first.data.nextCursor))).status,400);
      const one=await a.req(`/circles/${group}/invites?limit=1`);assert.ok(one.data.nextCursor);const two=await a.req(`/circles/${group}/invites?limit=1&cursor=${encodeURIComponent(one.data.nextCursor)}`);assert.notEqual(one.data.items[0].id,two.data.items[0].id);
      assert.equal((await a.req(`/circles/${group}/ownership-transfer`,'POST',{accountId:c.id})).status,204);
      assert.equal((await a.req(`/circles/${group}/invites`)).status,403);assert.equal((await c.req(`/circles/${group}/invites`)).status,200);
    });
    await t.test('archive races creation and invitation acceptance without inconsistent state',async()=>{
      for(let i=0;i<3;i++){
        const g=await makeGroup();const link=await invite(g);await b.req(`/circle-invites/${link.token}/accept`,'POST');
        const result=await Promise.all([a.req(`/circles/${g}`,'PATCH',{status:'archived'}),a.req(`/circles/${g}/pacts`,'POST',{participantIds:[b.id],startsAt:new Date().toISOString(),durationMinutes:5},randomUUID())]);
        assert.ok((result[0].status===200&&result[1].status===409)||(result[0].status===409&&result[1].status===201));
        const g2=await makeGroup();const link2=await invite(g2);const race=await Promise.all([a.req(`/circles/${g2}`,'PATCH',{status:'archived'}),d.req(`/circle-invites/${link2.token}/accept`,'POST')]);assert.equal(race[0].status,200);assert.ok([201,409].includes(race[1].status));
      }
    });
  } finally {
    try {for(const socket of sockets)socket.close();for(const group of groups){await pool.query('delete from focus_sessions where circle_id=$1',[group]);await pool.query('delete from circles where id=$1',[group]);}for(const user of users){await pool.query('delete from focus_sessions where started_by_account_id=$1',[user.id]);await pool.query('delete from identity_accounts where id=$1 and email=$2',[user.id,user.email]);}} finally {await pool.end();}
  }
});
