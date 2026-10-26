# ADR-0023 — Gentle focus support without AI

Status: Accepted for local Stage 2 implementation (2026-10-25).

## Decision

Account preferences are the source for sharing Pact presence, opt-in Pact reminders, and one Focus preset. Migration `0003_account-preferences-and-pact-reminders.sql` adds `account_preferences` and one reminder receipt per account/Pact. Both tables cascade on account deletion; receipts also cascade on Pact deletion. Existing accounts without a preferences row receive the same defaults as new accounts: sharing and reminders off, no preset.

The persisted participant presence enum stays unchanged. A Pact snapshot shows the actual state to its owner. Other authorized participants see `hidden` in place of `active`, `break`, or `disconnected` while sharing is off; `checked_out` remains visible. `presence.updated` uses the same per-recipient projection and contains only session ID, account ID and the projected enum. Changing sharing emits a fresh authorized snapshot from the one API instance. Intention and Open Seed remain private.

An opt-in in-web reminder is claimed with a unique database receipt during the ten minutes before an accepted scheduled Pact. The server checks current Pact, response, active Camp membership and preference. It returns at most five due reminders per request; the browser rechecks a visible banner every 15 seconds and removes it when the Pact is no longer scheduled or the preference is disabled. There is no email, push, background worker or promise to remind while the web is closed. The displayed time uses the profile IANA timezone and a GMT offset to disambiguate repeated daylight-saving times.

Recent partners are derived from actual completed Pact sessions and current Camp membership. Rủ lại and Hẹn lại only fill a form; confirmation still creates a new scheduled Pact and every invitee must accept. A two-minute stuck break does not pause the server timer. Private notes and Open Seed stay on the account path. Three bundled CC0 recordings play only after a user click in each browser; the preset selects duration and sound but never starts playback or a session.

## Rollout and rollback

Review migration 0003 and backup before applying it to any real environment. This ADR authorizes no migration on the user's existing database and no deployment. A code rollback may leave the two unused tables; reverting their schema would delete preferences and reminder receipts and needs separate review. A current client must understand the `hidden` presence value. Multiple API instances still need a shared Socket.IO adapter and coordination before rollout.
