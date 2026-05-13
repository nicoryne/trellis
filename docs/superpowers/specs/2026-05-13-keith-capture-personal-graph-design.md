# Design Spec: Keith — Capture & Personal Graph (Foundation-Up)

**Date:** 2026-05-13
**Developer:** Keith Ruezyl (CAPTURE domain)
**Branch:** `keith`
**Scope:** All files buildable without external team dependencies (Gabe's auth/shell, Nicolo's DB/server init)
**References:**
- `.agent/trellis-implementation-plan.md` — ticket definitions K-0 through K-8
- `.agent/project-architecture.md` — data model §3, AI pipelines §4, API surface §5
- `.agent/product-requirements.md` — acceptance criteria §2.2, §2.3, §2.6
- `.agent/design-guidelines.md` — color system §2, typography §3, component patterns §6

---

## 1. Approach

**Foundation-up sequencing.** Write files in natural dependency order within Keith's scope. Types first — every subsequent file references them. Storage next, then state, then HTTP client, then backend logic, then views. This ensures no drift between interfaces and consumers, and every file is immediately usable when teammates plug in their scaffold.

**Dependency stubs.** Where views will eventually need Gabe's `authStore` or `Layout`, we write a clearly marked `// TODO: import from authStore` comment and pass the token as a prop or local stub. The logic is complete; integration is a one-line swap.

---

## 2. File Scope & Execution Order

| # | File | Layer | Ticket |
|---|---|---|---|
| 1 | `apps/web/src/types/index.ts` | Types | Day 0 / K-1 |
| 2 | `apps/web/src/lib/idb.ts` | Storage | K-1 |
| 3 | `apps/web/src/store/noteStore.ts` | State | K-2 |
| 4 | `apps/web/src/api/client.ts` | HTTP | Day 0 |
| 5 | `apps/api/src/prompts/organize.md` | Prompt | K-5 |
| 6 | `apps/api/src/services/organize.ts` | Backend service | K-5 |
| 7 | `apps/api/src/routes/capture.ts` | Backend routes | K-5 |
| 8 | `apps/web/src/views/capture/CaptureView.tsx` | UI | K-2 |
| 9 | `apps/web/src/views/capture/TextCapture.tsx` | UI | K-2 |
| 10 | `apps/web/src/lib/audio.ts` | Audio utilities | K-3 |
| 11 | `apps/web/src/views/capture/AudioCapture.tsx` | UI | K-3 |
| 12 | `apps/web/src/views/capture/ImageCapture.tsx` | UI | K-4 |
| 13 | `apps/web/src/lib/graphUtils.ts` | Graph utilities | K-6 |
| 14 | `apps/web/src/views/graph/PersonalGraphView.tsx` | UI | K-6 |
| 15 | `apps/web/src/lib/seedPersonal.ts` | Seed | K-7 |

**Excluded (blocked on teammates):**
- `App.tsx` router integration — Gabe owns this
- `Layout.tsx`, `TopNav.tsx`, `SideNav.tsx` — Gabe owns these
- Auth middleware wiring in backend routes — Gabe owns `auth.ts`
- Live API call testing — requires Nicolo's Express server init and DB schema
- K-8 polish pass — requires the full app running

---

## 3. Layer Designs

### 3.1 Types (`types/index.ts`)

Implements the interfaces from `project-architecture.md §3.2` verbatim, plus API envelope types.

```
PersonalNote         — full note object stored in IndexedDB
Entity               — extracted entity with type, name, confidence
NoteClassification   — union type of 6 classification values
OrganizeResponse     — shape returned by POST /api/organize
ApiResponse<T>       — { data: T, error?: ApiError } envelope (from architecture §5)
ApiError             — { code: string, message: string, retryable: boolean }
```

Append-only file. Gabe and Nicolo add their types at the bottom without touching Keith's section.

### 3.2 IndexedDB Storage (`lib/idb.ts`)

Uses the `idb` library wrapper. Opens DB `trellis-personal` at version `1`.

**Three object stores:**
- `notes` — key: `id` (string UUID). Stores `PersonalNote`.
- `entities` — key: `id`. Stores `Entity` for local dedup.
- `personalGraph` — key: `id`. Stores derived graph structure for fast Cytoscape rendering.

