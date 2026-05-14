import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { streamChat } from '../../api/chat';
import { ChatMessageComponent } from './ChatMessage';
import { NodeSummaryPanel } from './NodeSummaryPanel';
import { SourcesPanel } from './SourcesPanel';
import { QueryOverlay } from './QueryOverlay';
import './chat.css';

/**
 * ChatView — the main "Chat with Team Brain" page.
 * Hero Moment 2 (design guidelines §8.2).
 *
 * Features:
 *   - Welcome state with suggested questions
 *   - Streaming SSE responses with thinking animation
 *   - Inline citation chips → node summary panel
 *   - Confidence badge
 *   - Query overlay animation trigger
 *   - Refusal state
 *   - Message history preserved during session
 */

const SUGGESTED_QUERIES = [
  'What strategies work for cross-examining expert witnesses?',
  'How do we handle summary judgment motions?',
  'What are our deposition timeline strategies?',
  'How should we approach settlement negotiations?',
];

export const ChatView: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

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

  const handleSubmit = useCallback(async (overrideQuery?: string) => {
    const query = (overrideQuery ?? input).trim();
    if (!query || isStreaming) return;

    if (!overrideQuery) setInput('');
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

  const canSend = input.trim() && !isStreaming;

  return (
    <div className={`chat-root${overlayActive ? ' overlay-active' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <h1>Team Brain</h1>
        <div className="chat-header-sub">
          Ask questions grounded in your firm's knowledge graph
        </div>
      </div>

      {/* Messages area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <MessageSquare size={24} />
            </div>
            <span className="chat-welcome-title">
              {user ? `Welcome, ${user.displayName.split(' ')[0]}` : 'Welcome to Team Brain'}
            </span>
            <span className="chat-welcome-desc">
              Ask a question and receive answers cited directly from your firm's published insights. 
              Every response is grounded — no hallucination.
            </span>

            {/* Suggested queries */}
            <div className="chat-welcome-suggestions">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  className="chat-suggestion"
                  onClick={() => handleSubmit(q)}
                >
                  {q}
                </button>
              ))}
            </div>
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

        {/* Thinking indicator — shows when streaming starts but no content yet */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
          <div className="chat-thinking">
            <div className="chat-avatar chat-avatar--assistant">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="thinking-dots">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <div className="chat-input-container">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the firm..."
            disabled={isStreaming}
            rows={1}
            className="chat-input"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!canSend}
            aria-label="Send message"
            className={`chat-send-btn ${canSend ? 'chat-send-btn--active' : 'chat-send-btn--disabled'}`}
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
