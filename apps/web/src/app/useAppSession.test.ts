import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AppRoute } from '../shared/types/domain';
import type { AuthSession } from '../shared/auth/auth';
import type { createHookHarness } from '../tests/hookHarness';
const h = vi.hoisted(() => ({ hooks: null as ReturnType<typeof createHookHarness> | null, initialize: vi.fn(), logout: vi.fn(),
  unsubscribe: vi.fn(), listener: null as ((session: AuthSession | null) => void) | null,
  route: { view: 'return' } as AppRoute, navigate: vi.fn() }));
vi.mock('react', async () => { const { createHookHarness } = await import('../tests/hookHarness'); h.hooks = createHookHarness(); return h.hooks.react; });
vi.mock('../shared/auth/auth', () => ({ initializeAuth: h.initialize, logout: h.logout,
  subscribeToAuth: (listener: (session: AuthSession | null) => void) => { h.listener = listener; return h.unsubscribe; } }));
vi.mock('./router', () => ({ useHashRouter: () => ({ route: h.route, navigate: h.navigate }) }));
import { useAppSession } from './useAppSession';
const render = () => h.hooks!.render(useAppSession);
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
beforeEach(() => { h.hooks!.reset(); vi.clearAllMocks(); h.route = { view: 'return' }; h.initialize.mockResolvedValue(null); h.logout.mockResolvedValue(undefined); });
afterEach(() => h.hooks!.cleanup());

it('returns to a protected route after login and clears that destination when returning to landing', async () => {
  h.route = { view: 'pact', id: 'fixture-pact' }; render(); await flush();
  h.route = { view: 'login' }; render().authenticated(); expect(h.navigate).toHaveBeenLastCalledWith('pact/fixture-pact');
  h.route = { view: 'invite', id: 'fixture-token' }; render();
  h.route = { view: 'landing' }; render();
  h.route = { view: 'login' }; render().authenticated(); expect(h.navigate).toHaveBeenLastCalledWith('return');
});

it('renders initialization errors, retries, and follows authentication expiry without editing private drafts', async () => {
  h.initialize.mockRejectedValueOnce(new Error('fixture offline')); render(); await flush();
  expect(render()).toMatchObject({ checking: false, session: null, notice: 'Chưa thể kết nối dịch vụ tài khoản.' });
  const account = { subject: 'fixture-account', email: 'fixture@example.test' }; h.initialize.mockResolvedValue(account);
  render().retryConnection(); render(); await flush(); expect(render()).toMatchObject({ session: account, notice: '', checking: false });
  h.route = { view: 'session', id: 'fixture-session' }; h.listener?.(null); render();
  h.route = { view: 'login' }; render().authenticated(); expect(h.navigate).toHaveBeenLastCalledWith('session/fixture-session');
});

it('navigates only after successful logout and unsubscribes on unmount', async () => {
  render(); await flush(); h.logout.mockRejectedValueOnce(new Error('fixture failure'));
  render().signOut(); await flush(); expect(h.navigate).not.toHaveBeenCalled(); expect(render().notice).toBe('Chưa thể đăng xuất.');
  render().signOut(); await flush(); expect(h.navigate).toHaveBeenCalledExactlyOnceWith('landing');
  h.hooks!.cleanup(); expect(h.unsubscribe).toHaveBeenCalledTimes(1);
});
