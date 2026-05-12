---
title: Log
type: log
status: active
updated: 2026-05-12
---

# Log

Chronological, append-only. Most recent entry at the top. Each entry starts with `## [YYYY-MM-DD] <op> | <subject>`.

Tip: `grep "^## \[" log.md | head -5` yields the last 5 entries.

---

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
