import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampForest } from '@pyneath/contracts';
import { ApiRequestError, getCampForests } from '../../shared/api/api';

type State = { campId: string; data: CampForest | null; loading: boolean; error: string };

/** Account-scoped by AppLayout; a different Camp or visibility transition discards old access data. */
export function useCampForest(campId: string, onAccessLost: () => void) {
  const [state, setState] = useState<State>({ campId, data: null, loading: true, error: '' });
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    setState({ campId, data: null, loading: true, error: '' });
    try {
      const result = await getCampForests();
      if (request !== sequence.current) return;
      const data = result.camps.find(camp => camp.campId === campId) ?? null;
      setState({ campId, data, loading: false, error: data ? '' : 'Chưa có quyền xem góc rừng này.' });
      if (!data) onAccessLost();
    } catch (failure) {
      if (request !== sequence.current) return;
      const denied = failure instanceof ApiRequestError && [401, 403, 404].includes(failure.status ?? 0);
      setState({ campId, data: null, loading: false, error: denied ? 'Chưa có quyền xem góc rừng này.' : 'Chưa tải được dấu chân chung.' });
      if (denied) onAccessLost();
    }
  }, [campId, onAccessLost]);
  useEffect(() => {
    const visibility = () => {
      if (document.visibilityState === 'visible') void reload();
      else { sequence.current++; setState({ campId, data: null, loading: true, error: '' }); }
    };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { sequence.current++; document.removeEventListener('visibilitychange', visibility); };
  }, [campId, reload]);
  const current = state.campId === campId ? state : { campId, data: null, loading: true, error: '' };
  return { ...current, reload };
}
