---
title: React + Vite
type: entity
status: active
tags: [framework, frontend, build-tool]
sources: [trellis-project-architecture]
created: 2026-05-12
updated: 2026-05-12
---

# React + Vite

Frontend stack for the [[trellis]] MVP single-page app. React 18 for the UI; Vite for the build; TypeScript throughout.

## Key facts

- **Why chosen**: team familiarity, ecosystem (React) and fast dev loop (Vite). (see [[trellis-project-architecture]])
- **Routing**: React Router.
- **State**: Zustand or React Context — "lightweight; no Redux needed."
- **Forms**: React Hook Form.
- **Styling**: Tailwind CSS for speed of iteration.
- **Graph viz**: [[cytoscape-js]].
- **Markdown**: `react-markdown` + `remark-gfm`.
- **Audio**: MediaRecorder API + WaveSurfer.js.
- **Local storage**: IndexedDB via the `idb` library (better DX than raw IndexedDB).
- **HTTP**: TanStack Query + fetch (caching, retries, mutations).
- **Deployed on**: Vercel free tier.

## What lives in IndexedDB

Personal notes — including audio Blobs and image Blobs — never leave the browser unsanitized. The schema is documented in [[trellis-data-model]] and the [[two-layer-architecture]] enforces this boundary.

## Relations

- **Used by**: [[trellis]] frontend
- **V1 replacement direction**: [[tauri]] desktop shell + React Native mobile (the React layer is portable)
- **Talks to**: [[postgres-pgvector|backend API]] over HTTPS

## Open questions

- Bundle-size budget — not specified. Affects time-to-interactive on the demo URL.

## Sources

- [[trellis-project-architecture]]
