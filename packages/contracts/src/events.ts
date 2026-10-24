export const productEventNames = [
    "seed_created",
    "seed_resumed",
    "solo_session_started",
    "session_checked_out",
    "camp_created",
    "camp_invite_accepted",
    "pact_created",
    "pact_accepted",
    "pact_cancelled",
    "session_joined",
    "session_reconnected",
    "camp_milestone_recorded",
    "assistance_requested",
    "assistance_fallback",
    "assistance_viewed",
    "assistance_selected",
    "assistance_edited",
    "assistance_discarded"
] as const;

export type ProductEventName = (typeof productEventNames)[number];
