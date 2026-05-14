import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useNoteStore } from '../../store/noteStore';
import {
  notesToCytoscapeElements,
  EDGE_COLOR_HOVER,
} from '../../lib/graphUtils';
import { createPhysicsRunner, type PhysicsRunner } from '../../lib/graphPhysics';
import { Logo } from '../../components/Logo';
import { GraphZoomControl } from '../../components/GraphZoomControl';

if (!(cytoscape as any).__fcoseRegistered) {
  cytoscape.use(fcose);
  (cytoscape as any).__fcoseRegistered = true;
}

const LABEL_ZOOM_THRESHOLD = 0.75;

export default function PersonalGraphView() {
  const { notes, loadNotes, setActiveNote } = useNoteStore();
  const [search, setSearch] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const baseZoomRef = useRef<number>(1);
  const physicsRef = useRef<PhysicsRunner | null>(null);
  const pinnedRef = useRef<Set<string>>(new Set());
  const searchRef = useRef('');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep searchRef in sync so event handlers can read current filter
  useEffect(() => { searchRef.current = search; }, [search]);

  const elements = useMemo(() => notesToCytoscapeElements(notes), [notes]);

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
    if (!containerRef.current || elements.length === 0) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 0.9,
            label: 'data(label)',
            'font-size': 11,
            'font-family': 'Inter, system-ui, sans-serif',
            'font-weight': 400,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            color: '#8b949e',
            'text-wrap': 'ellipsis',
            'text-max-width': '100px',
            'text-outline-color': '#0d1117',
            'text-outline-width': 2,
            'text-outline-opacity': 0.8,
            'text-opacity': 1,
            width: 14,
            height: 14,
            'border-width': 0,
            'shadow-blur': 12,
            'shadow-color': 'data(color)',
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'shadow-opacity': 0.6,
            'overlay-opacity': 0,
            'transition-property': 'text-opacity',
            'transition-duration': 180,
          } as any,
        },
        {
          selector: 'node[?isHub]',
          style: {
            shape: 'diamond',
            width: 22,
            height: 22,
            'background-opacity': 0.4,
            'shadow-opacity': 0.3,
            'shadow-blur': 8,
            'font-size': 10,
            'font-weight': 500,
            color: '#484f58',
          } as any,
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 2,
            'border-color': '#fb8500',
            'shadow-blur': 24,
            'shadow-opacity': 0.9,
            'background-opacity': 1,
            color: '#e6edf3',
          } as any,
        },
        {
          selector: 'edge',
          style: {
            'line-color': '#21262d',
            width: 0.75,
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
          selector: 'edge[edgeType="about"]',
          style: {
            'line-style': 'dotted',
            'line-color': '#21262d',
            width: 0.4,
            opacity: 0.15,
          } as any,
        },
        {
          selector: 'edge[edgeType="linked_to"]',
          style: {
            'line-style': 'solid',
            'line-color': '#9d4edd',
            width: 1.2,
            opacity: 0.7,
          } as any,
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': EDGE_COLOR_HOVER,
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
        if (n.data('isHub')) return;
        const r = 6 + (n.degree() / maxDeg) * 12;
        n.style({ width: r * 2, height: r * 2 });
      });

      // Obsidian-style force simulation: settles to equilibrium, pauses at rest
      physicsRef.current = createPhysicsRunner(cy, (id) => pinnedRef.current.has(id));
      physicsRef.current.start();
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
      // Inject drag momentum and wake the simulation
      physicsRef.current?.setNodeVelocity(id, dragVX * 0.35, dragVY * 0.35);
      pinnedRef.current.delete(id);
      dragLastPos = null; dragVX = 0; dragVY = 0;
    });

    // Hover: spotlight neighborhood, dim everything else to ~15%
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
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

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      node.removeClass('cy-hover');

      // Remove hover bypasses, letting stylesheet rules take back over
      cy.nodes().removeStyle('opacity');
      cy.edges().removeStyle('opacity line-color width');

      // Re-apply active search filter
      const q = searchRef.current.trim().toLowerCase();
      if (q) {
        cy.nodes().forEach(n => {
          n.style({ opacity: (n.data('label') as string).toLowerCase().includes(q) ? 1 : 0.2 });
        });
        cy.edges().style({ opacity: 0.15 });
      }

      if (!node.selected()) {
        node.removeStyle('shadow-blur shadow-opacity background-opacity color');
      }

      refreshLabelVisibility();
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const noteId = node.data('noteId') as string | undefined;
      if (noteId) {
        setActiveNote(noteId);
        navigate('/capture');
      } else {
        const neighborhood = node.neighborhood().add(node);
        cy.elements().not(neighborhood).style({ opacity: 0.2 });
        neighborhood.style({ opacity: 1 });
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().style({ opacity: 1 });
      }
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
      physicsRef.current?.stop();
      physicsRef.current = null;
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, setActiveNote, navigate, refreshLabelVisibility]);

  // Search filter
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (!search.trim()) {
      cy.elements().style({ opacity: 1 });
      return;
    }
    const q = search.toLowerCase();
    cy.nodes().forEach((node) => {
      node.style({
        opacity: (node.data('label') as string).toLowerCase().includes(q) ? 1 : 0.2,
      });
    });
    cy.edges().style({ opacity: 0.15 });
  }, [search]);

  if (notes.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state-logo">
          <Logo size={64} />
        </div>
        <span className="empty-state-title">Your personal graph is empty</span>
        <span className="empty-state-desc">
          Capture your first note to build your personal knowledge graph. Each note creates connected nodes automatically.
        </span>
        <button onClick={() => navigate('/capture')} className="btn btn--primary">
          Capture a note
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
      <div className="graph-toolbar">
        <div className="graph-search-wrapper">
          <Search size={14} className="graph-search-icon" />
          <input
            type="text"
            placeholder="Search your graph..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="graph-search"
          />
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <GraphZoomControl
          zoomPercent={zoomPercent}
          onChange={handleZoomChange}
          onReset={handleZoomReset}
        />
      </div>
    </div>
  );
}
