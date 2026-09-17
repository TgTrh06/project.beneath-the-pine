import { useEffect, useRef, useState, type SubmitEventHandler } from "react";
import { SiteHeader } from "../../shared/components/site/SiteHeader";
import { SiteFooter } from "../../shared/components/site/SiteFooter";
import { login, register } from "../../shared/auth/auth";

export function AuthView({ mode, connectionError, onRetry, onSuccess }: { mode: "login" | "register"; connectionError: string; onRetry: () => void; onSuccess: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const creating = mode === "register";
  useEffect(() => { document.title = `${creating ? "Đăng ký" : "Đăng nhập"} — Beneath the Pine`; heading.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [creating]);
  const submit: SubmitEventHandler<HTMLFormElement> = async event => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    if (creating && password !== data.get("confirm")) { setMessage("Mật khẩu xác nhận chưa khớp."); (form.elements.namedItem("confirm") as HTMLInputElement)?.focus(); return; }
    setBusy(true); setMessage("");
    try {
      await (creating ? register : login)({ email: String(data.get("email")), password });
      form.reset(); onSuccess();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chưa thể kết nối dịch vụ tài khoản."); }
    finally { setBusy(false); }
  };
  return <div className="public-page">
    <a className="skip-link" href="#auth-main" onClick={(event) => { event.preventDefault(); document.getElementById("auth-main")?.focus(); }}>Đến nội dung chính</a>
    <SiteHeader />
    <main className="auth-shell" id="auth-main" tabIndex={-1}>
    <section className="feature-card auth-card">
      <p className="eyebrow">BENEATH THE PINE</p><h1 ref={heading} tabIndex={-1}>{creating ? "Tạo khoảng riêng của bạn." : "Về dưới tán thông."}</h1>
      <p>{creating ? "Tạo tài khoản để bắt đầu hoặc quay lại việc đang dở." : "Đăng nhập vào không gian của bạn."}</p>
      {connectionError && <div className="notice" role="alert">{connectionError} <button className="link-button" onClick={onRetry}>Thử kết nối lại</button></div>}
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="auth-fields">
          <label>Email<input name="email" type="email" required maxLength={320} autoComplete="email" /></label>
          <label>Mật khẩu<input name="password" type={showPassword ? "text" : "password"} required minLength={12} maxLength={64} autoComplete={creating ? "new-password" : "current-password"} aria-describedby="password-hint" /></label>
          <button className="text-action" type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</button>
          <p id="password-hint" className="muted">Dùng từ 12 đến 64 ký tự.</p>
          {creating && <label>Nhập lại mật khẩu<input name="confirm" type="password" aria-invalid={message === "Mật khẩu xác nhận chưa khớp."} aria-describedby="auth-error" required minLength={12} maxLength={64} autoComplete="new-password" /></label>}
          <button className="primary full" type="submit">{busy ? "Đang xử lý…" : creating ? "Tạo tài khoản" : "Đăng nhập"}</button>
        </fieldset>
      </form>
      {message && <p id="auth-error" className="notice" role="alert">{message}</p>}
      <a className="auth-switch-link" href={creating ? "#login" : "#register"}>{creating ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</a>
    </section>
    </main>
    <SiteFooter />
  </div>;
}
