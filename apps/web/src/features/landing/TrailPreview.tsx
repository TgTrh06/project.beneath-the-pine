import { useId, useReducer } from "react";
import { MartenIllustration } from "./MartenIllustration";
import { previewReducer, trails } from "./trailPreviewState";

export function TrailPreview() {
  const [state, dispatch] = useReducer(previewReducer, { selected: null, small: false });
  const resultId = useId();
  const trail = state.selected === null ? null : trails[state.selected];
  return <div className="lp-trail-preview">
    <figure className="lp-preview">
      <div className="lp-marten-intro">
        <p><strong>Marten đây!</strong><span>Bạn đồng hành cho từng bước nhỏ.</span></p>
        <svg className="lp-marten-arrow" viewBox="0 0 88 60" fill="none" aria-hidden="true" focusable="false">
          <path d="M4 9C16 5 23 11 22 22C20 41 54 47 80 27M65 27L81 25L77 41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <MartenIllustration />
      <div className="lp-preview-top"><span>MỘT KHOẢNH KHẮC BẮT ĐẦU</span><span>Minh họa tương tác · Không lưu dữ liệu</span></div>
      <div className="lp-preview-scene">
        <div className="lp-note">
          <span className="lp-note-label">01 / ĐANG TRONG ĐẦU</span>
          <p>Chọn một việc đang vướng.</p>
          <div className="lp-trail-choices" role="group" aria-label="Chọn tình huống minh họa">
            {trails.map((item, index) => <button key={item.label} type="button" aria-pressed={state.selected === index} aria-controls={resultId} onClick={() => dispatch({ type: "select", index })}><span aria-hidden="true">{state.selected === index ? "✓" : "○"}</span>{item.label}</button>)}
          </div>
          <span className="lp-note-bottom">Một việc thôi. Những việc khác có thể chờ.</span>
        </div>
        <span className="lp-preview-arrow" aria-hidden="true">→</span>
        <div className="lp-focus-example lp-trail-result">
          <div className="lp-example-top"><span>02 / MỘT BƯỚC NHỎ</span><span className="lp-dot" aria-hidden="true" /></div>
          <div id={resultId} aria-live="polite" aria-atomic="true" className="lp-trail-message">
            <h2 key={`${state.selected}-${state.small}`}>{trail ? (state.small ? trail.smaller : trail.step) : "Bắt đầu từ điều đang vướng."}</h2>
            <p>{trail ? (state.small ? "Đến đây thôi cũng được. Bạn chọn khi nào bắt đầu." : "Gợi ý: 5 phút. Chỉ bắt đầu, chưa cần hoàn hảo.") : "Chọn một tình huống để xem gợi ý bước đầu tiên."}</p>
          </div>
          <button type="button" className="lp-shrink-step" aria-disabled={!trail || state.small} onClick={() => dispatch({ type: "shrink" })}>Nhỏ hơn một chút</button>
        </div>
      </div>
      <figcaption>Các gợi ý có sẵn để minh họa cách chia nhỏ công việc. Bạn luôn là người chọn.</figcaption>
    </figure>
  </div>;
}
