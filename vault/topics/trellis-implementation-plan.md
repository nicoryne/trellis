---
title: Trellis implementation plan (6-day sprint)
type: topic
status: active
tags: [trellis, hackathon, sprint, implementation]
sources: [trellis-implementation-plan]
created: 2026-05-13
updated: 2026-05-13
---

# Trellis implementation plan (6-day sprint)

The canonical ticket board and sprint structure for the [[trellis]] hackathon MVP. 3 developers, 6 days, 25 tickets, 1 deployed demo URL. (see [[trellis-implementation-plan]])

## Principle

**Vertical slices with strict file ownership.** Each developer owns complete features from database query through API route to frontend view. No two developers edit the same file. The bottleneck in AI-assisted development is merge conflicts, not velocity.

## Developer assignments

| Developer | Codename | Domain |
|---|---|---|
| Keith | CAPTURE | Note capture, personal graph, IndexedDB |
| Gabe | GOVERN | Auth, redaction, publish, team graph view |
| Nicolo | RETRIEVAL | Chat, RAG, seed data, query overlay, deployment |

Branches: `feat/capture`, `feat/govern`, `feat/retrieval` off `main`.

## Day 0 — Bootstrap (~2 hours, all together)

Before splitting:

- **Nicolo**: Vite + React + TypeScript + Tailwind init; Express + TypeScript init; `docker-compose.yml` (Postgres 16 + pgvector + Presidio); run `schema.sql`.
- **Gabe**: `tokens.css`, `App.tsx` (router skeleton), `Layout.tsx` (nav shell), `apps/api/src/index.ts` (Express mount points), `middleware/auth.ts`, `authStore.ts`.
- **Keith**: `api/client.ts` (shared fetch wrapper), `types/index.ts` (shared interfaces).
- All commit to `main`, branch into feature branches.

## Shared files (locked after Day 0)

These files are created once and should not be modified without coordination:

