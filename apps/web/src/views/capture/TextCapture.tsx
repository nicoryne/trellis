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
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <input
        autoFocus
        type="text"
        placeholder="Note title"
        value={title}
        onChange={e => { setTitle(e.target.value); scheduleSave(e.target.value, body); }}
        className="w-full bg-transparent text-2xl font-semibold outline-none border-b pb-2"
        style={{
          color: 'var(--text-primary)',
          borderColor: 'var(--border-muted)',
          caretColor: 'var(--accent-primary)',
        }}
      />

      <textarea
        placeholder="Start writing..."
        value={body}
        onChange={e => { setBody(e.target.value); scheduleSave(title, e.target.value); }}
        className="w-full min-h-96 bg-transparent outline-none resize-none text-base leading-relaxed"
        style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
      />

      {activeNote && activeNote.extractedEntities.length > 0 && (
        <div
          className="flex flex-wrap gap-2 pt-3 border-t"
          style={{ borderColor: 'var(--border-muted)' }}
        >
          {activeNote.extractedEntities.map(entity => (
            <span
              key={entity.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--accent-primary-bg)',
                color: ENTITY_COLORS[entity.type] ?? 'var(--text-primary)',
                border: `1px solid ${ENTITY_COLORS[entity.type] ?? 'var(--border-default)'}`,
              }}
            >
              {entity.type}: {entity.name}
              <button
                type="button"
                onClick={() => removeEntity(activeNote.id, entity.id)}
                aria-label={`Remove entity ${entity.name}`}
                className="leading-none px-1 rounded opacity-60 hover:opacity-100"
                style={{ color: 'inherit', background: 'transparent' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {activeNote?.isPrivileged && (
        <div
          className="text-xs px-3 py-1.5 rounded"
          style={{ backgroundColor: 'var(--accent-primary-bg)', color: 'var(--accent-primary)' }}
        >
          Attorney-client privileged content detected
        </div>
      )}

      {/* Publish to team graph button — visible when note is saved and not already published */}
      {activeNote && !activeNote.isPublished && activeNote.body.trim().length > 0 && (
        <button
          onClick={() => setShowRedaction(true)}
          className="px-4 py-2 rounded text-sm font-medium self-start"
          style={{ backgroundColor: 'var(--accent-primary)', color: '#0d1117' }}
        >
          Publish to team graph
        </button>
      )}

      {activeNote?.isPublished && (
        <span className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(63,185,80,0.1)', color: 'var(--success)' }}>
          Published
        </span>
      )}

      {isOrganizing && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Organizing...
        </span>
      )}

      {organizeError && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--danger)' }}>
            Organization failed
          </span>
          <button
            onClick={() => performSave(title, body)}
            className="text-xs underline"
            style={{ color: 'var(--accent-primary)' }}
          >
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
