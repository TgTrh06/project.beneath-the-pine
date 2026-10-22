import type { FocusPact } from "@beneath-the-pine/contracts";
export function pactActions(pact: FocusPact, accountId: string, now: number) {
  const mine = pact.participants.find(person => person.accountId === accountId);
  const creator = pact.creatorId === accountId; const scheduled = pact.status === "scheduled";
  const time = Date.parse(pact.startsAt); const withinPactWindow = now <= time + 1800000; const inStartWindow = now >= time - 600000 && withinPactWindow;
  return { respond: scheduled && withinPactWindow && Boolean(mine) && !creator, cancel: scheduled && withinPactWindow && creator, start: scheduled && creator && mine?.response === "accepted" && inStartWindow, join: pact.status === "active" && Boolean(pact.sessionId) && mine?.response === "accepted" };
}