**Exported functions:**
- `createNote(note: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersonalNote>` — generates UUID via `crypto.randomUUID()`, sets timestamps, writes to `notes` store.
- `getNote(id: string): Promise<PersonalNote | undefined>`
- `getAllNotes(): Promise<PersonalNote[]>`
- `updateNote(id: string, updates: Partial<PersonalNote>): Promise<PersonalNote>`
- `deleteNote(id: string): Promise<void>`
- `saveEntity(entity: Entity): Promise<void>` — upserts into `entities` store.
- `getAllEntities(): Promise<Entity[]>`

DB version upgrades handled in the `upgrade` callback — safe to add stores in future versions without data loss.

### 3.3 Note Store (`store/noteStore.ts`)

Zustand store. Single source of truth for in-memory note state.

**State shape:**
```
notes: PersonalNote[]
activeNoteId: string | null
isOrganizing: boolean        // true while /api/organize is in-flight
organizingError: string | null
```

**Actions:**
- `loadNotes()` — reads all notes from IndexedDB, sets `notes`
- `saveNote(data)` — creates/updates note in IndexedDB, updates local state, fires organize pipeline
- `setActiveNote(id)` — sets `activeNoteId`
- `updateNoteOrganization(id, result: OrganizeResponse)` — patches entities/classification/isPrivileged on the note in both IndexedDB and local state

`saveNote` calls `organizeNote` from `api/client.ts` after persisting. The store does not own the HTTP call logic — it delegates to the client.

### 3.4 API Client (`api/client.ts`)

Thin fetch wrapper. No external dependencies.

**Base URL:** `import.meta.env.VITE_API_URL` (falls back to `http://localhost:3000` in development).

**Auth:** Token injected via parameter — the caller passes it. No direct import of `authStore` (avoids circular dependency and allows use before auth is wired).

```typescript
async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string }
): Promise<ApiResponse<T>>
```

**Convenience exports:**
- `organizeNote(content: string, token: string): Promise<OrganizeResponse>`
- `transcribeAudio(blob: Blob, token: string): Promise<{ transcript: string }>`
- `analyzeImage(file: File, token: string): Promise<{ text: string; description: string }>`

Non-2xx responses are parsed into `ApiError` and returned in the `error` field — never thrown. This keeps error handling uniform across the app.

### 3.5 Organize Prompt (`prompts/organize.md`)

Single Gemini Pro call with structured JSON output schema. Instructs the model to return:

```json
{
  "entities": [
    { "id": "uuid", "type": "judge|matter|party|...", "name": "string", "confidence": 0.0–1.0 }
  ],
  "classification": "strategy|observation|lesson_learned|action_item|research|meeting_summary",
  "isPrivileged": true|false
}
```

**Privilege detection:** instructs model to flag `isPrivileged: true` if content contains references to attorney-client communications, work product, litigation strategy, or settlement discussions. Conservative threshold — false positives preferred over false negatives (aligns with `attorney-client-privilege.md` in vault/concepts).

**Entity types** align exactly with the node types in the Postgres schema: `matter`, `party`, `lawyer`, `judge`, `witness`, `concept`, `precedent`, `statute`.

### 3.6 Organize Service (`services/organize.ts`)

Wraps the Gemini SDK call using the `@google/generative-ai` package. Reads the prompt template from `prompts/organize.md` at startup. Returns a typed `OrganizeResponse`.

Uses `gemini-2.5-pro` with `generationConfig.responseMimeType: 'application/json'` and a JSON schema matching `OrganizeResponse`. Target latency: <5 seconds (per K-5 acceptance criteria).

### 3.7 Capture Routes (`routes/capture.ts`)

Three Express route handlers. All use Zod for request validation.

```
POST /api/organize  — body: { content: string }   → OrganizeResponse
POST /api/transcribe — multipart: audio file      → { transcript: string }
POST /api/vision    — multipart: image file       → { text: string, description: string }
```

Auth middleware: `// TODO: apply auth middleware from middleware/auth.ts` comment on each route. The handler logic is complete; auth wiring is Gabe's file.

`/api/transcribe` — proxies the audio Blob to Whisper API (`openai` SDK, `whisper-1` model), returns transcript text.
`/api/vision` — sends image to Gemini Vision (`gemini-2.5-pro` with inline image part), extracts text + structural description.

### 3.8 Capture Views

**`CaptureView.tsx`** — Tab shell with three tabs: Write, Record, Upload. Tab state is local (`useState`). Renders `TextCapture`, `AudioCapture`, or `ImageCapture` based on active tab. Uses design tokens: `bg-surface` background, `accent-primary` active tab indicator, `text-primary` labels.

