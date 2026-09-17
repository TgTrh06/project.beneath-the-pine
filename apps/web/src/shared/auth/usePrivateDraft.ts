import { useRef, useState, type SetStateAction } from "react";
import { draftOwner, readPrivateDraft, removePrivateDraft, writePrivateDraft } from "./privateDrafts";

export function usePrivateDraft<T>(key: string, initial: T | (() => T)) {
  const owner = useRef(draftOwner());
  const [value, setValue] = useState<T>(() => readPrivateDraft(owner.current, key, () => typeof initial === "function" ? (initial as () => T)() : initial));
  const current = useRef(value);
  const update = (next: SetStateAction<T>) => {
    const resolved = typeof next === "function" ? (next as (old: T) => T)(current.current) : next;
    current.current = resolved;
    writePrivateDraft(owner.current, key, resolved);
    setValue(resolved);
  };
  const clear = () => removePrivateDraft(owner.current, key);
  return [value, update, clear] as const;
}
