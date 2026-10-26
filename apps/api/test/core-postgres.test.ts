import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { DatabaseService } from '../src/platform/database/database.service';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { IdentityStore } from '../src/modules/identity/identity.store';
import { profiles } from '../src/modules/profile/infrastructure/profile.schema';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { CampService } from '../src/modules/camp/camp.service';
import { PactService } from '../src/modules/pact/pact.service';
import { focusPacts, pactReminderReceipts } from '../src/modules/pact/infrastructure/pact.schema';
import { FocusService } from '../src/modules/focus/focus.service';
import { MemoryService } from '../src/modules/memory/memory.service';
import { SeedService } from '../src/modules/seed/seed.service';
import { PreferencesService } from '../src/modules/preferences/preferences.service';
import { accountPreferences } from '../src/modules/preferences/infrastructure/preferences.schema';
import { PrivacyService } from '../src/modules/privacy/privacy.service';

test('core PostgreSQL flow preserves ownership, reconnect state, seed uniqueness and shared milestone', { skip: !process.env.BTP_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.BTP_TEST_DATABASE_URL, max: 4 }); const client = await pool.connect(); const concurrentClient = await pool.connect(); const schema = `core_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`); await client.query(`SET search_path TO "${schema}"`); await concurrentClient.query(`SET search_path TO "${schema}"`);
    const legacyAccountId = randomUUID(); const legacyCampId = randomUUID(); const legacyMembershipId = randomUUID(); const legacyEventId = randomUUID();
    const legacyInviteId = randomUUID(); const legacyPactId = randomUUID(); const legacySessionId = randomUUID(); const legacyParticipantId = randomUUID(); const legacyMilestoneId = randomUUID();
    for (const file of ['0000_core_baseline.sql', '0001_white_spacker_dave.sql', '0002_camp-rename.sql', '0003_account-preferences-and-pact-reminders.sql']) {
      const migration = readFileSync(resolve(__dirname, `../../drizzle/${file}`), 'utf8').replaceAll('"public"', `"${schema}"`);
      await client.query(migration);
      if (file === '0001_white_spacker_dave.sql') {
        await client.query('INSERT INTO identity_accounts (id,email,password_hash) VALUES ($1,$2,$3)', [legacyAccountId, 'legacy@example.test', 'fixture']);
        await client.query('INSERT INTO circles (id,owner_account_id,name) VALUES ($1,$2,$3)', [legacyCampId, legacyAccountId, 'Legacy group']);
        await client.query('INSERT INTO circle_memberships (id,circle_id,account_id,role) VALUES ($1,$2,$3,$4)', [legacyMembershipId, legacyCampId, legacyAccountId, 'owner']);
        await client.query("INSERT INTO circle_invites (id,circle_id,created_by_account_id,token_hash,expires_at) VALUES ($1,$2,$3,$4,now() + interval '1 day')", [legacyInviteId, legacyCampId, legacyAccountId, 'legacy-token-hash']);
        await client.query("INSERT INTO focus_pacts (id,circle_id,creator_account_id,starts_at,duration_minutes,status,started_session_id,request_key) VALUES ($1,$2,$3,now(),5,'active',$4,$5)", [legacyPactId, legacyCampId, legacyAccountId, legacySessionId, 'legacy-pact-key']);
        await client.query("INSERT INTO focus_pact_participants (pact_id,account_id,response) VALUES ($1,$2,'accepted')", [legacyPactId, legacyAccountId]);
        await client.query("INSERT INTO focus_sessions (id,kind,pact_id,circle_id,started_by_account_id,duration_minutes,started_at,ends_at,request_key) VALUES ($1,'pact',$2,$3,$4,5,now(),now() + interval '5 minutes',$5)", [legacySessionId, legacyPactId, legacyCampId, legacyAccountId, 'legacy-session-key']);
        await client.query('INSERT INTO session_participants (id,session_id,account_id) VALUES ($1,$2,$3)', [legacyParticipantId, legacySessionId, legacyAccountId]);
        await client.query('INSERT INTO circle_milestones (id,circle_id,session_id) VALUES ($1,$2,$3)', [legacyMilestoneId, legacyCampId, legacySessionId]);
        await client.query('INSERT INTO product_events (id,account_id,name,subject_id) VALUES ($1,$2,$3,$4)', [legacyEventId, legacyAccountId, 'circle_created', legacyCampId]);
      }
    }
    const legacyRows = await client.query('SELECT c.id, m.id AS membership_id, m.camp_id, e.id AS event_id, e.name FROM camps c JOIN camp_memberships m ON m.camp_id=c.id JOIN product_events e ON e.subject_id=c.id WHERE c.id=$1', [legacyCampId]);
    assert.deepEqual(legacyRows.rows, [{ id: legacyCampId, membership_id: legacyMembershipId, camp_id: legacyCampId, event_id: legacyEventId, name: 'camp_created' }]);
    const legacyForeignKey = await client.query("SELECT conname FROM pg_constraint WHERE conname='camp_memberships_camp_id_camps_id_fk' AND conrelid='camp_memberships'::regclass");
    assert.equal(legacyForeignKey.rowCount, 1, 'renamed membership FK remains enforced');
    const preserved = await client.query(`SELECT i.id AS invite_id, p.id AS pact_id, s.id AS session_id, sp.id AS participant_id, m.id AS milestone_id
      FROM camps c JOIN camp_invites i ON i.camp_id=c.id JOIN focus_pacts p ON p.camp_id=c.id
      JOIN focus_sessions s ON s.camp_id=c.id AND s.pact_id=p.id JOIN session_participants sp ON sp.session_id=s.id
      JOIN camp_milestones m ON m.camp_id=c.id AND m.session_id=s.id WHERE c.id=$1`, [legacyCampId]);
    assert.deepEqual(preserved.rows, [{ invite_id: legacyInviteId, pact_id: legacyPactId, session_id: legacySessionId, participant_id: legacyParticipantId, milestone_id: legacyMilestoneId }]);
    const renamedForeignKeys = await client.query("SELECT conname FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname=$1 AND conname IN ('camp_invites_camp_id_camps_id_fk','camp_milestones_camp_id_camps_id_fk','focus_sessions_camp_id_camps_id_fk','focus_pacts_camp_id_camps_id_fk')", [schema]);
    assert.equal(renamedForeignKeys.rowCount, 4, 'renamed relationships remain constrained');
    const db = drizzle(client); const concurrentDb = drizzle(concurrentClient); const database = { db } as unknown as DatabaseService; const concurrentDatabase = { db: concurrentDb } as unknown as DatabaseService; const analytics = new AnalyticsService(database); const concurrentAnalytics = new AnalyticsService(concurrentDatabase); const camps = new CampService(database, analytics); const concurrentCamps = new CampService(concurrentDatabase, concurrentAnalytics); const pacts = new PactService(database, camps, analytics); const concurrentPacts = new PactService(concurrentDatabase, concurrentCamps, concurrentAnalytics); const focus = new FocusService(database, pacts, analytics); const concurrentFocus = new FocusService(concurrentDatabase, concurrentPacts, concurrentAnalytics); const memory = new MemoryService(database); const seeds = new SeedService(database); const preferences = new PreferencesService(database);
    assert.equal((await camps.membership(legacyCampId, legacyAccountId))?.role, 'owner', 'migrated owner retains access');
    assert.equal((await pacts.get(legacyPactId, legacyAccountId)).id, legacyPactId, 'migrated Pact remains readable');
    assert.equal((await focus.snapshot(legacySessionId, legacyAccountId)).id, legacySessionId, 'migrated session remains readable');
    const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]; await db.insert(accounts).values(ids.map((id, index) => ({ id, email: `member${index}@example.test`, passwordHash: 'fixture' }))); await db.insert(profiles).values(ids.map((accountId, index) => ({ accountId, displayName: `Member ${index}`, timezone: 'Asia/Ho_Chi_Minh' })));
    const camp = await camps.create(ids[0], 'Bạn quen'); const invite = await camps.invite(camp.id, ids[0], 72); assert.equal(await camps.accept(invite.token, ids[1]), camp.id); const secondInvite = await camps.invite(camp.id, ids[0], 72); assert.equal(await camps.accept(secondInvite.token, ids[3]), camp.id);
    const pact = await pacts.create(camp.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID()); await pacts.respond(pact.id, ids[1], 'accepted'); const started = await focus.startPact(pact.id, ids[0], randomUUID()); await focus.join(started.id, ids[1]);
    assert.equal((await focus.snapshot(started.id, ids[1])).intention, null);
    assert.equal((await focus.snapshot(started.id, ids[1])).participants.find(person => person.accountId === ids[0])?.presence, 'hidden');
    await preferences.update(ids[0], {sharePresence:true,focusPreset:{durationMinutes:25,soundscapeId:'rain'}});
    assert.equal((await focus.snapshot(started.id, ids[1])).participants.find(person => person.accountId === ids[0])?.presence, 'active');
    assert.equal((await preferences.get(ids[0])).focusPreset?.soundscapeId,'rain');
    await preferences.update(ids[0], {sharePresence:false});
    assert.equal((await focus.snapshot(started.id, ids[1])).participants.find(person => person.accountId === ids[0])?.presence, 'hidden');
    await assert.rejects(focus.snapshot(started.id, ids[2])); await focus.checkout(started.id, ids[0], { outcome: 'progress' }); await focus.checkout(started.id, ids[1], { outcome: 'completed' }); await focus.markConnected(started.id, ids[1]); await assert.rejects(focus.setPresence(started.id, ids[1], 'break')); assert.equal((await memory.list(ids[1])).length, 1); assert.equal((await memory.list(ids[2])).length, 0);
    assert.deepEqual(await focus.recentPartners(camp.id,ids[0]),[ids[1]]);
    await assert.rejects(focus.recentPartners(camp.id,ids[2]));
    const duePact = await pacts.create(camp.id,ids[0],{participantIds:[ids[1]],startsAt:new Date(Date.now()+5*60000).toISOString(),durationMinutes:5},randomUUID());
    await pacts.respond(duePact.id,ids[1],'accepted');
    await preferences.update(ids[1],{remindAcceptedPacts:true});
    const reminderRaces = await Promise.all([pacts.claimDueReminders(ids[1]),concurrentPacts.claimDueReminders(ids[1])]);
    assert.equal(reminderRaces.reduce((sum,result)=>sum+result.items.length,0),1,'only one tab claims the reminder');
    assert.equal((await pacts.claimDueReminders(ids[1])).items.length,0);
    assert.equal((await pacts.claimDueReminders(ids[0])).items.length,0,'disabled account has no reminders');
    await pacts.cancel(duePact.id,ids[0]);
    const cancelledDue = await pacts.create(camp.id,ids[0],{participantIds:[ids[1]],startsAt:new Date(Date.now()+5*60000).toISOString(),durationMinutes:5},randomUUID());
    await pacts.respond(cancelledDue.id,ids[1],'accepted');
    await pacts.cancel(cancelledDue.id,ids[0]);
    assert.equal((await pacts.claimDueReminders(ids[1])).items.some(item => item.id === cancelledDue.id),false,'a cancelled Pact is not reminded');
    const startedDue = await pacts.create(camp.id,ids[0],{participantIds:[ids[1]],startsAt:new Date(Date.now()+5*60000).toISOString(),durationMinutes:5},randomUUID());
    await pacts.respond(startedDue.id,ids[1],'accepted');
    const startedDueSession = await focus.startPact(startedDue.id,ids[0],randomUUID());
    assert.equal((await pacts.claimDueReminders(ids[1])).items.some(item => item.id === startedDue.id),false,'an active Pact is not reminded');
    await focus.join(startedDueSession.id,ids[1]);
    await focus.checkout(startedDueSession.id,ids[0],{outcome:'stopped'});
    await focus.checkout(startedDueSession.id,ids[1],{outcome:'stopped'});
    const expiredDue = await pacts.create(camp.id,ids[0],{participantIds:[ids[1]],startsAt:new Date(Date.now()+5*60000).toISOString(),durationMinutes:5},randomUUID());
    await pacts.respond(expiredDue.id,ids[1],'accepted');
    await db.update(focusPacts).set({startsAt:new Date(Date.now()-31*60000)}).where(eq(focusPacts.id,expiredDue.id));
    assert.equal((await pacts.claimDueReminders(ids[1])).items.some(item => item.id === expiredDue.id),false,'an expired Pact is not reminded');
    assert.equal((await pacts.get(expiredDue.id,ids[1])).status,'expired');
    const solo = await focus.startSolo(ids[0], { intention: 'Mở lại chương đang dở', durationMinutes: 5 }, randomUUID()); assert.equal((await focus.snapshot(solo.id, ids[0])).intention, 'Mở lại chương đang dở'); await assert.rejects(focus.snapshot(solo.id, ids[1])); await focus.checkout(solo.id, ids[0], { outcome: 'stopped', openSeed: 'Đọc từ mục tiếp theo' }); await seeds.upsert(ids[0], { text: 'Viết một đoạn mở đầu' }); assert.equal((await seeds.get(ids[0]))?.text, 'Viết một đoạn mở đầu');

    const racePact = await pacts.create(camp.id, ids[0], { participantIds: [], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    const [startRace, cancelRace] = await Promise.allSettled([focus.startPact(racePact.id, ids[0], randomUUID()), concurrentPacts.cancel(racePact.id, ids[0])]);
    const racePactState = await pacts.get(racePact.id, ids[0]);
    if (racePactState.status === 'active') {
      assert.equal(startRace.status, 'fulfilled'); assert.equal(cancelRace.status, 'rejected');
      await focus.checkout(racePactState.sessionId!, ids[0], { outcome: 'stopped' });
    } else {
      assert.equal(racePactState.status, 'cancelled'); assert.equal(racePactState.sessionId, null);
      assert.equal(startRace.status, 'rejected'); assert.equal(cancelRace.status, 'fulfilled');
    }

    const presencePact = await pacts.create(camp.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(presencePact.id, ids[1], 'accepted'); const presenceSession = await focus.startPact(presencePact.id, ids[0], randomUUID()); await focus.join(presenceSession.id, ids[1]);
    await focus.setPresence(presenceSession.id, ids[1], 'break'); await concurrentFocus.markConnected(presenceSession.id, ids[1]);
    assert.equal((await focus.snapshot(presenceSession.id, ids[1])).participants.find(person => person.accountId === ids[1])?.presence, 'break', 'heartbeat preserves a chosen break state for the owner');
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'hidden', 'default sharing is off');
    await preferences.update(ids[1],{sharePresence:true});
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'break', 'sharing reveals the persisted state');
    await focus.setPresence(presenceSession.id, ids[1], 'disconnected'); await concurrentFocus.markConnected(presenceSession.id, ids[1]);
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'active', 'reconnect restores a disconnected participant');
    await preferences.update(ids[1],{sharePresence:false});
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'hidden', 'turning sharing off masks the next snapshot');
    await focus.checkout(presenceSession.id, ids[0], { outcome: 'stopped' }); await concurrentFocus.checkout(presenceSession.id, ids[1], { outcome: 'stopped' });

    const joinPact = await pacts.create(camp.id, ids[0], { participantIds: [ids[3]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(joinPact.id, ids[3], 'accepted'); const joinSession = await focus.startPact(joinPact.id, ids[0], randomUUID());
    const [joinRace, checkoutRace] = await Promise.allSettled([concurrentFocus.join(joinSession.id, ids[3]), focus.checkout(joinSession.id, ids[0], { outcome: 'progress' })]);
    const afterJoinRace = await focus.snapshot(joinSession.id, ids[0]);
    assert.equal(joinRace.status, 'fulfilled', 'accepted eligible invitee can join after creator checkout');
    assert.equal(checkoutRace.status, 'fulfilled'); assert.equal(afterJoinRace.status, 'active');
    assert.notEqual(afterJoinRace.participants.find(person => person.accountId === ids[3])?.presence, 'checked_out');
    await focus.checkout(joinSession.id, ids[3], { outcome: 'completed' });
    assert.equal((await focus.snapshot(joinSession.id, ids[0])).status, 'completed');
    await assert.rejects(concurrentFocus.join(joinSession.id, ids[3]));

    const waitingPact = await pacts.create(camp.id, ids[0], { participantIds: [ids[3]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(waitingPact.id, ids[3], 'accepted');
    const waitingSession = await focus.startPact(waitingPact.id, ids[0], randomUUID());
    await focus.checkout(waitingSession.id, ids[0], { outcome: 'progress' });
    assert.equal((await pacts.get(waitingPact.id, ids[0])).status, 'active', 'accepted late join keeps Pact open');
    await camps.remove(camp.id, ids[3], ids[0]);
    await focus.finalizeExpired();
    assert.equal((await pacts.get(waitingPact.id, ids[0])).status, 'completed', 'revoked invitee no longer holds Pact open');
    await assert.rejects(focus.join(waitingSession.id, ids[3]));

    const declinedPact = await pacts.create(camp.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(declinedPact.id, ids[1], 'declined');
    const declinedSession = await focus.startPact(declinedPact.id, ids[0], randomUUID());
    await focus.checkout(declinedSession.id, ids[0], { outcome: 'stopped' });
    assert.equal((await pacts.get(declinedPact.id, ids[0])).status, 'completed', 'declined invitation does not hold Pact open');

    const expiryPact = await pacts.create(camp.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(expiryPact.id, ids[1], 'accepted');
    const expirySession = await focus.startPact(expiryPact.id, ids[0], randomUUID());
    await focus.checkout(expirySession.id, ids[0], { outcome: 'progress' });
    await client.query("update focus_sessions set ends_at=now()-interval '1 second' where id=$1", [expirySession.id]);
    await Promise.allSettled([concurrentFocus.join(expirySession.id, ids[1]), focus.finalizeExpired()]);
    assert.equal((await pacts.get(expiryPact.id, ids[0])).status, 'completed', 'expiry closes waiting Pact');
    await assert.rejects(focus.join(expirySession.id, ids[1]));

    const expiredSolo = await focus.startSolo(ids[0], { intention: 'Race against expiry', durationMinutes: 5 }, randomUUID());
    await client.query("update focus_sessions set ends_at=now()-interval '1 second' where id=$1", [expiredSolo.id]);
    await Promise.allSettled([focus.checkout(expiredSolo.id, ids[0], { outcome: 'progress' }), concurrentFocus.finalizeExpired()]);
    const expiredState = await focus.snapshot(expiredSolo.id, ids[0]);
    assert.equal(expiredState.status, 'completed'); assert.equal(expiredState.participants[0].presence, 'checked_out');

    const revokePact = await pacts.create(camp.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(revokePact.id, ids[1], 'accepted'); const revokeSession = await focus.startPact(revokePact.id, ids[0], randomUUID()); await focus.join(revokeSession.id, ids[1]);
    await camps.remove(camp.id, ids[1], ids[0]);
    await assert.rejects(concurrentFocus.checkout(revokeSession.id, ids[1], { outcome: 'stopped' }));
    await assert.rejects(concurrentFocus.setPresence(revokeSession.id, ids[1], 'break'));
    await assert.rejects(concurrentFocus.snapshot(revokeSession.id, ids[1]));
    assert.equal(await focus.active(ids[1]), null, 'a removed participant releases their active slot when reconnecting');
    await focus.checkout(revokeSession.id, ids[0], { outcome: 'stopped' });

    const identityStore = new IdentityStore(database);
    const exported = await new PrivacyService(database, identityStore).export(ids[1]);
    assert.equal(exported.preferences?.remindAcceptedPacts, true, 'data export includes the owner preference');
    assert.ok(exported.pactReminders.some(receipt => receipt.pactId === duePact.id), 'data export includes the owner reminder receipt');
    await identityStore.deleteAccount(ids[1]);
    assert.equal((await db.select().from(accountPreferences).where(eq(accountPreferences.accountId, ids[1]))).length, 0, 'account deletion removes preferences');
    assert.equal((await db.select().from(pactReminderReceipts).where(eq(pactReminderReceipts.accountId, ids[1]))).length, 0, 'account deletion removes reminder receipts');
  } finally { await Promise.all([client.query('SET search_path TO public'), concurrentClient.query('SET search_path TO public')]); await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); concurrentClient.release(); client.release(); await pool.end(); }
});
