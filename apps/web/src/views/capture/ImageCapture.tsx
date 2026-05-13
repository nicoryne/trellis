import { useRef, useState } from 'react';
import { analyzeImage } from '../../api/client';
import { useNoteStore } from '../../store/noteStore';
import type { NoteClassification } from '../../types/index';

// TODO: replace STUB_TOKEN with useAuthStore.getState().token once Gabe's authStore is wired
const STUB_TOKEN = '';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

type ImageState = 'idle' | 'analyzing' | 'editing';

export default function ImageCapture() {
  const [state, setState] = useState<ImageState>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { saveNote } = useNoteStore();

  function handleFile(f: File) {
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
    const response = await analyzeImage(f, STUB_TOKEN);
    if (response.error) {
      setError('Image analysis failed. Try again.');
      setState('idle');
      return;
    }
    setText(response.data!.text);
    setState('editing');
  }

  async function handleSave() {
    if (!fileRef.current) return;
    await saveNote({
      title: fileRef.current.name.replace(/\.[^.]+$/, ''),
      body: text,
      contentType: 'image',
      imageBlob: fileRef.current,
      extractedEntities: [],
      classification: 'observation' as NoteClassification,
      isPrivileged: false,
      isPublished: false,
    });
    reset();
  }

  function reset() {
    setState('idle');
    fileRef.current = null;
    if (preview) URL.revokeObjectURL(preview);
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
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:border-amber-500"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
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
          <button
            onClick={() => { setError(null); setState('idle'); }}
            className="text-sm underline"
            style={{ color: 'var(--accent-primary)' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
