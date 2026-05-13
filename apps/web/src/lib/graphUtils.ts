// Node colors from design-guidelines.md §2.5 — do not change without updating the spec
import type { PersonalNote } from '../types/index';

export const NODE_COLORS: Record<string, string> = {
  insight: '#9d4edd',   // personal notes are "insights" — purple
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ff9f1c',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#fb5607',
};

export const EDGE_COLOR_DEFAULT = '#30363d';
export const EDGE_COLOR_HOVER = '#7d8590';

export interface CytoscapeNodeData {
  id: string;
  label: string;
  type: string;
  color: string;
  noteId?: string;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
}

export type CytoscapeElement =
  | { data: CytoscapeNodeData }
  | { data: CytoscapeEdgeData };

export function notesToCytoscapeElements(notes: PersonalNote[]): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];
  const seenEntities = new Set<string>(); // "type:name" dedup key

  for (const note of notes) {
    elements.push({
      data: {
        id: note.id,
        label: note.title || 'Untitled',
        type: 'insight',
        color: NODE_COLORS['insight'],
        noteId: note.id,
      },
    });

    for (const entity of note.extractedEntities) {
      const dedupeKey = `${entity.type}:${entity.name}`;
      const entityNodeId = `entity-${dedupeKey}`;

      if (!seenEntities.has(dedupeKey)) {
        seenEntities.add(dedupeKey);
        elements.push({
          data: {
            id: entityNodeId,
            label: entity.name,
            type: entity.type,
            color: NODE_COLORS[entity.type] ?? '#7d8590',
          },
        });
      }

      elements.push({
        data: {
          id: `edge-${note.id}-${entityNodeId}`,
          source: note.id,
          target: entityNodeId,
        },
      });
    }
  }

  return elements;
}
