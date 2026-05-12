---
title: RAG query pipeline
type: concept
status: active
tags: [pipeline, ai, trellis, retrieval]
sources: [trellis-project-architecture, trellis-product-requirements]
created: 2026-05-12
updated: 2026-05-12
---

# RAG query pipeline

The retrieval and synthesis pipeline behind [[trellis|Trellis]]'s chat-with-team-brain feature. Embed the query → vector similarity search → 1-hop graph expansion → grounded synthesis with inline node-ID citations. Triggers the [[query-overlay-animation]] in parallel.

## Sequence

1. User submits a query in the chat input.
2. Backend embeds the query using [[gemini|`text-embedding-004`]] (768-d).
3. Backend runs cosine-similarity search in [[postgres-pgvector]]:
   ```sql
   SELECT id, title, summary
   FROM team_graph_nodes
   ORDER BY embedding <=> $query_embedding
   LIMIT 8;
   ```
4. For each retrieved node, **1-hop graph expansion** via `team_graph_edges`, deduplicated by node ID.
5. **Filter** expanded set: keep only nodes with cosine similarity > **0.55** to the query.
6. Construct context as a JSON array of `{ id, title, summary, body, type }`.
7. Stream Gemini Pro response with a system prompt that enforces grounding rules (see below).
8. Frontend parses inline `[node_id]` markers into citation chips linked to summary panels.
9. **In parallel**, the frontend triggers the [[query-overlay-animation]] using the returned cited node IDs.

## Grounding rules (system prompt)

- **Cite every claim** with a node ID.
- **Refuse to answer** if no nodes are above similarity **0.75** — *"I don't have enough firm knowledge to answer this confidently."*
- **Output structured response** with inline `[node_id]` markers.
- See [[citation-grounding]] for the full discipline.

## Confidence buckets

- **High** — 3+ nodes above 0.80 similarity, all in the same topical cluster
- **Medium** — 2+ nodes above 0.70, mixed clusters
- **Low** — only 1 node above 0.75, or several below 0.70
- **Refuse** — zero nodes above 0.75 (no answer attempted)

The confidence indicator is a small pill in the chat UI: green/amber/red dot + label. Sources section is collapsed for High, expanded for Medium/Low.

## Why graph expansion on top of vector search

Pure top-k embedding similarity misses the relational structure of the team graph. A query about "cross-examining expert witnesses on damages" might top-rank a single insight; the 1-hop expansion pulls in related precedent nodes, motion-practice insights, and contributor history that strengthen the synthesis.

## Streaming and UX

- Streaming response begins within 3 seconds of query submission.
- Citation chips appear in the response only after the segment containing the citation has streamed.
- The [[query-overlay-animation]] overlay holds for ~1 second after cited nodes pulse, then fades back as the response streams.

## Relation to RAG generally

This is RAG in the **classical** sense — see [[rag]] for the contrast with the [[llm-wiki-pattern]] and the broader pattern. The graph-traversal layer is what differentiates Trellis's RAG from chunk-only retrieval.

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
