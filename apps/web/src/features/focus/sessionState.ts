import type { FocusSession } from "@beneath-the-pine/contracts";
export const outcomes = { completed: "Hoàn thành", progress: "Có tiến triển", stuck: "Đang vướng", stopped: "Dừng tại đây" } as const;
export type Outcome = keyof typeof outcomes;
export function remainingSeconds(endsAt: string, serverNow: string, elapsedMs: number) {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - Date.parse(serverNow) - Math.max(0, elapsedMs)) / 1000));
}
export function canCheckOut(session: FocusSession, accountId: string) {
  return session.status === "active" && session.participants.some(person => person.accountId === accountId && person.presence !== "checked_out");
}
export function seedPayload(mode: "keep" | "replace" | "remove", text: string) {
  return mode === "keep" ? {} : { openSeed: mode === "remove" ? null : text.trim() };
}
