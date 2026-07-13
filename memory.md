# Project Memory

This file is a short boot digest. It is not the canonical project memory.

For canonical project context, read:

- `.context/INDEX.md`

The previous long-form root memory is preserved as:

- `memory.legacy.md`

## Current Snapshot

Project stage: prototype / personal MVP with live deployment, owner authentication, and scoped database access.

Current focus: LumiStudio is a capture, judgment, routing, public-output, and relation-discovery studio for deciding where valuable information should go.

Latest meaningful work: production hardening added Magic Link access, owner-only Supabase RLS, authenticated capture/relation APIs, server-rendered public pages, a dynamic sitemap, and maintained YouTube transcript extraction.

Main blocker: the owner Magic Link flow and authenticated browser capture paths still require final manual verification.

Next sensible step: sign in with the owner email, then verify text, PDF, and both manual/automatic-caption YouTube captures in the deployed UI.

## Recent Handoff

Last agent/session: Codex on 2026-07-12.

What changed: deployed owner-scoped auth/RLS and protected server APIs; added readable public SSR/sitemap output; verified anonymous APIs are rejected and only published content is publicly projected.

What remains risky: email login and authenticated production capture need browser-level verification. The sole legacy discarded row has no owner and remains inaccessible unless the user explicitly chooses to migrate it.

## Context Entry Point

Before meaningful work:

1. Read `.context/INDEX.md`.
2. Load only the context files required by the task type.
3. Use `memory.legacy.md` only when older round-level evidence is needed.

## Architecture Audits

2026-07-12: focused production-readiness audit identified open RLS, unauthenticated cost-bearing APIs, non-readable public pages, and fragile production extraction. Remediation is deployed; final authenticated UI verification remains.

## Last Updated

2026-07-12 by Codex
