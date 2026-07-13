---
context_type: source_index
risk_level: low_to_medium
write_policy: append_allowed
canonical: true
last_updated: 2026-07-11
tags:
  - sources
  - evidence
  - links
  - files
---

# Source Index

Map source materials, links, files, transcripts, screenshots, docs, and evidence. Do not store secrets or raw private data.

## Canonical Sources

### Root boot digest

Type: file
Location: `memory.md`
Summary: Short startup digest for future agents. Read this first, then `.context/INDEX.md`.
Reliability: canonical for boot orientation, not full history
Last Checked: 2026-07-11
Used For: fast session startup

### Project context directory

Type: files
Location: `.context/`
Summary: Canonical project context system created during memory migration.
Reliability: canonical
Last Checked: 2026-07-11
Used For: task-specific context loading

### Legacy project memory

Type: file
Location: `memory.legacy.md`
Summary: Exact backup of the old root-level memory at migration time. Contains detailed round logs, historical verification notes, and stale/contradictory details that were not all promoted to canonical context.
Reliability: historical evidence; verify current facts before relying on drift-prone claims
Last Checked: 2026-07-11
Used For: provenance and older round details

### Package manifest

Type: file
Location: `package.json`
Summary: Declares Vite, React, TypeScript, Supabase, PDF parsing, Vercel node types, and scripts: `dev`, `build`, `lint`, `preview`.
Reliability: current local file
Last Checked: 2026-07-11
Used For: stack and verification commands

### Default README

Type: file
Location: `README.md`
Summary: Still the default React + TypeScript + Vite README, not a project-specific operating guide.
Reliability: current local file but low product value
Last Checked: 2026-07-11
Used For: documentation gap

### Context kit reference

Type: files
Location: `/Users/heloiseqin/Desktop/helia-agent-context-kit/`
Summary: Local reference used for `.context/` structure and file responsibilities.
Reliability: local reference template
Last Checked: 2026-07-11
Used For: migration scaffold

### Live custom domain

Type: link
Location: `https://studio.lumihelia.com`
Summary: Custom domain mentioned in legacy memory as production-verifiable even when `*.vercel.app` had connection issues from the agent environment.
Reliability: drift-prone; verify live before claims
Last Checked: not checked during this migration
Used For: production endpoint checks

### Vercel generated URL

Type: link
Location: `https://lumi-studio-weld.vercel.app/`
Summary: Earlier Vercel deployment URL from legacy memory.
Reliability: drift-prone; `*.vercel.app` reachability from this environment has been unreliable
Last Checked: not checked during this migration
Used For: historical deployment reference

## Deprecated Sources

None formally deprecated. Treat `memory.legacy.md` as historical evidence rather than current truth.

## Last Updated

2026-07-11 by Codex
