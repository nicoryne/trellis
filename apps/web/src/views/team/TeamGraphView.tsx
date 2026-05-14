// apps/web/src/views/team/TeamGraphView.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useAuthStore } from '../../store/authStore';
import { fetchTeamGraph } from '../../api/teamGraph';
import type { TeamGraph } from '../../types/index';
import { NodeSummaryPanel } from './NodeSummaryPanel';
import { GraphZoomControl } from '../../components/GraphZoomControl';
import './team.css';

if (!(cytoscape as any).__fcoseRegistered) {
  cytoscape.use(fcose);
  (cytoscape as any).__fcoseRegistered = true;
}

const LABEL_ZOOM_THRESHOLD = 0.75;

const NODE_COLORS: Record<string, string> = {
  insight: '#9d4edd',
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ffd60a',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#d62828',
};

export function TeamGraphView() {
  const token = useAuthStore((s) => s.token);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const baseZoomRef = useRef<number>(1);
  const simRafRef = useRef<number>(0);
  const velRef = useRef<Map<string, [number, number]>>(new Map());
  const pinnedRef = useRef<Set<string>>(new Set());
  const searchRef = useRef('');

  const [graph, setGraph] = useState<TeamGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);

  useEffect(() => {
    if (!token) return;
    fetchTeamGraph(token).then((result) => {
      setLoading(false);
      if (result.error) { setError(result.error.message); return; }
      if (result.data) setGraph(result.data);
    });
  }, [token]);

  // Keep searchRef in sync so event handlers can read current filter
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);

  const refreshLabelVisibility = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const base = baseZoomRef.current || 1;
    const showAll = cy.zoom() / base >= LABEL_ZOOM_THRESHOLD;
    cy.nodes().forEach((n) => {
      const forced = n.hasClass('cy-hover') || n.selected();
      n.style('text-opacity', forced || showAll ? 1 : 0);
    });
  }, []);

  const applyZoomPercent = useCallback((pct: number) => {
    const cy = cyRef.current;
    if (!cy) return;
    const base = baseZoomRef.current || 1;
    cy.zoom({
      level: base * (pct / 100),
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  }, []);

  const handleZoomChange = useCallback((pct: number) => {
    setZoomPercent(pct);
    applyZoomPercent(pct);
  }, [applyZoomPercent]);

  const handleZoomReset = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(undefined, 60);
    baseZoomRef.current = cy.zoom();
    setZoomPercent(100);
    refreshLabelVisibility();
  }, [refreshLabelVisibility]);

  useEffect(() => {
    if (!containerRef.current || !graph) return;

    const elements = [
      ...graph.nodes.map((n: any) => ({
        data: { id: n.id, label: n.title, nodeType: n.nodeType ?? n.node_type },
      })),
      ...graph.edges.map((e: any) => ({
        data: {
          id: e.id,
          source: e.sourceNodeId ?? e.source_node_id,
          target: e.targetNodeId ?? e.target_node_id,
          edgeType: e.edgeType ?? e.edge_type,
        },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (el: cytoscape.NodeSingular) => NODE_COLORS[el.data('nodeType')] ?? '#7d8590',
            'background-opacity': 0.9,
            width: 14,
            height: 14,
            label: 'data(label)',
            'font-size': 11,
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 400,
            color: '#8b949e',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            'text-max-width': '120px',
            'text-wrap': 'ellipsis',
            'text-outline-color': '#0d1117',
            'text-outline-width': 2,
            'text-outline-opacity': 0.8,
            'text-opacity': 1,
            'border-width': 0,
            'shadow-blur': 12,
            'shadow-color': (el: cytoscape.NodeSingular) => NODE_COLORS[el.data('nodeType')] ?? '#7d8590',
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'shadow-opacity': 0.6,
            'overlay-opacity': 0,
            'transition-property': 'text-opacity',
            'transition-duration': 180,
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#fb8500',
            'border-width': 2,
            'shadow-blur': 24,
            'shadow-opacity': 0.9,
            'background-opacity': 1,
            color: '#e6edf3',
          } as any,
        },
        {
          selector: 'edge',
          style: {
            width: 0.75,
            'line-color': '#21262d',
            'curve-style': 'bezier',
            opacity: 0.35,
            'overlay-opacity': 0,
          } as any,
        },
        {
          selector: 'edge[edgeType="related_to"]',
          style: {
            'line-style': 'dashed',
            'line-color': '#30363d',
            'line-dash-pattern': [4, 3],
            width: 0.5,
            opacity: 0.25,
          } as any,
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#7d8590',
            opacity: 0.8,
            width: 1.5,
          },
        },
      ],
      layout: { name: 'preset' },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      wheelSensitivity: 0.25,
    });

    cyRef.current = cy;

    const layout = cy.layout({
      name: 'fcose',
      quality: 'default',
      randomize: true,
      animate: false,
      fit: true,
      padding: 60,
      nodeDimensionsIncludeLabels: false,
      gravity: 0.35,
      gravityRange: 3.8,
      gravityCompound: 1.0,
      gravityRangeCompound: 1.5,
      idealEdgeLength: 75,
      nodeRepulsion: 4500,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 8,
      tilingPaddingHorizontal: 8,
      packComponents: true,
    } as any);
    layout.run();

    const onLayoutStop = () => {
      cy.fit(undefined, 60);
      const base = cy.zoom();
      baseZoomRef.current = base;
      cy.minZoom(base * 0.2);
      cy.maxZoom(base * 1.5);
      setZoomPercent(100);
      refreshLabelVisibility();

      // Degree-scaled radius: leaf nodes 6px, most-connected 18px
      const maxDeg = cy.nodes().reduce((m, n) => Math.max(m, n.degree()), 0) || 1;
      cy.nodes().forEach(n => {
        const r = 6 + (n.degree() / maxDeg) * 12;
        n.style({ width: r * 2, height: r * 2 });
      });

      // Init velocities
      cy.nodes().forEach(n => { velRef.current.set(n.id(), [0, 0]); });

      const vel = velRef.current;
      const pinned = pinnedRef.current;

      // Continuous breathing simulation — four forces per node per frame
      const tick = (time: number) => {
        const cxP = cy.width() / 2;
        const cyP = cy.height() / 2;

        const allPos = new Map<string, { x: number; y: number }>();
        cy.nodes().forEach(n => { allPos.set(n.id(), { ...n.position() }); });

        cy.batch(() => {
          cy.nodes().forEach(n => {
            const id = n.id();
            if (pinned.has(id)) return;

            const pos = allPos.get(id)!;
            let fx = 0, fy = 0;

            // 1. Center pull
            fx += (cxP - pos.x) * 0.0004;
            fy += (cyP - pos.y) * 0.0004;

            // 2. Breathing — unique sinusoidal phase per node
            const seed = id.split('').reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0) * 0.037;
            fx += Math.sin(time * 0.00065 + seed) * 0.022;
            fy += Math.cos(time * 0.00083 + seed * 1.37) * 0.022;

            // 3. Mutual repulsion
            cy.nodes().forEach(m => {
              const mid = m.id();
              if (mid === id) return;
              const mp = allPos.get(mid);
              if (!mp) return;
              const dx = pos.x - mp.x, dy = pos.y - mp.y;
              const d2 = Math.max(dx * dx + dy * dy, 4);
              const d = Math.sqrt(d2);
              fx += (dx / d) * (450 / d2);
              fy += (dy / d) * (450 / d2);
            });

            // 4. Edge springs — preferred rest length 75px
            n.connectedEdges().forEach(e => {
              const other = e.source().id() === id ? e.target() : e.source();
              const op = allPos.get(other.id());
              if (!op) return;
              const dx = op.x - pos.x, dy = op.y - pos.y;
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              const stretch = (d - 75) * 0.015;
              fx += (dx / d) * stretch;
              fy += (dy / d) * stretch;
            });

            const v = vel.get(id) ?? [0, 0];
            let vx = v[0] * 0.88 + fx;
            let vy = v[1] * 0.88 + fy;
            const spd = Math.sqrt(vx * vx + vy * vy);
            if (spd > 0.65) { vx = (vx / spd) * 0.65; vy = (vy / spd) * 0.65; }
            vel.set(id, [vx, vy]);
            n.position({ x: pos.x + vx, y: pos.y + vy });
          });
        });

        simRafRef.current = requestAnimationFrame(tick);
      };

      simRafRef.current = requestAnimationFrame(tick);
    };
    cy.one('layoutstop', onLayoutStop);

    // Elastic drag — pin node during grab, release with momentum
    let dragLastPos: { x: number; y: number } | null = null;
    let dragLastTime = 0;
    let dragVX = 0, dragVY = 0;

    cy.on('grabon', 'node', (e) => {
      pinnedRef.current.add(e.target.id());
      dragLastPos = { ...e.target.position() };
      dragLastTime = performance.now();
      dragVX = 0; dragVY = 0;
    });

    cy.on('drag', 'node', (e) => {
      const now = performance.now();
      const pos = e.target.position();
      if (dragLastPos) {
        const dt = Math.max(now - dragLastTime, 1);
        dragVX = (pos.x - dragLastPos.x) / dt * 16;
        dragVY = (pos.y - dragLastPos.y) / dt * 16;
      }
      dragLastPos = { ...pos };
      dragLastTime = now;
    });

    cy.on('free', 'node', (e) => {
      const id = e.target.id();
      velRef.current.set(id, [dragVX * 0.35, dragVY * 0.35]);
      pinnedRef.current.delete(id);
      dragLastPos = null; dragVX = 0; dragVY = 0;
    });

    // Hover: spotlight neighborhood, dim everything else to ~15%
    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      node.addClass('cy-hover');
      const nbNodes = node.neighborhood().nodes();
      const nbEdges = node.neighborhood().edges();

      cy.nodes().not(node).not(nbNodes).style({ opacity: 0.15 });
      cy.edges().not(nbEdges).style({ opacity: 0.06 });

      node.style({
        'shadow-blur': 26,
        'shadow-opacity': 0.95,
        'background-opacity': 1,
        color: '#e6edf3',
        'text-opacity': 1,
      });
      nbNodes.style({ opacity: 0.85 });
      nbEdges.style({ opacity: 0.8, 'line-color': '#fb8500', width: 1.5 });
    });

    cy.on('mouseout', 'node', (e) => {
      const node = e.target;
      node.removeClass('cy-hover');

      // Remove hover bypasses, letting stylesheet rules take back over
      cy.nodes().removeStyle('opacity');
      cy.edges().removeStyle('opacity line-color width');

      // Re-apply active search filter
      const q = searchRef.current.trim().toLowerCase();
      if (q) {
        cy.nodes().forEach(n => {
          n.style({ opacity: n.data('label')?.toLowerCase().includes(q) ? 1 : 0.15 });
        });
      }

      if (!node.selected()) {
        node.removeStyle('shadow-blur shadow-opacity background-opacity color');
      }

      refreshLabelVisibility();
    });

    cy.on('tap', 'node', (e) => {
      setSelectedNodeId(e.target.id());
    });

    cy.on('tap', (e) => {
      if (e.target === cy) setSelectedNodeId(null);
    });

    cy.on('zoom', () => {
      const base = baseZoomRef.current || 1;
      const pct = Math.round((cy.zoom() / base) * 100);
      const clamped = Math.max(20, Math.min(150, pct));
      setZoomPercent((prev) => (Math.abs(clamped - prev) >= 1 ? clamped : prev));
      refreshLabelVisibility();
    });

    return () => {
      layout.stop();
      cancelAnimationFrame(simRafRef.current);
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, refreshLabelVisibility]);

  // Search filter
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!searchQuery.trim()) {
      cy.nodes().style({ opacity: 1 });
      return;
    }

    const q = searchQuery.toLowerCase();
    cy.nodes().forEach((node) => {
      const matches = node.data('label')?.toLowerCase().includes(q);
      node.style({ opacity: matches ? 1 : 0.15 });
    });
  }, [searchQuery]);

  if (error) {
    return (
      <div className="team-graph-root">
        <div className="team-graph-empty">
          <span>Couldn't load. Retry.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="team-graph-root">
      <div className="team-graph-toolbar">
        <input
          className="team-graph-search"
          type="search"
          placeholder="Filter nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Filter team graph nodes"
        />
      </div>

      <div className="team-graph-canvas">
        {loading && (
          <div className="team-graph-empty">
            <span>Loading team knowledge graph...</span>
          </div>
        )}
        {!loading && graph?.nodes.length === 0 && (
          <div className="team-graph-empty">
            <span>No published insights yet. Be the first to publish.</span>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {!loading && graph && graph.nodes.length > 0 && (
          <GraphZoomControl
            zoomPercent={zoomPercent}
            onChange={handleZoomChange}
            onReset={handleZoomReset}
          />
        )}
      </div>

      <NodeSummaryPanel
        nodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}
