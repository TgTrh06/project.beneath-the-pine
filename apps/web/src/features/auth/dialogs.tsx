import { useEffect, useRef, type ReactNode, type SubmitEventHandler } from "react";

export function ConsentDialog({ onClose, onAgree }: { onClose: () => void; onAgree: () => void }) { return <Modal titleId="consent-title" onClose={onClose}><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">TRƯỚC KHI DÙNG AI</p><h2 id="consent-title">Bạn vẫn là người quyết định.</h2><p>Trong beta, nội dung Brain Dump được xử lý để gợi ý bước nhỏ và được mã hóa trước khi lưu. Nội dung thô tự xóa sau 30 ngày.</p><p>Đây không phải công cụ chẩn đoán hay hỗ trợ khẩn cấp.</p><button className="primary full" onClick={onAgree}>Tôi hiểu và đồng ý</button></Modal> }
export function WaitlistDialog({ onClose, onSubmit, message }: { onClose: () => void; onSubmit: SubmitEventHandler<HTMLFormElement>; message: string }) { return <Modal titleId="waitlist-title" onClose={onClose}><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">PRIVATE BETA</p><h2 id="waitlist-title">Tham gia khi sẵn sàng.</h2><p>Beneath the Pine đang mời một nhóm nhỏ cùng thử nghiệm sản phẩm.</p><form onSubmit={onSubmit}><label>Tên (tùy chọn)<input name="name" maxLength={80} /></label><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="primary full" type="submit">Đăng ký waitlist</button></form>{message && <p className="notice" role="status">{message}</p>}</Modal> }
export function LoginDialog({ onClose, onSubmit, message }: { onClose: () => void; onSubmit: SubmitEventHandler<HTMLFormElement>; message: string }) { return <Modal titleId="login-title" onClose={onClose}><button className="close" onClick={onClose} aria-label="Đóng">×</button><p className="eyebrow">PRIVATE BETA</p><h2 id="login-title">Đăng nhập vào không gian riêng tư.</h2><p>Tài khoản được bảo vệ trực tiếp bởi Beneath the Pine.</p><form onSubmit={onSubmit}><label>Email<input name="email" type="email" required maxLength={320} autoComplete="email" /></label><label>Mật khẩu<input name="password" type="password" required minLength={12} maxLength={64} autoComplete="current-password" /></label><button className="primary full" type="submit" value="login">Đăng nhập</button><button className="link-button full" type="submit" value="register">Tạo tài khoản mới</button></form>{message && <p className="notice" role="status">{message}</p>}</Modal> }

function Modal({ titleId, onClose, children }: { titleId: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog className="modal" ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    {children}
  </dialog>;
}
