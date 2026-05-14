// apps/web/src/views/team/TeamGraphView.tsx
import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { useAuthStore } from '../../store/authStore';
import { fetchTeamGraph } from '../../api/teamGraph';
import type { TeamGraph } from '../../types/index';
import { NodeSummaryPanel } from './NodeSummaryPanel';
import './team.css';

const NODE_COLORS: Record<string, string> = {
  insight: '#9d4edd',
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ff9f1c',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#fb5607',
};

export function TeamGraphView() {
  const token = useAuthStore((s) => s.token);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [graph, setGraph] = useState<TeamGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch graph data
  useEffect(() => {
    if (!token) return;
    fetchTeamGraph(token).then((result) => {
      setLoading(false);
      if (result.error) { setError(result.error.message); return; }
      if (result.data) setGraph(result.data);
    });
  }, [token]);

  // Build Cytoscape instance
  useEffect(() => {
    if (!containerRef.current || !graph) return;

    const elements = [
      ...graph.nodes.map((n) => ({
        data: { id: n.id, label: n.title, nodeType: n.nodeType },
      })),
      ...graph.edges.map((e) => ({
        data: { id: e.id, source: e.sourceNodeId, target: e.targetNodeId, edgeType: e.edgeType },
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (el) => NODE_COLORS[el.data('nodeType')] ?? '#7d8590',
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
            'border-width': 0,
            // Obsidian-style glow
            'shadow-blur': 12,
            'shadow-color': (el) => NODE_COLORS[el.data('nodeType')] ?? '#7d8590',
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'shadow-opacity': 0.6,
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'node:active, node:grabbed',
          style: {
            width: 18,
            height: 18,
            'shadow-blur': 20,
            'shadow-opacity': 0.85,
            'background-opacity': 1,
          },
        },
        {
          selector: 'node:selected',
          style: {
            width: 20,
            height: 20,
            'border-color': '#d4a72c',
            'border-width': 2,
            'shadow-blur': 24,
            'shadow-opacity': 0.9,
            'background-opacity': 1,
            color: '#e6edf3',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 0.75,
            'line-color': '#21262d',
            'curve-style': 'bezier',
            opacity: 0.35,
            'overlay-opacity': 0,
          },
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
      layout: { name: 'cose', animate: true, animationDuration: 600, padding: 40 },
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });

    // Hover glow — Cytoscape uses canvas, CSS :hover doesn't apply
    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      node.style({
        width: 18,
        height: 18,
        'shadow-blur': 22,
        'shadow-opacity': 0.85,
        'background-opacity': 1,
        color: '#e6edf3',
      });
      node.connectedEdges().style({ opacity: 0.6, 'line-color': '#30363d', width: 1 });
    });

    cy.on('mouseout', 'node', (e) => {
      const node = e.target;
      if (!node.selected()) {
        node.style({
          width: 14,
          height: 14,
          'shadow-blur': 12,
          'shadow-opacity': 0.6,
          'background-opacity': 0.9,
          color: '#8b949e',
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

    cyRef.current = cy;
    return () => { cy.destroy(); cyRef.current = null; };
  }, [graph]);

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
      </div>

      <NodeSummaryPanel
        nodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}
