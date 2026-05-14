import { useEffect, useRef, useState } from 'react';
import { analyzeImage, organizeNote } from '../../api/client';
import { useNoteStore } from '../../store/noteStore';
import { useAuthStore } from '../../store/authStore';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

type ImageState = 'idle' | 'analyzing' | 'editing';

export default function ImageCapture() {
  const [state, setState] = useState<ImageState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [organizeError, setOrganizeError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { saveNote, updateNoteOrganization } = useNoteStore();
  const token = useAuthStore((s) => s.token);

  // Fix 1A + Fix 2: Revoke object URL when preview changes or on unmount
  useEffect(() => {
    const url = preview;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [preview]);

  function handleFile(f: File) {
    // Fix 7: Guard against processing a new file while not idle
    if (state !== 'idle') return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Only PNG, JPG, and WebP files are accepted.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('File must be under 10MB.');
      return;
    }
    fileRef.current = f;
    setPreview(URL.createObjectURL(f));
    runAnalysis(f);
  }

  async function runAnalysis(f: File) {
    setState('analyzing');
    const response = await analyzeImage(f, token ?? '');
    // Fix 3: Stale request guard — bail if a newer upload has taken over
    if (fileRef.current !== f) return;
    // Fix 4: Replace unsafe non-null assertion with data check
    if (!response.data) {
      setError('Image analysis failed. Try again.');
      setState('idle');
      return;
    }
    setText(response.data.text);
    setState('editing');
  }

  async function handleSave() {
    if (!fileRef.current) return;
    const note = await saveNote({
      // Fix 8: Fallback title for dotfiles / extension-only names
      title: fileRef.current.name.replace(/\.[^.]+$/, '') || 'Untitled image',
      body: text,
      contentType: 'image',
      imageBlob: fileRef.current,
      extractedEntities: [],
      // Fix 5: Remove unnecessary type cast
      classification: 'observation',
      isPrivileged: false,
      isPublished: false,
    });
    if (text.trim().length > 20) {
      setOrganizeError(null);
      const response = await organizeNote(text, token ?? '');
      if (response.data) {
        await updateNoteOrganization(note.id, response.data);
      } else if (response.error) {
        setOrganizeError(response.error.message);
      }
    }
    reset();
  }

  function reset() {
    setState('idle');
    fileRef.current = null;
    setPreview(null);
    setText('');
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {state === 'idle' && (
        // Fix 6: Keyboard accessibility for drop zone
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:border-amber-500"
          style={{ borderColor: 'var(--border-default)' }}
        >
          {/* Fix 9: Derive accept attribute from ACCEPTED_TYPES */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Drop an image or click to upload
          </span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            PNG, JPG, WebP · max 10MB
          </span>
        </div>
      )}

      {state === 'analyzing' && (
        <div className="flex flex-col items-center gap-4 py-12">
          {preview && (
            <img src={preview} alt="Uploaded" className="max-h-64 rounded object-contain" />
          )}
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Analyzing image...
          </span>
        </div>
      )}

      {state === 'editing' && (
        <div className="flex flex-col gap-4">
          {preview && (
            <img src={preview} alt="Uploaded" className="max-h-48 rounded object-contain self-start" />
          )}
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Extracted text — edit before saving
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full min-h-48 p-4 rounded border bg-transparent resize-none text-base leading-relaxed"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-surface)',
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#0d1117' }}
            >
              Save note
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded text-sm"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)' }}
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>
          {/* Fix 1C: Call reset() directly instead of inline mutation */}
          <button
            onClick={reset}
            className="text-sm underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {organizeError && (
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--danger)' }}>
            Organization failed
          </span>
          <button
            onClick={() => setOrganizeError(null)}
            className="text-xs underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
