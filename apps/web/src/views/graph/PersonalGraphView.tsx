import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useNoteStore } from '../../store/noteStore';
import {
  notesToCytoscapeElements,
  NODE_COLORS,
  EDGE_COLOR_HOVER,
} from '../../lib/graphUtils';
import { Logo } from '../../components/Logo';
import { GraphZoomControl } from '../../components/GraphZoomControl';

// Register fcose (idempotent — guarded so it doesn't re-register in HMR)
if (!(cytoscape as any).__fcoseRegistered) {
  cytoscape.use(fcose);
  (cytoscape as any).__fcoseRegistered = true;
}

const LABEL_ZOOM_THRESHOLD = 0.75; // Show all labels at >=75% of base zoom

export default function PersonalGraphView() {
  const { notes, loadNotes, setActiveNote } = useNoteStore();
  const [search, setSearch] = useState('');
  const [zoomPercent, setZoomPercent] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const baseZoomRef = useRef<number>(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable Zustand action, run once
  }, []);

  const elements = useMemo(() => notesToCytoscapeElements(notes), [notes]);

  // Re-evaluate which labels should be visible given current zoom.
  // Hovered & selected nodes always show their label.
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

  // Slider → cy zoom. Keeps the viewport centered on the current center.
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

  // Build Cytoscape instance with fcose gravity layout
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
        // Phase 2: Classification hub nodes — larger, diamond, muted
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
            'text-transform': 'uppercase',
            color: '#484f58',
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

    // fcose: settles all nodes (connected or not) into one gravity well with proper spacing.
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
      // Gravity — pulls all nodes (incl. disconnected) toward the center
      gravity: 0.35,
      gravityRange: 3.8,
      gravityCompound: 1.0,
      gravityRangeCompound: 1.5,
      // Spring + repulsion — tuned for tight-but-readable clusters
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

    // After layout completes: capture base zoom and configure min/max + label visibility
    const onLayoutStop = () => {
      cy.fit(undefined, 60);
      const base = cy.zoom();
      baseZoomRef.current = base;
      // Hard clamp cy zoom to the slider range so wheel-zoom can't escape it.
      cy.minZoom(base * 0.2);
      cy.maxZoom(base * 1.5);
      setZoomPercent(100);
      refreshLabelVisibility();
    };
    cy.one('layoutstop', onLayoutStop);

    // Hover: show full styling + always show this node's label
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
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

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
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

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const noteId = node.data('noteId') as string | undefined;
      if (noteId) {
        setActiveNote(noteId);
        navigate('/capture');
      } else {
        // Entity node: highlight 1-hop neighborhood
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

    // Sync cy zoom → slider state
    const onZoom = () => {
      const base = baseZoomRef.current || 1;
      const pct = Math.round((cy.zoom() / base) * 100);
      const clamped = Math.max(20, Math.min(150, pct));
      // Functional update with a small dead-zone to break the slider→cy→slider loop
      setZoomPercent((prev) => (Math.abs(clamped - prev) >= 1 ? clamped : prev));
      refreshLabelVisibility();
    };
    cy.on('zoom', onZoom);

    return () => {
      layout.stop();
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
