# Core Permission Matrix

| Action | Account | Active member | Circle owner | Pact creator |
| --- | --- | --- | --- | --- |
| Read own seed/intention | own only | own only | own only | own only |
| Read Circle/member list | — | yes | yes | if member |
| Rename/archive Circle | — | no | yes | no |
| Create/revoke Circle invite | — | no | yes | no |
| Create pact | — | yes | yes | — |
| Accept/decline own pact place | own only | yes | yes | creator already accepted |
| Cancel pact | — | no | not by role alone | yes |
| Start pact | — | no | not by role alone | yes |
| Join active session | own place | accepted participant | accepted participant | yes |
| Remove member/transfer ownership | — | no | yes | no |

Missing membership is returned as not found where revealing existence would leak a private resource.
