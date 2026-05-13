---
title: Trellis codebase structure (monorepo)
type: topic
status: active
tags: [trellis, codebase, monorepo, structure]
sources: [trellis-implementation-plan, trellis-project-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Trellis codebase structure (monorepo)

The repository at `c:\Users\Keith\trellis` is a monorepo. The root contains five main directories plus the vault. This page documents the actual layout as of the main-branch merge on 2026-05-13.

## Root layout

```
trellis/
├── .agent/          # Canonical AI-agent documentation (specs, prompts, plans)
├── apps/
│   ├── api/         # Node.js + Express backend
│   └── web/         # React + Vite frontend SPA
├── docs/            # External-facing submission assets (hackathon)
├── infra/           # Local dev + deployment configs
└── vault/           # This wiki (Karpathy LLM pattern)
```

## `.agent/` — AI agent documentation

The canonical knowledge base for AI-assisted development. Every file here is a source that Claude (and the [[trellis-vault-assistant]]) reads to ground code generation.

| File | Purpose |
|---|---|
| `product-brief.md` | One-page pitch, problem, market, business model |
| `product-requirements.md` | Full PRD: roles, features, acceptance criteria, demo script |
| `project-architecture.md` | System architecture, data model, AI pipelines, API surface |
| `design-guidelines.md` | Brand, color, type, motion, hero moments, microcopy |
| `context-dump.md` | 11-phase conceptual history; decision reasoning; rejected ideas |
| `llm-wiki-pattern.md` | Karpathy's wiki pattern (same source as `vault/raw/llm-wiki-pattern.md`) |
| `trellis-vault-assistant.md` | System prompt for [[trellis-vault-assistant|vault-aware AI agents]] |
| `trellis_implementation_plan.md` | 6-day sprint plan, 25 tickets, developer assignments |

The `.agent/` specs are the authoritative product sources. The [[vault]] wiki (`vault/`) is derived from them and cross-references them via `[[wikilinks]]`.

## `apps/web/` — React + Vite frontend

| Path | Contents |
|---|---|
| `README.md` | Stack summary, directory map, design reference |
| `src/api/` | Fetch wrappers, TanStack Query hooks |
| `src/components/` | Reusable UI components (Layout, TopNav, SideNav, Toast, CitationChip) |
| `src/lib/` | IndexedDB wrappers (`idb.ts`), graph utilities, audio helpers |
| `src/store/` | Zustand stores (auth, notes, chat, graph state) |
| `src/styles/` | Design tokens (`tokens.css`), global CSS |
| `src/views/auth/` | Login screen |
| `src/views/capture/` | Text, audio, image capture views |
| `src/views/chat/` | Chat interface + query-overlay animation |
| `src/views/graph/` | Personal graph view (Cytoscape.js) |
| `src/views/publish/` | Redaction modal + publish flow |
| `src/views/team/` | Team graph view |

**Owner mapping** (see [[trellis-implementation-plan]]): `capture/` and `graph/` → Keith; `auth/`, `publish/`, `team/` → Gabe; `chat/` → Nicolo.

## `apps/api/` — Node.js + Express backend

| Path | Contents |
|---|---|
| `README.md` | Stack summary, API surface table |
| `src/routes/` | Express route handlers (auth, capture, publish, chat, seed, teamGraph) |
| `src/services/` | AI orchestration: `organize.ts`, `redaction.ts`, `rag.ts` |
| `src/db/` | Postgres pool (`pool.ts`), schema DDL (`schema.sql`), query helpers (`queries.ts`) |
| `src/prompts/` | Gemini system prompts as `.md` files (organize, redact, preserve, chat) |
| `src/seed/` | Seed script (`seedData.ts`), fixture files (`insights.json`, `users.json`) |

**Owner mapping**: `routes/capture.ts`, `services/organize.ts` → Keith; `routes/auth.ts`, `routes/publish.ts`, `services/redaction.ts` → Gabe; `routes/chat.ts`, `services/rag.ts`, `seed/`, `db/` → Nicolo.

## `infra/` — Infrastructure

| Path | Contents |
|---|---|
| `README.md` | Local dev + deployment docs |
| `docker-compose.yml` | Local dev: Postgres 16 + pgvector + Presidio (planned Day 0) |
| `deploy/` | Vercel + Railway deployment configs (planned Day 4–5) |

**Deployment targets**: Vercel (frontend SPA), Railway (backend + Postgres + Presidio sidecar). Total cost: under $100 for the hackathon window. **Owner**: Nicolo (ticket N-7).

## `docs/` — Submission assets

Holds external-facing materials for hackathon judges and stakeholders. The canonical specs live in `.agent/`; `docs/` is for the submission package only.

Planned contents: slide deck (PDF/Marp), video presentation script, cover image / screenshots, demo walkthrough notes.

## `vault/` — This wiki

Follows the [[llm-wiki-pattern]]. See [[vault/CLAUDE.md]] for schema and conventions.

## Relations

- [[trellis-tech-stack]] — stack choices behind the directory layout
- [[trellis-implementation-plan]] — ticket-to-file ownership mapping
- [[trellis-vault-assistant]] — the AI agent that uses `.agent/` as its knowledge base
- [[react-vite]] — frontend tech details
- [[postgres-pgvector]] — database tech details
- [[microsoft-presidio]] — redaction service (Docker sidecar)

## Sources

- [[trellis-implementation-plan]]
- [[trellis-project-architecture]]
