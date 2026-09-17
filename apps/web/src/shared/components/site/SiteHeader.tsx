import { useEffect, useId, useRef, useState } from "react";
import "./site.css";
import { ThemeSelect } from "../../theme/ThemeSelect";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [headerState, setHeaderState] = useState<"top" | "hidden" | "visible">("top");
  useEffect(() => {
    let previousY = Math.max(0, window.scrollY);
    let distance = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
      const delta = y - previousY;
      previousY = y;
      if (y <= 84) {
        distance = 0;
        setHeaderState("top");
        return;
      }
      if (Math.sign(delta) !== Math.sign(distance)) distance = 0;
      distance += delta;
      if (Math.abs(distance) >= 12) {
        setHeaderState(distance > 0 ? "hidden" : "visible");
        distance = 0;
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  const pendingMenuHref = useRef<string | null>(null);
  const closeMenu = (href?: string) => {
    pendingMenuHref.current = href ?? null;
    setMenuClosing(true);
  };
  useEffect(() => {
    if (!menuClosing) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 240;
    const timer = window.setTimeout(() => {
      setMenuOpen(false);
      setMenuClosing(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [menuClosing]);
  useEffect(() => {
    if (menuOpen || !pendingMenuHref.current) return;
    const href = pendingMenuHref.current;
    pendingMenuHref.current = null;
    const frame = requestAnimationFrame(() => {
      window.location.hash = href;
      const target = document.getElementById(href.slice(1));
      target?.scrollIntoView({ block: "start" });
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [menuOpen]);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const dialog = menuRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1101px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (!desktop.matches) menuButtonRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  return <>
    <div className="public-header-slot"><header className={`public-header is-${menuOpen ? "visible" : headerState}`}><div className="public-header-frame public-container"><div className="public-header-inner public-inner">
      <a className="public-brand" href="#home" aria-label="Beneath the Pine, trang giới thiệu">
        <svg viewBox="0 0 32 36" aria-hidden="true" fill="none"><path d="M16 31V5M16 5 8 15h5L5 25h22l-8-10h5L16 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
        <span>Beneath<br />the Pine<span className="public-brand-dot">.</span></span>
      </a>
      <nav className="public-nav" aria-label="Trang giới thiệu">
        <a href="#how-it-works">Cách hoạt động</a>
        <a href="#experience">Tinh thần của Pine</a>
      </nav>
      <div className="public-tools"><ThemeSelect/><a className="public-cta" href={signedIn ? "#return" : "#register"}>{signedIn ? "Về không gian của bạn" : "Ghé dưới tán thông"}</a></div>
      <button ref={menuButtonRef} className="public-menu-toggle" type="button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls={menuId} aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
        <span>Menu</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 6h14M3 14h14" stroke="currentColor" strokeWidth="2" /></svg>
      </button>
    </div></div></header></div>
    <dialog ref={menuRef} id={menuId} className={`public-menu-panel${menuClosing ? " is-closing" : ""}`} aria-label="Menu Beneath the Pine" onCancel={(event) => { event.preventDefault(); closeMenu(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
    }}>
      <div className="public-menu-top"><button type="button" className="public-menu-close" aria-label="Đóng menu" onClick={() => closeMenu()}>×</button></div>
      <nav className="public-menu-links" aria-label="Menu trang giới thiệu">
        <a href="#how-it-works" onClick={(event) => { event.preventDefault(); closeMenu("#how-it-works"); }}>Cách hoạt động</a>
        <a href="#experience" onClick={(event) => { event.preventDefault(); closeMenu("#experience"); }}>Tinh thần của Pine</a>
        <a className="public-cta" href={signedIn ? "#return" : "#register"} onClick={(event) => { event.preventDefault(); closeMenu(signedIn ? "#return" : "#register"); }}>{signedIn ? "Về không gian của bạn" : "Ghé dưới tán thông"}</a>
        {!signedIn && <><p className="field-hint">Tạo tài khoản Wanderer để bắt đầu.</p><a href="#login" onClick={(event) => { event.preventDefault(); closeMenu("#login"); }}>Đăng nhập</a></>}
      </nav>
      <ThemeSelect/>
    </dialog>
  </>;
}
