---
context_type: decision_log
risk_level: high
write_policy: append_only_context_delta_first
canonical: true
last_updated: 2026-07-11
tags:
  - decisions
  - architecture
  - product-direction
---

# Decision Log

Record durable project decisions here. Do not delete old decisions. If a decision is reversed, add a new entry and mark the old one as `superseded`.

## Decisions

### 2026-07-11 — Keep `memory.md` as boot digest and `.context/` as canonical project context

Status: active

Decision: The root `memory.md` is now a short boot digest. Durable project context lives in `.context/`, with the original long-form memory preserved as `memory.legacy.md`.

Reasoning: The old root memory mixed current state, decisions, logs, gotchas, and next steps in one large file. Splitting it lowers context load and makes future agents load only what the task needs.

Alternatives Considered: Keep appending to root `memory.md`; rejected because it had become too large and mixed stable facts with old logs.

Evidence / Source: User-requested memory migration on 2026-07-11; old `memory.md`; `helia-agent-context-kit`.

Consequences: Future agents should read `memory.md`, then `.context/INDEX.md`, then task-specific context files. Use `memory.legacy.md` only for older evidence.

Owner: Codex / user

### 2026-06-29 to 2026-07-11 — Use polling instead of Supabase Realtime

Status: active

Decision: Cross-device sync uses periodic polling plus immediate refetch after local mutations, not Supabase Realtime.

Reasoning: Realtime subscriptions reached `SUBSCRIBED` but did not deliver `postgres_changes` events despite visible dashboard configuration checks. Polling was simpler, understood, and adequate for a live prototype.

Alternatives Considered: Continue debugging Realtime; rejected for prototype momentum unless true sub-second sync becomes important.

Evidence / Source: Legacy memory Decisions section.

Consequences: Slightly higher latency is accepted. Revisit only if real workflow requires lower latency.

Owner: prior agents / user

### 2026-06-29 to 2026-07-11 — Accept no auth and open RLS only as demo posture

Status: active

Decision: The Supabase table is currently open/demo-style, with no authentication and shared data.

Reasoning: The app began as a hackathon/demo prototype where speed and a single shared dataset were explicitly accepted.

Alternatives Considered: Auth and scoped RLS; deferred because it changes scope and setup.

Evidence / Source: Legacy memory Decisions and Current State sections.

Consequences: This must be fixed before any real public, multi-user, or sensitive-data use.

Owner: user / prior agents

### 2026-06-29 to 2026-07-11 — Keep `id` as text, not uuid type

Status: active

Decision: The `entries.id` column is text, with generated UUID strings allowed.

Reasoning: Earlier seed/demo rows used human-readable IDs such as `e1`, so a strict uuid column would have broken migration compatibility.

Alternatives Considered: Native uuid column; rejected for compatibility with existing data shape.

Evidence / Source: Legacy memory Decisions section.

Consequences: Treat IDs as opaque strings in frontend and API code.

Owner: prior agents

### 2026-06-29 to 2026-07-11 — Deepen the row model before splitting into a graph

Status: active

Decision: The prototype keeps a single entry-row model with richer fields instead of immediately creating separate Material, Thought, Claim, Question, Action, Relation, and PublicObject tables.

Reasoning: The fuller conceptual model is real, but splitting the data model before the prototype loop is proven would create migration, UI, and delivery risk.

Alternatives Considered: Build the full graph schema immediately; deferred.

Evidence / Source: Legacy memory Round 5 and Decisions sections.

Consequences: Future graph work is a deliberate architecture step, not a casual refactor.

Owner: user / prior agents

### 2026-06-29 to 2026-07-11 — Gemini is optional and server-side only

Status: active

Decision: Gemini calls are made server-side when `GEMINI_API_KEY` exists; the frontend never receives model keys.

Reasoning: Provider keys must stay out of frontend env vars and source code. Fallback extraction keeps the product usable without a configured model.

Alternatives Considered: Frontend provider calls; rejected for key exposure risk.

Evidence / Source: Legacy memory Decisions section and `api/extract.ts` references.

Consequences: Local Vite dev cannot fully represent production serverless behavior; serverless API routes need separate verification.

Owner: prior agents

### 2026-06-29 to 2026-07-11 — Public surfaces must use allowlisted projections

Status: active

Decision: Public pages, feeds, and agent-readable API outputs should use a safe public projection rather than raw database rows.

Reasoning: Earlier work found a privacy gap where private notes could leak if public surfaces consumed full entries directly.

Alternatives Considered: Ad hoc filtering at each call site; replaced by a single projection approach.

Evidence / Source: Legacy memory Round 17 notes.

Consequences: Any new public/API surface must reuse or match the allowlist boundary.

Owner: prior agents

### 2026-06-29 to 2026-07-11 — API relative imports must use explicit `.js` extensions

Status: active

Decision: Relative imports reachable from Vercel serverless functions under `api/*.ts` must use explicit `.js` extensions.

Reasoning: Vercel serverless bundling previously failed at runtime when imports referenced `.ts` paths. Local typecheck/build did not catch the production failure.

Alternatives Considered: Extensionless or `.ts` imports; rejected for this serverless runtime graph.

Evidence / Source: Legacy memory Round 11 / Next Steps.

Consequences: After changing serverless import graphs, verify deployed endpoints directly through `https://studio.lumihelia.com/api/...` when possible.

Owner: prior agents

### 2026-06-29 to 2026-07-11 — Use Vercel dashboard when CLI cannot reach `api.vercel.com`

Status: active

Decision: Vercel project management may need to happen through the web dashboard rather than CLI from this machine.

Reasoning: The terminal environment previously saw network-level failures reaching `api.vercel.com`, while dashboard import and deploy worked.

Alternatives Considered: Continue relying on Vercel CLI; unreliable in this environment.

Evidence / Source: Legacy memory Decisions and Known Issues sections.

Consequences: Do not assume CLI failure means project configuration is impossible; use the dashboard or custom-domain endpoint verification.

Owner: prior agents

## Last Updated

2026-07-11 by Codex
