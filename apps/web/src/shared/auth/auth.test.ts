import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const csrf = 'a'.repeat(64);
const account = { id: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca', email: 'member@example.test' };
beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllGlobals(); });
it('authenticates with CSRF and cookie credentials; logout clears the session', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ authenticated: false, account: null, csrfToken: csrf }))
    .mockResolvedValueOnce(Response.json({ authenticated: true, account, csrfToken: 'b'.repeat(64) }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  const auth = await import('./auth');
  const listener = vi.fn(); auth.subscribeToAuth(listener);
  const result = await auth.register({ email: account.email, password: 'test-only-long-password' });
  expect(result.email).toBe(account.email);
  expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: 'include', headers: { 'X-XSRF-TOKEN': csrf } });
  await auth.logout();
  expect(listener).toHaveBeenLastCalledWith(null);
});
it('rejects invalid account payloads and safely reports non-JSON service errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ authenticated: true, account: { ...account, email: 'invalid' }, csrfToken: csrf }))
    .mockResolvedValueOnce(new Response('upstream unavailable', { status: 502 })));
  const auth = await import('./auth');
  await expect(auth.initializeAuth()).rejects.toThrow('Không thể xác nhận');
  await expect(auth.initializeAuth()).rejects.toThrow('chưa sẵn sàng');
});
