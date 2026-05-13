// apps/web/src/views/publish/RedactionModal.tsx
import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { PersonalNote, RedactResponse } from '../../types/index';
import { useAuthStore } from '../../store/authStore';
import { redactContent, publishNote } from '../../api/publish';
import { PreservationScore } from './PreservationScore';
import { DiffPane } from './DiffPane';
import { showToast } from '../../components/Toast';
import './redaction-modal.css';

interface RedactionModalProps {
  note: PersonalNote;
  onClose: () => void;
  onPublished: (nodeId: string) => void;
}

export function RedactionModal({ note, onClose, onPublished }: RedactionModalProps) {
  const token = useAuthStore((s) => s.token);
  const [redactData, setRedactData] = useState<RedactResponse | null>(null);
  const [sanitizedText, setSanitizedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasManualEdit = sanitizedText !== redactData?.sanitized;
  const canPublish = redactData
    ? redactData.confidence > 40 || hasManualEdit
    : false;

  // Load redaction on mount
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    redactContent(note.body, token).then((result) => {
      setLoading(false);
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.data) {
        setRedactData(result.data);
        setSanitizedText(result.data.sanitized);
      }
    });
  }, [note.body, token]);

  // Escape key to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handlePublish() {
    if (!token || !canPublish) return;
    setPublishing(true);

    const result = await publishNote(
      {
        title: note.title,
        body: sanitizedText,
        nodeType: 'insight',
        sourcePersonalNoteId: note.id,
      },
      token
    );

    setPublishing(false);

    if (result.error) {
      showToast(result.error.message, 'error');
      return;
    }

    if (result.data) {
      showToast(`Published. Your colleagues can now see this.`, 'success');
      onPublished(result.data.nodeId);
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Publish to team graph">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Publish to team graph</h2>
            {redactData && !loading && (
              <PreservationScore score={redactData.confidence} />
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading && (
            <div className="modal-loading">Analyzing for redaction...</div>
          )}
          {error && (
            <div className="modal-error">
              {error}
              <button onClick={onClose}>Dismiss</button>
            </div>
          )}
          {redactData && !loading && (
            <DiffPane
              original={redactData.original}
              sanitized={redactData.sanitized}
              redactions={redactData.redactions}
              onSanitizedChange={setSanitizedText}
            />
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handlePublish}
            disabled={!canPublish || publishing}
          >
            {publishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
