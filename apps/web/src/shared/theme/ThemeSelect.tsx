import { setTheme, useTheme, validTheme } from "./theme";

export function ThemeSelect() {
  const theme = useTheme();
  return <label className="theme-select">
    Giao diện
    <select value={theme} onChange={event => setTheme(validTheme(event.target.value))}>
      <option value="system">Theo thiết bị</option>
      <option value="light">Sáng</option>
      <option value="dark">Tối</option>
    </select>
  </label>;
}
