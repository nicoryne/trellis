import { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import type Cytoscape from 'cytoscape';
import { useNoteStore } from '../../store/noteStore';
import {
  notesToCytoscapeElements,
  NODE_COLORS,
  EDGE_COLOR_DEFAULT,
  EDGE_COLOR_HOVER,
} from '../../lib/graphUtils';

// TODO: replace with useNavigate('/capture') once Gabe's App.tsx router is wired
const navigateToCapture = () => {
  console.warn('Router not wired yet — navigate to /capture manually');
};

const CYTOSCAPE_STYLE: Cytoscape.Stylesheet[] = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      label: 'data(label)',
      'font-size': '10px',
      'text-valign': 'bottom',
      'text-margin-y': 4,
      color: '#e6edf3',
      'text-wrap': 'wrap',
      'text-max-width': '80px',
      width: 24,
      height: 24,
    },
  },
  {
    selector: 'edge',
    style: {
      'line-color': EDGE_COLOR_DEFAULT,
      width: 1,
      'curve-style': 'bezier',
      opacity: 0.6,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 2,
      'border-color': '#d4a72c', // accent-primary
    },
  },
  {
    selector: 'edge:selected',
    style: { 'line-color': EDGE_COLOR_HOVER, opacity: 1 },
  },
];

export default function PersonalGraphView() {
  const { notes, loadNotes, setActiveNote } = useNoteStore();
  const [search, setSearch] = useState('');
  const cyRef = useRef<Cytoscape.Core | null>(null);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  const elements = notesToCytoscapeElements(notes);

  if (notes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-center" style={{ color: 'var(--text-secondary)' }}>
          Capture your first note to build your personal knowledge graph
        </p>
        <button
          onClick={navigateToCapture}
          className="px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#0d1117' }}
        >
          Capture a note
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div className="p-4 border-b shrink-0" style={{ borderColor: 'var(--border-muted)' }}>
        <input
          type="text"
          placeholder="Search your graph..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 rounded text-sm outline-none"
          style={{
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            caretColor: 'var(--accent-primary)',
          }}
        />
      </div>

      <div className="flex-1">
        <CytoscapeComponent
          elements={elements}
          layout={{ name: 'cose', animate: true, animationDuration: 500, randomize: false }}
          stylesheet={CYTOSCAPE_STYLE}
          style={{ width: '100%', height: '100%' }}
          cy={cy => {
            cyRef.current = cy;

            cy.on('tap', 'node', evt => {
              const node = evt.target as Cytoscape.NodeSingular;
              const noteId = node.data('noteId') as string | undefined;

              if (noteId) {
                setActiveNote(noteId);
                // TODO: navigate to /capture once router is wired
              } else {
                // Entity node: show 1-hop neighborhood, fade everything else
                const neighborhood = node.neighborhood().add(node);
                cy.elements().not(neighborhood).style({ opacity: 0.2 });
                neighborhood.style({ opacity: 1 });
              }
            });

            cy.on('tap', evt => {
              // Background tap: reset all opacities
              if (evt.target === cy) {
                cy.elements().style({ opacity: 1 });
              }
            });
          }}
        />
      </div>
    </div>
  );
}
