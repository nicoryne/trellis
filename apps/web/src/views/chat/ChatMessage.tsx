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

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onCitationClick,
  citedNodeIds = [],
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      {/* Avatar */}
      <div className={`chat-avatar ${isUser ? 'chat-avatar--user' : 'chat-avatar--assistant'}`}>
        {isUser ? 'You' : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Message bubble */}
        <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
          <div className="chat-bubble-content">
            {isUser
              ? message.content
              : renderContentWithCitations(message.content, citedNodeIds, onCitationClick)}
            {/* Streaming cursor */}
            {isStreaming && !isUser && <span className="streaming-cursor" />}
          </div>
        </div>

        {/* Timestamp */}
        <div className="chat-timestamp" style={{ textAlign: isUser ? 'right' : 'left' }}>
          {formatTime(message.timestamp)}
        </div>

        {/* Confidence badge (only for finished assistant messages) */}
        {!isUser && !isStreaming && message.confidence && (
          <div style={{ marginTop: '4px' }}>
            <ConfidenceBadge confidence={message.confidence} sourceCount={message.sourceCount} />
          </div>
        )}
      </div>
    </div>
  );
};
