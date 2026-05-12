---
title: Redaction pipeline
type: concept
status: active
tags: [pipeline, privacy, trellis, ai]
sources: [trellis-product-requirements, trellis-project-architecture, trellis-design-guidelines]
created: 2026-05-12
updated: 2026-05-12
---

# Redaction pipeline

The mechanism that enforces the [[two-layer-architecture]] boundary. When a lawyer clicks "Publish to team graph," the redaction pipeline runs **before** any content reaches Layer 2. **Two-pass at MVP, four-pass at V1.** This surface is the "**wow moment of the demo**" — it must be visually polished. (see [[trellis-product-requirements]])

## Definition (MVP — two passes)

**Pass 1 — [[microsoft-presidio|Microsoft Presidio]] (regex + NER):** detects and tokenizes:

- Person names → `[PERSON_A]`, `[PERSON_B]` (consistent within a note)
- Organizations → `[ORG_A]`
- Monetary amounts → `[AMOUNT]`
- Dates → `[DATE]` (or `[DATE_OFFSET_FROM_FILING]` if a filing date is detected)
- Email addresses, phone numbers, addresses → respective tokens

**Pass 2 — [[gemini|Gemini Pro]] generalization:** reads the tokenized note and rewrites specific facts to legal-principle level. Example:

> *Input:* "Our client's 2019 acquisition of a competitor in the medical device space"
> *Output:* "An acquisition of a horizontal competitor in a regulated industry"

The system prompt instructs Gemini to **preserve strategic insight while generalizing specifics**.

**Plus — [[insight-preservation-score]]**: a single Gemini Flash call returns a 0–100 confidence score evaluating whether the sanitized version retains the strategic point. This replaces the explicit "Pass 4" preservation check from the full V1 pipeline.

## Definition (V1 — four passes)

1. **Privileged content detection** — fine-tuned legal model + Presidio
2. **Client identifier scrubbing** (current MVP Pass 1)
3. **Generalization** (current MVP Pass 2)
4. **Preservation check** — dedicated LLM call evaluating insight retention

## The side-by-side diff UI

The modal shows:

- **Left pane**: original note (read-only)
- **Right pane**: redacted version (editable text)
- **Highlights**: each redaction visually marked on both sides with matching colors and connecting curves on hover
- **Per-redaction controls**: accept (default), modify (inline edit), or reject (restore original)
- **[[insight-preservation-score|Insight preservation indicator]]**: 0–100% bar at the top. Below 60% triggers a yellow warning; below 40% triggers red. Publish button disabled until score > 40% or the lawyer manually edits the right pane.

See [[hero-moments]] §1 for the full design spec.

## The redaction map

The data structure returned to the frontend is an array of:

```ts
{ original: string, replacement: string, type: 'PII' | 'GENERALIZATION', position: [start, end] }
```

The frontend uses it to render highlights with hover-linked pairs.

## Approval

The lawyer reviews and clicks "Publish." The sanitized version commits to the team graph; the original stays only in the lawyer's personal storage. Confirmation toast: *"Published. 12 colleagues can now see this insight."*

**MVP simplification**: the [[knowledge-admin|Knowledge Admin]] approval step is **skipped** in MVP. Published knowledge auto-flows to the team graph. V1 adds the admin approval queue.

## Risks and fallbacks (per [[trellis-project-architecture]] §11)

- **Pass 2 generalization quality** is the most likely thing to slip. Fallback: ship Pass 1 only with a manual-review UI.

## Why "the wow moment"

[[attorney-client-privilege|Privilege]] is invisible to the eye — until you watch it being enforced in real time. The side-by-side diff makes the privacy guarantee **legible** to lawyers, KM partners, and hackathon judges in one screen.

## Contrast with adjacent concepts

- **Not the same as standard DLP (data loss prevention)** — Trellis preserves the *insight* and generalizes the *specifics*, which DLP does not.
- **Distinct from anonymization for analytics** — Trellis's goal is to publish useful knowledge, not to release a statistical dataset.

## Sources

- [[trellis-product-requirements]]
- [[trellis-project-architecture]]
- [[trellis-design-guidelines]]
