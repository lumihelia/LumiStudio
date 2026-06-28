# Project Memory

## Current State

LumiStudio has moved past the mock-data MVP stage. Current architecture: Vite + React SPA, **real Supabase Postgres backend** (no auth, single shared `entries` table, open RLS — explicitly a demo-only tradeoff), cross-device sync via **polling** (not Realtime — see Decisions for why), hosted in a **public GitHub repo** (`lumihelia/LumiStudio`), not yet deployed to Vercel (Round 3, next).

Product thesis (do not relitigate without reason): information only earns the right to be called an asset once someone has decided where it ends up. The user's own framing: *"每条值得留下来的信息，最后到底流向了哪里？"*

**Hackathon context** (confirmed with user, photographed in `Helia-Materials/` — gitignored, not in the repo): built for an in-person event ("AI Hacker House", 潮河泾 Hi-Tech Park). 3-minute demo + Q&A, pitch focus on product + technical implementation, peer-voted (no judges). Timeline: 18:50 submission opens, **18:59 hard deadline**, 19:00 demos start. `pitch.html` includes a "技术实现" section for this reason.

**The user wants all chat going forward in Chinese.** A live-build plan exists at `/Users/heloiseqin/.claude/plans/hi-cc-lumistudio-jaunty-sundae.md` (second version, post-mock-MVP — covers the Supabase/Vercel/repo/UI-rework rounds; outside this repo, may not be visible to a remote agent).

## Completed

**Round 1 — GitHub repo.** `git init`, public repo `lumihelia/LumiStudio` created and pushed via `gh repo create --push`. `.gitignore` extended to exclude `Helia-Materials/` (personal hackathon reference photos, not a deliverable) and `.claude/settings.local.json` (local-only tool permissions) — both correctly excluded from the public repo. Standing instruction from user: **commit after every round of work** going forward.

