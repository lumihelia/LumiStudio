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

Prototype / personal MVP with a real deployed app, owner authentication, scoped database access, and public output boundaries.

## What Exists Now

- Frontend: Vite + React + TypeScript app, gated by email Magic Link authentication.
- Backend/data: Supabase Postgres through `@supabase/supabase-js`, single shared `entries` table.
- Deployment: Vercel auto-deploys from `origin/main`.
- Public custom domain: `https://studio.lumihelia.com`.
- App surfaces include capture, workbench, public page, agent-readable API/feed outputs, settings/My Context, and Gravity relation discovery.
- Capture input has been restricted to three modes: text paste, file upload, and YouTube URL with captions.
- Real extraction has existed through serverless API routes and provider calls; fallback paths still exist.
- Public data projection uses an allowlist function (`toPublicView()`) to avoid leaking private fields.
- `/public`, `/p/:id`, and `/sitemap.xml` are server-rendered by Vercel functions so plain HTTP clients can read public content.
- Gravity relation detection is backed by a real relation-detection architecture rather than hardcoded placeholder copy.

## Current Data Posture

- Supabase verification on 2026-07-12 found one entry: it is discarded and not public.
- Owner-only RLS is enabled. The four `entries` policies allow authenticated users to read, insert, update, and delete only rows whose `user_id` equals `auth.uid()`.
- The earlier permissive `demo open access` policy is removed.
- Do not restore mock/seed data to "fix" an empty state.
- Do not delete live rows unless the user explicitly asks and the deletion scope is narrow and reversible enough to explain.

## What Is Being Worked On

- Project memory has been migrated from a large root-level `memory.md` into `.context/`.
- Magic Link sign-in, scoped RLS, authenticated extraction/relation APIs, public SSR, dynamic sitemap output, current `pdf-parse` usage, and maintained YouTube transcript fetching are deployed.
- `memory.legacy.md` preserves the original long-form historical record.

## Known Problems

- Supabase Realtime did not work reliably in this project; polling is the accepted current sync strategy.
- Vercel runtime import behavior is sensitive for `api/*.ts`; relative imports reachable from serverless functions must use explicit `.js` extensions.
- Production-only serverless behavior can differ from local Vite dev; verify deployed API routes directly through the custom domain when possible.
- `preview_click` and manual DOM `.value` updates have been unreliable for form testing in this project; use stronger browser interaction methods when available.

## Blockers

- No automated test suite beyond typecheck/build/lint.
- The owner Magic Link login and authenticated capture paths still need browser-level production verification.
- The remaining discarded legacy row has no `user_id`; it is intentionally inaccessible until the user explicitly selects a migration owner.

## Latest Build / Version

- Version: `0.0.0` in `package.json`
- Branch: `main`
- Deployment: Vercel, auto-deploy from `origin/main`
- Security/public-output release commits: `4dc263c`, `fa25662`, `de26c90`; a canonical URL correction is pending push.

## Verification Status

- Local: `npm run lint` and `npm run build` pass after the hardening work.
- Transcript provider retrieval succeeded locally for one manual-caption and one auto-caption YouTube URL supplied by the user.
- Production: unauthenticated `POST /api/extract` and `POST /api/relations` returned `401`; `/public` and `/sitemap.xml` returned `200`; an unknown `/api/p?id=...` returned `404`.
- Unverified areas: browser Magic Link completion, authenticated text/PDF/YouTube capture, and public-detail rendering with a deliberately published item.

## Architecture Audits

2026-07-12 focused production-readiness review: original posture was structurally risky due to open RLS, unauthenticated cost-bearing APIs, empty SPA public HTML, and fragile extraction dependencies. The identified remediations are deployed; complete the remaining authenticated browser checks before treating the release as fully validated.

## Last Updated

2026-07-12 by Codex
