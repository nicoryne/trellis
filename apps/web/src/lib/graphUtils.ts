// Node colors from design-guidelines.md §2.5 — do not change without updating the spec
import type { PersonalNote } from '../types/index';

export const NODE_COLORS: Record<string, string> = {
  insight: '#9d4edd',   // personal notes are "insights" — purple
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ffd60a',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#d62828',
  // Phase 2: Classification hub node colors (muted variants to not overpower data nodes)
  classification: '#484f58',
};

// Classification label display names
const CLASSIFICATION_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  observation: 'Observation',
  lesson_learned: 'Lesson Learned',
  action_item: 'Action Item',
  research: 'Research',
  meeting_summary: 'Meeting Summary',
};

export const EDGE_COLOR_DEFAULT = '#30363d';
export const EDGE_COLOR_HOVER = '#7d8590';

export interface CytoscapeNodeData {
  id: string;
  label: string;
  type: string;
  color: string;
  noteId?: string;
  isHub?: boolean; // Phase 2: classification hub nodes are rendered larger
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  edgeType?: string;
}

export type CytoscapeElement =
  | { data: CytoscapeNodeData }
  | { data: CytoscapeEdgeData };

/**
 * Convert personal notes into Cytoscape elements with Obsidian-style connections:
 *   - Note (insight) nodes
 *   - Entity nodes (deduped by type:name)
 *   - Note → Entity edges (mentions)
 *   - Phase 1: Note ↔ Note edges (shared entities — 2+ shared = related_to)
 *   - Phase 2: Classification hub nodes + edges (about)
 *   - Phase 4: Entity ↔ Entity edges (co-occurrence — 2+ notes = related_to)
 */
export function notesToCytoscapeElements(notes: PersonalNote[]): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];
  const seenEntities = new Set<string>(); // "type:name" dedup key
  const classificationNotes = new Map<string, string[]>(); // classification → noteIds[]

  // Track which entities each note mentions for Phase 1 + 4
  const noteEntities = new Map<string, Set<string>>(); // noteId → Set<entityNodeId>
  const entityNotes = new Map<string, Set<string>>();   // entityNodeId → Set<noteId>

  // Pass 1: Create note and entity nodes + mention edges
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

    // Track classification for Phase 2
    const cls = note.classification;
    if (cls) {
      if (!classificationNotes.has(cls)) classificationNotes.set(cls, []);
      classificationNotes.get(cls)!.push(note.id);
    }

    const entityIds = new Set<string>();

    for (const entity of note.extractedEntities) {
      const dedupeKey = `${entity.type}:${entity.name}`;
      const entityNodeId = `entity-${dedupeKey}`;

      entityIds.add(entityNodeId);

      // Track reverse mapping for Phase 4
      if (!entityNotes.has(entityNodeId)) entityNotes.set(entityNodeId, new Set());
      entityNotes.get(entityNodeId)!.add(note.id);

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
          edgeType: 'mentions',
        },
      });
    }

    noteEntities.set(note.id, entityIds);
  }

  // Phase 1: Create note ↔ note edges for insights sharing 2+ entities
  const noteIds = notes.map(n => n.id);
  const addedRelatedEdges = new Set<string>();

  for (let i = 0; i < noteIds.length; i++) {
    for (let j = i + 1; j < noteIds.length; j++) {
      const a = noteIds[i];
      const b = noteIds[j];
      const entitiesA = noteEntities.get(a) ?? new Set();
      const entitiesB = noteEntities.get(b) ?? new Set();

      // Count shared entities
      let shared = 0;
      for (const e of entitiesA) {
        if (entitiesB.has(e)) shared++;
      }

      if (shared >= 2) {
        const edgeKey = `${a}-${b}`;
        if (!addedRelatedEdges.has(edgeKey)) {
          addedRelatedEdges.add(edgeKey);
          elements.push({
            data: {
              id: `related-${a}-${b}`,
              source: a,
              target: b,
              edgeType: 'related_to',
            },
          });
        }
      }
    }
  }

  // Phase 2: Classification hub nodes
  for (const [cls, noteIdList] of classificationNotes.entries()) {
    if (noteIdList.length < 1) continue; // Only show hubs with at least 1 note

    const hubId = `hub-${cls}`;
    elements.push({
      data: {
        id: hubId,
        label: CLASSIFICATION_LABELS[cls] ?? cls,
        type: 'classification',
        color: NODE_COLORS['classification'],
        isHub: true,
      },
    });

    for (const nId of noteIdList) {
      elements.push({
        data: {
          id: `edge-${nId}-${hubId}`,
          source: nId,
          target: hubId,
          edgeType: 'about',
        },
      });
    }
  }

  // Phase 4: Entity ↔ entity co-occurrence edges (2+ shared insights)
  const entityIds = Array.from(entityNotes.keys());
  for (let i = 0; i < entityIds.length; i++) {
    for (let j = i + 1; j < entityIds.length; j++) {
      const eA = entityIds[i];
      const eB = entityIds[j];
      const notesA = entityNotes.get(eA)!;
      const notesB = entityNotes.get(eB)!;

      // Count co-occurrences
      let cooccurrences = 0;
      for (const n of notesA) {
        if (notesB.has(n)) cooccurrences++;
      }

      if (cooccurrences >= 2) {
        elements.push({
          data: {
            id: `cooccur-${eA}-${eB}`,
            source: eA,
            target: eB,
            edgeType: 'related_to',
          },
        });
      }
    }
  }

  return elements;
}
