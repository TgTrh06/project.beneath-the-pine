// Retain the key for retries of the same logical action.
export function requestKeyStore(create: () => string) {
  let payload = ""; let key = "";
  return {
    for(value: unknown) { const next = JSON.stringify(value); if (!key || next !== payload) { key = create(); payload = next; } return key; },
    clear() { key = ""; payload = ""; },
  };
}
