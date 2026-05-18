---
title: Embedding, retrieval, and citation — end-to-end
type: topic
status: active
tags: [ai, retrieval, embedding, chat, citation, trellis]
sources: [trellis-project-architecture, trellis-product-requirements, trellis-implementation-plan]
created: 2026-05-15
updated: 2026-05-15
---

# Embedding, retrieval, and citation — end-to-end

A single-document tour of how a chat query becomes a grounded, cited answer in [[trellis|Trellis]]. Covers every layer from "user presses Enter" through "clickable citation chip opens a node summary panel" — the math, the schemas, the prompt rules, the SSE protocol, and the failure modes.

This page **synthesizes** [[rag-query-pipeline]], [[chat-query-classifier]], [[conversational-chat-path]], [[citation-grounding]], [[gemini-retry-backoff]], [[postgres-pgvector]], and [[gemini]]. Read this first; drill into the canonical pages if you need more depth on a specific layer.

---

## 1. The big picture

```
User types query
     │
     ▼
[ Frontend ] streamChat(query, lastFourTurns)  ─── apps/web/src/api/chat.ts
     │
     │  POST /api/chat   { query, history: [...] }
     ▼
[ API ]  router.post('/', auth, ...)            ─── apps/api/src/routes/chat.ts
     │
     ▼
[ Classifier ]  classifyQuery(query, history)   ─── services/classifier.ts
     │           Gemini Flash, enum output
     │
     ├──► kind: 'conversational'  ─► streamConversationalResponse(query, history)
     │                                services/conversational.ts
     │                                Gemini Flash, no retrieval
     │
     └──► kind: 'knowledge'  ─► retrieveContext(query)
                                  │
                                  ├─ generateEmbedding(query)
                                  │    gemini-embedding-001, 768-d
                                  │
                                  ├─ vectorSearch(embedding, 8)
                                  │    pgvector <=> cosine, HNSW
                                  │
                                  ├─ expandOneHop(seedIds)
                                  │    keep only insight-type neighbors
                                  │
                                  ├─ filter contexts where similarity > 0.55
                                  │
                                  └─ calculateConfidence(contexts)
                                       │
                                       ▼
                                  streamRagResponse(query, contexts, confidence)
                                  Gemini Pro, grounding prompt, inline [node_id]
                                  citations OR random refusal variant
     │
     ▼
[ SSE stream back to client ]
   event: kind          ─► { kind: 'knowledge' | 'conversational' }
   event: cited-nodes   ─► { nodeIds, confidence }       (knowledge only)
   event: token         ─► { text }                      (both)
   event: done          ─► { kind, confidence?, sourceCount? }
   event: error         ─► { message }                   (on mid-stream failure)
     │
     ▼
[ Frontend ]
   - chatStore.startStreaming(...) appends a new assistant message
   - QueryOverlay.tsx fires the canvas pulse animation (knowledge + non-refuse only)
   - ChatMessage renders streaming tokens, parsing [uuid] / [hex-prefix] inline
     into CitationChip components
   - Click a chip → NodeSummaryPanel slides in from the right
```

The architecture is **two parallel paths gated by a classifier**, with retrieval and synthesis structurally separated so either layer can be swapped (e.g. self-hosted embeddings at V1) without touching the other.

---

## 2. Embedding

### Model

**`gemini-embedding-001`**, Google's hosted embedding model in the Gemini family. Called via `@google/generative-ai` SDK. `outputDimensionality: 768` is pinned at the API call site to match the `vector(768)` column on `team_graph_nodes`.

| Property | Value | Why |
|---|---|---|
| Model | `gemini-embedding-001` | Architecture spec called for `text-embedding-004` but that model isn't exposed by the SDK |
| Dimensions | 768 (pinned via `outputDimensionality`) | Matches DB column + HNSW index |
| Provider | Google Gemini API direct | Single `GEMINI_API_KEY` for entire MVP AI stack |
| Type-assertion workaround | `as Parameters<...>[0]` at the call site | `@google/generative-ai@0.24.1` types omit `outputDimensionality` |

