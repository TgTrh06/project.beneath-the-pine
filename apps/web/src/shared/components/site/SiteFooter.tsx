import "./site.css";
import { ThemeSelect } from "../../theme/ThemeSelect";

export function SiteFooter({ showTheme = true }: { showTheme?: boolean }) {
  return <footer className="public-footer public-container"><div className="public-footer-inner public-inner"><a className="public-footer-brand" href="#home">Pyneath.</a><p>Một khoảng yên. Một bước nhỏ.</p>{showTheme && <ThemeSelect/>}<a href="#before-you-start">Về trải nghiệm hiện tại</a></div></footer>;
}
