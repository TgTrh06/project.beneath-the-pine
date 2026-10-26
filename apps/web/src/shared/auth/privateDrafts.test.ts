import { beforeEach, describe, expect, it, vi } from "vitest";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

describe("private drafts", () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    vi.resetModules();
    storage = new MemoryStorage();
    vi.stubGlobal("sessionStorage", storage);
  });

  it("restores opted-in drafts after a page reload in the same account", async () => {
    const beforeReload = await import("./privateDrafts");
    beforeReload.setDraftOwner("a");
    beforeReload.writePrivateDraft("a", "return:intention", "Unsent intention", true);
    beforeReload.writePrivateDraft("a", "return:duration", 25, true);

    vi.resetModules();
    const afterReload = await import("./privateDrafts");
    afterReload.setDraftOwner("a");
    expect(afterReload.readPrivateDraft("a", "return:intention", () => "", true)).toBe("Unsent intention");
    expect(afterReload.readPrivateDraft("a", "return:duration", () => 10, true)).toBe(25);
  });

  it("keeps non-opted-in drafts in memory only", async () => {
    const drafts = await import("./privateDrafts");
    drafts.setDraftOwner("a");
    drafts.writePrivateDraft("a", "camp:private-selection", ["member"]);
    expect(storage.length).toBe(0);
    expect(drafts.readPrivateDraft("a", "camp:private-selection", () => [])).toEqual(["member"]);
  });

  it("isolates accounts and rejects stale writes when the owner changes", async () => {
    const drafts = await import("./privateDrafts");
    drafts.setDraftOwner("a"); drafts.writePrivateDraft("a", "return:intention", "Private A", true);
    drafts.setDraftOwner("b"); drafts.writePrivateDraft("a", "return:intention", "Late response A", true);
    expect(drafts.readPrivateDraft("b", "return:intention", () => "", true)).toBe("");
    drafts.setDraftOwner("a");
    expect(drafts.readPrivateDraft("a", "return:intention", () => "", true)).toBe("");
  });

  it("clears drafts from another account when authentication initializes after a reload", async () => {
    const beforeReload = await import("./privateDrafts");
    beforeReload.setDraftOwner("a");
    beforeReload.writePrivateDraft("a", "return:intention", "Private A", true);
    vi.resetModules();
    const afterReload = await import("./privateDrafts");
    afterReload.setDraftOwner("b");
    expect(storage.length).toBe(0);
    expect(afterReload.readPrivateDraft("b", "return:intention", () => "", true)).toBe("");
  });

  it("clears individual and all stored drafts through the account cleanup helper", async () => {
    const drafts = await import("./privateDrafts");
    drafts.setDraftOwner("a"); drafts.writePrivateDraft("a", "return:intention", "Saved", true);
    drafts.removePrivateDraft("a", "return:intention", true);
    expect(drafts.readPrivateDraft("a", "return:intention", () => "", true)).toBe("");
    drafts.writePrivateDraft("a", "session:one:seed", "Private seed", true);
    drafts.discardPrivateDrafts(); drafts.setDraftOwner("a");
    expect(drafts.readPrivateDraft("a", "session:one:seed", () => "", true)).toBe("");
  });
});
