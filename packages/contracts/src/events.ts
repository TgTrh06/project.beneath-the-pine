export const productEventNames = ["seed_created", "seed_resumed", "solo_session_started", "session_checked_out", "circle_created", "circle_invite_accepted", "pact_created", "pact_accepted", "pact_cancelled", "session_joined", "session_reconnected", "circle_milestone_recorded"] as const;
export type ProductEventName = (typeof productEventNames)[number];
