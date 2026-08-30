import { Component, type ErrorInfo, type ReactNode } from "react";
import { logFrontendError } from "../logging/logger";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(): void { logFrontendError({ event: "react_render_error", area: "react" }); }
  render(): ReactNode {
    if (this.state.hasError) return <main className="site-shell"><section className="feature-card" role="alert"><p className="eyebrow">ĐÃ CÓ LỖI</p><h1>Trang này cần tải lại.</h1><p>Không có nội dung riêng tư nào được đưa vào log lỗi.</p><button className="primary" onClick={() => window.location.reload()}>Tải lại trang</button></section></main>;
    return this.props.children;
  }
}
