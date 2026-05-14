---
title: Node color coding
type: concept
status: active
tags: [design, color, trellis]
sources: [trellis-design-guidelines]
created: 2026-05-12
updated: 2026-05-12
---

# Node color coding

The palette assigned to each node type in [[trellis|Trellis]]'s graph views. Governed by a **strict rule**: no graph node color may overlap with the accent palette (orange `#fb8500`) or the semantic palette (success/warning/danger/info). This keeps **UI signals visually distinct from data**.

## Palette (per [[trellis-design-guidelines]] §2.5)

| Node Type | Hex | Visual |
|---|---|---|
| `insight` | `#9d4edd` | Purple — primary user-generated content type |
| `matter` | `#06d6a0` | Teal — case/matter container |
| `party` | `#ef476f` | Magenta — clients, opposing parties |
| `lawyer` | `#118ab2` | Steel blue — firm lawyers, opposing counsel |
| `judge` | `#073b4c` (with outline) | Deep slate with white outline — judicial figures |
| `witness` | `#ff9f1c` | Orange — expert and fact witnesses |
| `concept` | `#8338ec` | Violet — legal concepts, doctrines |
| `precedent` | `#3a86ff` | Sky blue — case law |
| `statute` | `#fb5607` | Vermillion — statutory authority |

## Edges

- At rest: neutral `#30363d` (`border-default`).
- On hover: brighten to `#7d8590` (`text-secondary`).
- **Cited edges during [[query-overlay-animation|query overlay]]**: illuminate to `accent-primary` (orange `#fb8500`). This is the **only** place an accent color appears in graph visualization — it signals "active cited path."

## The strict rule in plain terms

If a user sees orange in the graph, they should know it means *"this is part of the answer being cited right now."* Not *"this is a node type."* That separation is what makes the [[query-overlay-animation]] readable without legend.

## Implementation

Palette is implemented in `apps/web/src/lib/graphUtils.ts` as `NODE_COLORS` (a `Record<string, string>`). The hex values match [[trellis-design-guidelines]] §2.5 exactly. Edge defaults are also defined there: `EDGE_COLOR_DEFAULT = '#30363d'`, `EDGE_COLOR_HOVER = '#7d8590'`. Tokens are also pre-defined in `tokens.css` as `--node-insight`, `--node-matter`, etc., for direct use in [[cytoscape-js]] style sheets.

Note: `judge` uses `#073b4c` (deep slate) and is rendered **with a white outline** in the graph to maintain legibility against dark backgrounds.

**2026-05-14 palette revisions** (alongside the accent-color rebrand):

| Node type | Before | After | Reason |
|---|---|---|---|
| `witness` | `#ff9f1c` (orange) | `#ffd60a` (saffron) | Avoid overlap with the new orange accent `#fb8500` |
| `statute` | `#fb5607` (vermillion) | `#d62828` (crimson) | Same — vermillion was too close to the new accent |

The strict no-overlap rule did the work here: the two node colors closest to the new accent migrated to maintain the data-vs-UI-signal separation.

## Sources

- [[trellis-design-guidelines]]
- [[trellis-implementation-plan]]
