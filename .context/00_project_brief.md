---
context_type: project_brief
risk_level: high
write_policy: context_delta_first
canonical: true
last_updated: 2026-07-11
tags:
  - project-definition
  - product-thesis
  - non-goals
---

# Project Brief

## One-line Description

LumiStudio is a personal information-capture and judgment studio that helps a user decide where valuable material should go: public writing, project context, later review, or discard.

## Why This Exists

The product is built around the question: "每条值得留下来的信息，最后到底流向了哪里？"

It treats captured material as unfinished until the user has made a judgment about its meaning, relevance, and destination. The product is not just a bookmark inbox; it is a tool for turning incoming material into public objects, project context, or deliberate non-retention.

## Target User

Primary user: the founder/user herself during a solo-founder prototype stage.

Near-term audience: a small demo or personal workflow context, not a multi-user SaaS. The current backend posture is intentionally demo-like and must not be treated as production-safe for public multi-user use.

## Product Thesis

Information only earns the right to be called an asset once someone has decided where it ends up.

The durable loop is:

- Capture material.
- Extract the material's factual content.
- Let the user make a human judgment.
- Route the material to a destination: public, project, parked, or discarded.
- Expose only the safe public projection to public and agent-readable surfaces.

## Product Philosophy

- Keep the interface calm, editorial, and judgment-oriented.
- Preserve a distinction between material facts and the user's own interpretation.
- Treat AI as drafting, extraction, relation-finding, and verification support, not as an uncontrolled writer into live shared records.
- Empty states and honest absence are better than fabricated relationships or filler content.
- Product surfaces should feel like a quiet cognitive environment, not a generic SaaS dashboard.

## Non-goals

- Do not rebuild this into a generic bookmark manager.
- Do not re-add mock or seed data as a "restore demo data" feature.
- Do not expose private capture notes or personal relevance fields publicly unless the entry explicitly opts into those fields.
- Do not implement the full Material/Thought/Claim/Question/Action/Relation/PublicObject split without a deliberate architecture step.
- Do not add auth, true multi-user semantics, or major data-model changes casually; these change the product's operating model.
- Do not assume mobile and desktop should share identical workflow density.

## Success Criteria

- A fresh capture can become a draft with a real title, summary, retell, core points, and project context when provider calls succeed.
- The user can review and write judgment before publication.
- Public and agent-readable outputs use an allowlisted public view, not raw database rows.
- Relation discovery is grounded in actual saved content and can return empty lanes honestly.
- Future agents can understand current project state from `memory.md` plus `.context/` without reading the full legacy memory log.

## Project Stage

Prototype / personal MVP. It is live and deployed, but still uses a demo-grade backend posture: no auth, open RLS, and a single shared table.

## Last Updated

2026-07-11 by Codex
