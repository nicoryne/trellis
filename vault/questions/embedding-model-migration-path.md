---
title: What is the migration path if Gemini's embedding model changes dimension?
type: question
status: open
tags: [architecture, embeddings, postgres, gemini]
sources: [trellis-project-architecture]
raised-on: [gemini, postgres-pgvector, trellis-project-architecture, trellis-data-model]
created: 2026-05-12
updated: 2026-05-12
---

# What is the migration path if Gemini's embedding model changes dimension?

## Status

**Open** — awaiting Keith's answer.

## Why it matters

The `team_graph_nodes.embedding` column is typed `vector(768)` to match `text-embedding-004`. If Google ships a successor model with a different dimension (e.g. 1024 or 3072), every embedded node has to be rebuilt and the HNSW index has to be rebuilt with it. Without a documented strategy, a model rev would block production until a one-off migration is hand-rolled. (see [[trellis-project-architecture]], [[postgres-pgvector]], [[gemini]], [[trellis-data-model]])

## What we know so far

- Dimension is fixed at 768 in the schema.
- HNSW index uses `vector_cosine_ops`.
- No re-embedding job exists; embeddings are written once at publish time.
- The architecture admits this is unresolved.

## What would resolve it

- A documented dual-write + reindex window strategy (write to old + new column, switch, drop), OR
- A versioned embedding column (`embedding_v1`, `embedding_v2`) with retrieval reading the active version, OR
- An accepted policy that an embedding-model change triggers a per-firm offline migration with a maintenance window.

## Answer

_(pending)_

## Related

- [[postgres-pgvector]]
- [[gemini]]
- [[trellis-data-model]]
- [[trellis-project-architecture]]
