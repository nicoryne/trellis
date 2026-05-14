---
title: Trellis retrieval domain — implementation
type: topic
status: active
tags: [trellis, retrieval, implementation, nicolo, rag, chat, deployment]
sources: [trellis-implementation-plan, trellis-project-architecture]
created: 2026-05-14
updated: 2026-05-14
---

# Trellis retrieval domain — implementation

The RETRIEVAL domain (Nicolo's vertical slice) is fully implemented and merged to `main`. Tickets N-1 through N-8 are complete. This page documents what was actually built — implementation choices, data shapes, and deviations from spec.

## What's shipped

| Ticket | File(s) | Status |
|---|---|---|
| N-1: DB setup + schema | `apps/api/src/db/pool.ts`, `db/schema.sql`, `db/queries.ts`, `infra/docker-compose.yml` | ✓ |
| N-2: Seed data | `apps/api/src/seed/seed.ts`, `seed/insights.ts` | ✓ |
| N-3: RAG service | `apps/api/src/services/rag.ts`, `prompts/chat.md` | ✓ |
| N-4: Chat API route | `apps/api/src/routes/chat.ts`, `routes/teamGraph.ts` (cross-domain assist) | ✓ |
| N-5: Chat view UI | `apps/web/src/views/chat/ChatView.tsx`, `store/chatStore.ts` | ✓ |
| N-6: Query-overlay animation | `apps/web/src/views/chat/QueryOverlay.tsx` | ✓ |
| N-7: Deployment | `infra/deploy/vercel.json`, `apps/api/Dockerfile`, health-check endpoint | ✓ |
| N-8: Integration + audit fixes | `4e69206` audit commit (see below) | ✓ |

## Database

- **Image**: `pgvector/pgvector:pg16` (Postgres 16 with pgvector preinstalled)
- **Extensions**: `uuid-ossp`, `vector`
- **Tables**:
  - `users` — `id`, `email UNIQUE`, `password_hash`, `display_name`, `role CHECK IN (lawyer, practice_group_lead, knowledge_admin)`, `created_at`
  - `team_graph_nodes` — `id`, `node_type CHECK IN (9 values)`, `title`, `body`, `summary`, `contributor_id REFERENCES users(id)`, `source_personal_note_id`, `embedding vector(768)`, `metadata JSONB`, `created_at`, `updated_at`
  - `team_graph_edges` — `id`, `source_node_id`, `target_node_id` (both REFERENCES team_graph_nodes ON DELETE CASCADE), `edge_type CHECK IN (7 values)`, `weight DEFAULT 1.0`, `created_at`; **unique constraint on `(source_node_id, target_node_id, edge_type)`**
- **Node types** (9): `insight`, `matter`, `party`, `lawyer`, `judge`, `witness`, `concept`, `precedent`, `statute`
- **Edge types** (7): `mentions`, `involves`, `cites`, `authored_by`, `about`, `concerns`, `related_to`
- **Indexes**:
  - `idx_node_type` on `team_graph_nodes(node_type)`
  - `idx_embedding` — **HNSW** on `embedding vector_cosine_ops`
  - source/target indexes on `team_graph_edges`
- **Connection**: `pg` pool, configured via `DATABASE_URL`
- **Health check**: `pg_isready -U trellis` (docker-compose health)

## Team graph seed (`seed/seed.ts` + `seed/insights.ts`)

- **20 seed insights** covering: judge tendencies (5), opposing counsel patterns (3), motion practice (4), expert witness handling (3), settlement dynamics (3), procedural lessons (2)
- **3 demo users** (real fictional names, not generic role labels):
  - `litigator@acme.law` — **Ana Mendoza** (role `lawyer`)
  - `lead@acme.law` — **Carlos Reyes** (role `practice_group_lead`)
  - `admin@acme.law` — **Diana Santos** (role `knowledge_admin`)
- **Entity nodes** are created on the fly from entities found in insights (one per unique `(node_type, LOWER(title))`)
- **Embeddings computed at seed time** using `text-embedding-004` (768 dim); stored directly in the `embedding` column
- **Entity deduplication**: case-insensitive match on `(node_type, LOWER(title))`
- **Endpoint**: `POST /api/seed` (idempotent dev-only)

## RAG service (`services/rag.ts`)

- **Top-k**: **8** nodes via pgvector cosine similarity
- **Cosine threshold** for context inclusion: **0.55**
- **Graph expansion**: 1-hop from top-k hits; **only `insight`-type neighbors are added to the context** (deviation worth noting — entity neighbors are not included, keeping context focused on synthesizable claims)
- **Confidence buckets** (computed from the top-k similarity distribution):

  | Level | Rule |
  |---|---|
  | `high` | ≥3 nodes with similarity ≥0.80 |
  | `medium` | ≥2 nodes with similarity ≥0.70 |
  | `low` | ≥1 node with similarity ≥0.75 |
  | `refuse` | 0 nodes ≥0.75 |

- **Synthesis model**: `gemini-2.5-pro`, streaming
- **System prompt**: `apps/api/src/prompts/chat.md` (grounding rules, citation format, refusal language)
- **Refusal message** (exact): *"I don't have firm knowledge that directly addresses this. You may want to capture your own thinking on this topic as a starting point."*
- **Citation format**: inline `[node_id]` in response text; Sources section lists `[id] Title` after `---` separator

## Chat API (`routes/chat.ts`)

Streaming via Server-Sent Events. Event sequence:

| Order | Event | Payload |
|---|---|---|
| 1 | `cited-nodes` | `{ nodeIds: string[], confidence: ConfidenceLevel }` |
| 2..N | `token` | `{ text: string }` (incremental chunks) |
| Final | `done` | `{ confidence, sourceCount: number }` |

The `cited-nodes` event fires **first** so the frontend can trigger the query overlay while Gemini is still streaming.

## Chat view (`views/chat/ChatView.tsx` + `store/chatStore.ts`)

- On `cited-nodes`: create assistant message with empty `content`, set `overlayActive = true`
- On `token`: append text to message `.content`
- On `done`: finalize message, set `overlayActive = false`
- Auto-scroll to bottom on new messages
- **Citation chips**: inline `[id]` markers in text are parsed into `Citation` objects; each renders as a chip that opens a node summary panel
- **Refusal state**: when `confidence === 'refuse'`, the refusal message is shown without a sources panel

## Query overlay (`views/chat/QueryOverlay.tsx`)

- **Implementation: canvas-based**, not Cytoscape-driven (deviation from spec). The chat-time graph is a separate visual layer rendered to a `<canvas>` with `requestAnimationFrame`.
- **Timing**: fade-in **400ms**, hold ~**800ms**, fade-out **600ms**
- **All nodes render at 15% opacity**; cited nodes (by ID) render at **100%** with a glow when opacity > 0.5
- **Edges between cited nodes** illuminate in amber as their endpoint nodes light up
- **`prefers-reduced-motion`**: skips the rAF fade loops; sets opacity directly to 1, holds ~800ms, then collapses instantly
- **HiDPI**: `devicePixelRatio` canvas scaling
- **Stability fix**: `Math.random()` was originally inside the render loop causing per-frame node jitter; replaced with deterministic `stableJitter()` (see audit fixes below)

## Deployment

- **Frontend**: Vercel, config at `infra/deploy/vercel.json`. Rewrites `/(.*)` → `/index.html` for SPA routing; `/assets/(.*)` cache `max-age=31536000, immutable`
- **Backend**: Railway, Docker via `apps/api/Dockerfile`
- **Health check**: `GET /api/health` → `{ status: 'healthy' }`
- **Environment variables**:

  **API (`apps/api/.env.example`)**:
  ```
  DATABASE_URL, PORT (3000), NODE_ENV,
  JWT_SECRET, GEMINI_API_KEY, OPENAI_API_KEY,
  PRESIDIO_ANALYZER_URL, PRESIDIO_ANONYMIZER_URL,
  FRONTEND_ORIGIN
  ```

  **Web (`apps/web/.env.example`)**:
  ```
  VITE_API_URL  (empty in dev; Vite proxies /api/* to http://localhost:3000)
  ```

## Types added (`apps/web/src/types/index.ts`)

```ts
interface TeamGraphNode {
  id: string;
  nodeType: 'insight' | 'matter' | 'party' | 'lawyer' | 'judge' | 'witness' | 'concept' | 'precedent' | 'statute';
  title: string;
  body?: string;
  summary?: string;
  contributorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface TeamGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: 'mentions' | 'involves' | 'cites' | 'authored_by' | 'about' | 'concerns' | 'related_to';
  weight: number;
}

interface TeamGraph { nodes: TeamGraphNode[]; edges: TeamGraphEdge[]; }

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: ConfidenceLevel;
  sourceCount?: number;
  citedNodeIds?: string[];
  timestamp: number;
}

interface Citation {
  index: number;
  nodeId: string;
  title: string;
  summary?: string;
  nodeType: TeamGraphNode['nodeType'];
}

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'refuse';
```

## Audit fixes (commit `4e69206`)

Four bugs caught during pre-merge audit. Worth recording — these are the failure modes for AI-assisted code:

1. **`apps/web/package.json`** — duplicate `"type": "commonjs"` overrode the correct `"type": "module"`, which would have broken every Vite ESM import.
2. **`store/chatStore.ts`** — `appendToken()` and `finishStreaming()` shallow-spread the array then mutated the original message object. Zustand uses referential equality, so React would skip re-renders. Fixed with immutable `.map()` producing new objects.
3. **`views/chat/QueryOverlay.tsx`** — `Math.random()` inside the canvas render loop caused node-position jitter every frame. Replaced with deterministic `stableJitter()`. Also fixed a stale-`phase` closure inside the rAF callback and added `devicePixelRatio` scaling.
4. **`services/rag.ts`** — `__dirname`-relative path to `chat.md` fails after tsc compilation because `.md` files aren't copied to `dist/`. Added `resolvePromptPath()` with fallback chain for dev / production / Docker. (This is also why the `postbuild` step exists — see below.)

## Postbuild step (commit `a23e4e8`)

`tsc` only emits `.js` files. The API reads prompt `.md` files and `schema.sql` at runtime via `__dirname` paths; without copying these to `dist/`, the API crashes on startup in production with `Cannot find prompts/organize.md`.

```jsonc
// apps/api/package.json
"build": "tsc && npm run postbuild",
"postbuild": "npx shx cp -r src/prompts dist/prompts && npx shx cp src/db/schema.sql dist/db/schema.sql"
```

`shx` is used for cross-platform `cp` (Windows + Railway Linux).

## Wire-up fix (commit `d424df2`)

Cross-cutting integration commit that finalized the merge:

- Replaced `STUB_TOKEN` with `useAuthStore().token` in `TextCapture.tsx`, `AudioCapture.tsx`, `ImageCapture.tsx`, and `ChatView.tsx`
- Wired `seedPersonalNotes()` into `LoginView.tsx` on lawyer login (was previously dead code)
- Added "Publish to team graph" button + `RedactionModal` invocation to `TextCapture.tsx`
- Installed Tailwind CSS v4 via `@tailwindcss/vite` plugin (corrected `vite.config.ts` and `package.json`)
- Fixed CSS `@import` order in `tokens.css` (Google Fonts must precede Tailwind)

## Relations

- [[rag-query-pipeline]] — spec; this page documents its implementation
- [[query-overlay-animation]] — spec; canvas-based implementation here
- [[postgres-pgvector]] — DB engine + extensions
- [[trellis-data-model]] — schema implemented here
- [[trellis-api-surface]] — endpoints implemented here
- [[acme-litigation-partners]] — demo users seeded here
- [[trellis-implementation-plan]] — N-1 through N-8 (all complete)

## Sources

- [[trellis-implementation-plan]]
- [[trellis-project-architecture]]
