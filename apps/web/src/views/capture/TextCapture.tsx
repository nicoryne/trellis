import { useEffect, useRef, useState } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useAuthStore } from '../../store/authStore';
import { organizeNote } from '../../api/client';
import { RedactionModal } from '../publish/RedactionModal';
import type { NoteClassification } from '../../types/index';

const ENTITY_COLORS: Record<string, string> = {
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ff9f1c',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#fb5607',
};

export default function TextCapture() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  const [showRedaction, setShowRedaction] = useState(false);
  const { saveNote, setActiveNote, updateNoteOrganization, removeEntity, notes, activeNoteId } = useNoteStore();
  const token = useAuthStore((s) => s.token);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(null);

  const activeNote = notes.find(n => n.id === activeNoteId);

  async function performSave(currentTitle: string, currentBody: string) {
    const data = {
      title: currentTitle,
      body: currentBody,
      contentType: 'text' as const,
      extractedEntities: [],
      classification: 'observation' as NoteClassification,
      isPrivileged: false,
      isPublished: false,
    };
    const note = await saveNote(data, noteIdRef.current ?? undefined);
    if (!noteIdRef.current) {
      noteIdRef.current = note.id;
      setActiveNote(note.id);
    }

    if (currentBody.trim().length > 20) {
      setIsOrganizing(true);
      setOrganizeError(null);
      const response = await organizeNote(currentBody, token ?? '');
      setIsOrganizing(false);
      if (response.data) {
        await updateNoteOrganization(note.id, response.data);
      } else if (response.error) {
        setOrganizeError(response.error.message);
      }
    }
  }

  function scheduleSave(currentTitle: string, currentBody: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSave(currentTitle, currentBody), 500);
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="editor-container">
      <input
        autoFocus
        type="text"
        placeholder="Note title"
        value={title}
        onChange={e => { setTitle(e.target.value); scheduleSave(e.target.value, body); }}
        className="editor-title"
      />

      <textarea
        placeholder="Start writing your observation, strategy, or lesson learned..."
        value={body}
        onChange={e => { setBody(e.target.value); scheduleSave(title, e.target.value); }}
        className="editor-body"
      />

      {activeNote && activeNote.extractedEntities.length > 0 && (
        <div className="entity-chips">
          {activeNote.extractedEntities.map(entity => (
            <span key={entity.id} className="entity-chip">
              <span
                className="entity-chip-dot"
                style={{ backgroundColor: ENTITY_COLORS[entity.type] ?? 'var(--text-muted)' }}
              />
              <span style={{ color: ENTITY_COLORS[entity.type] ?? 'var(--text-primary)' }}>
                {entity.name}
              </span>
              <button
                type="button"
                onClick={() => removeEntity(activeNote.id, entity.id)}
                aria-label={`Remove entity ${entity.name}`}
                className="entity-chip-remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {activeNote?.isPrivileged && (
        <div className="status-badge status-badge--privilege" style={{ marginTop: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Attorney-client privileged content detected
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        {/* Publish to team graph button — visible when note is saved and not already published */}
        {activeNote && !activeNote.isPublished && activeNote.body.trim().length > 0 && (
          <button onClick={() => setShowRedaction(true)} className="btn btn--primary">
            Publish to team graph
          </button>
        )}

        {activeNote?.isPublished && (
          <span className="status-badge status-badge--published">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Published
          </span>
        )}

        {isOrganizing && (
          <span className="status-badge status-badge--organizing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="spinner" />
            Organizing...
          </span>
        )}
      </div>

      {organizeError && (
        <div className="error-inline" style={{ marginTop: 12 }}>
          <span className="error-inline-text">Organization failed</span>
          <button onClick={() => performSave(title, body)} className="btn btn--danger-text">
            Retry
          </button>
        </div>
      )}

      {/* Redaction modal */}
      {showRedaction && activeNote && (
        <RedactionModal
          note={activeNote}
          onClose={() => setShowRedaction(false)}
          onPublished={(nodeId) => {
            // Mark the local note as published
            import('../../lib/idb').then(({ updateNote }) => {
              updateNote(activeNote.id, { isPublished: true, publishedNodeId: nodeId });
            });
          }}
        />
      )}
    </div>
  );
}
