// Legacy names exist only at the migration boundary; all new writes use Pyneath.
export function legacyStorageKey(key: string): string | undefined {
  if (key === 'pyneath.theme') return 'beneath-the-pine.theme';
  if (['pyneath:camp-scene', 'pyneath:solo-scene', 'pyneath:landing-scene'].includes(key)) return key.replace('pyneath:', 'pine:');
  if (key.startsWith('pyneath:hint:v1:') || key.startsWith('pyneath:private-draft:v1:')) return key.replace('pyneath:', 'btp:');
  return undefined;
}

export function readBrandValue(storage: Storage, key: string): string | null {
  const current = storage.getItem(key);
  const legacy = legacyStorageKey(key);
  if (!legacy) return current;
  const previous = storage.getItem(legacy);
  if (previous === null) return current;
  // Prefer new values and remove the old key only after the new value is safe.
  try {
    if (current === null) storage.setItem(key, previous);
    storage.removeItem(legacy);
  } catch { /* Full/read-only storage: retain access to the original value. */ }
  return current ?? previous;
}
