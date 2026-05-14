---
title: Log
type: log
status: active
updated: 2026-05-14
---

# Log

Chronological, append-only. Most recent entry at the top. Each entry starts with `## [YYYY-MM-DD] <op> | <subject>`.

Tip: `grep "^## \[" log.md | head -5` yields the last 5 entries.

---

## [2026-05-14] note | Working-tree polish (uncommitted) — 3 spec deviations closed or partially closed

Same HEAD commit, but uncommitted changes across capture views and RedactionModal. Three meaningful additions: (1) **per-redaction Restore / Re-apply toggle** in `RedactionModal.tsx` (new details accordion, rebuilds sanitized text from a `rejectedSet`, `canPublish` now also true on `hasRejections`) — partially closes the spec deviation about "per-redaction accept/modify/reject"; (2) **AudioCapture and ImageCapture now run `organizeNote` on save** (gated by extracted-text length > 20 chars) — previously text-only, now all three capture types run the auto-organization pipeline as the PRD requires; (3) **entity-chip "×" remove button** in TextCapture wired to a new `noteStore.removeEntity(noteId, entityId)` method — satisfies the PRD acceptance criterion "Lawyer can manually correct any extraction error (edit chips, add/remove entities)." Updated [[trellis-govern-implementation]], [[trellis-capture-implementation]], [[redaction-pipeline]]. Font stack adjustment in `tokens.css` (added Source Serif Pro as primary serif fallback before Source Serif 4) is too minor to record in concept pages.

## [2026-05-14] ingest | GOVERN + RETRIEVAL domains merged into main

Massive rebase brought in 36 commits across both domains. All 16 remaining tickets (G-1–G-8, N-1–N-8) shipped. Created [[trellis-govern-implementation]] and [[trellis-retrieval-implementation]] (topics). Updated [[redaction-pipeline]], [[rag-query-pipeline]], [[query-overlay-animation]], [[insight-preservation-score]] with implementation sections. Updated entities [[microsoft-presidio]] (port 5001/5002, Docker images, regex fallback), [[postgres-pgvector]] (image `pgvector/pgvector:pg16`, edge uniqueness + cascade, tables shipped vs. spec), [[acme-litigation-partners]] (real demo names Ana Mendoza / Carlos Reyes / Diana Santos, 20 published insights with topic breakdown). Marked G and N tickets ✓ in [[trellis-implementation-plan]].

**Key deviations from spec captured in the vault**: (1) preservation score is **5 dots, not 0–100% bar**; (2) redaction modal connecting curves not implemented (intentional trim); (3) query overlay is **canvas-based, not Cytoscape-rendered** — perceptual effect preserved via opacity + glow rather than per-node scale pulse; (4) RAG graph expansion only adds `insight`-type neighbors to context, not entity neighbors; (5) refusal message exact text changed from spec; (6) demo accounts have real fictional names (Mendoza/Reyes/Santos), not generic role labels.

**Audit fixes worth recording as cautionary patterns**: package.json `type: module` regression broke Vite ESM; Zustand referential equality requires immutable updates (shallow-spread + mutate fails); `Math.random()` inside a canvas render loop causes per-frame jitter (use deterministic seeded variants); `tsc` does not copy `.md` or `.sql` files to `dist/` — postbuild `shx cp` step required. (see [[trellis-retrieval-implementation]])

## [2026-05-13] ingest | CAPTURE domain implementation (K-1 through K-8)

Extracted from 27 git commits on the `keith` branch. All 8 CAPTURE tickets are complete — including K-4 (image capture, which was a P1 droppable contingency but shipped). Key new facts: `gemini-2.5-pro` confirmed as organize model; structured output via Gemini SDK `responseSchema` (not prompt-only); confidence threshold is **0.5** (not 0.6 as previously stated in the wiki — corrected). Personal seed is exactly 6 notes with 17 entities, 3 privileged / 3 non-privileged. Cytoscape layout is **`cose`** (not generic force-directed). Created [[trellis-capture-implementation]] (topic). Updated [[auto-organization-pipeline]] (entity types table, implementation section, confidence threshold correction), [[cytoscape-js]] (cose layout, file path), [[node-color-coding]] (implementation confirmation, edge hex values), [[acme-litigation-partners]] (6-note seed table with entity breakdown), [[trellis-implementation-plan]] (K tickets marked ✓). Index updated.

