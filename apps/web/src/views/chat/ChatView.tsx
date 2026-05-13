import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { streamChat } from '../../api/chat';
import { ChatMessageComponent } from './ChatMessage';
import { NodeSummaryPanel } from './NodeSummaryPanel';
import { SourcesPanel } from './SourcesPanel';
import { QueryOverlay } from './QueryOverlay';

/**
 * ChatView — the main "Chat with Team Brain" page.
 * Hero Moment 2 (design guidelines §8.2).
 *
 * Features:
 *   - Streaming SSE responses
 *   - Inline citation chips → node summary panel
 *   - Confidence badge
 *   - Query overlay animation trigger
 *   - Refusal state
 */
export const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const token = useAuthStore((s) => s.token);

  const {
    messages,
    isStreaming,
    citedNodeIds,
    overlayActive,
    addUserMessage,
    startStreaming,
    appendToken,
    finishStreaming,
    setOverlayActive,
  } = useChatStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const query = input.trim();
    if (!query || isStreaming) return;

    setInput('');
    addUserMessage(query);

    try {
      await streamChat(query, token, {
        onCitedNodes: (nodeIds, confidence) => {
          startStreaming(nodeIds, confidence);
          // Expand sources by default for medium/low confidence
          setSourcesExpanded(confidence !== 'high');
        },
        onToken: (text) => {
          appendToken('', text);
        },
        onDone: (confidence, sourceCount) => {
          finishStreaming('', confidence, sourceCount);
        },
        onError: (message) => {
          console.error('[chat] Stream error:', message);
          finishStreaming('', 'refuse', 0);
        },
      });
    } catch (err) {
      console.error('[chat] Failed to send query:', err);
      finishStreaming('', 'refuse', 0);
    }
  }, [input, isStreaming, token, addUserMessage, startStreaming, appendToken, finishStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-canvas)',
        position: 'relative',
        opacity: overlayActive ? 0.3 : 1,
        transition: `opacity 150ms var(--easing-default)`,
        pointerEvents: overlayActive ? 'none' : 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border-muted)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Team Brain
        </h1>
      </div>

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                maxWidth: '400px',
                lineHeight: 1.6,
              }}
            >
              Ask a question grounded in your firm's accumulated knowledge.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Responses are cited from the team graph. No hallucination.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <React.Fragment key={msg.id}>
            <ChatMessageComponent
              message={msg}
              isStreaming={isStreaming && msg === messages[messages.length - 1]}
              onCitationClick={setSelectedNodeId}
              citedNodeIds={citedNodeIds}
            />
            {/* Sources panel after the last assistant message */}
            {msg.role === 'assistant' &&
              !isStreaming &&
              msg === messages[messages.length - 1] &&
              citedNodeIds.length > 0 && (
                <SourcesPanel
                  citedNodeIds={citedNodeIds}
                  expanded={sourcesExpanded}
                  onToggle={() => setSourcesExpanded(!sourcesExpanded)}
                />
              )}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px 24px 20px',
          borderTop: '1px solid var(--border-muted)',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '12px',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the firm..."
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-canvas)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-serif)',
              fontSize: '15px',
              lineHeight: 1.6,
              outline: 'none',
              transition: `border-color var(--duration-fast) var(--easing-default)`,
              minHeight: '44px',
              maxHeight: '120px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor:
                input.trim() && !isStreaming
                  ? 'var(--accent-primary)'
                  : 'var(--bg-surface-raised)',
              color:
                input.trim() && !isStreaming
                  ? 'var(--bg-canvas)'
                  : 'var(--text-muted)',
              cursor: input.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all var(--duration-fast) var(--easing-default)`,
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Query overlay animation */}
      <QueryOverlay
        active={overlayActive}
        citedNodeIds={citedNodeIds}
        onDismiss={() => setOverlayActive(false)}
      />

      {/* Node summary slide-in panel */}
      <NodeSummaryPanel
        nodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
};
