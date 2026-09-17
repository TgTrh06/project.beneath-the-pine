import { useCallback, useEffect, useRef, useState } from "react";
export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current; setLoading(true); setError("");
    try { const result = await loader(); if (request === sequence.current) setData(result); }
    catch (failure) { if (request === sequence.current) setError(failure instanceof Error ? failure.message : "Chưa thể tải dữ liệu."); }
    finally { if (request === sequence.current) setLoading(false); }
  }, [loader]);
  useEffect(() => { void reload(); return () => { sequence.current++; }; }, [reload]);
  return { data, error, loading, reload, setData };
}
