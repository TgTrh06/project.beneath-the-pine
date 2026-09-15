import { useEffect } from "react";
import { SiteHeader } from "../../shared/components/site/SiteHeader";
import { SiteFooter } from "../../shared/components/site/SiteFooter";
import "./landing.css";

function PineDrawing() {
  return <svg viewBox="0 0 280 340" fill="none" aria-hidden="true" className="lp-pine-drawing">
    <path d="M140 302V48M140 66 106 104M140 66l34 38M140 97l-56 52M140 97l56 52M140 132l-78 64M140 132l78 64M140 174l-97 71M140 174l97 71M140 220l-115 69M140 220l115 69" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M82 309c32-11 84-11 116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

export function LandingPage({ signedIn = false }: { signedIn?: boolean }) {
  const cta = signedIn ? "Vào không gian của bạn" : "Ghé dưới tán thông";
  const entryHref = signedIn ? "#now" : "#register";
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

  return <div className="landing public-page" id="home">
    <a className="skip-link" href="#landing-main">Đến nội dung chính</a>
    <SiteHeader signedIn={signedIn} />

    <main id="landing-main" tabIndex={-1}>
      <section className="lp-hero lp-container" aria-labelledby="lp-title">
        <p className="lp-kicker"><span className="lp-small-line" /> MỘT KHOẢNG YÊN ĐỂ BẮT ĐẦU</p>
        <div className="lp-hero-copy">
          <h1 id="lp-title">Không cần<br />làm hết.<br /><span>Một bước thôi.</span></h1>
          <div className="lp-hero-aside">
            <p className="lp-intro">Khi mọi thứ đang hơi nhiều, mình cùng tìm một việc nhỏ có thể bắt đầu.</p>
            <p>Một không gian tập trung bằng tiếng Việt. Đặt xuống điều đang nghĩ, chọn bước tiếp theo, rồi dành cho nó vài phút.</p>
            <a className="lp-button" href={entryHref}>{cta}</a>
            <p className="lp-caption">{signedIn ? "Một khoảng yên để tiếp tục hành trình." : "Tạo tài khoản Wanderer để bắt đầu."}</p>
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
        <a className="lp-text-link" href={entryHref}>Bắt đầu với tài khoản của bạn</a>
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
        <div><p className="lp-kicker">TRƯỚC KHI BẮT ĐẦU</p><h2 id="lp-before-title">Một vài điều<br />nói rõ với nhau.</h2><p>Beneath the Pine đang được phát triển. Đây là lời mời trải nghiệm những bước đầu.</p></div>
        <div className="lp-questions">
          <details open><summary>Tài khoản Wanderer có gì?</summary><p>Bạn có thể đăng ký, đăng nhập và xem thông tin tài khoản. Brain Dump, task, thói quen và phiên tập trung đang được hoàn thiện; các hình ảnh phía trên minh họa trải nghiệm dự kiến.</p></details>
          <details><summary>Pine có thay thế hỗ trợ chuyên môn không?</summary><p>Không. Pine hỗ trợ tự quản lý và tập trung; không chẩn đoán, điều trị hay đưa ra tư vấn y khoa.</p></details>
          <details><summary>Có cần hoàn thành task khi hết giờ?</summary><p>Không cần. Thời lượng là một gợi ý để bắt đầu. Bạn có thể tạm dừng, tiếp tục hoặc ghi nhận rằng mình vẫn đang bị kẹt.</p></details>
        </div>
      </section>

      <section className="lp-closing lp-container" aria-labelledby="lp-closing-title">
        <p className="lp-kicker">KHÔNG CẦN ĐỢI MỘT NGÀY HOÀN HẢO</p><h2 id="lp-closing-title">Bắt đầu nhỏ.<br /><em>Ngay hôm nay.</em></h2><a className="lp-button" href={entryHref}>{cta}</a><p className="lp-caption">Một bước phù hợp với bạn là đủ để bắt đầu.</p>
      </section>
    </main>
    <SiteFooter />
  </div>;
}
