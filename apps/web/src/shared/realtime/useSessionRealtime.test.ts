import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { realtimeEvents } from '@pyneath/contracts';

const h = vi.hoisted(() => ({
  handlers: new Map<string, (value?: unknown) => void>(),
  emit: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), expire: vi.fn(), get: vi.fn(),
  connected: true, cleanup: undefined as undefined | (() => void),
}));
vi.mock('react', () => ({
  useCallback: (fn: unknown) => fn,
  useEffect: (fn: () => (() => void) | undefined) => { h.cleanup = fn(); },
  useRef: (current: unknown) => ({ current }),
  useState: (value: unknown) => [value, vi.fn()],
}));
vi.mock('socket.io-client', () => ({ io: () => ({
  get connected() { return h.connected; },
  on: (event: string, fn: (value?: unknown) => void) => h.handlers.set(event, fn),
  emit: h.emit, connect: h.connect,
  disconnect: () => { h.connected = false; h.disconnect(); },
  removeAllListeners: () => h.handlers.clear(),
}) }));
vi.mock('../auth/auth', () => ({ expireSession: h.expire }));
vi.mock('../api/api', () => ({ getSession: h.get, realtimeUrl: undefined, ApiRequestError: class extends Error {} }));
import { useSessionRealtime } from './useSessionRealtime';

beforeEach(() => {
  vi.useFakeTimers(); h.connected = true; h.handlers.clear(); h.get.mockRejectedValue(new Error('offline'));
  vi.stubGlobal('window', { setTimeout, clearTimeout, setInterval, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn(), visibilityState: 'visible' });
});
afterEach(() => { h.cleanup?.(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('expires authentication without clearing drafts or retrying revoked subscriptions', async () => {
  useSessionRealtime('session', vi.fn());
  h.handlers.get(realtimeEvents.error)?.({ code: 'UNAUTHENTICATED' });
  expect(h.expire).toHaveBeenCalledWith(); // default policy keeps private drafts for the same account
  expect(h.disconnect).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(30000);
  expect(h.emit).not.toHaveBeenCalled(); expect(h.connect).not.toHaveBeenCalled(); expect(h.get).not.toHaveBeenCalled();
});
it('service failure waits for bounded HTTP/reconnect retry instead of recursive subscribe', async () => {
  useSessionRealtime('session', vi.fn());
  h.handlers.get(realtimeEvents.error)?.({ code: 'SERVICE_UNAVAILABLE' });
  h.connected = false; h.handlers.get('disconnect')?.();
  expect(h.expire).not.toHaveBeenCalled(); expect(h.emit).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(9999); expect(h.connect).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1); expect(h.connect).toHaveBeenCalledOnce(); expect(h.get).toHaveBeenCalledOnce();
  h.connected = true; h.handlers.get('connect')?.();
  expect(h.emit).toHaveBeenCalledWith(realtimeEvents.subscribe, { sessionId: 'session' });
});
it('unmount clears retry timers and listeners', async () => {
  useSessionRealtime('session', vi.fn());
  h.handlers.get(realtimeEvents.error)?.({ code: 'FORBIDDEN' });
  h.cleanup?.(); h.cleanup = undefined;
  const before = h.emit.mock.calls.length;
  await vi.advanceTimersByTimeAsync(30000);
  expect(h.handlers.size).toBe(0); expect(h.emit.mock.calls.length).toBe(before);
});
