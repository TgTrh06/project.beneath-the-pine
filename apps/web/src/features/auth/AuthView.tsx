import { useEffect, useRef, useState, type SubmitEventHandler } from "react";
import { ReturnScene } from "../return/ReturnScene";
import "../../app/forest-pages.css";

import { login, register } from "../../shared/auth/auth";

export function AuthView({ mode, connectionError, onRetry, onSuccess }: { mode: "login" | "register"; connectionError: string; onRetry: () => void; onSuccess: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submissionGeneration = useRef(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const creating = mode === "register";
  useEffect(() => { submissionGeneration.current++; setBusy(false); setMessage(""); setShowPassword(false); formRef.current?.reset(); document.title = `${creating ? "Đăng ký" : "Đăng nhập"} — Pyneath`; heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [creating]);
  const submit: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();
    if (busy) return;
    const generation = submissionGeneration.current;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    if (creating && password !== data.get("confirm")) { setMessage("Mật khẩu xác nhận chưa khớp."); (form.elements.namedItem("confirm") as HTMLInputElement)?.focus(); return; }
    setBusy(true); setMessage("");
    try {
      await (creating ? register : login)({ email: String(data.get("email")), password });
      if (generation === submissionGeneration.current) { form.reset(); onSuccess(); }
    } catch (error) { if (generation === submissionGeneration.current) setMessage(error instanceof Error ? error.message : "Chưa thể kết nối dịch vụ tài khoản."); }
    finally { if (generation === submissionGeneration.current) setBusy(false); }
  };
  return <ReturnScene place="auth">{controls=><div className="site-shell forest-shell forest-auth">
    <a className="skip-link" href="#auth-main" onClick={(event) => { event.preventDefault(); document.getElementById("auth-main")?.focus(); }}>Đến nội dung chính</a>
    <header className="site-header"><div className="site-header-inner"><a className="brand" href="#home"><svg width="28" height="32" viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 31V5M16 5 8 15h5L5 25h22l-8-10h5L16 5Z" stroke="currentColor" strokeWidth="2"/></svg>Pyneath.</a><div className="header-actions">{controls}<a className="text-action" href="#home">Về khu rừng</a></div></div></header>
    <main className="auth-shell forest-auth-main" id="auth-main" tabIndex={-1}>
    <section className="feature-card auth-card">
      <p className="eyebrow">DƯỚI TÁN THÔNG</p><h1 ref={heading} tabIndex={-1}>{creating ? "Một chỗ dành cho bạn." : "Mừng bạn quay lại."}</h1>
      <p>{creating ? "Bắt đầu một chặng nhỏ." : "Tiếp tục từ nơi bạn dừng lại."}</p>
      {connectionError && <div className="notice" role="alert">{connectionError} <button className="link-button" onClick={onRetry}>Thử kết nối lại</button></div>}
      <form ref={formRef} onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="auth-fields">
          <label>Email<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
          <label htmlFor="auth-password">Mật khẩu</label>
          <div className="auth-password-control">
            <input id="auth-password" name="password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={64} autoComplete={creating ? "new-password" : "current-password"} aria-describedby={creating ? "password-hint" : undefined} />
            <button className="auth-password-toggle" type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-controls={creating ? "auth-password auth-confirm" : "auth-password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>{showPassword && <path d="m4 3 16 18" stroke="currentColor" strokeWidth="1.5"/>}</svg>
            </button>
          </div>
          {creating && <p id="password-hint" className="muted">Dùng từ 12 đến 64 ký tự.</p>}
          {creating && <label>Nhập lại mật khẩu<input id="auth-confirm" name="confirm" type={showPassword ? "text" : "password"} aria-invalid={message === "Mật khẩu xác nhận chưa khớp."} aria-describedby={message ? "auth-error" : undefined} required minLength={12} maxLength={64} autoComplete="new-password" /></label>}
          <button className="primary full" type="submit">{busy ? "Đang xử lý…" : creating ? "Tạo tài khoản" : "Đăng nhập"}</button>
        </fieldset>
      </form>
      {message && <p id="auth-error" className="notice" role="alert">{message}</p>}
      <a className="auth-switch-link" href={creating ? "#login" : "#register"}>{creating ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</a>
    </section>
    </main>
    <footer className="forest-auth-footer"><img src="/marten/3d/stand.webp" width="88" height="68" alt=""/><span>Một khoảng yên. Một bước nhỏ.</span></footer>
  </div>}</ReturnScene>;
}
