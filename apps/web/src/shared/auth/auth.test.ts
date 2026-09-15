import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const csrf = 'a'.repeat(64);
const user = { id: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca', email: 'wanderer@example.test', role: 'wanderer' };
beforeEach(() => { vi.resetModules(); });
afterEach(() => { vi.unstubAllGlobals(); });
it('authenticates with CSRF and cookie credentials; logout clears the session', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ authenticated: false, user: null, csrfToken: csrf }))
    .mockResolvedValueOnce(Response.json({ authenticated: true, user, csrfToken: 'b'.repeat(64) }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetchMock);
  const auth = await import('./auth');
  const listener = vi.fn(); auth.subscribeToAuth(listener);
  const result = await auth.register({ email: user.email, password: 'test-only-long-password' });
  expect(result.role).toBe('wanderer');
  expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: 'include', headers: { 'X-XSRF-TOKEN': csrf } });
  await auth.logout();
  expect(listener).toHaveBeenLastCalledWith(null);
});
it('rejects unexpected role payloads and safely reports non-JSON service errors', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ authenticated: true, user: { ...user, role: 'root' }, csrfToken: csrf }))
    .mockResolvedValueOnce(new Response('upstream unavailable', { status: 502 })));
  const auth = await import('./auth');
  await expect(auth.initializeAuth()).rejects.toThrow('Không thể xác nhận');
  await expect(auth.initializeAuth()).rejects.toThrow('chưa sẵn sàng');
});
