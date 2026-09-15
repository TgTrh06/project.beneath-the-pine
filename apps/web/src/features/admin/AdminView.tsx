import { useEffect, useState } from "react";
import type { AuthSession } from "../../shared/auth/auth";
import { getAdminAccounts } from "../../shared/api/api";

export function AdminView({ remoteSession, onNotice }: { remoteSession: AuthSession; onNotice: (value: string) => void }) {
  const [entries, setEntries] = useState<Array<{ id: string; email: string; role: string; createdAt: string }>>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setFailed(false); setEntries([]);
    void getAdminAccounts(remoteSession, offset).then(data => { if (active) { setEntries(data.entries); setHasMore(data.hasMore); } })
      .catch(() => { if (active) { setFailed(true); onNotice("Không thể tải danh sách tài khoản."); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [remoteSession, offset, retry, onNotice]);
  return <><section className="page-intro"><p className="eyebrow">PINE KEEPER</p><h1>Những người ghé Pine.</h1><p>Quản trị thông tin tài khoản. Nội dung ghi chú riêng tư không xuất hiện ở đây.</p></section>
    <section className="feature-card"><h2>Tài khoản</h2>
      {loading ? <p role="status">Đang tải…</p> : failed ? <button className="secondary" onClick={() => setRetry(value => value + 1)}>Thử lại</button> : entries.length === 0 ? <p>Chưa có tài khoản để hiển thị.</p> : <table><thead><tr><th>Email</th><th>Vai trò</th><th>Ngày tạo</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id}><td data-label="Email">{entry.email}</td><td data-label="Vai trò">{entry.role === "pine_keeper" ? "Pine Keeper" : "Wanderer"}</td><td data-label="Ngày tạo">{new Date(entry.createdAt).toLocaleDateString("vi-VN")}</td></tr>)}</tbody></table>}
      <div className="button-row"><button className="secondary" disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 50))}>Trang trước</button><button className="secondary" disabled={loading || failed || !hasMore} onClick={() => setOffset(value => value + 50)}>Trang sau</button></div>
    </section></>;
}