**`TextCapture.tsx`** — Title `<input>` (autofocus on mount) + body `<textarea>`. Debounced 500ms auto-save via `noteStore.saveNote`. Entity chips rendered below body after `isOrganizing` resolves — pill style with `accent-primary-bg` background. Privilege badge shown if `isPrivileged: true`. Markdown shortcuts handled via `react-markdown` for preview mode.

**`AudioCapture.tsx`** — Record/Stop button. Duration counter (MM:SS). WaveSurfer.js waveform visualization. 5-minute hard cap enforced in `audio.ts` — recording auto-stops at 300s. On stop: Blob posted to `/api/transcribe` via `client.ts`. Returned transcript displayed in editable textarea (same as TextCapture body). Original audio stored in IndexedDB alongside note.

**`ImageCapture.tsx`** — Drag-drop zone + click-to-upload button. Accepts PNG/JPG/WebP only; 10MB limit enforced client-side before upload. Preview rendered via `URL.createObjectURL`. On upload: File posted to `/api/vision`. Extracted text displayed in editable textarea. Original image Blob stored in IndexedDB.

### 3.9 Audio Utilities (`lib/audio.ts`)

```
startRecording(): Promise<MediaRecorder>
stopRecording(recorder: MediaRecorder): Promise<Blob>
formatDuration(seconds: number): string    // "MM:SS"
MAX_RECORDING_DURATION = 300              // 5 minutes in seconds
```

Uses `MediaRecorder` with `audio/webm;codecs=opus`. Accumulates chunks in `ondataavailable`. Returns assembled Blob on stop. Auto-stop timer set in `startRecording` at 300s.

### 3.10 Personal Graph View

**`lib/graphUtils.ts`** — Converts `PersonalNote[]` from IndexedDB into Cytoscape `ElementDefinition[]`. Each note becomes a node (`insight` type, purple `#9d4edd`). Each extracted `Entity` on a note becomes a node (color per `design-guidelines.md §2.5`). Edges connect notes to their entities. Deduplicates entity nodes across notes by entity `name + type`.

**`PersonalGraphView.tsx`** — Mounts Cytoscape with `cose` layout. Node click: if note node → sets `activeNoteId` in store; if entity node → filters graph to 1-hop neighborhood (non-neighbors fade to 20% opacity). Search input: filters by label match (matches stay full opacity, others 20%). Hover: tooltip with node title. Empty state: "Capture your first note to build your personal knowledge graph" with a CTA button that switches to capture view. Loads notes via `noteStore.loadNotes()` on mount.

Node color coding strictly follows `design-guidelines.md §2.5` — no overlap with accent palette.

### 3.11 Personal Seed (`lib/seedPersonal.ts`)

**`seedPersonalNotes()`** — Idempotent. Checks `getAllNotes()` first; if any notes exist, returns early. Writes 5–8 pre-authored `PersonalNote` objects covering:
- Judge tendencies (2 notes)
- Expert witness cross-examination strategy (2 notes)
- Opposing counsel patterns (1–2 notes)
- Procedural lessons (1 note)

Content matches Philippine litigation context (per N-2 spec). Each note has `extractedEntities` pre-populated so the personal graph renders populated without needing the AI pipeline to run. Called on first login after auth resolves.

---

## 4. Cross-Cutting Decisions

**TypeScript:** strict mode. No `any`. All function signatures typed against `types/index.ts`.

**Error handling:** no thrown exceptions in the UI layer. All async operations return `Result`-style shapes or null. Loading and error states tracked in the store (`isOrganizing`, `organizingError`). Views show retry buttons on failure per K-8 acceptance criteria.

**Design tokens:** all colors referenced by CSS variable name (`var(--accent-primary)`) not raw hex. Tailwind classes used where possible. No inline styles except for Cytoscape node definitions which require hex values directly — those reference `design-guidelines.md §2.5` constants defined in `graphUtils.ts`.

**No comments on what the code does.** Comments only on non-obvious constraints (e.g., why the 300s cap is enforced in `audio.ts` rather than the component).

---

## 5. Out of Scope for This Plan

- K-8 polish pass (loading skeletons, transition animations, retry UI beyond basic error state)
- Auth integration (waiting on Gabe's `authStore` and `auth.ts` middleware)
- Router integration (waiting on Gabe's `App.tsx`)
- App shell / navigation (waiting on Gabe's `Layout.tsx`)
- Running or testing anything end-to-end
- Any V1 or V2 features
