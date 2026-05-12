---
title: Gemini (Google AI)
type: entity
status: active
tags: [ai-model, llm, vendor, google]
sources: [trellis-project-architecture, trellis-product-requirements, trellis-context-dump]
created: 2026-05-12
updated: 2026-05-12
---

# Gemini

Google's frontier LLM family. Trellis MVP uses three variants plus an embedding model, **called directly via the Gemini API** (not via Google AI Studio — the Lablab organizers relaxed the AI Studio requirement mid-build, so Trellis uses the direct API path).

## Key facts

- **Access path (MVP)**: **Gemini API directly**. The Lablab hackathon's earlier "via Google AI Studio" requirement was relaxed during the session. (see [[trellis-context-dump]] §10 update)
- **Gemini 2.5 Pro** — entity extraction, classification, [[redaction-pipeline|redaction Pass 2 generalization]], [[rag-query-pipeline|RAG synthesis]]. (see [[trellis-project-architecture]])
- **Gemini 2.5 Flash** — lower-stakes/faster ops: confidence scoring, summary generation, [[insight-preservation-score]].
- **Gemini Vision** — image-to-text for [[trellis|image capture]] (PNG/JPG/WebP up to 10MB).
- **`text-embedding-004`** — 768-dimension embeddings stored in `vector(768)` column with HNSW + `vector_cosine_ops` in [[postgres-pgvector]].
- **In V1**: cloud Gemini Pro continues to receive **only sanitized content**; on-device extraction shifts to [[gemma]].

## Role in pipelines

- **[[auto-organization-pipeline]]**: single structured-output Gemini Pro call returns `{ entities, classification, isPrivileged }`.
- **[[redaction-pipeline]]**: Pass 2 generalization rewrites specifics to legal-principle level. Pass 4 (preservation) at V1 is a dedicated Gemini call.
- **[[rag-query-pipeline]]**: streams the response with system-prompt-enforced grounding and inline `[node_id]` citations; refuses if no nodes above 0.75 similarity.

## Cost envelope (MVP demo period)

- $20–$50 across Pro + Flash + Vision + embedding for the hackathon period. (see [[trellis-project-architecture]] §12)
- Recommend using GCP's $300 free credit for new accounts.

## Hackathon award eligibility

Trellis qualifies for the **Gemini Award**: Gemini powers extraction, redaction, and synthesis throughout the product. (see [[hackathon-judging-fit]])

## Relations

- **Used by**: [[trellis]] across all three AI pipelines
- **Complement (V1)**: [[gemma]] for on-device personal-layer extraction
- **Sees only sanitized content** after [[redaction-pipeline]] for published content
- **Audio transcription is not Gemini**: [[whisper]] handles that

## Open questions

- If Google migrates customers to a newer embedding model, what is the rebuild path for the existing 768-d HNSW index?
- Structured-output reliability in [[auto-organization-pipeline]]: what's the fallback when JSON schema validation fails?

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
- [[trellis-context-dump]]
