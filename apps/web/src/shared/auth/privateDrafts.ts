let owner: string | null = null;
const drafts = new Map<string, unknown>();

// Memory only: private work text must not be written to browser storage.
export function setDraftOwner(accountId: string) {
  if (owner !== accountId) drafts.clear();
  owner = accountId;
}
export function discardPrivateDrafts() { drafts.clear(); owner = null; }
export function draftOwner() { return owner; }
export function readPrivateDraft<T>(accountId: string | null, key: string, initial: () => T): T {
  if (!accountId || accountId !== owner) return initial();
  if (!drafts.has(key)) drafts.set(key, initial());
  return drafts.get(key) as T;
}
export function writePrivateDraft<T>(accountId: string | null, key: string, value: T) {
  if (accountId && accountId === owner) drafts.set(key, value);
}
export function removePrivateDraft(accountId: string | null, key: string) {
  if (accountId && accountId === owner) drafts.delete(key);
}
