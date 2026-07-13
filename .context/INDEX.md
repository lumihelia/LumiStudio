---
context_type: index
risk_level: high
write_policy: context_delta_first
canonical: true
last_updated: 2026-07-11
tags:
  - routing
  - context-loading
  - project-memory
---

# Project Context Index

Last updated: 2026-07-11

## Rule

Read this file before loading project context. Do not read all context files by default. Load context according to task type.

If the task is broad, ambiguous, architectural, or explicitly about product direction, load a wider context set. If the task is narrow and mechanical, load only what is necessary.

## Always read for meaningful work

- `01_current_state.md`
- `08_next_actions.md`
- `05_handoff_log.md`

## Read by task type

### Product strategy

Read:

- `00_project_brief.md`
- `01_current_state.md`
- `02_decision_log.md`
- `03_user_model.md`
- `06_open_questions.md`
- `07_rejected_ideas.md`

### Coding / implementation

Read:

- `01_current_state.md`
- `05_handoff_log.md`
- `08_next_actions.md`
- `02_decision_log.md` if architecture or behavior may change
- `09_source_index.md` if external specs, provider APIs, or deployment behavior are involved

### UI work

Read:

- `00_project_brief.md`
- `03_user_model.md`
- `02_decision_log.md`
- `01_current_state.md`
- `07_rejected_ideas.md`
- `09_source_index.md` if design references exist

### Debugging

Read:

- `01_current_state.md`
- `05_handoff_log.md`
- `02_decision_log.md` if the bug touches architecture or runtime behavior
- `06_open_questions.md` if the failure is already known but unresolved
- `07_rejected_ideas.md` if a previous fix was rejected

### Research

Read:

- `00_project_brief.md`
- `06_open_questions.md`
- `09_source_index.md`
- `02_decision_log.md`

### Writing / documentation

Read:

- `00_project_brief.md`
- `03_user_model.md`
- `02_decision_log.md` if explaining decisions
- `09_source_index.md` if factual claims or sources are involved

### Handoff / continuation

Read:

- `memory.md`
- `01_current_state.md`
- `05_handoff_log.md`
- `08_next_actions.md`

### Architecture review

Read:

- `00_project_brief.md`
- `01_current_state.md`
- `02_decision_log.md`
- `05_handoff_log.md`
- `06_open_questions.md`
- `09_source_index.md`

### Memory maintenance

Read:

- `memory.md`
- `INDEX.md`
- the specific context files being updated
- `05_handoff_log.md`
- `memory.legacy.md` only when migration evidence or older round details are needed

## Context file map

### `00_project_brief.md`

Purpose: Defines what this project is, why it exists, who it serves, and what it refuses to become.
Risk level: high
Write policy: use context delta first unless the user explicitly asks for a change.

### `01_current_state.md`

Purpose: Tracks current phase, current work, blockers, latest build, and audit status.
Risk level: medium
Write policy: factual updates allowed when caused by completed work.

### `02_decision_log.md`

Purpose: Records major decisions and why they were made.
Risk level: high
Write policy: append-only; use context delta first for major decisions.

### `03_user_model.md`

Purpose: Records project-relevant user preferences, product taste, constraints, and collaboration needs.
Risk level: high
Write policy: use context delta first. Do not store sensitive personal claims.

### `04_agent_roles.md`

Purpose: Defines agent responsibilities, permissions, and boundaries.
Risk level: high
Write policy: use context delta first unless the user explicitly asks for a role update.

### `05_handoff_log.md`

Purpose: Records what previous agents did and what the next agent must know.
Risk level: low
Write policy: append concise entries after meaningful work.

### `06_open_questions.md`

Purpose: Tracks unresolved conceptual, product, technical, or strategic questions.
Risk level: medium
Write policy: append or update status when grounded.

### `07_rejected_ideas.md`

Purpose: Prevents agents from repeating ideas already rejected.
Risk level: medium
Write policy: append when the rejection is clear and durable.

### `08_next_actions.md`

Purpose: Lists concrete next tasks.
Risk level: low-to-medium
Write policy: update when next steps change.

### `09_source_index.md`

Purpose: Maps source materials, links, files, transcripts, screenshots, and evidence.
Risk level: low-to-medium
Write policy: append source records; do not delete sources casually.

## Write policy summary

Auto-append allowed:

- `05_handoff_log.md`
- `08_next_actions.md`
- `09_source_index.md`

Careful factual update allowed:

- `01_current_state.md`
- `06_open_questions.md`
- `07_rejected_ideas.md`

Use context delta first:

- `00_project_brief.md`
- `02_decision_log.md`
- `03_user_model.md`
- `04_agent_roles.md`
- `INDEX.md`

## Last Updated

2026-07-11 by Codex
