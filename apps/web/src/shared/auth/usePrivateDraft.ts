import { useEffect, useRef, useState, type SetStateAction } from "react";
import { draftOwner, readPrivateDraft, removePrivateDraft, restoreStoredPrivateDraft, writePrivateDraft } from "./privateDrafts";

export function usePrivateDraft<T>(key: string, initial: T | (() => T), options: { persist?: boolean } = {}) {
  const owner = useRef(draftOwner());
  const persist = options.persist ?? false;
  const [value, setValue] = useState<T>(() => readPrivateDraft(owner.current, key, () => typeof initial === "function" ? (initial as () => T)() : initial, persist));
  const current = useRef(value);
  const wasPersistent = useRef(persist);
  useEffect(() => {
    if (persist && !wasPersistent.current) {
      const restored = restoreStoredPrivateDraft<T>(owner.current, key);
      if (restored.found) {
        current.current = restored.value as T;
        setValue(restored.value as T);
      }
    }
    wasPersistent.current = persist;
  }, [key, persist]);
  const update = (next: SetStateAction<T>) => {
    const resolved = typeof next === "function" ? (next as (old: T) => T)(current.current) : next;
    current.current = resolved;
    writePrivateDraft(owner.current, key, resolved, persist);
    setValue(resolved);
  };
  const clear = () => removePrivateDraft(owner.current, key, persist);
  return [value, update, clear] as const;
}
