import { defaultForestArrangement, type ForestArrangement, type ForestThreshold } from '@pyneath/contracts';

export const forestLayouts: { id: ForestArrangement['layout']; label: string }[] = [
  { id: 'clearing', label: 'Bên gốc thông' }, { id: 'gathered', label: 'Gần nhau' }, { id: 'arc', label: 'Vòng cung nhỏ' },
];
// Ground-plane anchors shared by the static plan view and the existing 3D patch.
const anchors: Record<ForestArrangement['layout'], Record<ForestThreshold, [number, number]>> = {
  clearing: { 1: [0, 0], 3: [-.6, .3], 7: [.65, .2] },
  gathered: { 1: [-.25, .1], 3: [.2, .48], 7: [.45, -.2] },
  arc: { 1: [-.55, .1], 3: [0, .5], 7: [.55, .1] },
};
export function arrangedForest(earned: readonly ForestThreshold[], arrangement: ForestArrangement | null = null) {
  const value = arrangement ?? defaultForestArrangement;
  return ([1, 3, 7] as const).filter(item => earned.includes(item) && !value.hidden.includes(item))
    .map(threshold => ({ threshold, position: anchors[value.layout][threshold] }));
}
