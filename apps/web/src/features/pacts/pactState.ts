import type { FocusPact } from "@beneath-the-pine/contracts";
export function pactActions(pact: FocusPact, accountId: string, now: number) {
  const mine = pact.participants.find(person => person.accountId === accountId);
  const creator = pact.creatorId === accountId; const scheduled = pact.status === "scheduled";
  const time = Date.parse(pact.startsAt); const inWindow = now >= time - 600000 && now <= time + 1800000;
  return { respond: scheduled && Boolean(mine) && !creator, cancel: scheduled && creator, start: scheduled && creator && mine?.response === "accepted" && inWindow, join: pact.status === "active" && Boolean(pact.sessionId) && mine?.response === "accepted" };
}
