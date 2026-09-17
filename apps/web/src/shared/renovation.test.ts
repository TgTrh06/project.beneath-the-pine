import { describe, expect, it } from "vitest";
import type { FocusPact, FocusSession } from "@beneath-the-pine/contracts";
import { resolveTheme, validTheme } from "./theme/theme";
import { requestKeyStore } from "./api/requestKey";
import { localToIso } from "./time";
import { safeFrontendErrorRecord } from "./logging/logger";
import { resolveHashRoute } from "../app/routePaths";
import { canCheckOut, remainingSeconds, seedPayload } from "../features/focus/sessionState";
import { pactActions } from "../features/pacts/pactState";

describe("theme and private navigation", () => {
  it("keeps a manual theme despite system preference and handles unknown storage", () => {
    expect(resolveTheme("light",true)).toBe("light");
    expect(resolveTheme("dark",false)).toBe("dark");
    expect(resolveTheme(validTheme("invalid"),true)).toBe("dark");
  });
  it("accepts only local, valid invite routes and redacts their secret from logs", () => {
    const token = "a".repeat(64);
    expect(resolveHashRoute("#invite/"+token)).toEqual({view:"invite",id:token});
    expect(resolveHashRoute("#https://evil.example").view).toBe("return");
    expect(resolveHashRoute("#invite/not-valid").view).toBe("return");
    const record = safeFrontendErrorRecord({event:"failure",area:"api",path:"/circle-invites/"+token+"/accept"});
    expect(record.path).toBe("/circle-invites/[redacted]/accept");
    expect(JSON.stringify(record)).not.toContain(token);
  });
});
describe("durable intent and time", () => {
  it("retains a key on retry but changes it for a different intention or new operation", () => {
    let n=0; const keys=requestKeyStore(()=>String(++n));
    expect(keys.for({intention:"Read",minutes:10})).toBe("1");
    expect(keys.for({intention:"Read",minutes:10})).toBe("1");
    expect(keys.for({intention:"Write",minutes:10})).toBe("2");
    keys.clear(); expect(keys.for({intention:"Write",minutes:10})).toBe("3");
  });
  it("uses the profile timezone, not the browser timezone, and rejects a DST gap", () => {
    expect(localToIso("2026-09-16T09:00","Asia/Ho_Chi_Minh")).toBe("2026-09-16T02:00:00.000Z");
    expect(localToIso("2026-03-08T02:30","America/New_York")).toBeNull();
    expect(localToIso("invalid","UTC")).toBeNull();
  });
  it("anchors remaining time to server time and never goes negative", () => {
    expect(remainingSeconds("2026-09-16T02:10:00Z","2026-09-16T02:00:00Z",123000)).toBe(477);
    expect(remainingSeconds("2026-09-16T02:10:00Z","2026-09-16T02:00:00Z",700000)).toBe(0);
  });
  it("distinguishes preserving, replacing and explicitly deleting an Open Seed", () => {
    expect(seedPayload("keep","new text")).toEqual({});
    expect(seedPayload("replace"," next page ")).toEqual({openSeed:"next page"});
    expect(seedPayload("remove","")).toEqual({openSeed:null});
  });
  it("does not offer outcome editing after checkout or terminal state", () => {
    const session = {status:"active",participants:[{accountId:"me",presence:"active"}]} as FocusSession;
    expect(canCheckOut(session,"me")).toBe(true);
    expect(canCheckOut({...session,status:"completed"},"me")).toBe(false);
    expect(canCheckOut(session,"other")).toBe(false);
    expect(canCheckOut({...session,participants:[{...session.participants[0],presence:"checked_out"}]},"me")).toBe(false);
  });
});
describe("Pact permissions and lifecycle", () => {
  const time=Date.parse("2026-09-16T02:00:00Z");
  const pact={creatorId:"owner",startsAt:new Date(time).toISOString(),status:"scheduled",sessionId:null,participants:[{accountId:"owner",response:"accepted"},{accountId:"member",response:"invited"}]} as FocusPact;
  it("allows creator-only start within the backend window", () => {
    expect(pactActions(pact,"owner",time-600001).start).toBe(false);
    expect(pactActions(pact,"owner",time-600000).start).toBe(true);
    expect(pactActions(pact,"owner",time+1800001).start).toBe(false);
    expect(pactActions(pact,"member",time).start).toBe(false);
    expect(pactActions(pact,"member",time).respond).toBe(true);
  });
  it("removes mutating controls from terminal Pacts and only lets accepted people join", () => {
    expect(pactActions({...pact,status:"completed"},"owner",time)).toEqual({respond:false,cancel:false,start:false,join:false});
    expect(pactActions({...pact,status:"active",sessionId:"session"},"member",time).join).toBe(false);
    expect(pactActions({...pact,status:"active",sessionId:"session"},"owner",time).join).toBe(true);
  });
});
