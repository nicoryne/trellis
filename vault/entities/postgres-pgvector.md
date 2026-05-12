---
title: Postgres + pgvector
type: entity
status: active
tags: [database, vector, infra, oss]
sources: [trellis-project-architecture]
created: 2026-05-12
updated: 2026-05-12
---

# Postgres + pgvector

Trellis MVP runs a **single Postgres 16 instance** holding users, the team graph (nodes + edges), and vector embeddings via the `pgvector` extension. No separate vector DB, no graph DB.

## Key facts

- **Extensions enabled**: `pgvector` (vector similarity), `uuid-ossp` (UUID generation). (see [[trellis-project-architecture]])
- **Tables**: `users`, `sessions`, `team_graph_nodes`, `team_graph_edges`, `seed_data`.
- **Embedding column**: `embedding vector(768)` on `team_graph_nodes`, matching [[gemini|`text-embedding-004`]] output dimension.
- **Index**: `CREATE INDEX idx_embedding ON team_graph_nodes USING hnsw (embedding vector_cosine_ops)`.
- **Edge typing**: `edge_type IN ('mentions','involves','cites','authored_by','about','concerns','related_to')`.
- **Node typing**: `node_type IN ('insight','matter','party','lawyer','judge','witness','concept','precedent','statute')`.

## Why pgvector + relational rather than a dedicated graph DB

Postgres relational tables modeling nodes/edges plus pgvector for similarity is sufficient at MVP scale (under 10k nodes). Adding Neo4j or Apache AGE adds operational complexity without proportional benefit. The graph queries Trellis needs (1-hop neighborhood expansion, filtered retrieval) are straightforward SQL with recursive CTEs where needed. V1 can re-evaluate at scale.

## Retrieval flow

[[rag-query-pipeline]] uses:

```sql
SELECT id, title, summary
FROM team_graph_nodes
ORDER BY embedding <=> $query_embedding
LIMIT 8;
```

Followed by 1-hop expansion via `team_graph_edges`, deduplicated, then filtered to nodes with cosine similarity > 0.55 to the query.

## Relations

- **Used by**: [[trellis]] backend
- **Stores**: [[trellis-data-model|team graph schema]]
- **Receives embeddings from**: [[gemini]] (`text-embedding-004`)
- **Personal notes do NOT live here**: those live in browser IndexedDB; this DB only sees sanitized published nodes.

## Open questions

- HNSW recall/latency at single-firm scale (under 10k nodes) is fine; what's the V1 plan if a firm graph crosses 100k nodes?
- Migration path if the embedding model changes dimension.

## Sources

- [[trellis-project-architecture]]
