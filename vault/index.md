---
title: Index
type: index
status: active
updated: 2026-05-12
---

# Index

Catalog of every page in the wiki. Updated on every ingest and every lint.

## Sources

- [[karpathy-llm-wiki-pattern]] — Karpathy's gist defining the LLM Wiki pattern this vault implements
- [[trellis-product-brief]] — One-sentence pitch, problem, product, market, hackathon framing
- [[trellis-product-requirements]] — PRD: roles, MVP feature spec, V1 scope, acceptance criteria
- [[trellis-project-architecture]] — MVP and V1 architecture, stack, data model, AI pipelines, API
- [[trellis-design-guidelines]] — Brand, color, type, motion, hero moments, microcopy
- [[trellis-context-dump]] — Full conceptual journey, decision rationale, rejected ideas, glossary

## Entities

### Product
- [[trellis]] — The product itself: privacy-first knowledge fabric for law firms
- [[stratum]] — The original codename for Trellis (do not use externally)

### Organizations (demo)
- [[acme-litigation-partners]] — Pre-seeded demo firm and commercial-litigation practice group

### Hackathon org and sponsors
- [[lablab]] — Hosts the AI & Big Data Expo hackathon; Trellis competes in Track 4
- [[veea]] — Track 1 sponsor; maker of [[lobster-trap]]
- [[lobster-trap]] — Veea's DPI proxy; optional deferred integration for Trellis

### Roles and personas
- [[litigator]] — Primary user persona: 4–8 year litigation associate at a mid-size firm
- [[practice-group-lead]] — Validator persona: partner leading the litigation practice group
- [[knowledge-admin]] — V1 buyer-aligned persona: KM Partner / KM Director

### AI and model providers
- [[gemini]] — Google's Gemini 2.5 Pro / Flash / Vision and `text-embedding-004`
- [[gemma]] — On-device model used in V1 for personal-layer extraction
- [[whisper]] — OpenAI Whisper API for audio transcription
- [[microsoft-presidio]] — Self-hosted PII detection used in redaction Pass 1

### Tools and platforms (frontend, infra)
- [[obsidian]] — Markdown vault app; the IDE for the Wiki pattern
- [[cytoscape-js]] — Graph visualization library chosen for Trellis MVP
- [[postgres-pgvector]] — Single Postgres database with pgvector for embeddings
- [[react-vite]] — Frontend framework and build tool for the MVP SPA
- [[tauri]] — V1 cross-platform desktop shell

### Document management and integrations (V1)
- [[imanage]] — Legal DMS, V1 integration target for seeding the team graph
- [[netdocuments]] — Legal DMS, V1 integration target

### Competitors and adjacent products
- [[harvey]] — Legal AI competitor / future MCP consumer; $3B (2025) reference comp
- [[spellbook]] — Legal AI for drafting
- [[cocounsel]] — Legal AI for research
- [[glean]] — Enterprise search; cloud-first model incompatible with privilege
- [[notion]] — Generic team knowledge; lacks legal compliance posture
- [[rewind-ai]] — Rejected reference: always-on capture pattern explicitly ruled out

## Concepts

- [[llm-wiki-pattern]] — Persistent compounding wiki maintained by an LLM, vs ephemeral RAG
- [[memex]] — Vannevar Bush's 1945 vision; spiritual predecessor to the wiki pattern
- [[rag]] — Retrieval-augmented generation; contrast and basis for the wiki pattern
- [[attorney-client-privilege]] — Legal doctrine that structurally blocks generic AI adoption
- [[two-layer-architecture]] — Personal brain (local) + team-managed graph (cloud) separation
- [[three-graph-views]] — Personal, team-admin, query-overlay graphs
- [[pluggable-brain]] — Trellis as the substrate other AI tools plug into via MCP
- [[redaction-pipeline]] — Two-pass MVP (Presidio + Gemini generalization) → four-pass V1
- [[auto-organization-pipeline]] — Single Gemini call: extract + classify + privilege detect
- [[rag-query-pipeline]] — Embed → top-k vector search → 1-hop graph expansion → grounded synthesis
- [[query-overlay-animation]] — Signature visual: chat dims, team graph fades in, cited nodes pulse
- [[mcp-server]] — V1 endpoint exposing the team graph to Harvey, CoCounsel, Copilot
- [[citation-grounding]] — Every claim cites a node ID; refuse rather than hallucinate
- [[insight-preservation-score]] — Single-LLM-call confidence metric on redacted content
- [[force-directed-graph]] — Layout algorithm; nodes repel, edges attract
- [[local-first-architecture]] — Personal notes never leave the device unsanitized
- [[node-color-coding]] — Strict rule: graph palette never overlaps with UI accent/semantic
- [[knowledge-graph-extraction]] — Pipeline from raw capture to entity/edge inserts
- [[hero-moments]] — Three UI surfaces where design polish must concentrate
- [[adoption-strategy]] — Two pillars + departure-capture exception + reinforcing reciprocity
- [[ethical-wall]] — Chinese-wall doctrine; V1+ retrieval-filter requirement

## Topics

- [[legal-ai-landscape]] — Competitive map: point tools, DMS, enterprise search, generic KM
- [[trellis-mvp-scope]] — What ships in 6 days, what does not, and why
- [[trellis-v1-roadmap]] — First paying customers: native apps, on-device LLM, approvals, MCP
- [[trellis-v2-vision]] — Cross-firm benchmarks, ethical walls, EU deployment, vertical expansion
- [[trellis-tech-stack]] — Frontend, backend, database, AI, deployment — MVP and V1
- [[trellis-data-model]] — Postgres schema for team graph; IndexedDB schema for personal notes
- [[trellis-ai-pipelines]] — Auto-organize, redact, RAG query — sequence diagrams and prompts
- [[trellis-api-surface]] — REST endpoints for the MVP backend
- [[trellis-design-system]] — Tokens, type, components, motion
- [[trellis-demo-narrative]] — Five-minute hackathon demo flow
- [[trellis-business-model]] — Practice-group license + land-and-expand; market sizing TAM/SAM/SOM
- [[competitive-moat]] — Vertical depth, privacy architecture, pluggable positioning, network effects
- [[hackathon-judging-fit]] — Why Trellis maps cleanly to Track 4 and the Gemini Award
- [[trellis-decision-history]] — Ten-phase reasoning chain from Obsidian curiosity to locked MVP
- [[trellis-rejected-ideas]] — Queryable surface of ideas explicitly ruled out (don't regress)

## Questions

- (none yet — open as gaps are discovered during ingest or query)
