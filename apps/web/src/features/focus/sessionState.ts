import type { FocusSession } from "@pyneath/contracts";
export const outcomes = { completed: "Hoàn thành", progress: "Có tiến triển", stuck: "Đang vướng", stopped: "Dừng tại đây" } as const;
export type Outcome = keyof typeof outcomes;
export function remainingSeconds(endsAt: string, serverNow: string, elapsedMs: number) {
  return Math.max(0, Math.ceil((Date.parse(endsAt) - Date.parse(serverNow) - Math.max(0, elapsedMs)) / 1000));
}
export function canCheckOut(session: FocusSession, accountId: string) {
  return session.status === "active" && session.participants.some(person => person.accountId === accountId && person.presence !== "checked_out");
}
export function shouldAcceptSnapshot(previous: FocusSession | null, next: FocusSession) {
  if (!previous || previous.id !== next.id) return true;
  const previousEnded = previous.status !== "active";
  const nextEnded = next.status !== "active";
  if (previousEnded && !nextEnded) return false;
  return Date.parse(next.serverNow) >= Date.parse(previous.serverNow);
}
export function seedPayload(mode: "keep" | "replace" | "remove", text: string) {
  return mode === "keep" ? {} : { openSeed: mode === "remove" ? null : text.trim() };
}
