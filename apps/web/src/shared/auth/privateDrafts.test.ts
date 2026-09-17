import { beforeEach, describe, expect, it } from "vitest";
import { discardPrivateDrafts, readPrivateDraft, removePrivateDraft, setDraftOwner, writePrivateDraft } from "./privateDrafts";

describe("private in-memory drafts", () => {
  beforeEach(discardPrivateDrafts);
  it("restores the same account's draft after authentication recovery", () => {
    setDraftOwner("a"); writePrivateDraft("a", "return", "Unsent intention");
    setDraftOwner("a");
    expect(readPrivateDraft("a", "return", () => "")).toBe("Unsent intention");
  });
  it("isolates accounts and rejects stale writes from the previous account", () => {
    setDraftOwner("a"); writePrivateDraft("a", "return", "Private A");
    setDraftOwner("b"); writePrivateDraft("a", "return", "Late response A");
    expect(readPrivateDraft("b", "return", () => "")).toBe("");
    setDraftOwner("a"); expect(readPrivateDraft("a", "return", () => "")).toBe("");
  });
  it("clears a saved draft and discards all drafts on explicit logout/deletion", () => {
    setDraftOwner("a"); writePrivateDraft("a", "return", "Saved");
    removePrivateDraft("a", "return"); expect(readPrivateDraft("a", "return", () => "")).toBe("");
    writePrivateDraft("a", "checkout", "Private seed"); discardPrivateDrafts(); setDraftOwner("a");
    expect(readPrivateDraft("a", "checkout", () => "")).toBe("");
  });
});
