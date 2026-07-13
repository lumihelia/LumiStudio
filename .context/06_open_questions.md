---
context_type: open_questions
risk_level: medium
write_policy: append_or_status_update_allowed
canonical: true
last_updated: 2026-07-11
tags:
  - open-questions
  - ambiguity
  - research
---

# Open Questions

Track unresolved questions that affect product direction, architecture, experience, release, or research.

## Active Questions

### Q1. What is the exact current live database state?

Context: Legacy memory contains conflicting claims: it says the live table was intentionally emptied after Round 18, but also includes a later known-issue correction saying the database contains at least one real user-captured item.

Why It Matters: Future verification, public-page checks, relation discovery, and privacy checks depend on knowing whether real entries exist.

Current Hypothesis: The database state changed across rounds and the old root memory was not consistently normalized afterward.

Needed Evidence: Check Supabase directly, inspect the live UI, or query through existing app/API paths without exposing secrets.

Owner: next agent / user

Status: open

### Q2. Do the three capture modes work in production Vercel runtime?

Context: Round 19 added text paste, file upload, and YouTube captions. Legacy memory says YouTube transcript fetch and PDF dynamic import were not verified against Vercel's actual Node.js environment.

Why It Matters: These are now the only accepted capture mechanisms.

Current Hypothesis: Local build passed, but production runtime behavior still needs real checks.

Needed Evidence: User or agent tests through the deployed custom domain: YouTube with captions, YouTube without captions, PDF upload, text/TXT/MD/SRT/VTT upload, and plain text paste.

Owner: next agent / user

Status: open

### Q3. When should auth and scoped RLS be added?

Context: No auth and open RLS are accepted for demo/personal prototype use only.

Why It Matters: Any real public or multi-user use changes the privacy and security requirements.

Current Hypothesis: Add auth/RLS before beta or any workflow with sensitive shared data.

Needed Evidence: Product stage decision and intended audience.

Owner: user / strategy agent

Status: open

### Q4. Should the SPA be prerendered or server-rendered for agent-readable homepage content?

Context: The raw HTML for `studio.lumihelia.com` is an empty SPA shell. Agent-readable formats exist under API endpoints, but generic HTTP readers will not discover the content naturally.

Why It Matters: If the public page is intended to be read by web agents, plain HTTP content matters.

Current Hypothesis: SSR/prerendering is a real architecture decision and should not be started casually.

Needed Evidence: Decide whether generic crawler/agent readability is a near-term product requirement.

Owner: user / architecture agent

Status: open

## Resolved Questions

None recorded in the migrated context. See `memory.legacy.md` for older round-level details.

## Last Updated

2026-07-11 by Codex
