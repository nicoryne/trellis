---
title: Auto-organization pipeline
type: concept
status: active
tags: [pipeline, ai, trellis, extraction]
sources: [trellis-product-requirements, trellis-project-architecture]
created: 2026-05-12
updated: 2026-05-12
---

# Auto-organization pipeline

After any personal note is saved, [[trellis|Trellis]] runs the auto-organization pipeline: a **single structured-output [[gemini|Gemini Pro]] call** that returns extracted entities, a classification, and a privilege flag. Sub-5-second latency budget. This is the "intelligent layer" that distinguishes Trellis from a generic note-taking app.

## Pipeline steps (single Gemini call returns all of this)

1. **Entity extraction** — identify named entities relevant to legal context:
   - Matters (case names, matter numbers)
   - Parties (clients, opposing parties)
   - Lawyers (firm lawyers, opposing counsel, judges)
   - Witnesses (expert and fact)
   - Legal concepts (claims, defenses, motion types, doctrines)
   - Statutes and precedents (with citation parsing)

2. **Classification** — categorize the note by type:
   - `strategy` | `observation` | `lesson_learned` | `action_item` | `research` | `meeting_summary`

3. **Privilege flagging** — detect privileged content patterns and tag the note as `isPrivileged: true` if triggered. This governs the [[redaction-pipeline]] later during publish.

4. **Graph integration** (post-call, frontend) — create or update nodes for extracted entities in the personal graph; create edges from the note node to entity nodes; suggest edges to existing notes that share entities.

## Acceptance criteria (per [[trellis-product-requirements]] §2.3)

- Pipeline runs within 5 seconds of save (acceptable demo latency)
- Extracted entities appear as **clickable chips** on the note
- Personal graph updates to show new nodes and edges
- Note is searchable by any extracted entity name
- Lawyer can manually correct any extraction error (edit chips, add/remove entities)

## Edge cases

- **Extraction failure (API error)**: note is saved without enrichment; a retry button is visible.
- **Duplicate entities** (same name, different casing): merged at the graph level.
- **Low-confidence entities** (below 0.6): suggested but not auto-added.

## Why a single call

[[trellis-project-architecture]] specifies "single Gemini Pro call with a structured JSON output schema doing extraction + classification + privilege detection in one shot." Multiple round-trips would blow the 5-second budget.

## Relation to other pipelines

- **Feeds** the personal graph view and the per-note chip UI.
- **Upstream of** the [[redaction-pipeline]] (which runs only when the lawyer clicks publish).
- **Distinct from** the [[rag-query-pipeline]] (which retrieves over the team graph at query time).

## Open questions

- Schema validation reliability of structured outputs across Gemini versions — fallback path when JSON validation fails.

## Sources

- [[trellis-product-requirements]]
- [[trellis-project-architecture]]