| File | Owner |
|---|---|
| `apps/web/src/styles/tokens.css` | Gabe |
| `apps/web/src/App.tsx` | Gabe |
| `apps/web/src/components/Layout.tsx` | Gabe |
| `apps/api/src/index.ts` | Gabe |
| `apps/api/src/db/pool.ts` | Nicolo |
| `apps/api/src/db/schema.sql` | Nicolo |
| `apps/api/src/middleware/auth.ts` | Gabe |
| `apps/web/src/api/client.ts` | Keith |
| `apps/web/src/store/authStore.ts` | Gabe |
| `apps/web/src/types/index.ts` | All (append-only — each dev appends, never edits others' types) |

## Tickets

### Keith — CAPTURE ✓ Complete (as of 2026-05-13)

| Ticket | Day | Priority | Status | Description |
|---|---|---|---|---|
| K-1 | 1 | P0 | ✓ | IndexedDB storage layer (`idb` library, 3 stores: notes / entities / personalGraph, CRUD for PersonalNote) |
| K-2 | 1–2 | P0 | ✓ | Text note capture view (tabbed: Write / Record / Upload; markdown editor; 500ms auto-save to IDB; `POST /api/organize` → entity chips) |
| K-3 | 2 | P0 | ✓ | Audio capture (MediaRecorder + WaveSurfer.js; `POST /api/transcribe`; editable transcript; max 5 min; audio Blob stored in IDB) |
| K-4 | 2 | P1 | ✓ | Image capture (PNG/JPG/WebP max 10MB; `POST /api/vision`; Gemini Vision → editable text; image stored in IDB) — contingency not needed, shipped |
| K-5 | 2 | P0 | ✓ | Auto-organization backend routes (`POST /api/organize`, `/api/transcribe`, `/api/vision`; Gemini Pro structured output → `{entities, classification, isPrivileged}`) |
| K-6 | 3–4 | P0 | ✓ | Personal graph view (Cytoscape.js; **cose layout**; color-coded node types per design tokens; click/hover/search; settles in <2s) |
| K-7 | 4 | P0 | ✓ | Personal note pre-seeding (**6** PH litigation notes with extracted entities seeded into IDB for Lawyer on first login) |
| K-8 | 5 | P0 | ✓ | Capture polish + demo prep (loading states, error handling, entity chip styling, transitions, full test coverage) |

### Gabe — GOVERN

| Ticket | Day | Priority | Description |
|---|---|---|---|
| G-1 | 1 | P0 | Auth backend + login view (`POST /api/auth/login` → JWT 24h; 3 pre-seeded accounts: `litigator@acme.law`, `lead@acme.law`, `admin@acme.law`, password `demo`) |
| G-2 | 1 | P0 | App shell + navigation (top nav 56px + side nav 240px; Lucide icons; amber active state; protected route wrapper) |
| G-3 | 1 | P0 | Express server foundation (CORS; JWT middleware; rate limit 60 req/min/user; response envelope `{data, error?}`) |
| G-4 | 2–3 | P0 | Redaction backend service (`POST /api/redact`: Presidio Pass 1 → Gemini Pro Pass 2 → preservation score; `POST /api/publish`: embed → insert team_graph_nodes + edges) |
| G-5 | 3–4 | P0 | Redaction modal UI — hero moment 1 (full-screen split pane; connecting-curve hover; preservation score bar; per-redaction accept/modify/reject; publish toast) |
| G-6 | 4 | P0 | Team graph view (read-only Cytoscape.js; click → slide-in node summary panel; same visual language as personal graph) |
| G-7 | 2 | P0 | Team graph API route (`GET /api/team-graph`; `GET /api/team-graph/nodes/:id`) |
| G-8 | 5 | P0 | Governance polish + demo prep (login error states, modal animations, toast styling, team graph loading skeleton) |

### Nicolo — RETRIEVAL

| Ticket | Day | Priority | Description |
|---|---|---|---|
| N-1 | 1 | P0 | Database setup + schema (Postgres pool via `pg`; DDL for users / team_graph_nodes / team_graph_edges; pgvector HNSW index; `docker-compose.yml`) |
| N-2 | 1–2 | P0 | Seed data script + content (15–30 published insights: judge tendencies, opposing counsel, motion practice, expert witnesses, settlement, procedural lessons; PH law context; seed voice: conclusory + brief narrative, 2–3 sentences; `POST /api/seed` idempotent dev endpoint; **canonical demo query must return a strong, cited response**) |
| N-3 | 2–3 | P0 | RAG service backend (embed → top-8 cosine via pgvector → 1-hop graph expansion → filter >0.55 → Gemini Pro streaming with grounding prompt; confidence: High 3+×>0.80, Medium 2+×>0.70, Low 1×>0.75, Refuse 0 nodes >0.75) |
| N-4 | 3 | P0 | Chat API route (streaming SSE; first event = cited node IDs for overlay trigger; subsequent events = tokens; confidence metadata) |
| N-5 | 3–4 | P0 | Chat view UI (streaming response; citation chips `[1]`, `[2,3]` in amber; clickable → node summary panel; confidence badge; refusal state styled) |
| N-6 | 4–5 | P0 | Query-overlay animation — hero moment 3 (chat dims 30% at 150ms; full-screen overlay fade-in 400ms; team graph fades in; cited nodes pulse in rank order 150ms apart; 1s hold; 600ms fade-out as response streams; 60fps via `requestAnimationFrame`; `prefers-reduced-motion` respected; fallback: dim-only) |
| N-7 | 4–5 | P0 | Deployment (Vercel for frontend; Railway for backend + Postgres + Presidio; env vars; seed on first deploy; HTTPS; single public URL) |
| N-8 | 5–6 | P0 | Integration testing + demo hardening (full demo script end-to-end on deployed URL; canonical query <10s; publish <30s; overlay smooth; refusal works) |

## Day-by-day summary

| Day | Keith (CAPTURE) | Gabe (GOVERN) | Nicolo (RETRIEVAL) |
|---|---|---|---|
| 0 | Shared types, fetch client | Tokens, App shell, auth middleware, server init | Vite+Express init, Docker, schema |
| 1 | K-1: IndexedDB layer | G-1: Auth backend + login UI | N-1: DB setup, N-2: Seed data |
| 2 | K-2: Text capture, K-3: Audio | G-2: Nav shell, G-3: Server, G-7: Team graph API | N-2: Seed content + embeddings |
| 3 | K-4: Image capture, K-5: Organize backend | G-4: Redaction backend | N-3: RAG service, N-4: Chat API |
| 4 | K-6: Personal graph view | G-5: Redaction modal UI, G-6: Team graph view | N-5: Chat UI, N-6: Query overlay |
| 5 | K-7: Personal seed, K-8: Polish | G-8: Governance polish | N-6: Overlay polish, N-7: Deploy |
| 6 | Demo prep | Demo prep | N-8: Integration test, demo prep |

## Merge strategy

- Daily merge to `main` in order: **Nicolo first** (infra), **Gabe second** (auth/shell), **Keith last** (features).
- `types/index.ts` is append-only — each developer adds interfaces at the bottom, never edits existing ones.
- Conflicts on shared files: resolved by the designated file owner (see table above).

## Contingency plans

| Risk | Fallback | Owner |
|---|---|---|
| Presidio container issues | Mock PII detection with regex fallback | Gabe |
| Query-overlay animation | Simplified: dim chat only, no graph fly-in | Nicolo |
| Image capture (K-4) | Drop entirely, demo text + audio only | Keith |
| Personal graph >100 nodes | Cap seed at 50 personal nodes | Keith |
| Pass 2 generalization quality | Ship Pass 1 only + manual review | Gabe |
| Whisper API latency | Pre-record a demo audio clip, cache transcript | Keith |

## Relations

- **Implements**: [[trellis-mvp-scope]], [[trellis-demo-narrative]]
- **Allocates**: K-2/K-3/K-5 (capture feature), G-4/G-5 (redaction + [[redaction-pipeline]]), N-2 (seed, [[acme-litigation-partners]]), N-3/N-4/N-5/N-6 ([[rag-query-pipeline]], [[query-overlay-animation]])
- **Structure lives in**: [[trellis-codebase-structure]]

## Sources

- [[trellis-implementation-plan]]
