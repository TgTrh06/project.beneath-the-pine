import { describe, expect, it } from 'vitest';
import { arrangedForest } from './forestArrangement';

describe('forest arrangement visibility', () => {
  it('keeps the P1 layout when no preferences exist', () => {
    expect(arrangedForest([1, 3, 7])).toEqual([
      { threshold: 1, position: [0, 0] }, { threshold: 3, position: [-.6, .3] }, { threshold: 7, position: [.65, .2] },
    ]);
  });
  it('never places an unearned item, even with manipulated preferences', () => {
    expect(arrangedForest([1], { layout: 'arc', hidden: [], version: 0 }).map(item => item.threshold)).toEqual([1]);
    expect(arrangedForest([], { layout: 'gathered', hidden: [], version: 4 })).toEqual([]);
  });
  it('shows a new unlock while previously hidden items stay hidden', () => {
    const saved = { layout: 'gathered' as const, hidden: [1] as const, version: 3 };
    const preference = { ...saved, hidden: [...saved.hidden] };
    expect(arrangedForest([1], preference)).toEqual([]);
    expect(arrangedForest([1, 3], preference).map(item => item.threshold)).toEqual([3]);
    expect(arrangedForest([1, 3, 7], preference).map(item => item.threshold)).toEqual([3, 7]);
  });
});
