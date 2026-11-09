/** CPU-only hook orchestration fixture. Browser checks cover React DOM, focus and rendering. */
export function createHookHarness() {
  let slots: unknown[] = [], index = 0;
  const effects = new Map<number, { deps?: readonly unknown[]; cleanup?: () => void }>();
  let pending: Array<() => void> = [];
  function useState<T>(initial: T | (() => T)): [T, (next: T | ((value: T) => T)) => void] {
    const key = index++;
    if (!(key in slots)) slots[key] = typeof initial === 'function' ? (initial as () => T)() : initial;
    return [slots[key] as T, next => { slots[key] = typeof next === 'function' ? (next as (value: T) => T)(slots[key] as T) : next; }];
  }
  function useRef<T>(initial: T) {
    const key = index++;
    if (!(key in slots)) slots[key] = { current: initial };
    return slots[key] as { current: T };
  }
  function useReducer<S, A>(reduce: (state: S, action: A) => S, initial: S): [S, (action: A) => void] {
    const [state, setState] = useState(initial);
    return [state, action => setState(current => reduce(current, action))];
  }
  function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
    const key = index++, old = effects.get(key);
    if (old && deps && old.deps && deps.length === old.deps.length && deps.every((value, i) => Object.is(value, old.deps?.[i]))) return;
    pending.push(() => { old?.cleanup?.(); effects.set(key, { deps, cleanup: effect() || undefined }); });
  }
  const cleanup = () => { for (const effect of effects.values()) effect.cleanup?.(); effects.clear(); };
  return {
    react: { useState, useRef, useReducer, useEffect },
    render<T>(hook: () => T): T { index = 0; const result = hook(); const tasks = pending; pending = []; tasks.forEach(task => task()); return result; },
    cleanup,
    reset() { cleanup(); slots = []; index = 0; pending = []; },
  };
}
