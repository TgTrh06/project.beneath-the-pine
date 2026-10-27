import { legacyStorageKey, readBrandValue } from '../brandStorage';

let owner: string | null = null;
const drafts = new Map<string, unknown>();
const storagePrefix = "pyneath:private-draft:v1:";

function accountPrefix(accountId: string) {
  return `${storagePrefix}${encodeURIComponent(accountId)}:`;
}

function clearStoredDrafts(accountId: string) {
  try {
    const prefix = accountPrefix(accountId);
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && (key.startsWith(prefix) || key.startsWith(legacyStorageKey(prefix)!))) keys.push(key);
    }
    keys.forEach(key => sessionStorage.removeItem(key));
  } catch {
    // Storage may be disabled; the in-memory draft path remains available.
  }
}

function clearStoredDraftsForOtherAccounts(accountId: string) {
  try {
    const currentPrefix = accountPrefix(accountId);
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && (key.startsWith(storagePrefix) || key.startsWith(legacyStorageKey(storagePrefix)!))
        && !key.startsWith(currentPrefix) && !key.startsWith(legacyStorageKey(currentPrefix)!)) keys.push(key);
    }
    keys.forEach(key => sessionStorage.removeItem(key));
  } catch {
    // Storage may be disabled; the in-memory draft path remains available.
  }
}

function storedKey(accountId: string, key: string) {
  return `${accountPrefix(accountId)}${encodeURIComponent(key)}`;
}

export function setDraftOwner(accountId: string) {
  if (owner !== accountId) {
    drafts.clear();
    if (owner) clearStoredDrafts(owner);
    clearStoredDraftsForOtherAccounts(accountId);
  }
  owner = accountId;
}
export function discardPrivateDrafts() {
  drafts.clear();
  if (owner) clearStoredDrafts(owner);
  owner = null;
}
export function draftOwner() { return owner; }
export function readPrivateDraft<T>(accountId: string | null, key: string, initial: () => T, persist = false): T {
  if (!accountId || accountId !== owner) return initial();
  if (!drafts.has(key)) {
    let value = initial();
    if (persist) {
      try {
        const saved = readBrandValue(sessionStorage, storedKey(accountId, key));
        if (saved !== null) value = JSON.parse(saved) as T;
      } catch {
        // Ignore malformed or inaccessible storage and use a fresh in-memory value.
      }
    }
    drafts.set(key, value);
  }
  return drafts.get(key) as T;
}
export function restoreStoredPrivateDraft<T>(accountId: string | null, key: string): { found: boolean; value?: T } {
  if (!accountId || accountId !== owner) return { found: false };
  try {
    const saved = readBrandValue(sessionStorage, storedKey(accountId, key));
    if (saved === null) return { found: false };
    const value = JSON.parse(saved) as T;
    drafts.set(key, value);
    return { found: true, value };
  } catch {
    return { found: false };
  }
}
export function writePrivateDraft<T>(accountId: string | null, key: string, value: T, persist = false) {
  if (!accountId || accountId !== owner) return;
  drafts.set(key, value);
  if (persist) {
    try { const target = storedKey(accountId, key); sessionStorage.setItem(target, JSON.stringify(value)); sessionStorage.removeItem(legacyStorageKey(target)!); }
    catch { /* Storage may be disabled or full; retain the in-memory draft. */ }
  }
}
export function removePrivateDraft(accountId: string | null, key: string, persist = false) {
  if (!accountId || accountId !== owner) return;
  drafts.delete(key);
  if (persist) {
    try { const target = storedKey(accountId, key); sessionStorage.removeItem(target); sessionStorage.removeItem(legacyStorageKey(target)!); }
    catch { /* Storage may be disabled. */ }
  }
}