Implementation: [services/embedding.ts](apps/api/src/services/embedding.ts).

### When embeddings are generated

Three call sites, all on **sanitized text only** — the personal layer is never embedded:

| Event | Caller | What gets embedded |
|---|---|---|
| Seed time | `seed/seed.ts` calls `generateEmbedding` per insight + per unique entity name | The 20 published insights' `${title} ${body}`, plus each unique entity's name |
| Publish time | `routes/publish.ts:58` | The sanitized `${title}\n\n${body}` of a newly-published insight |
| Query time | `services/rag.ts:89` (inside `retrieveContext`) | The user's chat query text |

The personal layer ([[trellis-capture-implementation|capture domain]]) stores notes in IndexedDB on-device with **no embedding** — personal-graph search is title/body filter only. A note only acquires an embedding when it has been redacted, generalized, and published as a team-graph node. This is the [[local-first-architecture]] guarantee in code: privileged content never reaches an embedding endpoint.

### Where embeddings live

Postgres column `team_graph_nodes.embedding vector(768)`, indexed with **HNSW** on `vector_cosine_ops`:

```sql
CREATE INDEX idx_embedding ON team_graph_nodes
  USING hnsw (embedding vector_cosine_ops);
```

HNSW (Hierarchical Navigable Small World) gives approximate-nearest-neighbor lookups in roughly O(log N) time — fast enough that retrieval latency is dominated by the embedding call (~300 ms), not the search (typically < 50 ms at MVP scale). See [[postgres-pgvector]].

### Reliability

Every embedding call goes through `withGeminiRetry` ([[gemini-retry-backoff]]). Default 3 attempts, 30 s per-attempt timeout, exponential backoff with full jitter. Transient 429 / 5xx hiccups no longer surface to the user as a 500.

---

## 3. The classifier gate (first decision after submit)

Before any retrieval happens, every chat message goes through [[chat-query-classifier]] — a Gemini Flash call that returns `'knowledge'` or `'conversational'`.

### Why it exists

Before this gate, every message went through RAG. Typing "hi" hit vector search, found nothing above the threshold, and produced a refusal-with-invite — technically correct, conversationally absurd. The classifier routes social interactions and operational follow-ups around RAG entirely while preserving the privilege boundary for anything substantive.

### Rules (from the classifier system prompt)

Returns `conversational` for:
- Greetings / acknowledgments — "hi", "thanks", "good morning"
- Meta / capability — "what can you do?", "how does this work?", "what's in the firm brain?"
- Operations on the prior assistant turn — "summarize that", "shorter please", "what was the second source?"

Returns `knowledge` for:
- Facts, opinions, or strategy from firm work
- Substantive follow-ups — "tell me more about that judge", "what else have we tried on cross?"
- **Anything ambiguous** — *"When in doubt, return knowledge."* Misrouting a substantive query to conversational is worse than the other direction.

### Implementation specifics

- **Model**: `gemini-2.5-flash`
- **Structured output**: `responseSchema` with `format: 'enum'` on `kind: ['knowledge', 'conversational']`
- **History awareness**: receives the recent turns from the request; builds a 400-char-truncated "prior assistant turn" block so it can disambiguate "summarize that"
- **Reliability**: tight `maxAttempts: 2`, `timeoutMs: 8_000`. On any failure (network, parse, timeout) the function returns `'knowledge'` — safe default

### Cost vs. UX tradeoff

The classifier adds one Gemini Flash round-trip (~300–800 ms typical) to every chat reply. That cost is hidden under the user's send animation; the architectural payoff is that the **SSE protocol's first event is `kind`**, letting the frontend decide whether to expect `cited-nodes` and gate the [[query-overlay-animation]] cleanly.

---

## 4. Retrieval — the knowledge path

When the classifier returns `kind: 'knowledge'`, `retrieveContext(query)` in [services/rag.ts](apps/api/src/services/rag.ts) runs five steps.

