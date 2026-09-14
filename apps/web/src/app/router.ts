import { useEffect, useState } from "react";
import type { View } from "../shared/types/domain";
import { resolveHashView } from "./routePaths";

export const navigationItems: Array<{ view: View; label: string }> = [
  { view: "now", label: "Ngay lúc này" },
  { view: "capture", label: "Brain Dump" },
  { view: "habits", label: "Nhịp nhẹ mỗi ngày" },
  { view: "review", label: "Nhìn lại tuần" },
  { view: "settings", label: "Cài đặt" },
];

const readHashView = (): View => resolveHashView(location.hash);

export function useHashRouter() {
  const [view, setView] = useState<View>(readHashView);

  useEffect(() => {
    const handleHashChange = () => setView(readHashView());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (next: View) => {
    const hash = next === "landing" ? "home" : next;
    if (location.hash === `#${hash}`) { setView(next); return; }
    location.hash = hash;
  };

  return { view, navigate };
}
