---
context_type: rejected_ideas
risk_level: medium
write_policy: append_allowed_when_grounded
canonical: true
last_updated: 2026-07-11
tags:
  - rejected-ideas
  - non-goals
  - product-boundaries
---

# Rejected Ideas

Record ideas that should not be repeatedly proposed unless conditions change. Do not treat "not now" as "never".

## Entries

### 2026-06-29 to 2026-07-11 — Re-add mock or seed data

#### Idea

Restore demo entries or a "restore demo data" button.

#### Why Rejected

The user explicitly asked to remove mock data. Empty states are valid and should not be treated as broken.

#### Conditions for Reconsideration

Only if the user asks for a separate demo/sandbox mode that cannot pollute real data.

#### Related Decision

No auth/open RLS demo posture and the routing loop's real-data principle.

### 2026-06-29 to 2026-07-11 — Fabricate relation explanations or filler lanes

#### Idea

Show hardcoded relation explanations or generated-looking placeholder connections when no real relation exists.

#### Why Rejected

The product should preserve honest absence. Gravity should show grounded relation reasoning or empty states, not fake cognitive depth.

#### Conditions for Reconsideration

Do not reconsider unless the surface is clearly labeled as examples or onboarding demo data.

#### Related Decision

Gravity relation detection must be grounded in real entries.

### 2026-06-29 to 2026-07-11 — Let agents write live material or judgment content without user review

#### Idea

Use agent automation to patch live entry titles, summaries, or judgments directly.

#### Why Rejected

This breaks the product boundary between AI extraction support and the user's own judgment. A previous attempt persisted agent-authored content and was explicitly called out in legacy memory as out of bounds.

#### Conditions for Reconsideration

Only with explicit user approval of the exact content and destination, or inside a clearly isolated draft/sandbox flow.

#### Related Decision

Human judgment remains the product's central action.

### 2026-06-29 to 2026-07-11 — Build the full graph schema immediately

#### Idea

Split into Material, Thought, Claim, Question, Action, Relation, and PublicObject entities immediately.

#### Why Rejected

This is plausible future architecture, but it was deliberately deferred while the prototype loop was still being proven.

#### Conditions for Reconsideration

Revisit during a dedicated architecture pass once real usage shows which entity boundaries matter.

#### Related Decision

Deepen the row model before splitting into a graph.

### 2026-06-29 to 2026-07-11 — Treat mobile as a dense desktop-equivalent workbench

#### Idea

Expose all desktop routes and processing controls as primary mobile navigation.

#### Why Rejected

The accepted mobile role is lightweight capture and public reading. Dense judgment and routing workflows belong primarily on desktop for now.

#### Conditions for Reconsideration

If real mobile use shows that review/publish actions are a core phone workflow.

#### Related Decision

Mobile UI split from desktop.

## Last Updated

2026-07-11 by Codex
