import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import { useNoteStore } from '../../store/noteStore';
import {
  notesToCytoscapeElements,
  NODE_COLORS,
  EDGE_COLOR_HOVER,
} from '../../lib/graphUtils';

// Register cola layout extension (idempotent)
cytoscape.use(cola);

export default function PersonalGraphView() {
  const { notes, loadNotes, setActiveNote } = useNoteStore();
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const layoutRef = useRef<cytoscape.Layouts | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadNotes is a stable Zustand action, intentionally run once on mount
  }, []);

  const elements = useMemo(() => notesToCytoscapeElements(notes), [notes]);

  // Build Cytoscape instance with cola physics
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
            width: 14,
            height: 14,
            'border-width': 0,
            // Obsidian-style glow
            'shadow-blur': 12,
            'shadow-color': 'data(color)',
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
            'shadow-opacity': 0.6,
            'overlay-opacity': 0,
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
            'border-color': '#d4a72c',
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
    });

    // Run continuous cola force-directed layout (Obsidian-style live physics)
    const layout = cy.layout({
      name: 'cola',
      infinite: true,
      fit: false,
      animate: true,
      randomize: true,
      maxSimulationTime: 0,
      ungrabifyWhileSimulating: false,
      nodeSpacing: 25,
      edgeLength: 120,
      padding: 40,
    } as any);
    layout.run();
    layoutRef.current = layout;

    // Hover glow
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
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

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
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

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const noteId = node.data('noteId') as string | undefined;

      if (noteId) {
        setActiveNote(noteId);
        navigate('/capture');
      } else {
        // Entity node: show 1-hop neighborhood, fade everything else
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

    // Fit after initial positions settle
    setTimeout(() => cy.fit(undefined, 60), 1500);

    cyRef.current = cy;
    return () => { layout.stop(); cy.destroy(); cyRef.current = null; layoutRef.current = null; };
  }, [elements, setActiveNote, navigate]);

  // Search filter
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    if (!search.trim()) {
      cy.elements().style({ opacity: 1 });
      return;
    }
    const q = search.toLowerCase();
    cy.nodes().forEach(node => {
      node.style({ opacity: (node.data('label') as string).toLowerCase().includes(q) ? 1 : 0.2 });
    });
    cy.edges().style({ opacity: 0.15 });
  }, [search]);

  if (notes.length === 0) {
    return (
      <div className="empty-state" style={{ height: '100%' }}>
        <div className="empty-state-icon">
          <Network size={28} />
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
            onChange={e => setSearch(e.target.value)}
            className="graph-search"
          />
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}
