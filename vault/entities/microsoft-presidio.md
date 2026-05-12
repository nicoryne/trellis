---
title: Microsoft Presidio
type: entity
status: active
tags: [pii, redaction, oss, microsoft]
sources: [trellis-project-architecture, trellis-product-requirements]
created: 2026-05-12
updated: 2026-05-12
---

# Microsoft Presidio

Open-source PII (Personally Identifiable Information) detection and anonymization framework from Microsoft. Self-hosted in a Docker container; provides regex + NER tokenization. In Trellis it powers **Pass 1** of the [[redaction-pipeline]].

## Key facts

- **Self-hosted**: Docker container deployed alongside the backend. (see [[trellis-project-architecture]])
- **Detection types tokenized in Pass 1**:
  - Person names → `[PERSON_A]`, `[PERSON_B]` (consistent within a note)
  - Organizations → `[ORG_A]`
  - Monetary amounts → `[AMOUNT]`
  - Dates → `[DATE]` (or `[DATE_OFFSET_FROM_FILING]` if a filing date is detected)
  - Email addresses, phone numbers, addresses → respective tokens
- **Output**: tokenized content + redaction map (`{ original, replacement, type, position }` array used by the diff UI).
- **Why it's chosen**: hybrid regex + NER coverage, self-hosted (privilege-compatible), free.

## Role in the redaction pipeline

- **MVP**: Pass 1 only (Presidio); Pass 2 generalization runs on [[gemini]]; preservation score (the simplified V1 Pass 4) is a Gemini Flash call.
- **V1**: full four-pass pipeline — privilege detection (fine-tuned legal model + Presidio), client identifier scrubbing, generalization, preservation check.

## Relations

- **Used by**: [[trellis]] [[redaction-pipeline]] (Pass 1 in MVP, Passes 1–2 in V1)
- **Complement**: [[gemini]] (generalization and preservation)

## Open questions

- Out-of-the-box Presidio recognizers vs. custom legal recognizers — the V1 spec implies a fine-tuned legal model is layered on top; what's its training data and provenance?

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
