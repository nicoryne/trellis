---
title: Trellis capture domain — implementation
type: topic
status: active
tags: [trellis, capture, implementation, keith]
sources: [trellis-implementation-plan, trellis-project-architecture, trellis-product-requirements]
created: 2026-05-13
updated: 2026-05-13
---

# Trellis capture domain — implementation

The CAPTURE domain (Keith's vertical slice) is fully implemented as of the keith branch. Tickets K-1 through K-8 are complete. This page documents what was actually built — implementation choices, data shapes, and deviations from spec.

## What's shipped

| Ticket | File(s) | Status |
|---|---|---|
| K-1: IndexedDB layer | `apps/web/src/lib/idb.ts` | Done |
| K-2: Text capture view | `apps/web/src/views/capture/TextCapture.tsx`, `CaptureView.tsx` | Done |
| K-3: Audio capture | `apps/web/src/views/capture/AudioCapture.tsx`, `lib/audio.ts` | Done |
| K-4: Image capture | `apps/web/src/views/capture/ImageCapture.tsx` | Done |
| K-5: Organize backend routes | `apps/api/src/routes/capture.ts`, `services/organize.ts`, `prompts/organize.md` | Done |
| K-6: Personal graph view | `apps/web/src/views/graph/PersonalGraphView.tsx`, `lib/graphUtils.ts` | Done |
| K-7: Personal note pre-seeding | `apps/web/src/lib/seedPersonal.ts` | Done |
| K-8: Polish + tests | All capture/graph files | Done |

## TypeScript interfaces (`apps/web/src/types/index.ts`)

`types/index.ts` is append-only — each developer section is separated by a comment. Keith's section defines the capture domain:

- **`NoteClassification`** union: `strategy | observation | lesson_learned | action_item | research | meeting_summary`
- **`Entity`**: `{ id, type, name, confidence }` — type is one of 8 values: `matter | party | lawyer | judge | witness | concept | precedent | statute`
- **`PersonalNote`**: full shape including `audioBlob?`, `imageBlob?`, `audioTranscript?`, `extractedEntities`, `classification`, `isPrivileged`, `isPublished`, `publishedNodeId?`, `createdAt` (epoch ms), `updatedAt` (epoch ms)
- **`OrganizeResponse`**: `{ entities, classification, isPrivileged }`
- **`ApiError`**: `{ code, message, retryable }`
- **`ApiResponse<T>`**: `{ data?, error? }`

Note on Blob fields: IDB structured-clone stores Blobs but they may return as empty after a page reload — reconstruct with `new Blob([arrayBuffer])` if needed. Documented in type comments.

## IndexedDB layer (`apps/web/src/lib/idb.ts`)

- **Database name**: `trellis-personal`, version 1
- **3 object stores**: `notes` (key: `id`), `entities` (key: `id`), `personalGraph` (key: `id`)
- **CRUD for PersonalNote**: `createNote`, `getNote`, `getAllNotes`, `updateNote`, `deleteNote`
- **Entity ops**: `saveEntity`, `getAllEntities`
- **ID generation**: `crypto.randomUUID()` client-side
- **Test isolation**: `_resetDB()` resets the singleton `dbPromise` to `null`; called in `beforeEach` with `fake-indexeddb`
- **Library**: `idb` (`IDBPDatabase<TrellisDB>` typed)

## Zustand note store (`apps/web/src/store/noteStore.ts`)

IDB-backed save, load, and organization update. Sits between views and IDB; views never call IDB directly. Exposes `saveNote`, `setActiveNote`, `updateNoteOrganization`, and **`removeEntity(noteId, entityId)`** (used by the entity-chip "×" button).

## Fetch client (`apps/web/src/api/client.ts`)

Shared fetch wrapper with JWT injection from `authStore`. Typed error envelope `{ data?, error? }`. Supports JSON and `FormData` (for audio/image upload). Guards JSON.parse on error responses.

## Auto-organization service (backend, `apps/api/src/services/organize.ts`)

See [[auto-organization-pipeline]] for the full spec. Implementation specifics:
- **Model**: `gemini-2.5-pro` via `@google/generative-ai` SDK
- **Structured output**: `responseMimeType: 'application/json'` + typed `responseSchema` (Gemini native structured output, not prompt-only)
- **System prompt**: loaded from `apps/api/src/prompts/organize.md` at server start
- **Error handling**: guards `JSON.parse` on Gemini response; throws on non-JSON

## Capture routes (`apps/api/src/routes/capture.ts`)

Three routes, all require valid JWT, validated with Zod:
- `POST /api/organize` → `organizeNote(content)` → `{ entities, classification, isPrivileged }`
- `POST /api/transcribe` → `multer` audio upload (field: `audio`, uses `originalname`) → `gemini-2.5-flash` inline audio transcription → `{ data: { transcript: string } }`. **Note**: spec called for OpenAI Whisper (`whisper-1`); migrated to Gemini Flash (2026-05-14) to consolidate on a single API key. The `openai` npm package has been removed. (see [[whisper]])
- `POST /api/vision` → `multer` image upload → Gemini Vision proxy → extracted text

## Capture UI

- **CaptureView**: tab shell (Write / Record / Upload), design-token styling
- **TextCapture**: title + body markdown editor; 500ms debounced auto-save to IDB; entity chips appear after `POST /api/organize` returns; chips trigger on initial save and on body changes. Each chip has an **"×" remove button** that calls `noteStore.removeEntity(noteId, entityId)` (PRD acceptance criterion "Lawyer can manually correct any extraction error" — satisfied).
- **AudioCapture**: state machine (idle → recording → processing → done); WaveSurfer.js waveform; max 5 minutes (constant in `lib/audio.ts`); auto-stop moved to a dedicated effect (not inside `setDuration` updater — stale closure fix); editable transcript before save. On save, calls `organizeNote(transcript)` if transcript length > 20 chars; updates the saved note with extracted entities.
- **ImageCapture**: drag-drop + file picker; PNG/JPG/WebP validation; 10MB limit; Gemini Vision extraction; URL cleanup on unmount (object URL leak prevention); race condition guard on concurrent uploads. On save, calls `organizeNote(visionText)` if extracted text length > 20 chars.

## Personal graph (`apps/web/src/lib/graphUtils.ts` + `views/graph/PersonalGraphView.tsx`)

- **Transform**: `notesToCytoscapeElements(notes)` converts `PersonalNote[]` → Cytoscape elements
- **Node types**: `insight` nodes (one per note) + entity nodes (one per unique `type:name` pair)
- **Edge IDs**: `edge-{noteId}-entity-{type}:{name}`
- **Deduplication**: shared entities across notes → single entity node with multiple edges in
- **Layout (post-polish)**: switched from `cose` to **`cola`** continuous force-directed physics (`infinite: true`, `nodeSpacing: 25`, `edgeLength: 120`) for Obsidian-style organic positioning. Direct `cytoscape` instance built in `useEffect` instead of the `react-cytoscapejs` wrapper.
- **Interactivity**: search filter (non-matching nodes fade to 20% opacity), node click handlers per type, empty state CTA (uses the new [[trellis-logo|Logo]] component at size 64), hover-to-highlight neighbors (node expands 14→18px; connected edges brighten 0.35→0.6 opacity), tap-to-open detail. (see [[cytoscape-js]])
- **Zoom control** (post-polish, commit `ad3e14c`): persistent [[graph-zoom-control|GraphZoomControl]] widget anchored bottom-right; range 20–150%, step 5; fit-to-view reset. `baseZoomRef` captures the fit-all zoom after layout settles so the slider's percent reads against that baseline.
- **Adaptive labels**: entity-node labels suppress below 75% of base zoom (`LABEL_ZOOM_THRESHOLD = 0.75`) but always show on hover/selection.
- **Classification hubs**: synthetic `classification`-type nodes (`isHub: true`) appear as diamond-shaped, muted-color scaffolding — one per classification value across all notes. See [[derived-edges]] (Phase 2).

## Personal seed data (`apps/web/src/lib/seedPersonal.ts`)

6 notes, Philippine litigation context, idempotent (no-op if notes already exist):

1. **Judge Reyes — cross-examination latitude on expert testimony** (`observation`, not privileged)
2. **Damages calculation cross — Garcia & Partners expert pattern** (`strategy`, privileged)
3. **Motion practice — RTC Makati Branch 147 under Judge Soriano** (`observation`, not privileged)
4. **Lesson learned — Dela Cruz v. Multinational Corp timeline failure** (`lesson_learned`, privileged)
5. **Opposing counsel — Atty. Bautista (Tan & Reyes) patterns** (`observation`, not privileged)
6. **Settlement dynamics — commercial disputes above PHP 50M** (`strategy`, privileged)

3 privileged, 3 non-privileged. Topics 1 and 2 directly answer the canonical demo query on expert witness cross-examination on damages. See [[acme-litigation-partners]] for the full entity breakdown.

## Test coverage

Every module has a co-located test file in `apps/web/src/__tests__/` (and `apps/api/src/__tests__/`). Test isolation: `fake-indexeddb` + `_resetDB()` in `beforeEach` for all IDB-dependent tests.

## Relations

- [[auto-organization-pipeline]] — the AI pipeline this domain calls
- [[acme-litigation-partners]] — the demo firm whose data this domain populates
- [[trellis-implementation-plan]] — K-1 through K-8 (all complete)
- [[trellis-data-model]] — IndexedDB schema for personal notes
- [[node-color-coding]] — palette implemented in `graphUtils.ts`
- [[cytoscape-js]] — `cose` layout confirmed here

## Sources

- [[trellis-implementation-plan]]
- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
