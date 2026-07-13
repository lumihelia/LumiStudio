# Context Delta

Date: 2026-07-12
Agent: Codex
Task: Production hardening and public-output readiness

## Proposed Updates

### `.context/02_decision_log.md`

Proposed change: Supersede the historical demo-only open-RLS decision with owner-only Magic Link authentication, `user_id = auth.uid()` RLS policies, authenticated extraction/relation APIs, and allowlisted server-rendered public output.

Reason: The user explicitly approved the security and public-readability direction, configured Supabase/Vercel, and verified the resulting RLS policy set.

Evidence: Supabase policy screenshot; deployed endpoint checks; local lint/build; local transcript-provider retrieval against both user-supplied videos.

Risk level: high

## Requires User Confirmation

- Confirm that this is the intended durable access model before writing it into the high-risk decision log.

## Safe to Apply

- Current-state, handoff, and next-action updates reflecting the verified implementation and remaining browser checks.
