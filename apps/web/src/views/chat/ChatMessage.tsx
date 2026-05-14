import React from 'react';
import { CitationChip } from './CitationChip';
import { ConfidenceBadge } from './ConfidenceBadge';
import { Logo } from '../../components/Logo';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage as ChatMessageType } from '../../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming: boolean;
  onCitationClick: (nodeId: string) => void;
  citedNodeIds?: string[];
}

/**
 * Parse text and replace citation patterns [uuid] or [uuid, uuid] with CitationChip components.
 */
function renderContentWithCitations(
  content: string,
  citedNodeIds: string[],
  onCitationClick: (nodeId: string) => void
): React.ReactNode[] {
  const citationRegex = /\[([a-f0-9-]{36}(?:\s*,\s*[a-f0-9-]{36})*)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const ids = match[1].split(',').map((s) => s.trim());
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
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function initialsFromName(name: string | undefined): string {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ChatMessageComponent: React.FC<ChatMessageProps> = ({
  message,
  isStreaming,
  onCitationClick,
  citedNodeIds = [],
}) => {
  const isUser = message.role === 'user';
  const user = useAuthStore((s) => s.user);
  const isRefusal = !isUser && message.confidence === 'refuse';

  return (
    <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
      <div
        className={`chat-avatar ${isUser ? 'chat-avatar--user' : 'chat-avatar--assistant'}`}
        aria-hidden
      >
        {isUser ? initialsFromName(user?.displayName) : <Logo size={20} alt="Trellis" />}
      </div>

      <div className="chat-message-content">
        <div
          className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}${
            isRefusal ? ' chat-bubble--refusal' : ''
          }`}
        >
          <div className="chat-bubble-content">
            {isUser
              ? message.content
              : renderContentWithCitations(message.content, citedNodeIds, onCitationClick)}
            {isStreaming && !isUser && <span className="streaming-cursor" />}
          </div>
        </div>

        <div className="chat-meta">
          <span className="chat-timestamp">{formatTime(message.timestamp)}</span>
          {!isUser && !isStreaming && message.confidence && (
            <ConfidenceBadge
              confidence={message.confidence}
              // Suppress source count on refusal — no fake sources (design-guidelines §8.2)
              sourceCount={isRefusal ? undefined : message.sourceCount}
            />
          )}
        </div>
      </div>
    </div>
  );
};
