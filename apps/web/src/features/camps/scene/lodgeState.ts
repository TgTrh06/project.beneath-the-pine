import type { Camp } from '@pyneath/contracts';

export type LodgeMember = NonNullable<Camp['members']>[number];
export const wandererColors = ['#597666', '#b67c52', '#7d8295', '#a18c58', '#697b91', '#986e64', '#79906a', '#a38a79'];

// Membership is not presence. This projection intentionally accepts no session/private data.
export function lodgeMembers(members: LodgeMember[]) {
  return [...members].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.accountId.localeCompare(b.accountId)).slice(0, 8);
}

export function toggleLodgeMember(selected: string[], id: string, members: LodgeMember[], accountId: string, disabled: boolean) {
  if (disabled || id === accountId || !members.some(member => member.accountId === id)) return selected;
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id].slice(0, 7);
}

export function appearanceIndex(id: string) {
  return [...id].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) % wandererColors.length;
}
