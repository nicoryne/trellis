import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { startRecording, formatDuration, MAX_RECORDING_DURATION, type Recording } from '../../lib/audio';
import { transcribeAudio } from '../../api/client';
import { useNoteStore } from '../../store/noteStore';

// TODO: replace STUB_TOKEN with useAuthStore.getState().token once Gabe's authStore is wired
const STUB_TOKEN = '';

type AudioState = 'idle' | 'recording' | 'transcribing' | 'editing';

export default function AudioCapture() {
  const [state, setState] = useState<AudioState>('idle');
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const { saveNote } = useNoteStore();

  useEffect(() => {
    if (state !== 'recording' || !waveContainerRef.current) return;
    wavesurferRef.current = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: '#7d8590',
      progressColor: '#d4a72c',
      height: 64,
      barWidth: 2,
      barGap: 1,
      interact: false,
    });
    return () => { wavesurferRef.current?.destroy(); wavesurferRef.current = null; };
  }, [state]);

  // Auto-stop when duration reaches the cap — kept outside the interval updater to avoid side effects in a state setter
  useEffect(() => {
    if (state === 'recording' && duration >= MAX_RECORDING_DURATION - 1) {
      void handleStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleStop references stable refs only
  }, [duration, state]);

  async function handleStart() {
    setError(null);
    setDuration(0);
    try {
      recordingRef.current = await startRecording();
      setState('recording');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch {
      setError('Microphone access denied. Allow microphone access in your browser and try again.');
    }
  }

  async function handleStop() {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setState('transcribing');

    const blob = await recordingRef.current.stop();
    blobRef.current = blob;
    recordingRef.current = null;

    const response = await transcribeAudio(blob, STUB_TOKEN);
    if (!response.data) {
      setError('Transcription failed. Try again.');
      setState('idle');
      return;
    }
    setTranscript(response.data.transcript);
    setState('editing');
  }

  async function handleSave() {
    await saveNote({
      title: 'Audio note',
      body: transcript,
      contentType: 'audio',
      audioBlob: blobRef.current ?? undefined,
      audioTranscript: transcript,
      extractedEntities: [],
      classification: 'observation',
      isPrivileged: false,
      isPublished: false,
    });
    setState('idle');
    setTranscript('');
    setDuration(0);
    blobRef.current = null;
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <button
            onClick={handleStart}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#0d1117' }}
            aria-label="Start recording"
          >
            ●
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Click to record (max 5 min)
          </span>
        </div>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center gap-4">
          <div ref={waveContainerRef} className="w-full rounded" />
          <div className="text-2xl font-mono tabular-nums" style={{ color: 'var(--accent-primary)' }}>
            {formatDuration(duration)}
          </div>
          <button
            onClick={handleStop}
            className="px-6 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--danger)', color: '#fff' }}
          >
            Stop recording
          </button>
        </div>
      )}

      {state === 'transcribing' && (
        <div className="flex flex-col items-center gap-4 py-12">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Transcribing...
          </span>
        </div>
      )}

      {state === 'editing' && (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Transcript — edit before saving
          </label>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            className="w-full min-h-64 p-4 rounded border bg-transparent resize-none text-base leading-relaxed"
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
              onClick={() => { setState('idle'); setTranscript(''); setDuration(0); blobRef.current = null; }}
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
            onClick={() => setError(null)}
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
