# Project Memory

## Current State

LumiStudio MVP is **functionally complete** for today's scope: a static-frontend (no backend, no login, no real API) demo of a tool that forces every captured piece of information toward one of four endings — published, connected to a project, parked, or discarded. Built 2026-06-28, in one session, handed off mid-build risk was flagged by the user (possible handoff to Codex if Claude credits run out) — this file is written with that handoff in mind.

Product thesis (do not relitigate without reason): information only earns the right to be called an asset once someone has decided where it ends up. The user's own framing: *"每条值得留下来的信息，最后到底流向了哪里？"*

Full reasoning/spec lives in the approved plan file at `/Users/heloiseqin/.claude/plans/hi-cc-lumistudio-jaunty-sundae.md` (outside this repo, same machine — may not be visible to a remote agent). This `memory.md` is the self-contained summary; read it first.

**Critical context discovered mid-build, confirmed with the user**: this is being built for an in-person hackathon ("AI Hacker House", 潮河泾 Hi-Tech Park) happening today. Rules (photographed in `Helia-Materials/IMG_7389.JPG` and `IMG_7390.JPG`, taken ~10:34-10:38 local time today): 3-minute demo + Q&A per builder, no team-background intro, **pitch focus must be on product + technical implementation**, no judges — builders vote for each other after all demos (1 vote each, can't self-vote). Timeline: 18:50 submission portal opens, **18:59 hard submission deadline**, 19:00 demo order announced and demos begin, then peer voting, results announced immediately after. `pitch.html` was revised after this was confirmed to add a "技术实现" section (Vite+React SPA, shared state across 4 views, mock data + localStorage) so it satisfies the "technical implementation" focus the rules require, not just product thesis/keywords.

## Completed

- **Stack**: Vite + React 19 + TypeScript, `react-router-dom` v7, plain CSS Modules (no Tailwind, no component library — kept dependency-free per the "boring solution" rule).
- **4 routes**, single SPA, shared in-memory state (React Context + reducer) persisted to `localStorage` (key `lumistudio.entries.v1`):
  - `/` — `CapturePage` (手机端收集页): capture form (收进来/记一下) + recent captures list.
  - `/workbench` — `WorkbenchPage` (PC 三栏操作台): InboxColumn / MaterialColumn / JudgmentColumn, three-column CSS grid laid out with spacing + typographic labels only (deliberately **not** bordered/boxed — avoids the kanban-board look that was flagged as the single biggest visual risk).
  - `/public` — `PublicPage`: only `isPublic` entries, judgment statement as lead text, editorial reading layout.
  - `/agent` — `AgentOutputPage`: same filtered set as `/public`, JSON/Markdown toggle, narrower `toAgentShape` projection (omits internal fields).
- **Data layer**: `src/data/types.ts` (Entry type, 4 lifecycle statuses: captured/parked/connected/published), `src/data/seedEntries.ts` (7 hand-authored Chinese seed entries spanning all 5 source types and all 4 statuses), `src/state/appReducer.ts` (ADD_ENTRY / UPDATE_JUDGMENT / ROUTE_ENTRY / DISCARD_ENTRY / RESET_TO_SEED), `src/lib/localStorage.ts` (guarded load/save, falls back to seed on corrupt data).
- **Live-demo recovery affordance**: a quiet "恢复成示例数据" text link at the far right of `NavBar` (`src/components/layout/NavBar.tsx`), low visual weight (`--placeholder-color`, smaller font, no border), inline confirm pattern (same style as 不留了). Dispatches `RESET_TO_SEED`, which replaces all entries with a fresh copy of the original 7 seed entries. Added specifically because this will be demoed live at the hackathon (see below) — if a presenter fumbles the workbench mid-demo, this recovers clean state in two clicks without opening devtools.
- **Design system**: `src/styles/tokens.css` (exact CSS variable block from the project's identity spec) + `src/styles/global.css`, Playfair Display (headings) / Source Serif Pro (body) via Google Fonts link in `index.html`. Chinese button copy uses the user's exact natural-speech vocabulary throughout: 收进来、记一下、连接到项目里、写成一段、放到公开页、先放着、不留了 — verified present verbatim in the UI, no generic 保存/提交/确认 crept in.
- **Standalone `pitch.html`** at repo root (outside the Vite build graph, inline styles, same fonts/tokens): keyword-driven, large Playfair Display statements — opening question, thesis, core loop, four endings, four surfaces, closing line. Verified it renders correctly opened through a static file request (no SPA dependency).

## Decisions

- **Single SPA with shared state, not 4 disconnected static HTML files.** The user said "静态前端" (static frontend) but also explicitly prioritized "体验闭环" (closed interaction loop). Resolved by reading "static" as "no backend/no real API," not "no client-side interactivity" — a React SPA with in-memory state + localStorage still satisfies "static" while making the loop real: capturing on `/` actually surfaces in the Workbench inbox; routing to 放到公开页 actually appears on `/public` and `/agent`, live, same session. This was a deliberate build-decision surfaced in the plan, not a silent deviation.
- **Discard (不留了) really removes the entry from state**, not a soft delete — matches the product thesis that this ending is a final decision, not a hidden trash can. Has an inline confirm step (not a browser `confirm()`) to prevent accidental data loss during the demo.
- **Three-column workbench uses CSS grid + spacing + muted typographic labels for column separation — no per-column background/border/shadow boxes.** This was flagged pre-build as the highest visual risk (looking like a Trello/kanban board) and was specifically verified post-build via screenshot at desktop width — it reads as one continuous editorial surface, not bordered panels.
- **Project picker is a simple set of chips (KNOWN_PROJECTS) + freeform text input**, not a full tag/entity system — matches the explicit non-goal of avoiding a tagging system beyond "a simple project picker."

## Verification

- `npx tsc -b --noEmit` — zero type errors.
- `npm run build` — production build succeeds cleanly (`tsc -b && vite build`), no warnings.
- Manual closed-loop test in dev preview (Chrome via Claude Preview MCP): captured a test item is not needed — instead selected seed entry `e1` (unprocessed), filled in a judgment statement, clicked 放到公开页, confirmed via `localStorage` inspection that `status`/`isPublic`/`processedAt` updated correctly, then confirmed the same entry appeared on `/public` (judgment as lead text, correct provenance line) and on `/agent` in both JSON and Markdown views with matching content.
- Responsive check done at 375px (mobile — primary target for `/`, reads cleanly), 768px (workbench correctly stacks to single column below the 900px breakpoint), 1024px (workbench renders as true 3-column grid, no overflow, no kanban look).
- Console check: zero errors, zero warnings across the entire session (capture, navigate, fill, route, toggle JSON/Markdown).
- Copy check: all required verbs (收进来/记一下/连接到项目里/写成一段/放到公开页/先放着/不留了) confirmed present verbatim via DOM query of all rendered buttons.
- `pitch.html` verified by direct static-file fetch through the dev server (200 response) and full-page screenshot — renders identically without any SPA/app state dependency.
- **Negative-path check (second pass)**: routed a clue entry to 连接到项目里 with a non-empty judgment statement, confirmed via `localStorage` that `isPublic` stayed `false`, then confirmed the entry's text appears on neither `/public` nor `/agent` (both JSON and Markdown views). Also confirmed an already-`parked` entry (e4) doesn't leak. This was the one risk path not explicitly checked in the first verification pass.
- **Reset affordance check**: clicked 恢复成示例数据 → confirmed inline confirm step renders → clicked 确定 → confirmed via `localStorage` that all 7 entries returned to their exact original seed state (statuses, `isPublic`, empty judgment fields on e1/e5) and the confirm UI collapsed back to the quiet link.
- Final `npm run build` after these changes: clean, no errors.

## Known Issues

- No automated test suite (intentional — frontend-only mock MVP, manual verification only, matches plan).
- NavBar shows all 4 routes at every viewport width, including mobile — a deliberate demo-navigability choice so a reviewer can reach every page from a phone-width screenshot; a "real" shipped product would likely scope mobile nav to capture-only.
- `pitch.html` loads fonts from Google Fonts over the network — will fall back to system serif if opened offline.
- Project picker (chips + freeform text) does not deduplicate near-identical typed project names (e.g. trailing space) — acceptable for a 7-entry demo, would need normalization if this became a real feature.

## Architecture Audits

None yet — project is at Prototype stage (today's MVP), single greenfield build session, no audit due per the checkpoint rule.

## Next Steps

MVP scope for today is done — all 11 build/verify/hardening tasks completed, including the post-discovery hackathon hardening pass (negative-path verification + live-demo reset affordance). **Submission deadline today is 18:59** (rules photographed in `Helia-Materials/`); as of the last update it was 12:33, leaving comfortable margin. If continuing before the deadline:
1. Optionally rehearse the 3-minute demo against the actual rules (pitch focus = product + technical implementation, no team intro) using `pitch.html` as the visual aid.
2. Add a project-specific `CLAUDE.md` if this repo continues past the demo stage.
3. If moving past mock data: replace `src/lib/localStorage.ts` + seed data with a real backend — this is explicitly out of scope for the current build and was not started.
4. No other in-progress work — nothing was left mid-implementation.
