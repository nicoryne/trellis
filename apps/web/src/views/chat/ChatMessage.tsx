import React from 'react';
import { CitationChip } from './CitationChip';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  onCitationClick: (nodeId: string) => void;
  citedNodeIds?: string[];
}

/**
 * Parse text and replace citation patterns [uuid] or [uuid, uuid] with CitationChip components.
 * Also handles simpler [1] style references.
 */
function renderContentWithCitations(
  content: string,
  citedNodeIds: string[],
  onCitationClick: (nodeId: string) => void
): React.ReactNode[] {
  // Match patterns like [uuid-here] or [uuid1, uuid2]
  const citationRegex = /\[([a-f0-9-]{36}(?:\s*,\s*[a-f0-9-]{36})*)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(content)) !== null) {
    // Text before the citation
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const ids = match[1].split(',').map((s) => s.trim());
    // Map UUIDs to their indices in citedNodeIds
    const indices = ids
      .map((id) => citedNodeIds.indexOf(id) + 1)
      .filter((i) => i > 0);

    if (indices.length > 0) {
      parts.push(
        <CitationChip
          key={match.index}
          indices={indices}
          onClick={(idx) => {
            const nodeId = citedNodeIds[idx - 1];
            if (nodeId) onCitationClick(nodeId);
          }}
        />
      );
    } else {
      // Keep as-is if IDs aren't recognized
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onCitationClick,
  citedNodeIds = [],
}) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '20px',
        animation: 'fadeIn var(--duration-fast) var(--easing-entry)',
      }}
    >
      {/* Role label */}
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {isUser ? 'You' : 'Trellis'}
      </span>

      {/* Message bubble */}
      <div
        style={{
          maxWidth: '85%',
          padding: '14px 18px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          backgroundColor: isUser ? 'var(--accent-primary-bg)' : 'var(--bg-surface)',
          border: `1px solid ${isUser ? 'var(--accent-primary-muted)' : 'var(--border-default)'}`,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {isUser
            ? message.content
            : renderContentWithCitations(message.content, citedNodeIds, onCitationClick)}
          {/* Streaming cursor */}
          {isStreaming && !isUser && (
            <span
              style={{
                display: 'inline-block',
                width: '2px',
                height: '16px',
                backgroundColor: 'var(--accent-primary)',
                marginLeft: '2px',
                verticalAlign: 'text-bottom',
                animation: 'blink 1s step-end infinite',
              }}
            />
          )}
        </div>
      </div>

      {/* Confidence badge (only for finished assistant messages) */}
      {!isUser && !isStreaming && message.confidence && (
        <div style={{ marginTop: '8px' }}>
          <ConfidenceBadge confidence={message.confidence} sourceCount={message.sourceCount} />
        </div>
      )}
    </div>
  );
};
