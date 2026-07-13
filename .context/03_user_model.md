---
context_type: user_model
risk_level: high
write_policy: context_delta_first
canonical: true
last_updated: 2026-07-11
tags:
  - user-preferences
  - product-taste
  - collaboration
  - constraints
---

# User Model

This file records project-relevant user context only. Do not store secrets, sensitive attributes, momentary moods, raw private data, or speculative psychological claims.

## Stable Project-Relevant Preferences

- The user wants project conversation and reports in Chinese unless they ask otherwise.
- The user values real product judgment over literal execution when a request would weaken the product.
- The user prefers concrete evidence: exact files, commands, verification results, and clear risk statements.
- The user does not want agents to write material or judgment content into live shared records on her behalf without explicit review/confirmation.
- The user expects changes to be committed and pushed after ordinary implementation rounds, but this migration explicitly says not to auto-commit.

## Product Taste

- Calm, intentional, editorial, spacious, quietly intelligent.
- Avoid generic SaaS aesthetics unless a project-specific reason exists.
- Prefer honest empty states over fabricated relationships or filler.
- Mobile should remain a lightweight capture/reading layer unless the user asks for more density.

## Thinking Style Relevant to This Project

- The user is willing to defer a large architecture vision when a smaller prototype step protects delivery.
- The user catches stale assumptions about fast-moving provider APIs and expects current documentation checks when provider details matter.
- The user cares about the boundary between extraction/automation and human judgment.

## Communication Preferences for Agents

- Be decisive.
- Put meaningful disagreement first.
- Use plain language for technical tradeoffs.
- Avoid vague option lists unless comparison is requested.
- Report failed verification and unverified areas directly.

## Constraints

- Do not store or expose secrets.
- Do not treat demo-grade open RLS as acceptable beyond demo/personal use.
- Do not assume live database data can be edited, published, or deleted by the agent without explicit user instruction.
- Do not rely only on local build success for Vercel serverless behavior.

## Do Not Assume

- Do not assume the live database is currently empty or populated without checking.
- Do not assume `*.vercel.app` is reachable from this environment; try the custom domain when production verification is needed.
- Do not assume provider model names or API shapes are current from memory.

## Last Updated

2026-07-11 by Codex
