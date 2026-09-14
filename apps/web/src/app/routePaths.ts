import type { View } from "../shared/types/domain";

const appViews = new Set<View>(["now", "capture", "habits", "review", "study", "settings", "admin"]);
const landingSections = new Set(["", "home", "how-it-works", "experience", "before-you-start", "landing-main"]);

export function resolveHashView(hash: string): View {
  const candidate = hash.replace(/^#/, "");
  if (landingSections.has(candidate)) return "landing";
  return appViews.has(candidate as View) ? candidate as View : "now";
}
