import { useEffect, useState } from "react";
import type { View } from "../shared/types/domain";

export const navigationItems: Array<{ view: View; label: string }> = [
  { view: "now", label: "Ngay lúc này" },
  { view: "capture", label: "Brain Dump" },
  { view: "habits", label: "Nhịp nhẹ mỗi ngày" },
  { view: "review", label: "Nhìn lại tuần" },
  { view: "settings", label: "Cài đặt" },
];

const knownViews = new Set<View>(["now", "capture", "habits", "review", "study", "settings", "admin"]);
const readHashView = (): View => {
  const candidate = location.hash.replace("#", "") as View;
  return knownViews.has(candidate) ? candidate : "now";
};

export function useHashRouter() {
  const [view, setView] = useState<View>(readHashView);

  useEffect(() => {
    const handleHashChange = () => setView(readHashView());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (next: View) => {
    if (location.hash === `#${next}`) { setView(next); return; }
    location.hash = next;
  };

  return { view, navigate };
}
