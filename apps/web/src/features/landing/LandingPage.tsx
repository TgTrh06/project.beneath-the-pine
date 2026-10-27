import { useEffect } from "react";
import { SiteHeader } from "../../shared/components/site/SiteHeader";
import { SiteFooter } from "../../shared/components/site/SiteFooter";
import "./landing.css";
import { TrailPreview } from "./TrailPreview";
import { useRevealOnce } from "./useRevealOnce";
import { LandingScene } from "./LandingScene";
import "./landing-forest.css";

export function LandingPage({ signedIn = false }: { signedIn?: boolean }) {
  const landingRef = useRevealOnce();
  const cta = signedIn ? "Về không gian của bạn" : "Ghé dưới tán thông";
  const entryHref = signedIn ? "#return" : "#register";
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Pyneath — Một bước nhỏ để bắt đầu";
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(location.hash.slice(1) || "home");
      target?.scrollIntoView({ block: "start" });
      if (target && target.id !== "home") target.focus({ preventScroll: true });
    });
    return () => { cancelAnimationFrame(frame); document.title = previousTitle; };
  }, []);

  return <div ref={landingRef} className="landing landing-forest public-page" id="home">
    <a className="skip-link" href="#landing-main">Đến nội dung chính</a>
    <LandingScene>{controls => <SiteHeader signedIn={signedIn} showTheme={false} actions={controls} />}</LandingScene>

    <main id="landing-main" tabIndex={-1}>
      <section className="lp-hero lp-container" aria-labelledby="lp-title">
        <p className="lp-kicker"><span className="lp-small-line" /> MỘT KHOẢNG YÊN ĐỂ BẮT ĐẦU</p>
        <div className="lp-hero-copy">
          <h1 id="lp-title">Không cần làm hết.<br /><span>Một bước thôi.</span></h1>
          <div className="lp-hero-aside">
            <p className="lp-intro">Khi mọi thứ đang hơi nhiều, mình cùng tìm một việc nhỏ có thể bắt đầu.</p>
            <p>Một không gian tập trung bằng tiếng Việt. Đặt xuống điều đang nghĩ, chọn bước tiếp theo, rồi dành cho nó vài phút.</p>
            <a className="lp-button" href={entryHref}>{cta}</a>
            <p className="lp-caption">{signedIn ? "Một khoảng yên để tiếp tục hành trình." : "Tạo tài khoản Wanderer để bắt đầu."}</p>
          </div>
        </div>

        <div className="lp-hero-foot"><span>ÍT ĐI MỘT CHÚT. DỄ BẮT ĐẦU HƠN.</span><a href="#how-it-works">Khám phá cách hoạt động <span aria-hidden="true">↓</span></a></div>
      </section>

      <section className="lp-how lp-container" id="how-it-works" tabIndex={-1} aria-labelledby="lp-how-title">
        <div className="lp-section-heading"><p className="lp-kicker">TỪ BỊ KẸT ĐẾN BẮT ĐẦU</p><h2 id="lp-how-title">Nhẹ đầu hơn.<br /><span>Rõ một bước hơn.</span></h2><p>Không cần một kế hoạch hoàn hảo để có một điểm bắt đầu.</p></div>
        <ol className="lp-steps">
          <li><span className="lp-step-number" aria-hidden="true">01</span><div><h3>Đặt xuống điều đang nghĩ.</h3><p>Viết một việc bạn muốn dành thời gian cho. Chỉ một ý định nhỏ, riêng tư, không cần sắp xếp cả ngày.</p></div><p className="lp-step-note">“Mình cần làm báo cáo,<br />nhưng chưa biết bắt đầu.”</p></li>
          <li><span className="lp-step-number" aria-hidden="true">02</span><div><h3>Dành cho nó vài phút.</h3><p>Chọn 5, 10, 25 hoặc 50 phút. Bắt đầu một phiên riêng với một việc và một đồng hồ.</p></div><p className="lp-step-note">“Chỉ mở tài liệu.<br />Viết một ý đầu tiên.”</p></li>
          <li><span className="lp-step-number" aria-hidden="true">03</span><div><h3>Để lại một điểm tiếp tục.</h3><p>Trước khi khép lại, ghi một câu cho lần sau. Pyneath giữ điểm này để bạn không phải tìm lại từ đầu.</p></div><p className="lp-step-note">“Mình đã bắt đầu.<br />Thế là có một bước rồi.”</p></li>
        </ol>
        <a className="lp-text-link" href={entryHref}>{signedIn ? "Về không gian của bạn" : "Bắt đầu với tài khoản của bạn"}</a>
        <TrailPreview />
      </section>

      <section className="lp-return" id="experience" tabIndex={-1} aria-labelledby="lp-return-title">
        <div className="lp-container lp-return-inner">
          <div className="lp-return-copy"><p className="lp-kicker">MỘT NƠI ĐỂ QUAY LẠI</p><h2 id="lp-return-title">Bạn có thể<br />bắt đầu lại.<br /><em>Ngay từ đây.</em></h2><p>Có những ngày kế hoạch không đi như mình nghĩ. Một điểm tiếp tục — Open Seed — giữ lại nơi bạn muốn mở vào lần sau. Quay lại, đọc một câu, rồi chọn bước nhỏ tiếp theo.</p><p className="lp-return-signoff">Pyneath dành chỗ cho cả những ngày như thế.</p></div>
          <figure className="lp-rest-preview"><img src="/solo/solo-poster-dusk.webp" alt="Một người ngồi dưới gốc tùng, Marten ngủ bên cạnh ánh đèn lồng." width="1600" height="1000" loading="lazy" /><figcaption>Một góc riêng dưới tán tùng. Từng chút một.</figcaption></figure>
        </div>
      </section>

      <section className="lp-principles lp-container" aria-labelledby="lp-principles-title">
        <div><p className="lp-kicker">NHỮNG ĐIỀU PYNEATH GIỮ LẠI</p><h2 id="lp-principles-title">Một chút cấu trúc.<br /><span>Nhiều chỗ để thở.</span></h2></div>
        <div className="lp-principle-list">
          <article><span aria-hidden="true">↳</span><div><h3>Một việc, tại một thời điểm.</h3><p>Bước đang làm được đặt ở trung tâm. Những việc khác có thể chờ đến lượt.</p></div></article>
          <article><span aria-hidden="true">↳</span><div><h3>Bạn giữ quyền quyết định.</h3><p>Bạn chọn việc và thời lượng. Có tiến triển, đang vướng hay muốn dừng đều là những cách khép lại hợp lệ.</p></div></article>
          <article><span aria-hidden="true">↳</span><div><h3>Có mặt cùng người quen.</h3><p>Tạo Camp riêng, hẹn một Focus Pact. Mỗi người làm việc của mình; nội dung công việc vẫn riêng tư. Không streak, không bảng xếp hạng.</p></div></article>
        </div>
      </section>

      <section className="lp-before lp-container" id="before-you-start" tabIndex={-1} aria-labelledby="lp-before-title">
        <div><p className="lp-kicker">TRƯỚC KHI BẮT ĐẦU</p><h2 id="lp-before-title">Một vài điều<br />nói rõ với nhau.</h2><p>Pyneath đang được phát triển. Đây là lời mời trải nghiệm những bước đầu.</p></div>
        <div className="lp-questions">
          <details open><summary>Tài khoản Wanderer có gì?</summary><p>Một không gian cho phiên tập trung riêng, điểm tiếp tục và những cuộc hẹn cùng người quen. Khối tương tác phía trên là minh họa dựng sẵn, không lưu dữ liệu và không tạo gợi ý bằng AI.</p></details>
          <details><summary>Pyneath có thay thế hỗ trợ chuyên môn không?</summary><p>Không. Pyneath hỗ trợ tự quản lý và tập trung; không chẩn đoán, điều trị hay đưa ra tư vấn y khoa.</p></details>
          <details><summary>Có cần làm xong khi hết giờ?</summary><p>Không cần. Đồng hồ khép lại một chặng, không đánh giá kết quả. Bạn có thể để lại điểm tiếp tục rồi quay lại khi sẵn sàng.</p></details>
        </div>
      </section>

      <section className="lp-closing lp-container" aria-labelledby="lp-closing-title">
        <p className="lp-kicker">KHÔNG CẦN ĐỢI MỘT NGÀY HOÀN HẢO</p><h2 id="lp-closing-title">Bắt đầu nhỏ.<br /><em>Ngay hôm nay.</em></h2><a className="lp-button" href={entryHref}>{cta}</a><p className="lp-caption">Một bước phù hợp với bạn là đủ để bắt đầu.</p>
      </section>
    </main>
    <SiteFooter showTheme={false} />
  </div>;
}
