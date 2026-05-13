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
  audioBlob?: Blob;
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
// (Nicolo appends here)
