import { useEffect, useRef, useState } from "react";
import { isConfigured } from "../../shared/api/api";
import "./landing.css";

function PineDrawing() {
  return <svg viewBox="0 0 280 340" fill="none" aria-hidden="true" className="lp-pine-drawing">
    <path d="M140 302V48M140 66 106 104M140 66l34 38M140 97l-56 52M140 97l56 52M140 132l-78 64M140 132l78 64M140 174l-97 71M140 174l97 71M140 220l-115 69M140 220l115 69" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M82 309c32-11 84-11 116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
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
    const desktop = window.matchMedia("(min-width: 861px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (!desktop.matches) menuButtonRef.current?.focus({ preventScroll: true });
    };
  }, [menuOpen]);
  const cta = isConfigured ? "Vào không gian tập trung" : "Thử bản demo";
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Beneath the Pine — Một bước nhỏ để bắt đầu";
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1) || "home");
      target?.scrollIntoView({ block: "start" });
      if (target && target.id !== "home") target.focus({ preventScroll: true });
    });
    return () => { cancelAnimationFrame(frame); document.title = previousTitle; };
  }, []);

  return <div className="landing" id="home">
    <a className="skip-link" href="#landing-main">Đến nội dung chính</a>
    <header className="lp-header lp-container">
      <a className="lp-brand" href="#home" aria-label="Beneath the Pine, trang giới thiệu">
        <svg viewBox="0 0 32 36" aria-hidden="true" fill="none"><path d="M16 31V5M16 5 8 15h5L5 25h22l-8-10h5L16 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
        <span>Beneath<br />the Pine<span className="lp-brand-dot">.</span></span>
      </a>
      <nav className="lp-nav" aria-label="Trang giới thiệu">
        <a href="#how-it-works">Cách hoạt động</a>
        <a href="#experience">Tinh thần của Pine</a>
      </nav>
      <a className="lp-header-cta" href="#now">Vào ứng dụng <span aria-hidden="true">↗</span></a>
      <button ref={menuButtonRef} className="lp-menu-toggle" type="button" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls="lp-mobile-menu" aria-haspopup="dialog" onClick={() => setMenuOpen(true)}>
        <span>Menu</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 6h14M3 14h14" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
    </header>
    <dialog ref={menuRef} id="lp-mobile-menu" className={`lp-menu-panel${menuClosing ? " is-closing" : ""}`} aria-label="Menu Beneath the Pine" onCancel={(event) => { event.preventDefault(); closeMenu(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
    }}>
      <div className="lp-menu-top"><button type="button" className="lp-menu-close" aria-label="Đóng menu" onClick={() => closeMenu()}>×</button></div>
      <nav className="lp-menu-links" aria-label="Menu trang giới thiệu">
        <a href="#how-it-works" onClick={(event) => { event.preventDefault(); closeMenu("#how-it-works"); }}>Cách hoạt động</a>
        <a href="#experience" onClick={(event) => { event.preventDefault(); closeMenu("#experience"); }}>Tinh thần của Pine</a>
        <a className="lp-menu-app" href="#now" onClick={(event) => { event.preventDefault(); closeMenu("#now"); }}>Vào ứng dụng</a>
      </nav>
    </dialog>

    <main id="landing-main" tabIndex={-1}>
      <section className="lp-hero lp-container" aria-labelledby="lp-title">
        <p className="lp-kicker"><span className="lp-small-line" /> MỘT KHOẢNG YÊN ĐỂ BẮT ĐẦU</p>
        <div className="lp-hero-copy">
          <h1 id="lp-title">Không cần<br />làm hết.<br /><span>Một bước thôi.</span></h1>
          <div className="lp-hero-aside">
            <p className="lp-intro">Khi mọi thứ đang hơi nhiều, mình cùng tìm một việc nhỏ có thể bắt đầu.</p>
            <p>Một không gian tập trung bằng tiếng Việt. Đặt xuống điều đang nghĩ, chọn bước tiếp theo, rồi dành cho nó vài phút.</p>
            <a className="lp-button" href="#now">{cta}<span aria-hidden="true">↗</span></a>
            <p className="lp-caption">{isConfigured ? "Phiên bản đang phát triển · Tính năng trực tuyến cần đăng nhập." : "Không cần tài khoản · Bản demo trên trình duyệt"}</p>
          </div>
        </div>

        <figure className="lp-preview">
          <div className="lp-preview-top"><span>BENEATH THE PINE / MỘT KHOẢNH KHẮC BẮT ĐẦU</span><span>VÍ DỤ MINH HỌA</span></div>
          <div className="lp-preview-scene">
            <div className="lp-note">
              <span className="lp-note-label">01 / ĐANG TRONG ĐẦU</span>
              <p>Báo cáo còn dang dở.<br />Email chưa trả lời.<br />Chẳng biết bắt đầu từ đâu.</p>
              <span className="lp-note-bottom">Cứ đặt xuống. Chưa cần sắp xếp.</span>
            </div>
            <span className="lp-preview-arrow" aria-hidden="true">→</span>
            <div className="lp-focus-example">
              <div className="lp-example-top"><span>02 / MỘT BƯỚC NHỎ</span><span className="lp-dot" aria-hidden="true" /></div>
              <h2>Mở báo cáo.<br />Viết một gạch đầu dòng.</h2>
              <div className="lp-example-bottom"><span className="lp-example-time">05<span>:</span>00</span><p>Chỉ bắt đầu.<br />Chưa cần hoàn hảo.</p></div>
            </div>
          </div>
          <figcaption>Một ví dụ từ điều đang vướng đến một bước có thể làm. Bạn luôn là người chọn.</figcaption>
        </figure>
        <div className="lp-hero-foot"><span>ÍT ĐI MỘT CHÚT. DỄ BẮT ĐẦU HƠN.</span><a href="#how-it-works">Khám phá cách hoạt động <span aria-hidden="true">↓</span></a></div>
      </section>

      <section className="lp-how lp-container" id="how-it-works" tabIndex={-1} aria-labelledby="lp-how-title">
        <div className="lp-section-heading"><p className="lp-kicker">TỪ BỊ KẸT ĐẾN BẮT ĐẦU</p><h2 id="lp-how-title">Nhẹ đầu hơn.<br /><span>Rõ một bước hơn.</span></h2><p>Không cần một kế hoạch hoàn hảo để có một điểm bắt đầu.</p></div>
        <ol className="lp-steps">
          <li><span className="lp-step-number" aria-hidden="true">01</span><div><h3>Đặt xuống điều đang nghĩ.</h3><p>Viết vào Brain Dump như cách bạn đang nghĩ. Một câu, một danh sách chưa gọn, hay một việc cứ ở trong đầu.</p></div><p className="lp-step-note">“Mình cần làm báo cáo,<br />nhưng chưa biết bắt đầu.”</p></li>
          <li><span className="lp-step-number" aria-hidden="true">02</span><div><h3>Chọn một bước vừa sức.</h3><p>Xem gợi ý và chọn bước phù hợp. Vẫn thấy khó? Bạn có thể yêu cầu một bước nhỏ hơn trước khi bắt đầu.</p></div><p className="lp-step-note">“Chỉ mở tài liệu.<br />Viết một ý đầu tiên.”</p></li>
          <li><span className="lp-step-number" aria-hidden="true">03</span><div><h3>Dành cho nó vài phút.</h3><p>Vào phiên tập trung với một việc và một đồng hồ. Tạm dừng, tiếp tục hoặc kết thúc khi đã đủ với bạn.</p></div><p className="lp-step-note">“Mình đã bắt đầu.<br />Thế là có một bước rồi.”</p></li>
        </ol>
        <a className="lp-text-link" href="#capture">Thử đặt xuống một điều <span aria-hidden="true">↗</span></a>
      </section>

      <section className="lp-return" id="experience" tabIndex={-1} aria-labelledby="lp-return-title">
        <div className="lp-container lp-return-inner">
          <div className="lp-return-copy"><p className="lp-kicker">MỘT NƠI ĐỂ QUAY LẠI</p><h2 id="lp-return-title">Bạn có thể<br />bắt đầu lại.<br /><em>Ngay từ đây.</em></h2><p>Có những ngày kế hoạch không đi như mình nghĩ. Bạn có thể dừng, chọn một bước nhỏ hơn, rồi thử lại khi sẵn sàng.</p><p className="lp-return-signoff">Pine dành chỗ cho cả những ngày như thế.</p></div>
          <div className="lp-pine-print"><span className="lp-print-corner">B / P</span><PineDrawing /><span className="lp-print-caption">TỪNG CHÚT MỘT.</span></div>
        </div>
      </section>

      <section className="lp-principles lp-container" aria-labelledby="lp-principles-title">
        <div><p className="lp-kicker">NHỮNG ĐIỀU PINE GIỮ LẠI</p><h2 id="lp-principles-title">Một chút cấu trúc.<br /><span>Nhiều chỗ để thở.</span></h2></div>
        <div className="lp-principle-list">
          <article><span aria-hidden="true">↳</span><div><h3>Một việc, tại một thời điểm.</h3><p>Bước đang làm được đặt ở trung tâm. Những việc khác có thể chờ đến lượt.</p></div></article>
          <article><span aria-hidden="true">↳</span><div><h3>Bạn giữ quyền quyết định.</h3><p>Gợi ý chỉ trở thành task khi bạn chọn. Có thể thu nhỏ bước đi, tạm dừng hoặc làm đến đây thôi.</p></div></article>
          <article><span aria-hidden="true">↳</span><div><h3>Không chấm điểm sự cố gắng.</h3><p>Không streak, không bảng xếp hạng. Một phiên ngắn cũng có chỗ trong ngày của bạn.</p></div></article>
        </div>
      </section>

      <section className="lp-before lp-container" id="before-you-start" tabIndex={-1} aria-labelledby="lp-before-title">
        <div><p className="lp-kicker">TRƯỚC KHI BẠN THỬ</p><h2 id="lp-before-title">Một vài điều<br />nói rõ với nhau.</h2><p>Beneath the Pine đang được phát triển. Đây là lời mời trải nghiệm những bước đầu.</p></div>
        <div className="lp-questions">
          <details open><summary>{isConfigured ? "Trải nghiệm hiện tại có gì?" : "Bản demo hoạt động thế nào?"}</summary><p>{isConfigured ? "Bạn có thể mở không gian tập trung. Những tính năng dùng dữ liệu trực tuyến cần đăng nhập; khả năng sử dụng phụ thuộc dịch vụ đang được triển khai." : "Bạn có thể thử Brain Dump, chọn bước nhỏ và chạy timer ngay trên trình duyệt. Gợi ý demo dùng quy tắc đơn giản, không gọi AI. Task và ghi chú demo nằm trong bộ nhớ phiên, sẽ mất khi tải lại trang."}</p></details>
          <details><summary>Pine có thay thế hỗ trợ chuyên môn không?</summary><p>Không. Pine hỗ trợ tự quản lý và tập trung; không chẩn đoán, điều trị hay đưa ra tư vấn y khoa.</p></details>
          <details><summary>Có cần hoàn thành task khi hết giờ?</summary><p>Không cần. Thời lượng là một gợi ý để bắt đầu. Bạn có thể tạm dừng, tiếp tục hoặc ghi nhận rằng mình vẫn đang bị kẹt.</p></details>
        </div>
      </section>

      <section className="lp-closing lp-container" aria-labelledby="lp-closing-title">
        <p className="lp-kicker">KHÔNG CẦN ĐỢI MỘT NGÀY HOÀN HẢO</p><h2 id="lp-closing-title">Bắt đầu nhỏ.<br /><em>Ngay hôm nay.</em></h2><a className="lp-button" href="#now">{cta}<span aria-hidden="true">↗</span></a><p className="lp-caption">Một bước phù hợp với bạn là đủ để bắt đầu.</p>
      </section>
    </main>
    <footer className="lp-footer lp-container"><a className="lp-footer-brand" href="#home">Beneath the Pine.</a><p>Một khoảng yên. Một bước nhỏ.</p><a href="#before-you-start">Về trải nghiệm hiện tại ↑</a></footer>
  </div>;
}