**Round 2 — Real backend.**
- Supabase Postgres table `entries` (snake_case columns, `id text primary key default gen_random_uuid()::text` — **not uuid type**, because seed entries use human-readable ids like `"e1"`). Open RLS policy (`for all using (true) with check (true)`) — no auth, single shared dataset, intentional demo tradeoff.
- `src/lib/supabaseClient.ts` reads `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from env. `.env.local` holds real values (gitignored via `*.local`), `.env.example` documents the two keys.
- `src/data/entryMapper.ts` — `rowToEntry()`/`entryToRow()` translate Postgres snake_case ↔ the unchanged TS `Entry` camelCase shape.
- `src/state/AppStateContext.tsx` internals fully rewritten, **same external `{ entries, dispatch }` shape** — every consumer component (`CaptureForm`, `JudgmentColumn`, `RoutingActions`, `NavBar`) needed zero changes. State is now sourced from Supabase, refetched on an interval (see Decisions), and every action (`ADD_ENTRY`/`UPDATE_JUDGMENT`/`ROUTE_ENTRY`/`DISCARD_ENTRY`/`RESET_TO_SEED`) calls Supabase directly then triggers an immediate `refetch()` for instant local feedback.
- `src/state/appReducer.ts` renamed to `src/state/actions.ts` (it no longer contains a reducer, only the shared `Action`/`RouteDestination` types — kept for clarity since this project may be handed off).
- `src/lib/localStorage.ts` deleted — Supabase is the single source of truth now, no client-side persistence layer.
- Seeded the live table with the 7 demo entries via the existing 恢复成示例数据 reset button (which now writes to Supabase instead of localStorage).

**Carried over from the mock-MVP build** (still true): 4 routes (`/`, `/workbench`, `/public`, `/agent`), design tokens (`src/styles/tokens.css`), Chinese natural-speech button vocabulary (收进来/记一下/连接到项目里/写成一段/放到公开页/先放着/不留了), the non-kanban 3-column workbench layout, `pitch.html`.

## Decisions

- **Polling (3s interval), not Supabase Realtime, for cross-device sync.** Originally implemented via `postgres_changes` + a Realtime channel subscription. Debugged extensively with the user directly in the Supabase dashboard (confirmed: table correctly in the `supabase_realtime` publication, INSERT/UPDATE/DELETE all enabled, RLS open) — the channel reached `SUBSCRIBED` status but **no postgres_changes events ever arrived**, even when testing via Supabase's own Realtime Inspector. Root cause not resolved (likely something dashboard/project-config-specific not visible to either of us). Given the hackathon time pressure, made the deliberate call to rip it out and use simple polling instead: `setInterval(refetch, 3000)` plus an immediate `refetch()` after every local mutation for instant same-tab feedback. Verified working end-to-end including a true cross-device simulation (inserted a row via raw `fetch` POST to the Supabase REST API, confirmed the running app picked it up via polling alone within 3s, with zero action taken in that tab). This is the "boring solution that works" — slightly higher latency than true Realtime, but robust and fully understood, which matters more for a live demo than shaving 2-3 seconds.
- **No auth, open RLS.** Confirmed with user — single shared dataset for a one-day demo. Must not carry forward into any real/non-demo use without adding auth + scoped RLS.
- **`id` column is `text`, not `uuid`.** Needed because seed entries use ids like `"e1"`–`"e7"`; new entries get a server-generated UUID string via `default gen_random_uuid()::text`, same column.
- Decisions carried over from the mock-MVP build (still valid): single SPA over 4 static pages (for the closed-loop experience), 不留了 is a real delete not soft-delete, 3-column workbench uses spacing/typography not borders (avoids kanban look), simple chip-based project picker.

## Verification

- `npx tsc -b --noEmit` and `npm run build` — clean after every round, including after the Realtime→polling swap.
- Insert/update/delete through the UI confirmed via direct Supabase REST queries (not just trusting the UI) — caught a real bug this way (see Known Issues: flaky `preview_click`).
- Cross-device sync verified by inserting a row via raw REST `fetch` (simulating a phone) and confirming the open app tab displayed it via polling alone, no manual refresh, no action in that tab.
- Reset-to-seed verified against the live Supabase table (not localStorage) — confirmed row count returns to exactly 7 after delete-all + re-insert-seed.
- Mock-MVP-era verifications (responsive 375/768/1024px, negative routing paths, Chinese copy, console-clean) still hold — backend swap didn't touch any UI/component code.

## Known Issues

- **`preview_click` (the MCP browser tool) was unreliable on the capture form's submit button** during this session — reported success but didn't actually trigger the click/submit; switching to `element.click()` via `preview_eval` worked reliably every time. Worth remembering for future verification in this project: prefer eval-based clicks over `preview_click` for form submissions.
- Realtime (`postgres_changes`) does not work in this Supabase project for reasons never fully diagnosed (publication + RLS + Inspector all looked correct). If a future session wants true sub-second sync, this would need a fresh investigation — possibly try Supabase's newer "Broadcast from database" pattern instead of the deprecated-leaning `postgres_changes` path.
- No auth / open RLS — by design for today, must change before any real use.
- Carried over: no automated tests, NavBar shows all 4 routes at every viewport, `pitch.html` needs network for fonts, project picker doesn't dedupe near-identical names.

## Architecture Audits

None yet — still effectively prototype stage (now with a real DB, but single-user, no auth, demo-only).

## Next Steps

1. **Round 3 (next): Vercel deployment.** Connect the GitHub repo to Vercel for auto-deploy on push, set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as Vercel env vars, verify the live URL works cross-device (phone + desktop, same as the local polling test above).
2. **Round 4: UI rework.** PC `/workbench` needs a fixed-viewport app-shell (no outer-page scroll, per user's reference mockups) instead of the current scrolling layout; mobile `/` capture flow should become a bottom-sheet/modal interaction instead of an inline form. Keep all current colors/fonts — structural/interaction patterns only, from reference images already reviewed with the user.
3. Decided against: native iOS Share Extension and iOS Shortcuts (see plan file for the full reasoning) — the mobile web capture link + polling sync is the agreed cross-device mechanism for the demo.
4. Commit after this round (per standing instruction), then proceed to Round 3.
