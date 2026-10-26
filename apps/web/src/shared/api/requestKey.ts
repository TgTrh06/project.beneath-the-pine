// Retain the key for retries of the same logical action.
export type StableRequestKey = { payload: string; key: string };

export function stableRequestKey(current: StableRequestKey | null, value: unknown, create: () => string): StableRequestKey {
  const payload = JSON.stringify(value);
  return current?.payload === payload ? current : { payload, key: create() };
}

export function requestKeyStore(create: () => string) {
  let payload = ""; let key = "";
  return {
    for(value: unknown) { const next = JSON.stringify(value); if (!key || next !== payload) { key = create(); payload = next; } return key; },
    clear() { key = ""; payload = ""; },
  };
}
