---
title: iManage
type: entity
status: active
tags: [integration, dms, v1, legal]
sources: [trellis-product-brief, trellis-project-architecture]
created: 2026-05-12
updated: 2026-05-12
---

# iManage

A leading legal Document Management System (DMS). Stores finished work product across the firm. The "exhaust" of legal work — documents — but **not the reasoning behind it**.

## Key facts

- **Category**: legal DMS. (see [[trellis-product-brief]])
- **Why it doesn't solve Trellis's problem**: DMSes store finished work product but **not the strategy, reasoning, or "why."** That stays in human heads.
- **V1 integration priority**: **Critical**. Direction: inbound — read firm document corpus to seed the team graph. (see [[trellis-project-architecture]] §8 and [[trellis-product-requirements]] §4.4)
- **MVP**: not built.
- **Relationship to Trellis**: integrates with rather than replaces.

## Relations

- **Peer**: [[netdocuments]] (the other dominant legal DMS)
- **Integrates with (V1)**: [[trellis]] — seeds the [[trellis-data-model|team graph]] from existing firm documents
- **Authentication context (V1)**: SSO via Microsoft 365 / Google Workspace identity layer

## Open questions

- iManage offers multiple connectivity surfaces (REST API, MFAPI, custom plugins). Which V1 path is chosen?
- Volume to ingest: hundreds of thousands of documents per firm at the low end. What's the indexing strategy and cost envelope?

## Sources

- [[trellis-product-brief]]
- [[trellis-project-architecture]]
