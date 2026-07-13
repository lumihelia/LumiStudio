---
context_type: agent_roles
risk_level: high
write_policy: context_delta_first
canonical: true
last_updated: 2026-07-11
tags:
  - agent-roles
  - permissions
  - handoff
---

# Agent Roles

## Default Principle

No agent owns the entire project reality. Agents read shared context, work within their scope, and leave a handoff trail.

## Project-Specific Boundaries

- Do not write agent-authored material, summaries, or judgment into live shared user records unless the user explicitly asks and confirms the content.
- Do not publish, discard, or delete live entries for verification unless the user explicitly authorizes that exact action and scope.
- Do not reintroduce mock/seed data as a convenience.
- Do not make public/API surfaces read raw entries when a public allowlist projection is required.
- Do not add auth, data-model migrations, provider changes, or deployment changes without explaining consequences first.

## Role Map

### Strategy / Product Agent

Scope: product direction, user job, core loop, project trajectory, product language.

Can Modify: proposed context deltas, open questions, rejected ideas when grounded.

Cannot Modify Without Confirmation: project brief, decision log, user model.

Required Context: `00_project_brief.md`, `02_decision_log.md`, `03_user_model.md`, `06_open_questions.md`, `07_rejected_ideas.md`.

### Coding / Implementation Agent

Scope: code changes, tests, verification, local implementation decisions.

Can Modify: current state, handoff log, next actions, source index when factual.

Cannot Modify Without Confirmation: product thesis, user model, major architecture decisions, production data.

Required Context: `01_current_state.md`, `05_handoff_log.md`, `08_next_actions.md`, `02_decision_log.md` when behavior or architecture may change.

### UI Agent

Scope: user-facing surfaces, components, interaction states, visual hierarchy, responsive behavior.

Can Modify: current state, handoff log, next actions after implementation.

Cannot Modify Without Confirmation: core product language or identity defaults unless requested.

Required Context: `00_project_brief.md`, `03_user_model.md`, `02_decision_log.md`, `01_current_state.md`, `07_rejected_ideas.md`.

### Research / Provider Agent

Scope: source discovery, official API documentation checks, evidence mapping, uncertainty framing.

Can Modify: source index, open questions, handoff log.

Cannot Modify Without Confirmation: provider migration decisions based solely on unverified research.

Required Context: `00_project_brief.md`, `06_open_questions.md`, `09_source_index.md`, `02_decision_log.md`.

### Writing / Documentation Agent

Scope: README, docs, public explanations, product copy, editorial materials.

Can Modify: documentation and handoff log.

Cannot Modify Without Confirmation: product definition, factual claims without sources, user model.

Required Context: `00_project_brief.md`, `03_user_model.md`, `02_decision_log.md`, `09_source_index.md` when factual claims are involved.

## Last Updated

2026-07-11 by Codex