### Step 1 — Embed the query

`generateEmbedding(query)` → 768-d vector. Same model as the corpus embeddings, so cosine similarity is comparable.

### Step 2 — Vector similarity search (top-8)

`vectorSearch(queryEmbedding, 8)` in [db/queries.ts:9](apps/api/src/db/queries.ts#L9):

```sql
SELECT id, node_type, title, body, summary, contributor_id, metadata,
       created_at, updated_at,
       1 - (embedding <=> $1::vector) AS similarity
FROM team_graph_nodes
WHERE embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 8;
```

The `<=>` operator is pgvector's cosine distance. `1 - distance = similarity`, so similarity is on `[0, 1]` with 1 = identical. The `ORDER BY ... <=>` clause uses the HNSW index for the approximate nearest-neighbor scan. Top-k of **8** balances recall (enough candidates for confidence calibration) against context-window cost.

### Step 3 — 1-hop graph expansion

`expandOneHop(seedNodeIds)` in [db/queries.ts:31](apps/api/src/db/queries.ts#L31) — for each of the top hits, walk every connected edge in `team_graph_edges` and collect the other endpoint:

```sql
SELECT ... FROM team_graph_edges
WHERE source_node_id = ANY($1) OR target_node_id = ANY($1)
```

This is the **graph-augmented RAG** layer that distinguishes Trellis from chunk-only retrieval — even if the top vector hit is a single insight, the 1-hop expansion pulls in related precedent / motion-practice / contributor-attributed neighbors that strengthen the synthesis.

### Step 4 — Filter expanded set

Two filters are applied to the candidate set:

1. **Top-k cosine threshold**: keep only top hits with `similarity > 0.55`. Below 0.55 the relationship is too weak to anchor a citation.
2. **Neighbor type filter (deviation)**: from the 1-hop expansion, **only `insight`-type neighbors are added to the context** (lines 116–129 in `rag.ts`). Entity neighbors (`matter`, `party`, `lawyer`, `judge`, etc.) are walked but not synthesized over — they exist as graph structure, not as text to cite. This keeps the context focused on synthesizable claims.

Neighbor insights added via expansion are tagged `similarity: 0.55` (a floor value) so they don't inflate confidence calculations — they're context padding, not evidence.

### Step 5 — Sort and calculate confidence

The full context array is sorted by similarity descending. Then `calculateConfidence(contexts)` computes one of four levels.

The output of `retrieveContext` is:

```ts
{
  citedNodeIds: string[],     // IDs of every context node, in similarity order
  confidence: 'high' | 'medium' | 'low' | 'refuse',
  contexts: RagContext[]      // full payload for the LLM
}
```

---

## 5. Confidence score — how the bucket is chosen

### The rules (recalibrated 2026-05-15)

```ts
function calculateConfidence(contexts: RagContext[]): ConfidenceLevel {
  const above075 = contexts.filter(c => c.similarity >= 0.75).length;
  const above070 = contexts.filter(c => c.similarity >= 0.70).length;
  const above060 = contexts.filter(c => c.similarity >= 0.60).length;
  if (above075 >= 3) return 'high';
  if (above070 >= 2) return 'medium';
  if (above060 >= 1) return 'low';
  return 'refuse';
}
```

| Bucket | Rule | Meaning |
|---|---|---|
| `high` | ≥3 nodes with similarity ≥ 0.75 | Multiple strongly on-topic hits |
| `medium` | ≥2 nodes ≥ 0.70 | Solid but thinner — one strong + adjacent |
| `low` | ≥1 node ≥ 0.60 | A single weakly-related hit |
| `refuse` | 0 nodes ≥ 0.60 | No answer attempted |

Buckets are evaluated **in order**: a context that meets `high` skips the rest. The function only returns `refuse` when literally no context node hit the 0.60 floor.

### Why these numbers (the calibration story)

The pre-2026-05-15 thresholds used `≥0.80 = high`. Empirical measurement on the seeded Acme corpus with `gemini-embedding-001` showed that **even tightly-matched queries cap around 0.80 cosine similarity** — e.g., the query *"How does Judge Buenaventura handle motions"* against 6 dedicated Buenaventura insights tops out near 0.80. The old threshold made `high` confidence physically unreachable on real queries.

The new thresholds were calibrated against the actual distribution in `apps/api/src/diagnostics-similarity.ts`. The triplet `(0.75 / 0.70 / 0.60)` was chosen because:

- **0.75 for high** is achievable on the most on-topic hits in the corpus
- **0.70 for medium** matches the cluster of "solidly relevant but not exact" hits
- **0.60 for low** is the noise floor — below this the cosine is essentially random

Calibration is **corpus-specific** — different seed content, different distributions, different thresholds. The triplet is not a universal truth; it's an Acme-corpus number. If the corpus is rebuilt with different content or a different embedding model, recalibration is required.

### What the user sees

The confidence bucket drives three UX behaviors in chat:

1. **[`ConfidenceBadge`](apps/web/src/views/chat/ConfidenceBadge.tsx)** — a pill in the chat-message footer showing the bucket as a dot + label, drawn from the **semantic palette** (success / warning / danger) — independent of the orange accent.
2. **Sources section default expansion** — `high` collapses the [`SourcesPanel`](apps/web/src/views/chat/SourcesPanel.tsx) (trust the answer; don't crowd it); `medium` and `low` expand it (encourage inspection).
3. **Refusal CTA** — `refuse` shows the "Capture your thinking on this" button that routes to `/capture`.

### Refusal — random variant

When confidence is `refuse`, `streamRagResponse` yields a single message picked at random from **four phrasings**:

> *"I don't have firm knowledge that directly addresses this. You may want to capture your own thinking on this topic as a starting point."*
>
> *"The firm brain doesn't have material covering this question. Consider opening a capture and starting the record yourself — your notes today become tomorrow's institutional memory."*
>
> *"No published insights in the team graph speak to this directly. This looks like an open area for the firm's knowledge — your capture could be the first entry."*
>
> *"I couldn't find firm knowledge on this. Rather than synthesize from general legal training, I'd rather defer — this is a good prompt for a fresh personal capture."*

All four share the same product intent: acknowledge the gap, invite a capture. Randomization keeps the demo from feeling scripted across multiple test queries. The refusal path **does not call Gemini** — `streamRagResponse` short-circuits on `confidence === 'refuse'` and yields the variant directly, then returns. No tokens, no API spend, sub-100 ms latency.

---

## 6. Synthesis — building the answer (knowledge path)

When confidence is `high`, `medium`, or `low`, `streamRagResponse(query, contexts, confidence)` is invoked. It assembles a Gemini Pro call and yields the streamed response chunk-by-chunk.

### Context payload

```ts
const contextPayload = contexts.map(c => ({
  id: c.id,
  title: c.title,
  body: c.body,
  summary: c.summary,
  type: c.type,
}));
const userMessage = `Context:\n${JSON.stringify(contextPayload, null, 2)}\n\nQuestion: ${query}`;
```

Body, title, summary, and type are all available to the model — `id` is critical because the model is required to cite it.

### System prompt — the grounding contract

Loaded once at module scope from [prompts/chat.md](apps/api/src/prompts/chat.md). The seven rules in plain terms:

1. **Ground every claim in the provided context.** No invention, no training-data backfill.
2. **Cite every factual claim** with `[node_id]`. Multi-source citations are comma-separated: `[id_1, id_2]`.
3. **If context is insufficient**, use one of the four refusal variants verbatim. Don't fabricate; don't pad with generic legal advice; don't cite anything when refusing.
4. **Professional, direct tone.** No emoji. No exclamation points. No "I'm happy to help" filler. Address the lawyer as a peer.
5. **Structure longer responses** with clear paragraphs. Lead with the most actionable insight.
6. **Preserve attribution.** When referencing a strategy, include enough context (node title, brief description) that the reader can trace it.
7. **Synthesize across sources**, don't list sequentially.

The model is also given an explicit **output format**: response prose with inline `[node_id]` citations, then `---`, then a `Sources:` section listing each cited node with its title.

### Model setup

- **Model**: `gemini-2.5-pro`
- **System prompt**: `prompts/chat.md` via the shared `loadPrompt` helper
- **Streaming**: `model.generateContentStream(...)`, yielded chunk-by-chunk
- **Reliability**: initial connect wrapped in `withGeminiRetry({ label: 'rag.stream', timeoutMs: 30_000 })`. Mid-stream chunks are **not** retried — partial output may already have reached the user, and re-streaming the prefix would be visible

---

## 7. The conversational path (no retrieval)

When the classifier returns `kind: 'conversational'`, the entire retrieval pipeline is skipped. `streamConversationalResponse(query, history)` in [services/conversational.ts](apps/api/src/services/conversational.ts) runs Gemini Flash under a separate system prompt.

### Conversation history

The frontend sends the **last 4 turns** (≤ 2 user/assistant pairs) on every request. Server schema caps at 8. For assistant turns, `citedNodeIds` are attached so the model can re-quote them when the user asks "what was the second source?".

### Prompt format

```
Recent conversation:
USER: hello
ASSISTANT: Hi — what can I help you find?

Current user message: summarize that
```

Assistant turns with citations get an extra `[citedNodeIds: id1, id2, ...]` suffix so the model can re-quote those exact IDs without inventing new ones.

### Hard rule against substantive legal claims

Rule 6 of `prompts/conversational.md` is load-bearing:

> *"If the user asks for legal substance the firm brain has not surfaced (e.g., 'what is a motion in limine?', 'what's the rule on hearsay exceptions?'), do not answer the substance. Redirect briefly: 'That's the kind of question the firm brain is built to answer — try rephrasing it as a question about the firm's work, or capture your own thinking to start the record.'"*

This is what stops the conversational path from becoming a back-door for general legal advice. The privilege boundary survives the relaxed prompt.

### What the user perceives

- No overlay activation (`overlayActive` is gated to `kind === 'knowledge'`).
- No `SourcesPanel` (gated on `msg.kind === 'knowledge'`).
- No confidence badge — confidence is a knowledge-path concept.
- **Citations still resolve and click correctly** — the frontend unions every citation ever made in the conversation into a single resolution set, so a re-quoted `[abc12345]` from a prior knowledge turn renders as a clickable chip and opens the same `NodeSummaryPanel`.

---

## 8. Citations — extraction, parsing, display

### Server side — how citations get into the response

The Gemini Pro system prompt **commands** the model to insert `[node_id]` markers inline and append a Sources section. The IDs in the context payload are the source of truth — the model is instructed to use exactly those IDs.

In practice, the API returns the **first 8 hex characters** of each UUID (no hyphens) in `citedNodeIds` for compactness in the streamed payload. The full UUIDs live in the context array and are the canonical resolution set; the prefix form is what gets serialized.

### Client side — three-step lifecycle

1. **Receive cited nodes via SSE.** On the `cited-nodes` event, `chatStore.startStreaming(citedNodeIds, confidence, 'knowledge')` records them on the assistant message and on the global `citedNodeIds` slice.

2. **Parse tokens for citation markers** as they stream. In [ChatMessage.tsx](apps/web/src/views/chat/ChatMessage.tsx), `renderContentWithCitations(content, citedNodeIds, onCitationClick)` runs this regex on the streamed text:

   ```
   /\[([a-f0-9]{4,12}(?:-[a-f0-9-]{0,31})?(?:\s*,\s*[a-f0-9]{4,12}(?:-[a-f0-9-]{0,31})?)*)\]/g
   ```

   The regex accepts **both** full 36-char UUIDs and 8–12 char hex-prefix IDs (with optional internal hyphens). Multi-citation `[id1, id2]` patterns are split on comma and resolved individually.

3. **Resolve to indices.** `resolveId(rawId, citedNodeIds)` strips hyphens and matches by exact UUID first, then by prefix:

   ```ts
   function resolveId(rawId: string, citedNodeIds: string[]): string | undefined {
     const clean = rawId.replace(/-/g, '');
     const exact = citedNodeIds.find(id => id === rawId || id.replace(/-/g, '') === clean);
     if (exact) return exact;
     return citedNodeIds.find(id => id.replace(/-/g, '').startsWith(clean));
   }
   ```

   Resolved IDs are converted to 1-indexed positions (`indices = resolvedIds.map(id => citedNodeIds.indexOf(id) + 1)`). The chip displays the indices, not the IDs — readers see `[1]` or `[1,2,3]`, not raw hex.

   Citations that fail to resolve (model hallucinated an ID, or the prefix doesn't match anything in `citedNodeIds`) render as plain text, not broken chips. **Defense in depth against the model fabricating IDs.**

### Conversation-wide citation resolution

The parser doesn't just resolve against the **current** message's `citedNodeIds`. In ChatView, an `allCitedNodeIds` memo unions every citation ever made in this conversation plus the live streaming set:

```ts
const allCitedNodeIds = React.useMemo(() => {
  const set = new Set<string>();
  for (const m of messages) {
    if (m.role === 'assistant' && m.citedNodeIds) {
      for (const id of m.citedNodeIds) set.add(id);
    }
  }
  for (const id of citedNodeIds) set.add(id);
  return Array.from(set);
}, [messages, citedNodeIds]);
```

This is what lets a **conversational follow-up** re-quote `[abc12345]` from a prior knowledge turn and have it resolve as a clickable chip. Without the union, the chip would render as plain text in any conversational reply.

### Display — the CitationChip

[`CitationChip.tsx`](apps/web/src/views/chat/CitationChip.tsx) renders the resolved indices as an inline monospace badge:

| Property | Value |
|---|---|
| Format | `[1]`, `[1,2,3]` |
| Size | 11 px, vertical-align super |
| Background | `accent-primary-bg` (`#2d1a06`) |
| Text | `accent-primary` (`#fb8500` orange) |
| Border | `accent-primary-muted` (`#8a4900`) |
| Hover | motion spring `scale: 1.06, y: -1` (stiffness 420, damping 22) |
| Keyboard | Enter / Space trigger onClick |
| A11y | `role="button"`, `tabIndex={0}`, `aria-label="Citation X, Y, Z"` |

The accent orange is the **only** non-grey color in the chat UI — it's the universal "this is a cited path" signal, matching the cited-edge illumination in [[query-overlay-animation]] (graphs) and the [[node-color-coding|strict UI-vs-data palette rule]].

### Click → NodeSummaryPanel

Clicking a chip invokes `onCitationClick(nodeId)`, which sets `selectedNodeId` in ChatView. The [`NodeSummaryPanel`](apps/web/src/views/chat/NodeSummaryPanel.tsx) slides in from the right (340 px wide) and fetches the full node via `GET /api/team-graph/nodes/:id`, showing:

- Node type + title
- Body + summary
- Contributor attribution
- Connected neighbors

Close handlers: outside-click, close button, or selecting a different chip.

For multi-citation chips like `[1,2,3]`, clicking the chip routes to the **first cited node**; the SourcesPanel below the message lists all three for individual inspection.

---

## 9. The query overlay (the visual hero moment)

When the assistant message is **knowledge-kind**, non-refuse, and has citations, the [[query-overlay-animation]] activates in parallel with the streaming response. This is the canvas-based pulse animation that visualizes "the firm is thinking" — see [trellis-retrieval-implementation](vault/topics/trellis-retrieval-implementation.md) for the full implementation breakdown.

Gating logic in chatStore:

```ts
overlayActive: kind === 'knowledge' && confidence !== 'refuse' && citedNodeIds.length > 0
```

Conversational replies and knowledge refusals share the plain thinking-dots loading state without the overlay. That's deliberate — the overlay is the visual signature of *grounded retrieval succeeded*; using it for "hi → Hi back" or "I don't have firm knowledge on this" would devalue it.

---

## 10. Reliability — what happens when Gemini hiccups

Every Gemini SDK call in the API goes through `withGeminiRetry` ([[gemini-retry-backoff]]). Three relevant retry policies in this pipeline:

| Call | maxAttempts | timeoutMs | Notes |
|---|---|---|---|
| Embedding (query) | 3 (default) | 30_000 | Cheap retry; embedding is fast |
| Classifier | 2 | 8_000 | Tight — chat latency is a hero moment |
| RAG synthesis stream | 3 (default) | 30_000 | Initial connect only; mid-stream chunks not retried |
| Conversational stream | 2 | 30_000 | Initial connect only |

Retryable failures: SDK aborts, `GoogleGenerativeAIFetchError` with status 408/425/429/5xx, fetch errors without a status, network-layer message patterns (`fetch failed`, `ECONNRESET`, etc.).

**Streaming connect retry only.** Once chunks start flowing, a mid-stream failure becomes a `done` event with no content rather than a re-stream — re-streaming the prefix would be visible and confusing, and Gemini has no native resumption.

For the conversational path, a mid-stream error compensates correctly: it does **not** stamp `'refuse'` confidence on the partial message (confidence is a knowledge-path concept). The message stays with whatever content arrived. (Commit `a8b4eb3`.)

---

## 11. End-to-end timeline — what the user perceives

For a typical knowledge-path query on a healthy network:

| t (approx) | What's happening server-side | What the user sees |
|---|---|---|
| 0 ms | User presses Enter; `isPending = true`; history payload built | Send button animates; input clears; thinking dots appear |
| 50 ms | POST /api/chat lands; auth + Zod validation pass | (Thinking dots) |
| 100 ms | `classifyQuery` call begins | (Thinking dots) |
| 500 ms | Classifier returns `'knowledge'`; `event: kind` written to SSE | (Thinking dots) |
| 600 ms | Embedding call begins | (Thinking dots) |
| 1100 ms | Embedding returns; `vectorSearch` runs (< 50 ms) | (Thinking dots) |
| 1200 ms | `expandOneHop` runs; contexts filtered; confidence calculated | (Thinking dots) |
| 1250 ms | `event: cited-nodes` written; `chatStore.startStreaming(...)`; `overlayActive = true` | **Chat dims; QueryOverlay fades in over 400 ms; cited nodes pulse with stagger** |
| 1300 ms | Gemini Pro stream begins; first token arrives | First text appears in the assistant message |
| 1300–4000 ms | Streaming tokens accumulate; CitationChips parsed inline as they appear | Tokens stream in; chips render as the model emits `[abc12345]` markers |
| 4000 ms | `event: done`; `finishStreaming(...)`; `overlayActive = false` | Overlay fades out (600 ms); SourcesPanel renders (collapsed if high, expanded otherwise); confidence badge appears |

For a `conversational` reply: classifier returns at ~500 ms, `event: kind: 'conversational'` fires, no retrieval / no overlay activates, Gemini Flash streams the short reply directly. Total ~1500 ms typical.

For a refusal: classifier returns `'knowledge'` at ~500 ms, retrieval runs to ~1200 ms, `event: cited-nodes` fires with `confidence: 'refuse'` and an empty `nodeIds` array, the overlay does **not** activate (gated on non-refuse + non-empty citations), the refusal-message variant streams as a single token. "Capture your thinking on this" CTA appears.

---

## 12. Failure modes and what they look like

| Failure | What happens | What user sees |
|---|---|---|
| Empty `GEMINI_API_KEY` | First Gemini call (classifier) 401s; `withGeminiRetry` doesn't retry 401; chat handler catches, returns 500 | Error toast / chat error state |
| Network blip during classify | `withGeminiRetry` retries once (8 s timeout × 2 attempts max); on second failure, returns `'knowledge'` (safe default) | Slight delay; user sees normal knowledge-path output |
| Network blip during embedding | `withGeminiRetry` retries up to 3× with backoff; final failure → 500 to client | Brief delay; if all retries fail, error toast |
| Vector search returns 0 rows | `retrieveContext` short-circuits with `confidence: 'refuse'`, `citedNodeIds: []` | Refusal message + capture CTA |
| All top-8 hits below 0.55 | `contexts` array is empty after filter; `confidence` = 'refuse' (no nodes ≥ 0.60) | Refusal message + capture CTA |
| Top-8 has 1 hit at 0.65 | `confidence` = 'low' (1 node ≥ 0.60); 1 cited node; expanded SourcesPanel | Streamed answer with 1 citation, low badge, sources expanded |
| Mid-stream Gemini error | `withGeminiRetry` returns the partial stream object before chunks arrive; once chunks start, no retry; `event: error` written; SSE closes | Partial answer + "Stream interrupted" toast; conversational path doesn't stamp 'refuse' |
| Model hallucinates a node ID not in `citedNodeIds` | `resolveId` returns undefined; `indices.length === 0`; parser falls through to plain text | The `[badid]` renders as literal text — not a broken chip. Reader sees the model's mistake instead of a click target that 404s |

---

## 13. What's deliberately NOT in this pipeline (and why)

- **Multi-turn synthesis with prior-turn evidence**. Each knowledge query is retrieved independently; the conversational path is the only place prior turns affect output. Why: scope, and because preserving citation integrity across multi-turn retrieval requires careful re-ranking that's out of MVP.
- **Re-ranking after vector search**. Top-8 cosine is the only signal; no cross-encoder re-rank. Why: cost + latency; the seed corpus is small enough that the top-8 is already well-ordered. V1 may revisit at firm scale.
- **Personal-layer retrieval**. The personal IDB notes are never embedded and never reachable from chat. Chat queries always target the **team graph**. Why: [[local-first-architecture]] — personal content stays on-device.
- **Entity-typed neighbors in synthesis context**. The 1-hop expansion walks them but excludes them from `contexts`. Why: entity nodes don't carry synthesizable claims; including them would dilute the prompt and produce vague answers.
- **Embeddings for everything published**. Only the title + body is embedded; metadata and contributor info are not. Why: those fields are filterable, not semantically retrievable.

---

## Open questions

- **Confidence calibration at firm scale.** The 0.75/0.70/0.60 thresholds are Acme-corpus numbers. Onboarding a real firm will require recalibration against their distribution.
- **Re-ranking** — at what corpus size does the noise floor on cosine alone become inadequate? Pre-trained cross-encoders (`bge-reranker`) are cheap to swap in.
- **Embedding model swap** ([[embedding-model-migration-path]]) — pinning to 768-d is the partial mitigation; full migration strategy is open.
- **Multi-turn knowledge synthesis** — when a user says "tell me more," should the second turn's retrieval ride the prior turn's contexts, or start fresh? Current behavior is fresh; harder, but probably correct for citation integrity.
- **Self-hosted embedding** — V1 would let firms keep even sanitized content off Google. The retrieval pipeline is structurally ready (one service swap); the operational shift is real.

## Cross-references

- [[rag-query-pipeline]] — the canonical concept page for the knowledge-path pipeline
- [[chat-query-classifier]] — classifier rules and prompt
- [[conversational-chat-path]] — the no-retrieval path
- [[citation-grounding]] — the discipline and product rationale
- [[gemini-retry-backoff]] — the reliability wrapper
- [[postgres-pgvector]] — the database layer
- [[gemini]] — the model family
- [[trellis-retrieval-implementation]] — the full domain implementation page
- [[query-overlay-animation]] — the visual hero moment that fires in parallel

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
- [[trellis-implementation-plan]]
