import type { AppRoute, View } from "../shared/types/domain";

const appViews = new Set<View>(["login", "register", "return", "circles", "memory", "settings"]);
const landingSections = new Set(["", "home", "how-it-works", "experience", "before-you-start", "landing-main"]);

export function resolveHashView(hash: string): View {
  return resolveHashRoute(hash).view;
}
export function resolveHashRoute(hash: string): AppRoute {
  const candidate = hash.replace(/^#/, "");
  if (landingSections.has(candidate)) return { view: "landing" };
  const invite = candidate.match(/^invite\/([a-f0-9]{64})$/);
  if (invite) return { view: "invite", id: invite[1] };
  const dynamic = candidate.match(/^(circle|pact|session)\/([0-9a-f-]{36})$/);
  if (dynamic) return { view: dynamic[1] as View, id: dynamic[2] };
  return appViews.has(candidate as View) ? { view: candidate as View } : { view: "return" };
}
