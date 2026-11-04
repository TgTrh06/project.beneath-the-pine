# Data Rights and Retention

Users must be able to export/delete account-owned profile, Camp memberships they created or joined, invitations, pacts, sessions, private seeds and permitted milestones. Deletion is authorized through re-authentication and recorded without private text.

The account export includes the account's Camp invitation declines. Deleting the account removes those decline records through a cascading foreign key; deleting an invitation also removes its related declines.

The export also includes the account's materialized personal forest milestones (threshold, source session ID, original completion date). They contain no work text, are retained until account deletion and cascade with the account. Personal milestones are independent of Camp membership; leaving a Camp does not expose or revoke them. Existing Camp milestone visibility remains membership-gated. See ADR-0026.

Personal forest arrangement (layout, hidden earned items and version) is private account preference data. The existing own-account preferences export includes it and the existing account FK deletes it with the account. It is not persisted in browser localStorage, broadcast to Camps or copied into analytics. See ADR-0027.

| Data | Default retention |
| --- | --- |
| Account/profile | Until deletion request or legal need |
| Intention/Open Seed | Until user replaces/deletes/account deletion |
| Session/pact/Camp history | Until account deletion; exact product policy before pilot |
| Security logs | Short, provider-configured period; never raw private text |
| Pilot research data | Only for consented study period |
| OpenAI demo processing | Fictional inputs only. Responses use `store:false`; OpenAI's default abuse-monitoring logs may contain content for up to 30 days. Review separately before real-data use. |

Final backup/processor retention must be decided with real deployment providers before release.

## Export authorization after leaving a Camp

Milestones are exported only while the requesting account has an active membership in that Camp. This applies to all milestones, including those recorded after leaving or removal. Historical membership records stay in the account export; their current Camp `name` and `status` are `null` when membership is no longer active. The account's own session intention/outcome and Open Seed remain available. Rejoining restores the active-membership policy. See ADR-0025 and the November 2026 security verification.

## Camp forest summary

P3A derives Camp counts and 1/3/7 milestone dates from existing shared-presence records without storing new data. The summary uses the same active-membership boundary as Camp memory/export, including archived Camps. It returns no private work or participant/session IDs. Shared records survive session cleanup and cascade with Camp deletion; member deletion does not remove the remaining Camp history. Existing exports already contain the source records. See [ADR-0028](../04-engineering/adr/0028-camp-forest-projection.md).
