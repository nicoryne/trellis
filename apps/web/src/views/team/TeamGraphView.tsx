// apps/web/src/views/team/TeamGraphView.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape, { Core } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useAuthStore } from '../../store/authStore';
import { fetchTeamGraph } from '../../api/teamGraph';
import type { TeamGraph } from '../../types/index';
import { NodeSummaryPanel } from './NodeSummaryPanel';
import { GraphZoomControl } from '../../components/GraphZoomControl';
import './team.css';

// Register fcose once
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

  const [graph, setGraph] = useState<TeamGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);

  // Fetch graph data
  useEffect(() => {
    if (!token) return;
    fetchTeamGraph(token).then((result) => {
      setLoading(false);
      if (result.error) { setError(result.error.message); return; }
      if (result.data) setGraph(result.data);
    });
  }, [token]);

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
    const target = base * (pct / 100);
    cy.zoom({
      level: target,
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

  // Build Cytoscape instance
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
          selector: 'node:active, node:grabbed',
          style: {
            width: 18,
            height: 18,
            'shadow-blur': 20,
            'shadow-opacity': 0.85,
            'background-opacity': 1,
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            width: 20,
            height: 20,
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

    // fcose with gravity — all nodes pull toward a common center
    const layout = cy.layout({
      name: 'fcose',
      quality: 'default',
      randomize: true,
      animate: true,
      animationDuration: 900,
      animationEasing: 'ease-out',
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
    };
    cy.one('layoutstop', onLayoutStop);

    // Hover: show full styling + always show this node's label
    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      node.addClass('cy-hover');
      node.style({
        width: 18,
        height: 18,
        'shadow-blur': 22,
        'shadow-opacity': 0.85,
        'background-opacity': 1,
        color: '#e6edf3',
        'text-opacity': 1,
      });
      node.connectedEdges().style({ opacity: 0.6, 'line-color': '#30363d', width: 1 });
    });

    cy.on('mouseout', 'node', (e) => {
      const node = e.target;
      node.removeClass('cy-hover');
      if (!node.selected()) {
        const base = baseZoomRef.current || 1;
        const showLabel = cy.zoom() / base >= LABEL_ZOOM_THRESHOLD;
        node.style({
          width: 14,
          height: 14,
          'shadow-blur': 12,
          'shadow-opacity': 0.6,
          'background-opacity': 0.9,
          color: '#8b949e',
          'text-opacity': showLabel ? 1 : 0,
        });
        node.connectedEdges().style({ opacity: 0.35, 'line-color': '#21262d', width: 0.75 });
      }
    });

    cy.on('tap', 'node', (e) => {
      setSelectedNodeId(e.target.id());
    });

    cy.on('tap', (e) => {
      if (e.target === cy) setSelectedNodeId(null);
    });

    // Sync cy zoom → slider state
    cy.on('zoom', () => {
      const base = baseZoomRef.current || 1;
      const pct = Math.round((cy.zoom() / base) * 100);
      const clamped = Math.max(20, Math.min(150, pct));
      setZoomPercent((prev) => (Math.abs(clamped - prev) >= 1 ? clamped : prev));
      refreshLabelVisibility();
    });

    return () => {
      layout.stop();
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
