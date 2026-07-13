# Project Memory

This file is a short boot digest. It is not the canonical project memory.

For canonical project context, read:

- `.context/INDEX.md`

The previous long-form root memory is preserved as:

- `memory.legacy.md`

## Current Snapshot

Project stage: prototype / personal MVP with live deployment and real backend, but demo-grade data security posture.

Current focus: LumiStudio is a capture, judgment, routing, public-output, and relation-discovery studio for deciding where valuable information should go.

Latest meaningful work: root-level `memory.md` was migrated into `.context/`; capture input had previously been restricted to text paste, file upload, and YouTube-caption URL modes.

Main blocker: no auth/open RLS is still demo-only; live database row count and Round 19 production capture behavior are unverified in this migration.

Next sensible step: verify live data state and production-test the three capture modes before building on the current workflow.

## Recent Handoff

Last agent/session: Codex on 2026-07-11.

What changed: backed up old memory to `memory.legacy.md`, created `.context/`, migrated durable project facts into split context files, and reduced this file to a boot digest.

What remains risky: the legacy memory had contradictory current-data claims; treat exact live database state as unknown until checked. Do not restore seed data, publish entries, or delete live rows without explicit user instruction.

## Context Entry Point

Before meaningful work:

1. Read `.context/INDEX.md`.
2. Load only the context files required by the task type.
3. Use `memory.legacy.md` only when older round-level evidence is needed.

## Architecture Audits

None logged yet. Flag `architecture-due-diligence` before the project moves beyond prototype / personal MVP, especially before auth/RLS, multi-user, or public-data expansion.

## Last Updated

2026-07-11 by Codex
