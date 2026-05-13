import { create } from 'zustand';
import type { ChatMessage, ConfidenceLevel } from '../types';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  citedNodeIds: string[];
  confidence: ConfidenceLevel | null;
  overlayActive: boolean;

  // Actions
  addUserMessage: (content: string) => string;
  startStreaming: (citedNodeIds: string[], confidence: ConfidenceLevel) => void;
  appendToken: (messageId: string, text: string) => void;
  finishStreaming: (messageId: string, confidence: ConfidenceLevel, sourceCount: number) => void;
  setOverlayActive: (active: boolean) => void;
  clearMessages: () => void;
}

let messageCounter = 0;

function generateId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  citedNodeIds: [],
  confidence: null,
  overlayActive: false,

  addUserMessage: (content: string) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, message] }));
    return id;
  },

  startStreaming: (citedNodeIds: string[], confidence: ConfidenceLevel) => {
    const id = generateId();
    const message: ChatMessage = {
      id,
      role: 'assistant',
      content: '',
      citedNodeIds,
      confidence,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, message],
      isStreaming: true,
      citedNodeIds,
      confidence,
      overlayActive: true,
    }));
  },

  appendToken: (_messageId: string, text: string) => {
    set((state) => {
      const messages = [...state.messages];
      const lastAssistant = messages.findLast((m) => m.role === 'assistant');
      if (lastAssistant) {
        lastAssistant.content += text;
      }
      return { messages };
    });
  },

  finishStreaming: (_messageId: string, confidence: ConfidenceLevel, sourceCount: number) => {
    set((state) => {
      const messages = [...state.messages];
      const lastAssistant = messages.findLast((m) => m.role === 'assistant');
      if (lastAssistant) {
        lastAssistant.confidence = confidence;
        lastAssistant.sourceCount = sourceCount;
      }
      return {
        messages,
        isStreaming: false,
        overlayActive: false,
      };
    });
  },

  setOverlayActive: (active: boolean) => set({ overlayActive: active }),
  clearMessages: () =>
    set({ messages: [], isStreaming: false, citedNodeIds: [], confidence: null, overlayActive: false }),
}));
