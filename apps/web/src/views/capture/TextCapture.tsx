import { useEffect, useRef, useState } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { organizeNote } from '../../api/client';
import type { NoteClassification } from '../../types/index';

// TODO: replace STUB_TOKEN with useAuthStore.getState().token once Gabe's authStore is wired
const STUB_TOKEN = '';

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
  const { saveNote, setActiveNote, updateNoteOrganization, notes, activeNoteId } = useNoteStore();
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
      const response = await organizeNote(currentBody, STUB_TOKEN);
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
              className="px-2 py-1 rounded text-xs font-mono"
              style={{
                backgroundColor: 'var(--accent-primary-bg)',
                color: ENTITY_COLORS[entity.type] ?? 'var(--text-primary)',
                border: `1px solid ${ENTITY_COLORS[entity.type] ?? 'var(--border-default)'}`,
              }}
            >
              {entity.type}: {entity.name}
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
    </div>
  );
}
