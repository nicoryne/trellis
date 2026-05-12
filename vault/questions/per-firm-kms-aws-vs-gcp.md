---
title: Per-firm KMS — AWS KMS or GCP KMS?
type: question
status: open
tags: [v1, security, infrastructure]
sources: [trellis-project-architecture]
raised-on: [trellis-project-architecture, trellis-tech-stack]
created: 2026-05-12
updated: 2026-05-12
---

# Per-firm KMS — AWS KMS or GCP KMS?

## Status

**Open** — awaiting Keith's answer.

## Why it matters

V1 ships **per-firm single-tenant** deployments with **per-firm encryption keys via cloud KMS**. The V1 stack table lists both AWS KMS and GCP KMS as options. The choice cascades into deployment topology, customer security review answers, and the operational runbook for key rotation. (see [[trellis-project-architecture]] §2.6 and §6.2)

## What we know so far

- V1 deploys per-firm single-tenant.
- Per-firm encryption keys are required.
- AWS KMS and GCP KMS both listed as viable.
- Trellis is already on GCP for [[gemini]] usage, which is a soft lean toward GCP.

## What would resolve it

- A pick (with rationale: cost, customer preference, operational fit) — or a deliberate "per-firm-choice" stance where each firm picks based on their cloud footprint.

## Answer

_(pending)_

## Related

- [[trellis-tech-stack]]
- [[trellis-project-architecture]]
