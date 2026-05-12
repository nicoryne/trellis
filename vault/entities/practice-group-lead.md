---
title: Practice Group Lead (persona)
type: entity
status: active
tags: [persona, user, trellis]
sources: [trellis-product-requirements, trellis-product-brief]
created: 2026-05-12
updated: 2026-05-12
---

# Practice Group Lead (persona)

A partner leading the litigation practice group. The **validator** persona for [[trellis]] — cares about team productivity, associate development, knowledge retention, and competitive differentiation in the firm's litigation offering.

## Key facts

- **Cares about**: team productivity, associate development, knowledge retention, competitive differentiation. (see [[trellis-product-brief]])
- **V1 power**: approves what becomes "firm-endorsed" knowledge; can flag insights for promotion.
- **MVP power**: role exists in the data model but has the **same permissions as [[litigator|Lawyer]]** — no admin dashboard. (see [[trellis-product-requirements]])
- **MVP demo account**: `lead@acme.law` / `demo` at [[acme-litigation-partners]].

## Why this persona exists in the brief but not the demo

The brief and PRD list the Practice Group Lead among the three demo accounts to make the **role model legible** to judges and to fix the data shape. In MVP the role does not exercise distinct UI; the demo does not meaningfully switch to this account.

> ⚠ Demo risk: judges might ask "what does the Lead actually see?" The honest answer is "the same as the Lawyer in MVP, with promotion and approval surfaces shipping in V1." Rehearse this answer.

## Relations

- **Manages**: [[litigator]]
- **Coordinates with**: [[knowledge-admin]] (V1 approval workflow)
- **Role contrast**: [[litigator]] (user), [[knowledge-admin]] (governor)

## Open questions

- "Flag for promotion" (V1) — what does the surface look like? Not designed.

## Sources

- [[trellis-product-requirements]]
- [[trellis-product-brief]]
