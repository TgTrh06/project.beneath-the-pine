import { describe, expect, it } from 'vitest';
import { readBrandValue } from './brandStorage';

function storage(seed: Record<string, string>, full = false): Storage {
  const values = new Map(Object.entries(seed));
  return { get length() { return values.size; }, key: i => [...values.keys()][i] ?? null,
    getItem: key => values.get(key) ?? null, removeItem: key => { values.delete(key); }, clear: () => values.clear(),
    setItem: (key, value) => { if (full) throw new Error('quota'); values.set(key, value); } };
}
describe('Pyneath local preference migration', () => {
  it('moves existing settings once and never overwrites a newer choice', () => {
    const old = storage({ 'beneath-the-pine.theme': 'dark', 'pine:landing-scene': '{"time":"night"}', 'btp:hint:v1:a:focus': 'done', 'pyneath:solo-scene': 'new', 'pine:solo-scene': 'old' });
    expect(readBrandValue(old, 'pyneath.theme')).toBe('dark');
    expect(readBrandValue(old, 'pyneath:landing-scene')).toBe('{"time":"night"}');
    expect(readBrandValue(old, 'pyneath:hint:v1:a:focus')).toBe('done');
    expect(readBrandValue(old, 'pyneath:solo-scene')).toBe('new');
    expect(old.getItem('beneath-the-pine.theme')).toBeNull();
    expect(old.getItem('pine:solo-scene')).toBeNull();
    expect(readBrandValue(old, 'pyneath.theme')).toBe('dark');
  });
  it('keeps old data readable if migration cannot write', () => {
    const full = storage({ 'pine:camp-scene': 'saved' }, true);
    expect(readBrandValue(full, 'pyneath:camp-scene')).toBe('saved');
    expect(full.getItem('pine:camp-scene')).toBe('saved');
    expect(full.getItem('pyneath:camp-scene')).toBeNull();
  });
  it('does not consume unrelated keys', () => {
    const data = storage({ 'pine:unrelated': 'keep' });
    expect(readBrandValue(data, 'pyneath:unrelated')).toBeNull();
    expect(data.getItem('pine:unrelated')).toBe('keep');
  });
});
