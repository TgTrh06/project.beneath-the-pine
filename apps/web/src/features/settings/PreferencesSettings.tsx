import { useState } from 'react';
import { getPreferences, updatePreferences } from '../../shared/api/api';
import { useResource } from '../../shared/api/useResource';
import { ErrorMessage } from '../../shared/components/ui';
import type { Preferences } from '@beneath-the-pine/contracts';

export function PreferencesSettings() {
  const resource = useResource(getPreferences);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const preferences = resource.data?.preferences;

  const save = async (patch: Partial<Preferences>, success: string) => {
    if (!preferences || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await updatePreferences(patch);
      resource.setData(result);
      setMessage(success);
      window.dispatchEvent(new Event('pine:preferences-updated'));
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <section className="feature-card">
    <h2>Hiện diện trong Pact</h2>
    <p>Thành viên cùng Pact luôn biết bạn đã tham gia hoặc đã khép phiên. Bạn có thể chọn có chia sẻ thêm trạng thái đang tập trung, nghỉ và mất kết nối hay không.</p>
    <ErrorMessage message={resource.error} retry={resource.reload}/>
    <ErrorMessage message={error}/>
    {resource.loading && <p role="status">Đang tải lựa chọn riêng tư…</p>}
    {preferences && <><p role="status">{preferences.sharePresence ? 'Đang chia sẻ trạng thái' : 'Chỉ hiện đã tham gia hoặc đã khép phiên'}</p>
      <button className="secondary" type="button" disabled={busy} onClick={() => void save({sharePresence:!preferences.sharePresence}, preferences.sharePresence ? 'Đã tắt chia sẻ trạng thái trong Pact.' : 'Đã bật chia sẻ trạng thái trong Pact.')}>{busy ? 'Đang lưu…' : preferences.sharePresence ? 'Tắt chia sẻ' : 'Bật chia sẻ'}</button></>}
    {message && <p className="notice" role="status">{message}</p>}
    <h3>Nhắc cuộc hẹn đã nhận</h3>
    <p>Chỉ nhắc khi bạn đang mở web trong 10 phút trước giờ hẹn, tối đa một lần cho mỗi Pact. Không có email hoặc thông báo khi web đóng.</p>
    {preferences && <><p role="status">{preferences.remindAcceptedPacts ? 'Đang bật nhắc trong web' : 'Đang tắt nhắc trong web'}</p>
      <button className="secondary" type="button" disabled={busy} onClick={() => void save({remindAcceptedPacts:!preferences.remindAcceptedPacts}, preferences.remindAcceptedPacts ? 'Đã tắt nhắc Pact.' : 'Đã bật nhắc Pact.')}>{busy ? 'Đang lưu…' : preferences.remindAcceptedPacts ? 'Tắt nhắc' : 'Bật nhắc'}</button></>}
  </section>;
}
