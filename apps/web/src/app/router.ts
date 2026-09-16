import { useEffect, useState } from "react";
import type { AppRoute, View } from "../shared/types/domain";
import { resolveHashRoute } from "./routePaths";

export const navigationItems: Array<{ view: View; label: string }> = [
  { view: "return", label: "Quay lại" },
  { view: "circles", label: "Circle" },
  { view: "memory", label: "Kỷ niệm" },
  { view: "settings", label: "Cài đặt" },
];

const readRoute = (): AppRoute => resolveHashRoute(location.hash);

export function useHashRouter() {
  const [route, setRoute] = useState<AppRoute>(readRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (next: View | string) => {
    const hash = next === "landing" ? "home" : next;
    if (location.hash === `#${hash}`) { setRoute(readRoute()); return; }
    location.hash = hash;
  };

  return { route, navigate };
}