## [2026-05-13] ingest | Codebase structure after main-branch merge

Explored four new directories introduced by merging main: `apps/`, `.agent/`, `infra/`, `docs/`. Two new sources in `.agent/`: `trellis_implementation_plan.md` (25-ticket sprint board, 3 devs) and `trellis-vault-assistant.md` (Claude system prompt for vault-grounded queries). Created [[trellis-implementation-plan]] (source + topic), [[trellis-codebase-structure]] (topic), and [[trellis-vault-assistant]] (entity). Updated [[index.md]] with 4 new entries. Key new facts: Keith=CAPTURE, Gabe=GOVERN, Nicolo=RETRIEVAL; vertical-slice file ownership; Day 0 bootstrap; daily merge order Nicolo→Gabe→Keith; 6 contingency plans; `apps/web/src/views/{auth,capture,chat,graph,publish,team}/` and `apps/api/src/{routes,services,db,prompts,seed}/` directory structure.

## [2026-05-12] note | Answered 5 questions (first batch)

Answered: [[acme-seed-voice-tone]], [[practice-group-lead-mvp-distinctiveness]], [[demo-off-script-query-handling]], [[cytoscape-webgl-vs-canvas]], [[react-vite-bundle-size-budget]]. Partially answered [[v1-seed-strategy-at-firm-onboarding]] for the MVP-demo scope (V1 customer-onboarding still open). Propagated to [[acme-litigation-partners]] (added seed corpus = PH laws/articles/cases, seed voice, backup-query coverage as key facts), [[practice-group-lead]] (replaced ⚠ demo-risk callout with the rehearsed talk-track), [[cytoscape-js]] (canvas renderer + lazy-load note), [[react-vite]] (full bundle-budget section), [[trellis-demo-narrative]] (new refusal segment + seed-corpus + backup-query design constraints). Index marked with ✓ and ◐ status indicators.

## [2026-05-12] ingest | Trellis Product Brief + Context Dump (business-model revision)

Re-ingested `raw/product-brief.md` and `raw/context-dump.md`. Material change: **business model flipped from firm-wide license to practice-group license with land-and-expand**, and target customer reframed from "primary target" to **"wedge, not ceiling"** with an explicit expansion path (other practice groups → BigLaw → in-house legal → adjacent professional services). New pricing tiers: $25K/$50K/$85K for 10–25 / 25–50 / 50–100 litigators; ~$200K ARR per firm at maturity. The context dump adds **Phase 11** documenting the reasoning. Heavy rewrite of [[trellis-business-model]]; updates to [[trellis]], [[knowledge-admin]], [[trellis-v1-roadmap]] pricing tiers, [[trellis-decision-history]] (Phase 11 added), [[trellis-rejected-ideas]] (firm-wide license added to the list), and re-ingest notes on both source pages. Product, architecture, and demo are unchanged.

## [2026-05-12] ingest | Trellis Context Dump

Major new source. Ingested `raw/context-dump.md` as [[trellis-context-dump]]. Created 5 new entities ([[stratum]], [[lobster-trap]], [[veea]], [[rewind-ai]], [[lablab]]), 2 new concepts ([[adoption-strategy]], [[ethical-wall]]), and 2 new topics ([[trellis-decision-history]], [[trellis-rejected-ideas]]). Updated [[trellis]] (codename history + decision-history backlink), [[harvey]] ($3B in 2025 framing), [[gemini]] (Gemini API direct, not via AI Studio — the Lablab requirement was relaxed mid-session), [[two-layer-architecture]] (collapsed from three layers historical note), [[legal-ai-landscape]] (Rewind.ai rejected-reference note), [[hackathon-judging-fit]] (Path A vs Path B decision on Lobster Trap, plus the 4/2 day time split), [[trellis-mvp-scope]] (time budget). Index and frontmatter `sources:` lists updated.

