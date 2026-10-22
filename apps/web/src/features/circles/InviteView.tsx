import "./circles.css";
import { useCallback, useRef, useState } from "react";
import { acceptCircleInvite, ApiRequestError, declineCircleInvite, getCircleInvitePreview } from "../../shared/api/api";
import { useResource } from "../../shared/api/useResource";
import { ErrorMessage } from "../../shared/components/ui";

export function InviteView({ token, onOpen, onDeclined, onCircles }: {
  token: string;
  onOpen: (id: string) => void;
  onDeclined: () => void;
  onCircles: () => void;
}) {
  const loader = useCallback(async () => {
    try { return { state: "ready" as const, invite: (await getCircleInvitePreview(token)).invite }; }
    catch (failure) {
      if (failure instanceof ApiRequestError && [404, 409].includes(failure.status ?? 0)) return { state: "unavailable" as const };
      throw failure;
    }
  }, [token]);
  const resource = useResource(loader);
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const act = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError("");
    try { await action(); }
    catch (failure) {
      if (failure instanceof ApiRequestError && [404, 409].includes(failure.status ?? 0)) {
        setError("Chưa thể dùng lời mời này. Circle có thể đã đủ người hoặc link vừa đổi trạng thái.");
        await resource.reload();
      }
      else setError(`${failure instanceof Error ? failure.message : "Chưa thể xử lý lời mời."} Hãy thử lại thao tác bên dưới.`);
    }
    finally { pending.current = false; setBusy(false); }
  };

  return <section className="circles-page invite-detail">
    <p className="eyebrow">LỜI MỜI RIÊNG</p>
    <h1>Một khoảng yên cùng người quen.</h1>
    {resource.loading && <p role="status">Đang kiểm tra lời mời…</p>}
    <ErrorMessage message={resource.error} retry={() => void resource.reload()}/>
    {!resource.loading && resource.data?.state === "unavailable" && <>
      <p role="alert">Link mời này không còn sử dụng được. Nếu bạn vừa nhận lời, hãy kiểm tra danh sách Circle của mình.</p>
      <button className="secondary" onClick={onCircles}>Xem Circle của bạn</button>
    </>}
    {!resource.loading && resource.data?.state === "ready" && <>
      <p>Chỉ nhận lời nếu link này đến từ người bạn biết. Sau khi tham gia, thành viên Circle có thể thấy tên hiển thị của bạn.</p>
      <div className="circle-panel invite-preview">
        <h2>{resource.data.invite.circleName}</h2>
        <p>Người tạo link: {resource.data.invite.inviterName ?? "chưa đặt tên hiển thị"}</p>
        <p className="field-hint">Danh sách thành viên chỉ hiện sau khi tham gia.</p>
      </div>
      <ErrorMessage message={error}/>
      <div className="button-row">
        <button className="primary" disabled={busy} onClick={() => void act(async () => {
          const value = await acceptCircleInvite(token);
          history.replaceState(null, "", "#circles");
          onOpen(value.circleId);
        })}>{busy ? "Đang xử lý…" : "Tham gia Circle"}</button>
        <button className="secondary" disabled={busy} onClick={() => void act(async () => {
          await declineCircleInvite(token);
          history.replaceState(null, "", "#circles");
          onDeclined();
        })}>Không tham gia</button>
      </div>
    </>}
  </section>;
}
