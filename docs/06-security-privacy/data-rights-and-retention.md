# Data Rights and Retention

Users must be able to export/delete account-owned profile, Camp memberships they created or joined, invitations, pacts, sessions, private seeds and permitted milestones. Deletion is authorized through re-authentication and recorded without private text.

The account export includes the account's Camp invitation declines. Deleting the account removes those decline records through a cascading foreign key; deleting an invitation also removes its related declines.

| Data | Default retention |
| --- | --- |
| Account/profile | Until deletion request or legal need |
| Intention/Open Seed | Until user replaces/deletes/account deletion |
| Session/pact/Camp history | Until account deletion; exact product policy before pilot |
| Security logs | Short, provider-configured period; never raw private text |
| Pilot research data | Only for consented study period |
| OpenAI demo processing | Fictional inputs only. Responses use `store:false`; OpenAI's default abuse-monitoring logs may contain content for up to 30 days. Review separately before real-data use. |

Final backup/processor retention must be decided with real deployment providers before release.
