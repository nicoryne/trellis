---
title: Cytoscape.js
type: entity
status: active
tags: [library, visualization, frontend]
sources: [trellis-project-architecture, trellis-product-requirements]
created: 2026-05-12
updated: 2026-05-12
---

# Cytoscape.js

JavaScript graph theory library for visualization and analysis. Chosen over D3 for the [[trellis|Trellis]] MVP because it has better out-of-the-box performance for 100+ nodes and a built-in force-directed layout.

## Key facts

- **Why chosen**: "Better performance than D3 for 100+ nodes; force-directed built-in." (see [[trellis-project-architecture]])
- **Used in**: personal graph view and team graph view; underlies the [[query-overlay-animation|query-overlay graph]].
- **Performance budget**: clean rendering at 100+ nodes (the demo seed will hit this), graceful degradation up to 500. Layout settles within 2 seconds of load.
- **Render style**: see [[node-color-coding]] for the strict palette rules and [[force-directed-graph]] for layout behavior.

## Component pattern

Per [[trellis-design-guidelines]], graph node visual is a 24px circle (32px when selected), fill by node type, 1px `border-default` at rest, `text-primary` on hover, `accent-primary` when selected, soft drop-shadow on hover. Label below node, `ui-xs` size, `text-secondary` color.

## Relations

- **Used by**: [[trellis]] (personal graph, team graph, query overlay)
- **Underlies**: [[query-overlay-animation]], [[force-directed-graph]], [[node-color-coding]]
- **Alternative considered**: D3 (rejected for performance at scale)

## Open questions

- WebGL renderer mode vs. canvas — not specified. Affects 500-node graceful-degradation behavior.

## Sources

- [[trellis-project-architecture]]
- [[trellis-product-requirements]]
