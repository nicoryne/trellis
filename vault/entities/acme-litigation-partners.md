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
- **Seed footprint**: **6 personal notes** for the Lawyer (idempotent — skips if notes already exist); 15–30 published insights in the team graph spanning judge tendencies, opposing counsel, motion practice, expert witnesses, settlement, procedure. (6 notes is within the spec'd 5–8 range.)
- **Seed content corpus**: **Philippine laws, articles, and previous cases** — so the team brain delivers useful answers from day one. (Matches [[adoption-strategy]] Pillar 2 — "pre-seeded with public legal knowledge.") (see [[demo-off-script-query-handling]])
- **Seed voice**: **conclusory with brief narrative justification, 2–3 sentences each**, in the voice of a senior partner dictating a quick note. A one-line conclusion followed by 1–2 sentences of justification or context — enough to make the [[redaction-pipeline|side-by-side diff]] visibly do generalization work. (see [[acme-seed-voice-tone]])
- **Backup query coverage**: seed designed so **2–3 additional queries beyond the canonical one** also produce strong cited answers, giving demo headroom for off-script judges. (see [[demo-off-script-query-handling]])

## Personal seed notes (implemented — `apps/web/src/lib/seedPersonal.ts`)

Six notes seeded into IndexedDB for the `litigator@acme.law` account on first login. All use PH litigation context:

| Title | Classification | Privileged | Key entities |
|---|---|---|---|
| Judge Reyes — cross-examination latitude on expert testimony | observation | No | Judge Reyes, expert witness cross-examination |
| Damages calculation cross — Garcia & Partners expert pattern | strategy | **Yes** | Garcia & Partners, Dr. Santos, DCF method, terminal growth rate |
| Motion practice — RTC Makati Branch 147 under Judge Soriano | observation | No | Judge Soriano, RTC Makati Branch 147, summary judgment |
| Lesson learned — Dela Cruz v. Multinational Corp timeline failure | lesson_learned | **Yes** | Dela Cruz v. Multinational Corp, Rivera v. Pacific Corp, deposition timeline strategy |
| Opposing counsel — Atty. Bautista (Tan & Reyes) patterns | observation | No | Atty. Bautista, Tan & Reyes, motions in limine |
| Settlement dynamics — commercial disputes above PHP 50M | strategy | **Yes** | settlement negotiation, summary judgment leverage |

The first and second notes directly support the canonical demo query about cross-examining expert witnesses on damages calculations.

## Why it exists

Without a populated firm, the [[hero-moments|retrieval moment]] fails. The seeded canonical query *"What has our firm learned about cross-examining expert witnesses on damages calculations?"* must produce a coherent cited response in under 10 seconds.

## Relations

- **Hosts**: [[litigator]], [[practice-group-lead]], [[knowledge-admin]]
- **Practice group**: Commercial Litigation (a single instance of the [[trellis-product-brief|target segment]])

## Open questions

- (none — seed voice and content corpus answered; see [[acme-seed-voice-tone]] and [[demo-off-script-query-handling]])

## Sources

- [[trellis-product-requirements]]
