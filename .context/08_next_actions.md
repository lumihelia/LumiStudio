---
context_type: next_actions
risk_level: low_to_medium
write_policy: update_allowed
canonical: true
last_updated: 2026-07-11
tags:
  - next-actions
  - tasks
  - execution
---

# Next Actions

Only record concrete actions. Avoid vague ambitions.

## Immediate

- [ ] Complete the owner Magic Link sign-in on `https://studio.lumihelia.com`.
  - Owner: user
  - Done means: the browser returns to the app and the capture workspace is visible.

- [ ] Production-test authenticated text, PDF, manual-caption YouTube, and auto-caption YouTube capture.
  - Owner: user with agent support
  - Done means: each supported input either produces a draft or shows a specific, actionable failure state.

- [ ] Test a fresh real entry through My Context, judgment, publish, public page, public detail page, sitemap, and agent-readable output.
  - Owner: user with agent support
  - Context: prior checks depended on data that may no longer exist; the agent should not publish on the user's behalf.
  - Done means: `/public` and `/api/agent?format=json|markdown|feed` show only the intended public projection.

## Later

- [ ] Run `architecture-due-diligence` before moving beyond prototype / personal MVP.
  - Owner: user / architecture agent
  - Context: no audit has been logged yet.

## Parking Lot

- Full graph/entity split: Material, Thought, Claim, Question, Action, Relation, PublicObject.
- True sub-second sync via Realtime or a newer Supabase pattern.
- AI auto-correction after a failed draft verification pass.

## Last Updated

2026-07-12 by Codex
