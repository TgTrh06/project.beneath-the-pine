import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ getCsrfToken: vi.fn(), expireSession: vi.fn() }));
const logging = vi.hoisted(() => ({ logFrontendError: vi.fn() }));
vi.mock('../auth/auth', () => auth);
vi.mock('../logging/logger', () => logging);
import { ApiRequestError, request } from './transport';
import { startSolo, checkOut } from './clients/focus';
import { getCampInvitePreview } from './clients/camps';
import { requestAssistance } from './clients/assistance';
import { deleteAccount } from './clients/privacy';

beforeEach(() => { vi.clearAllMocks(); auth.getCsrfToken.mockResolvedValue('fixture-csrf'); });
afterEach(() => vi.unstubAllGlobals());

it('retains credentials, CSRF and an explicit idempotency key across group clients', async () => {
  const fetcher = vi.fn().mockImplementation(async () => Response.json({ session: { id: 'fixture' } }));
  vi.stubGlobal('fetch', fetcher);
  const input = { intention: 'Fictional work', durationMinutes: 5 as const };
  await startSolo(input, 'same-action'); await startSolo(input, 'same-action');
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [url, options] of fetcher.mock.calls) {
    expect(url).toBe('/api/v1/focus-sessions');
    expect(options).toMatchObject({ method: 'POST', credentials: 'include', body: JSON.stringify(input),
      headers: { 'X-XSRF-TOKEN': 'fixture-csrf', 'Idempotency-Key': 'same-action', 'content-type': 'application/json' } });
  }
});

it('does not fetch CSRF for reads, preserves null/omitted checkout seeds, and accepts empty 204', async () => {
  const fetcher = vi.fn().mockImplementation(async () => Response.json({ invite: {} })); vi.stubGlobal('fetch', fetcher);
  await getCampInvitePreview('fixture-token'); expect(auth.getCsrfToken).not.toHaveBeenCalled();
  await checkOut('session', { outcome: 'stopped' });
  expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ outcome: 'stopped' });
  await checkOut('session', { outcome: 'stopped', openSeed: null });
  expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ outcome: 'stopped', openSeed: null });
  fetcher.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(deleteAccount('fixture-password')).resolves.toBeUndefined();
});

it('expires authentication on 401 without dropping drafts or retrying; logs no payload', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ code: 'UNAUTHENTICATED', message: 'upstream private text' }, { status: 401 }));
  vi.stubGlobal('fetch', fetcher);
  await expect(requestAssistance({ capability: 'assisted_start', description: 'private fictional draft' })).rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  expect(auth.expireSession).toHaveBeenCalledExactlyOnceWith();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(logging.logFrontendError).toHaveBeenCalledWith({ event: 'api_request_failed', area: 'api', method: 'POST', path: '/me/assistance', status: 401, code: 'UNAUTHENTICATED' });
  expect(JSON.stringify(logging.logFrontendError.mock.calls)).not.toContain('private');
});

it('keeps safe errors for malformed JSON and network failures without retries', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(new Response('private upstream error', { status: 502 }))
    .mockRejectedValueOnce(new Error('private network details'));
  vi.stubGlobal('fetch', fetcher);
  for (let i = 0; i < 2; i++) await expect(request('/me/profile')).rejects.toEqual(new ApiRequestError('Không thể kết nối API.'));
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(logging.logFrontendError.mock.calls)).not.toContain('private');
});
