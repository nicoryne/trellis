---
title: Acme Litigation Partners
type: entity
status: active
tags: [trellis, demo, fictional]
sources: [trellis-product-requirements]
created: 2026-05-12
updated: 2026-05-12
---

# Acme Litigation Partners

The single hard-coded demo firm in the [[trellis]] hackathon MVP. Has one practice group (`Commercial Litigation`) and three pre-seeded user accounts. Fictional; avoid using recognizable real cases or real lawyer names in seed content.

## Key facts

- **Tenancy**: single hard-coded firm; no signup, no tenant management UI in MVP. (see [[trellis-product-requirements]])
- **Practice group**: Commercial Litigation.
- **Three demo accounts**:
  - `litigator@acme.law` / `demo` — role [[litigator|Lawyer]]
  - `lead@acme.law` / `demo` — role [[practice-group-lead|Practice Group Lead]]
  - `admin@acme.law` / `demo` — role [[knowledge-admin|Knowledge Admin]]
- **Seed footprint**: 5–8 personal notes for the Lawyer; 15–30 published insights in the team graph spanning judge tendencies, opposing counsel, motion practice, expert witnesses, settlement, procedure.

## Why it exists

Without a populated firm, the [[hero-moments|retrieval moment]] fails. The seeded canonical query *"What has our firm learned about cross-examining expert witnesses on damages calculations?"* must produce a coherent cited response in under 10 seconds.

## Relations

- **Hosts**: [[litigator]], [[practice-group-lead]], [[knowledge-admin]]
- **Practice group**: Commercial Litigation (a single instance of the [[trellis-product-brief|target segment]])

## Open questions

- What's the "voice" of the firm in seed insights — terse and conclusory, or narrative? Affects how generalization in [[redaction-pipeline]] reads on screen.

## Sources

- [[trellis-product-requirements]]
