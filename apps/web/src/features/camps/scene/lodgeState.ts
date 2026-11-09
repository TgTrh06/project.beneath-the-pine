import type { Camp } from '@pyneath/contracts';

export type LodgeMember = NonNullable<Camp['members']>[number];
// Membership is not presence. This projection intentionally accepts no session/private data.
export function lodgeMembers(members: LodgeMember[]) {
  return [...members].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.accountId.localeCompare(b.accountId)).slice(0, 8);
}

export function toggleLodgeMember(selected: string[], id: string, members: LodgeMember[], accountId: string, disabled: boolean) {
  if (disabled || id === accountId || !members.some(member => member.accountId === id)) return selected;
  return selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id].slice(0, 7);
}
