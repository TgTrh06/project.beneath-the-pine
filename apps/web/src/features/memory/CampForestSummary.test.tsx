import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CampForest, ForestThreshold } from '@pyneath/contracts';
import { CampForestSummary } from './CampForestSummary';
import { ForestGrowth } from './ForestGrowth';

const forest = (count: number): CampForest => ({ campId: 'camp', name: 'Camp', status: 'active', sharedSessions: count,
  milestones: ([1, 3, 7] as const).filter(threshold => threshold <= count).map(threshold => ({ threshold, recordedAt: '2026-11-03T00:00:00Z' })),
});
const render = (data: CampForest | null, loading = false, error = '') => renderToStaticMarkup(<CampForestSummary forest={data} loading={loading} error={error} onRetry={() => {}}/>);

describe('Camp progress without WebGL', () => {
  it('uses the same earned state in text and static preview at each threshold', () => {
    for (const [count, title, items] of [[0, 'Một góc rừng đang đợi.', 0], [1, 'Mầm cây chung', 1], [3, 'Khoảng hoa chung', 2], [7, 'Ánh đèn chung', 3]] as const) {
      const html = render(forest(count));
      expect(html).toContain(title);
      expect(html).toContain(`${items} vật phẩm đang hiện`);
      expect(html).not.toContain('<canvas');
    }
  });
  it('does not expose stale progress or present a failed load as zero earned milestones', () => {
    for (const html of [render(forest(7), true), render(forest(7), false, 'Chưa tải được dấu chân chung.')]) {
      expect(html).not.toContain('Ánh đèn chung');
      expect(html).not.toContain('data-item');
      expect(html).not.toContain('Một góc rừng đang đợi.');
    }
    expect(render(null, false, 'Chưa tải được dấu chân chung.')).toContain('Tải lại dấu chân');
  });
  it('keeps archived earned progress readable', () => {
    expect(render({ ...forest(3), status: 'archived' })).toContain('Khoảng hoa chung');
  });
});

describe('shared growth placement preserves the personal scene', () => {
  it('keeps the original personal origin and namespace when no Camp options are supplied', () => {
    const earned: ForestThreshold[] = [1, 3, 7];
    const personal = ForestGrowth({ earned })!;
    const camp = ForestGrowth({ earned, namespace: 'camp', origin: [3.4, .12, 1.5] })!;
    expect(personal.props.position).toEqual([1.2, .12, -1.7]);
    expect(personal.props.name).toBe('personal-forest-growth');
    expect(camp.props.name).toBe('camp-forest-growth');
    expect(camp.props.children.map((item: { props: { position: number[] } }) => item.props.position)).toEqual(personal.props.children.map((item: { props: { position: number[] } }) => item.props.position));
    expect(ForestGrowth({ earned: [] })).toBeNull();
  });
});