## [2026-05-12] ingest | Trellis Project Architecture (re-ingest)

Re-ingested `raw/project-architecture.md` after a minor refresh. Only meaningful diff: §2.4 AI Services row for [[gemini]] changed from "Google AI Studio / Gemini API" to just "Gemini API" — Trellis calls the Gemini API directly. Eligibility for the Gemini Award is unchanged. Source page [[trellis-project-architecture]] updated with a re-ingest note.

## [2026-05-12] ingest | Trellis Design Guidelines

Ingested `raw/design-guidelines.md` as [[trellis-design-guidelines]]. Created [[trellis-design-system]] topic page consolidating color, type, spacing, motion, and component patterns. Pulled [[hero-moments]], [[query-overlay-animation]], [[node-color-coding]] as concept pages. Updated [[trellis]] entity page to reference brand personality and tone. Index and frontmatter `sources:` lists updated.

## [2026-05-12] ingest | Trellis Project Architecture

Ingested `raw/project-architecture.md` as [[trellis-project-architecture]]. Created [[trellis-tech-stack]], [[trellis-data-model]], [[trellis-ai-pipelines]], [[trellis-api-surface]] topic pages. Created [[postgres-pgvector]], [[react-vite]], [[tauri]], [[microsoft-presidio]], [[cytoscape-js]], [[gemma]], [[whisper]], [[gemini]] entity pages. Created [[auto-organization-pipeline]], [[rag-query-pipeline]], [[local-first-architecture]], [[mcp-server]] concept pages. Refined [[redaction-pipeline]] with two-pass MVP and four-pass V1 specifics.

## [2026-05-12] ingest | Trellis Product Requirements

Ingested `raw/product-requirements.md` as [[trellis-product-requirements]]. Created [[litigator]], [[practice-group-lead]], [[knowledge-admin]] entity (persona) pages and [[trellis-mvp-scope]], [[trellis-v1-roadmap]], [[trellis-v2-vision]], [[trellis-demo-narrative]] topic pages. Added [[citation-grounding]], [[insight-preservation-score]], [[knowledge-graph-extraction]] concepts. Cross-linked acceptance criteria to feature concepts.

## [2026-05-12] ingest | Trellis Product Brief

Ingested `raw/product-brief.md` as [[trellis-product-brief]]. Created [[trellis]] entity page (the product), [[acme-litigation-partners]] (demo firm), [[harvey]], [[spellbook]], [[cocounsel]], [[glean]], [[notion]], [[imanage]], [[netdocuments]] (competitive map and integration targets). Created [[two-layer-architecture]], [[three-graph-views]], [[pluggable-brain]], [[attorney-client-privilege]] concepts. Created [[legal-ai-landscape]], [[trellis-business-model]], [[competitive-moat]], [[hackathon-judging-fit]] topics.

## [2026-05-12] ingest | Karpathy LLM Wiki pattern

First source. Ingested `raw/llm-wiki-pattern.md` as [[karpathy-llm-wiki-pattern]]. Established the pattern this vault implements: three layers (raw / wiki / schema), three operations (ingest / query / lint), and the index/log conventions. Created [[llm-wiki-pattern]] (concept), [[memex]] (concept, historical context), [[rag]] (concept, contrast), [[obsidian]] (entity). Initialized [[CLAUDE.md]] schema, [[index.md]], this log, and all templates from this source.

## [2026-05-12] note | vault initialized

Bootstrap. Created directory structure, schema file, index, log, and templates. Ready to ingest sources.
