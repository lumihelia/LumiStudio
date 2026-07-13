---
context_type: current_state
risk_level: medium
write_policy: factual_updates_allowed
canonical: true
last_updated: 2026-07-11
tags:
  - current-state
  - blockers
  - verification
  - architecture-audits
---

# Current State

## Current Phase

Prototype / personal MVP with a real deployed app and real backend, but not a production-safe multi-user system.

## What Exists Now

- Frontend: Vite + React + TypeScript SPA.
- Backend/data: Supabase Postgres through `@supabase/supabase-js`, single shared `entries` table.
- Deployment: Vercel auto-deploys from `origin/main`.
- Public custom domain used in prior verification: `https://studio.lumihelia.com`.
- App surfaces include capture, workbench, public page, agent-readable API/feed outputs, settings/My Context, and Gravity relation discovery.
- Capture input has been restricted to three modes: text paste, file upload, and YouTube URL with captions.
- Real extraction has existed through serverless API routes and provider calls; fallback paths still exist.
- Public data projection uses an allowlist function (`toPublicView()` in legacy memory) to avoid leaking private fields.
- Gravity relation detection is backed by a real relation-detection architecture rather than hardcoded placeholder copy.

## Current Data Posture

- The live database row count is not confirmed by this migration.
- The old memory says the live table became intentionally empty after Round 18, but it also contains later contradictory notes about at least one real captured item. Treat exact current row count as unverified until checked against Supabase or the live UI.
- Do not restore mock/seed data to "fix" an empty state.
- Do not delete live rows unless the user explicitly asks and the deletion scope is narrow and reversible enough to explain.

## What Is Being Worked On

- Project memory has been migrated from a large root-level `memory.md` into `.context/`.
- `memory.legacy.md` preserves the original long-form historical record.

## Known Problems

- No auth / open RLS remains the biggest blocker before any real public or multi-user use.
- Supabase Realtime did not work reliably in this project; polling is the accepted current sync strategy.
- `studio.lumihelia.com` raw HTML is an empty SPA shell; plain HTTP agents need `/api/agent?format=json|markdown|feed` for readable output unless SSR/prerendering is built.
- Vercel runtime import behavior is sensitive for `api/*.ts`; relative imports reachable from serverless functions must use explicit `.js` extensions.
- Production-only serverless behavior can differ from local Vite dev; verify deployed API routes directly through the custom domain when possible.
- `preview_click` and manual DOM `.value` updates have been unreliable for form testing in this project; use stronger browser interaction methods when available.

## Blockers

- Unknown live database state after the latest capture changes.
- No automated test suite beyond typecheck/build/lint.
- Some production verification still depends on either custom-domain curl checks or the user's browser/Vercel dashboard.

## Latest Build / Version

- Version: `0.0.0` in `package.json`
- Branch: `main`
- Deployment: Vercel, auto-deploy from `origin/main`
- Latest commit mentioned in legacy memory: `1a70653` for Round 19 capture mode changes

## Verification Status

- Migration verification: file existence and git status checks only.
- Previous project verification in legacy memory: `tsc -b --noEmit` and `npm run build` were clean after recent implementation rounds.
- Current migration did not run app build because it changed only project context files.
- Unverified areas: live database row count, production YouTube transcript fetch on Vercel, PDF dynamic import path on Vercel.

## Architecture Audits

None yet. The project is still recorded as prototype / personal MVP. Flag a formal `architecture-due-diligence` audit before moving toward beta/public multi-user use, especially because auth/RLS/data exposure are known issues.

## Last Updated

2026-07-11 by Codex
