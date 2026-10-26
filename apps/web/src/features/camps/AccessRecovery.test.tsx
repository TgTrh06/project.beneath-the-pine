import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CampView } from './CampView';
import { PactView } from '../pacts/PactView';
import { ReturnView } from '../return/ReturnView';

let resource: { loading: boolean; error: string; data: unknown; reload: () => Promise<void> };
vi.mock('../../shared/api/useResource', () => ({ useResource: () => resource }));

describe('unavailable Camp and Pact recovery', () => {
  beforeEach(() => { resource = { loading: false, error: 'Bạn không có quyền truy cập.', data: null, reload: async () => {} }; });

  it('offers a safe destination when a Camp cannot be loaded', () => {
    const html = renderToStaticMarkup(<CampView id="camp" accountId="outsider" onPact={() => {}} onLeave={() => {}} onNotice={() => {}}/>);
    expect(html).toContain('Bạn không có quyền truy cập.');
    expect(html).toContain('Thử lại');
    expect(html).toContain('Về danh sách Camp');
  });

  it('offers a safe destination when a Pact cannot be loaded', () => {
    const html = renderToStaticMarkup(<PactView id="pact" accountId="outsider" onSession={() => {}} onPacts={() => {}} onNotice={() => {}}/>);
    expect(html).toContain('Bạn không có quyền truy cập.');
    expect(html).toContain('Thử lại');
    expect(html).toContain('Về danh sách cuộc hẹn');
  });

  it('shows loading instead of denial before the first response', () => {
    resource = { ...resource, loading: true, error: '' };
    const camp = renderToStaticMarkup(<CampView id="camp" accountId="outsider" onPact={() => {}} onLeave={() => {}} onNotice={() => {}}/>);
    const pact = renderToStaticMarkup(<PactView id="pact" accountId="outsider" onSession={() => {}} onPacts={() => {}} onNotice={() => {}}/>);
    expect(camp).toContain('Đang mở Camp');
    expect(camp).not.toContain('Về danh sách Camp');
    expect(pact).toContain('Đang mở cuộc hẹn');
    expect(pact).not.toContain('Về danh sách cuộc hẹn');
  });

  it('shows a saved Seed even when timezone confirmation is still required', () => {
    resource = { ...resource, error: '', data: { profileReady: false, openSeed: { text: 'Mở lại trang vừa đọc' }, activeSession: null, upcomingPacts: [], timezone: 'Asia/Ho_Chi_Minh' } };
    const html = renderToStaticMarkup(<ReturnView onSession={() => {}} onPact={() => {}} onNotice={() => {}}/>);
    expect(html).toContain('Xác nhận múi giờ');
    expect(html).toContain('Mở lại trang vừa đọc');
    expect(html).toContain('Điểm này đã được lưu riêng cho bạn');
  });
});
