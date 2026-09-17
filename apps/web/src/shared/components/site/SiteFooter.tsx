import "./site.css";
import { ThemeSelect } from "../../theme/ThemeSelect";

export function SiteFooter() {
  return <footer className="public-footer public-container"><div className="public-footer-inner public-inner"><a className="public-footer-brand" href="#home">Beneath the Pine.</a><p>Một khoảng yên. Một bước nhỏ.</p><ThemeSelect/><a href="#before-you-start">Về trải nghiệm hiện tại</a></div></footer>;
}
