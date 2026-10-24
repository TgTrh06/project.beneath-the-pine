import { useCallback, useEffect, useRef, useState } from 'react';
import type { PactReminderClaim } from '@beneath-the-pine/contracts';
import { ApiRequestError, claimDuePactReminders, getPact, getPreferences, getProfile } from '../../shared/api/api';
import { ErrorMessage } from '../../shared/components/ui';
import { deviceTimezone, formatTime } from '../../shared/time';
import './PactReminder.css';

type Reminder = PactReminderClaim['items'][number];

export function PactReminder({ onOpen }: { onOpen: (id: string) => void }) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [timezone, setTimezone] = useState(deviceTimezone);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const itemsRef = useRef<Reminder[]>([]);
  const replaceItems = (next: Reminder[]) => { itemsRef.current = next; setItems(next); };
  const dismiss = (id: string) => replaceItems(itemsRef.current.filter(value => value.id !== id));

  const refresh = useCallback(async () => {
    if (pending.current || document.visibilityState !== 'visible') return;
    pending.current = true;
    try {
      const [preferences, profile] = await Promise.all([getPreferences(), getProfile()]);
      if (!preferences.preferences.remindAcceptedPacts) { replaceItems([]); setError(''); return; }
      setTimezone(profile.profile?.timezone ?? deviceTimezone());
      const claimed = await claimDuePactReminders();
      const validExisting: Reminder[] = [];
      for (const item of itemsRef.current) {
        try { const { pact } = await getPact(item.id); if (pact.status === 'scheduled') validExisting.push(item); }
        catch (failure) { if (!(failure instanceof ApiRequestError) || ![403,404].includes(failure.status ?? 0)) validExisting.push(item); }
      }
      replaceItems([...validExisting, ...claimed.items.filter(item => !validExisting.some(current => current.id === item.id))]);
      setError('');
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      pending.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', visible);
    window.addEventListener('pine:preferences-updated', visible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); window.removeEventListener('focus', visible); window.removeEventListener('pine:preferences-updated', visible); };
  }, [refresh]);

  if (!items.length && !error) return null;
  return <aside className="pact-reminder" aria-label="Nhắc cuộc hẹn đã nhận">
    <ErrorMessage message={error} retry={() => void refresh()}/>
    {items.map(item => <div key={item.id} className="pact-reminder__item" role="status">
      <p>Cuộc hẹn trong Camp “{item.campName}” sắp bắt đầu lúc {formatTime(item.startsAt, timezone)} ({timezone}).</p>
      <div className="button-row"><button className="secondary" onClick={() => { dismiss(item.id); onOpen(item.id); }}>Xem Pact</button>
        <button className="text-action" onClick={() => dismiss(item.id)}>Đóng nhắc</button></div>
    </div>)}
  </aside>;
}
