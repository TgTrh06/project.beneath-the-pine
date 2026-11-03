import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CampLodge } from './CampLodge';
import { appearanceIndex, lodgeMembers, toggleLodgeMember, type LodgeMember } from './lodgeState';

const members: LodgeMember[] = [
  { accountId: 'me', displayName: 'An', role: 'owner', joinedAt: '2026-10-01T00:00:00Z' },
  { accountId: 'linh', displayName: 'Linh', role: 'member', joinedAt: '2026-10-02T00:00:00Z' },
  { accountId: 'mai', displayName: 'Mai', role: 'member', joinedAt: '2026-10-03T00:00:00Z' },
];

describe('Camp scene membership and selection boundaries', () => {
  it('keeps seats consistent when the API changes array ordering without mutating the source', () => {
    const incoming = [members[2], members[0], members[1]];
    expect(lodgeMembers(incoming)).toEqual(members);
    expect(incoming[0]).toBe(members[2]);
    expect(appearanceIndex('linh')).toBe(appearanceIndex(lodgeMembers(incoming)[1].accountId));
  });
  it('adds and removes the same member selection used by the Pact form', () => {
    const added = toggleLodgeMember([], 'linh', members, 'me', false);
    expect(added).toEqual(['linh']);
    expect(toggleLodgeMember(added, 'linh', members, 'me', false)).toEqual([]);
  });
  it('does not select yourself, a removed member, or anyone while busy/archived', () => {
    const selected = ['linh'];
    expect(toggleLodgeMember(selected, 'me', members, 'me', false)).toBe(selected);
    expect(toggleLodgeMember(selected, 'removed', members, 'me', false)).toBe(selected);
    expect(toggleLodgeMember(selected, 'mai', members, 'me', true)).toBe(selected);
  });
  it('never offers more than eight seats or seven invitees', () => {
    const large = Array.from({ length: 10 }, (_, index) => ({ ...members[1], accountId: `person-${index}` }));
    expect(lodgeMembers(large)).toHaveLength(8);
    expect(toggleLodgeMember(large.slice(0, 7).map(m => m.accountId), 'person-9', large, 'me', false)).toHaveLength(7);
  });
});

describe('Camp scene without a GPU or browser', () => {
  const base = { members, accountId: 'me', selected: ['linh'], disabled: false, archived: false, onToggleMember() {}, onCompose() {}, onPacts() {} };
  it('renders the forest poster and task controls before loading the renderer', () => {
    const html = renderToStaticMarkup(<CampLodge {...base} />);
    expect(html).toContain('/camp/camp-poster-');
    expect(html).not.toContain('<canvas');
    expect(html).toContain('Quây quần dưới cây tùng');
    expect(html).toContain('Hẹn một chặng');
    expect(html).toContain('Thành viên');
    expect(html).not.toContain('lodge-roster-heading');
    expect(html).not.toContain('Căn nhà');
  });
  it('keeps the archived Camp readable without an action to create a Pact', () => {
    const html = renderToStaticMarkup(<CampLodge {...base} archived disabled />);
    expect(html).toContain('Bảng hẹn');
    expect(html).toContain('Chuyển động · Tắt');
    expect(html).not.toContain('camp-start');
  });
  it('does not put private member names in the static fallback or default overlay', () => {
    const html = renderToStaticMarkup(<CampLodge {...base} members={[{ ...members[0], displayName: '<script>unsafe</script>' }]} />);
    expect(html).not.toContain('unsafe');
    expect(html).toContain('camp-poster-');
  });
});
