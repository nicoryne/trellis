---
title: Auto-organization pipeline
type: concept
status: active
tags: [pipeline, ai, trellis, extraction]
sources: [trellis-product-requirements, trellis-project-architecture, trellis-implementation-plan]
created: 2026-05-12
updated: 2026-05-13
---

# Auto-organization pipeline

After any personal note is saved, [[trellis|Trellis]] runs the auto-organization pipeline: a **single structured-output [[gemini|Gemini Pro]] call** that returns extracted entities, a classification, and a privilege flag. Sub-5-second latency budget. This is the "intelligent layer" that distinguishes Trellis from a generic note-taking app.

## Pipeline steps (single Gemini call returns all of this)

1. **Entity extraction** — identify named entities relevant to legal context. Eight exact types:

   | Type | When to use |
   |---|---|
   | `matter` | A case, lawsuit, or legal matter |
   | `party` | A client, opposing party, corporation, or individual involved in a matter |
   | `lawyer` | A specific attorney (firm lawyer or opposing counsel) |
   | `judge` | A specific judge or magistrate |
   | `witness` | An expert witness, fact witness, or deponent |
   | `concept` | A legal concept, doctrine, or legal principle |
   | `precedent` | A cited case or legal authority |
   | `statute` | A statute, regulation, or rule |

2. **Classification** — categorize the note by type (pick exactly one):
   - `strategy` — tactical or strategic decisions, approach notes
   - `observation` — observations about courts, judges, opposing counsel, proceedings
   - `lesson_learned` — post-matter retrospectives, what worked or did not work
   - `action_item` — tasks, follow-ups, deadlines
   - `research` — legal research findings, doctrine summaries
   - `meeting_summary` — notes from meetings, calls, or conferences

3. **Privilege flagging** — detect privileged content. Set `isPrivileged: true` if the note contains: direct attorney-client communications; work product (mental impressions, legal theories, litigation strategy); settlement discussions or negotiation positions; or internal case assessments or risk evaluations. **Conservative threshold: when in doubt, flag as privileged.** False positives are far preferable to false negatives in a law firm context. This governs the [[redaction-pipeline]] later during publish.

4. **Graph integration** (post-call, frontend) — create or update nodes for extracted entities in the personal graph; create edges from the note node to entity nodes.

## Implementation (as shipped — `apps/api/src/services/organize.ts`)

- **Model**: `gemini-2.5-pro`
- **SDK**: `@google/generative-ai` with `responseMimeType: 'application/json'` + typed `responseSchema`
- **System prompt**: `apps/api/src/prompts/organize.md`
- **Confidence threshold**: entities below **0.5** confidence are excluded
- **Max entities per note**: 0–10; do not force-extract if entities are not clearly present
- **Normalization**: canonical entity names (`"Judge Cruz"`, not `"the judge"`)
- **Route**: `POST /api/organize` — accepts note content (string), returns `{ entities, classification, isPrivileged }`; requires valid JWT

## Acceptance criteria (per [[trellis-product-requirements]] §2.3)

- Pipeline runs within 5 seconds of save (acceptable demo latency)
- Extracted entities appear as **clickable chips** on the note
- Personal graph updates to show new nodes and edges
- Note is searchable by any extracted entity name
- Lawyer can manually correct any extraction error (edit chips, add/remove entities)

## Edge cases

- **Extraction failure (API error)**: note is saved without enrichment; a retry button is visible.
- **Duplicate entities** (same type + name): deduplicated by `type:name` key in `graphUtils.ts`.
- **Low-confidence entities** (below 0.5): excluded entirely (not suggested).

## Why a single call

[[trellis-project-architecture]] specifies "single Gemini Pro call with a structured JSON output schema doing extraction + classification + privilege detection in one shot." Multiple round-trips would blow the 5-second budget.

## Relation to other pipelines

- **Feeds** the personal graph view and the per-note chip UI.
- **Upstream of** the [[redaction-pipeline]] (which runs only when the lawyer clicks publish).
- **Distinct from** the [[rag-query-pipeline]] (which retrieves over the team graph at query time).

## Open questions

- Schema validation reliability of structured outputs across Gemini versions — fallback path when JSON validation fails. (see [[auto-organization-json-validation-fallback]])

## Sources

- [[trellis-product-requirements]]
- [[trellis-project-architecture]]
- [[trellis-implementation-plan]]
