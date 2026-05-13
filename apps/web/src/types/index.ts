// Interfaces from project-architecture.md §3.2
// APPEND-ONLY: Gabe and Nicolo add their types below Keith's section. Never edit existing entries.

// ─── Keith: Capture & Personal Graph ────────────────────────────────────────

export type NoteClassification =
  | 'strategy'
  | 'observation'
  | 'lesson_learned'
  | 'action_item'
  | 'research'
  | 'meeting_summary';

export interface Entity {
  id: string;
  type:
    | 'matter'
    | 'party'
    | 'lawyer'
    | 'judge'
    | 'witness'
    | 'concept'
    | 'precedent'
    | 'statute';
  name: string;
  confidence: number;
}

export interface PersonalNote {
  id: string;
  title: string;
  body: string;
  contentType: 'text' | 'audio' | 'image';
  /** Stored via IDB structured clone — reconstruct with new Blob([arrayBuffer]) if retrieved as empty after a page reload. */
  audioBlob?: Blob;
  /** Stored via IDB structured clone — reconstruct with new Blob([arrayBuffer]) if retrieved as empty after a page reload. */
  imageBlob?: Blob;
  audioTranscript?: string;
  extractedEntities: Entity[];
  classification: NoteClassification;
  isPrivileged: boolean;
  isPublished: boolean;
  publishedNodeId?: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

export interface OrganizeResponse {
  entities: Entity[];
  classification: NoteClassification;
  isPrivileged: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// ─── Gabe: Auth & Governance ─────────────────────────────────────────────────
// (Gabe appends here)

// ─── Nicolo: Retrieval & Chat ─────────────────────────────────────────────────

export interface TeamGraphNode {
  id: string;
  nodeType: 'insight' | 'matter' | 'party' | 'lawyer' | 'judge'
    | 'witness' | 'concept' | 'precedent' | 'statute';
  title: string;
  body?: string;
  summary?: string;
  contributorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TeamGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: 'mentions' | 'involves' | 'cites' | 'authored_by'
    | 'about' | 'concerns' | 'related_to';
  weight: number;
}

export interface TeamGraph {
  nodes: TeamGraphNode[];
  edges: TeamGraphEdge[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: ConfidenceLevel;
  sourceCount?: number;
  citedNodeIds?: string[];
  timestamp: number;
}

export interface Citation {
  index: number;
  nodeId: string;
  title: string;
  summary?: string;
  nodeType: TeamGraphNode['nodeType'];
}

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'refuse';

