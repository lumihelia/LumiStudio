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

- [ ] Verify the live database state before relying on entry count.
  - Owner: next agent / user
  - Context: legacy memory contains conflicting state about whether the table is empty or has at least one real entry.
  - Done means: `.context/01_current_state.md` is updated with a verified statement or explicitly remains unknown.

- [ ] Production-test the three capture modes.
  - Owner: next agent / user
  - Context: Round 19 added text paste, file upload, and YouTube-caption input; production YouTube/PDF behavior is still unverified.
  - Done means: capture succeeds/fails with expected user-visible states on the deployed custom domain.

- [ ] Test a fresh real entry through My Context, judgment, publish, public page, and agent-readable output.
  - Owner: user with agent support
  - Context: prior checks depended on data that may no longer exist; the agent should not publish on the user's behalf.
  - Done means: `/public` and `/api/agent?format=json|markdown|feed` show only the intended public projection.

## Later

- [ ] Add auth and scoped RLS before any real public or multi-user use.
  - Owner: architecture/coding agent after user approval
  - Context: open RLS is demo-only.

- [ ] Decide whether homepage SSR/prerendering is needed for generic agent readability.
  - Owner: product/architecture agent
  - Context: current SPA shell is not content-readable without executing JavaScript.

- [ ] Run `architecture-due-diligence` before moving beyond prototype / personal MVP.
  - Owner: user / architecture agent
  - Context: no audit has been logged yet.

## Parking Lot

- Full graph/entity split: Material, Thought, Claim, Question, Action, Relation, PublicObject.
- True sub-second sync via Realtime or a newer Supabase pattern.
- AI auto-correction after a failed draft verification pass.

## Last Updated

2026-07-11 by Codex
