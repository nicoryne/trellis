---
title: Trellis govern domain — implementation
type: topic
status: active
tags: [trellis, govern, implementation, gabe, auth, redaction]
sources: [trellis-implementation-plan, trellis-project-architecture, trellis-product-requirements]
created: 2026-05-14
updated: 2026-05-14
---

# Trellis govern domain — implementation

The GOVERN domain (Gabe's vertical slice) is fully implemented and merged to `main`. Tickets G-1 through G-8 are complete. This page documents what was actually built — implementation choices, data shapes, and deviations from spec.

## What's shipped

| Ticket | File(s) | Status |
|---|---|---|
| G-1: Auth backend + login view | `apps/api/src/services/auth.ts`, `routes/auth.ts`, `middleware/auth.ts`; `apps/web/src/views/auth/LoginView.tsx`, `store/authStore.ts` | ✓ |
| G-2: App shell + navigation | `App.tsx`, `components/Layout.tsx`, `TopNav.tsx`, `SideNav.tsx`, `shell.css` | ✓ |
| G-3: Express server foundation | `apps/api/src/index.ts`, `middleware/rateLimit.ts` | ✓ |
| G-4: Redaction backend service | `apps/api/src/services/redaction.ts`, `routes/publish.ts`, `prompts/redact.md`, `prompts/preserve.md`, `services/embedding.ts` | ✓ |
| G-5: Redaction modal UI | `views/publish/RedactionModal.tsx`, `DiffPane.tsx`, `PreservationScore.tsx` | ✓ |
| G-6: Team graph view | `views/team/TeamGraphView.tsx` | ✓ |
| G-7: Team graph API routes | `apps/api/src/routes/teamGraph.ts` | ✓ |
| G-8: Polish | `components/Toast.tsx`, reduced-motion handling, a11y, nav active states | ✓ |

## Auth

- **JWT lifetime**: 24 hours (`expiresIn: '24h'`)
- **Password hashing**: bcrypt, **10 rounds**
- **Token payload**: `{ id: string, email: string, role: string }` where role ∈ `{ lawyer, practice_group_lead, knowledge_admin }`
- **Endpoints**:
  - `POST /api/auth/login` → `{ token, user }` or error
  - `POST /api/auth/logout` → `{ ok: true }` (stateless; client drops token)
  - `GET /api/me` → authenticated user (Bearer token)
- **Client-side token storage**: `localStorage` keys `trellis_token` and `trellis_user` (set by `authStore`)
- **Auth middleware**: wires JWT verification into capture, chat, team-graph, publish, and seed routes; attaches `req.user` for downstream handlers

## Rate limiting

- **Limit**: 60 requests per 60-second sliding window
- **Key strategy**: `req.user?.id` first, falls back to `req.ip`, finally to literal `'anonymous'`
- **Backing store**: in-memory `Map<string, { count, resetAt }>` (single-instance only; will not survive horizontal scaling — fine for hackathon)
- **Error response**: HTTP 429 with `{ code: 'RATE_LIMITED', retryable: true }`

## Redaction pipeline (implementation)

See [[redaction-pipeline]] for the canonical concept page. Implementation specifics:

- **Presidio analyzer URL**: `process.env.PRESIDIO_ANALYZER_URL ?? 'http://localhost:5001'`
- **Presidio anonymizer URL**: `process.env.PRESIDIO_ANONYMIZER_URL ?? 'http://localhost:5002'`
- **Docker images**: `mcr.microsoft.com/presidio-analyzer:latest`, `mcr.microsoft.com/presidio-anonymizer:latest` (`infra/docker-compose.yml`)
- **Pass 1 sequence**: `POST /analyze` (returns `PresidioResult[]` with entity positions/types) → `POST /anonymize` (returns tokenized text + redaction map)
- **Pass 2 generalization**: `gemini-2.5-pro` with `prompts/redact.md` as system prompt
- **Presidio failure fallback**: regex-based `regexFallback()` with three patterns:
  - `\b[A-Z][a-z]+ [A-Z][a-z]+\b` → `[PERSON]`
  - `\b[\w.-]+@[\w.-]+\.\w+\b` → `[EMAIL]`
  - `\b\d{3}[-.]?\d{3}[-.]?\d{4}\b` → `[PHONE]`
- **Preservation score**: `gemini-2.5-flash` with `prompts/preserve.md`; output JSON `{ score: 0–100, reason: string }`; **fallback value `50` on parse error**
- **Embedding model**: `gemini-embedding-001` (768-dim, output-dimensionality-pinned) (768 dim) via `services/embedding.ts`

### Routes (`routes/publish.ts`)

- `POST /api/redact` — input `{ content: string }` (max 50,000 chars); output `RedactResult = { original, sanitized, redactions[], confidence }`; auth + rate limit required
- `POST /api/publish` — input `{ title, body, summary?, nodeType?, sourcePersonalNoteId?, relatedNodeIds[]? }`; output `{ nodeId, message }`; embeds sanitized body, inserts a row into `team_graph_nodes`, optionally inserts edges to `relatedNodeIds`

`nodeType` ∈ `{ insight, matter, party, lawyer, judge, witness, concept, precedent, statute }` — the nine team-graph node types.

## Redaction modal UI

- **Layout**: full-screen modal backdrop with centered panel, **max-width 960px, max-height 90vh**
- **Body**: split-pane CSS grid `1fr 1fr`. Left = read-only original with highlights; right = `contentEditable` sanitized text firing `onSanitizedChange`
- **Highlights**: type-coded (`PII` vs `GENERALIZATION`) underline + background color
- **Preservation score**: **5 dots** (not the spec's 0–100% bar). Filled count = `Math.round((score / 100) * 5)`. Color thresholds: High ≥60 (green), Medium 40–59 (orange), Low <40 (red). Percentage shown next to dots
- **Details disclosure**: accordion (closed by default) below the diff listing each redaction. Per row: type badge (PII / Generalized), `original → replacement` with arrow, plain-language reason ("Personally identifying or client-confidential token replaced" / "Specific fact generalized to legal-principle level"), and a **Restore / Re-apply** toggle that ejects or re-applies that single redaction. Rebuild logic: `displaySanitized` is rebuilt from `(original, redactions, rejectedSet)` on every toggle; the editable pane remounts via a `paneVersion` key
- **Can-publish gate**: `confidence > 40 || hasManualEdit || hasRejections` (the rejection set was added in the working-tree update and now also unlocks publish)
- **Deviation from spec — partially closed**: per-redaction **reject** is now implemented as Restore / Re-apply; per-redaction **modify** is still expressed only through free-form edits to the right pane. Connecting curves between original/redacted spans are still not implemented — highlights use underline + background color matching instead

## App shell

- **Top nav height**: **56px** (`shell.css`)
- **Side nav width**: **240px**
- **Nav items** (`SideNav.tsx`) — post-polish (commit `5b5336d`) reorganized into two labeled sections:
  - **Personal**: `/capture` (Capture), `/graph` (Personal Graph)
  - **Team**: `/team` (Team Graph), `/chat` (Chat)
  - Icons from Lucide React; icon size reduced to 18px for visual hierarchy
- **TopNav**: now displays a role badge next to the display name using `ROLE_LABELS` map (`lawyer` → "Lawyer", `practice_group_lead` → "Lead", `knowledge_admin` → "Admin")
- **Protected route**: `ProtectedRoute` wrapper checks `useAuthStore().token`; redirects to `/login` if missing
- **Active state**: background `var(--accent-primary-bg)`, foreground and SVG icon `var(--accent-primary)`
- **Login page polish** (`login.css`, post-polish): "Legal Knowledge Management" subtitle below wordmark, error icon (SVG circle-with-X) beside error text, footer tagline "Powered by Trellis — Knowledge lives here.", card fade-in 400ms (`@keyframes loginFadeIn`), radial gradient glow behind card, focus rings and error-state box-shadows on inputs

## Toast

- **Auto-dismiss**: **3000ms**
- **Variants**: `success | error | warning`
- **Implementation**: pub/sub via in-module `listeners` array; `showToast(message, variant)` adds an item and schedules removal
- **Layout**: fixed bottom-right stack, fade-in animation; border-left color matches variant

## Team graph view

- **Library**: [[cytoscape-js]] with `cose` layout (`animate: true`, `animationDuration: 600`, `padding: 40`)
- **Node summary panel**: right-sliding, **340px** width; opens on node click with type, title, body, metadata, connections; closes on outside click or close button
- **Search filter**: case-insensitive substring on node `label`; matching nodes opacity 1, non-matching opacity **0.15**

## Design tokens

`apps/web/src/styles/tokens.css` matches `.agent/design-guidelines.md` without deviation. Notable values:

- **Motion durations**: `--duration-fast: 150ms`, `--duration-default: 250ms`, `--duration-slow: 400ms`, `--duration-deliberate: 700ms`
- **Reduced-motion fallback**: `prefers-reduced-motion: reduce` collapses transitions/animations to `0.01ms`
- **Accent**: `#fb8500` (orange) — revised from amber-gold `#d4a72c` on 2026-05-14 along with the design-guidelines update; hover `#ff9d2a`, muted `#8a4900`, bg-tint `#2d1a06`
- **Typography**: Source Serif 4 (headings/prose), Inter (UI), JetBrains Mono (code)

## Types added (`apps/web/src/types/index.ts`)

```ts
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'lawyer' | 'practice_group_lead' | 'knowledge_admin';
}

interface LoginResponse { token: string; user: User; }

interface RedactionItem {
  original: string;
  replacement: string;
  type: 'PII' | 'GENERALIZATION';
  position: [number, number];
}

interface RedactResponse {
  original: string;
  sanitized: string;
  redactions: RedactionItem[];
  confidence: number;
}

interface PublishResponse { nodeId: string; message: string; }
```

## Relations

- [[redaction-pipeline]] — spec; this page documents its implementation
- [[insight-preservation-score]] — 5-dot indicator implemented here
- [[microsoft-presidio]] — Docker sidecar configuration
- [[trellis-data-model]] — `team_graph_nodes` and `team_graph_edges` written by `POST /api/publish`
- [[trellis-implementation-plan]] — G-1 through G-8 (all complete)
- [[trellis-capture-implementation]] — sibling vertical (Keith)
- [[trellis-retrieval-implementation]] — sibling vertical (Nicolo)

## Sources

- [[trellis-implementation-plan]]
- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
