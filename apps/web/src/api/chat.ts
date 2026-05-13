import type { ConfidenceLevel } from '../types';

const BASE_URL = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_API_URL ?? '')
  : '';

interface ChatSSECallbacks {
  onCitedNodes: (nodeIds: string[], confidence: ConfidenceLevel) => void;
  onToken: (text: string) => void;
  onDone: (confidence: ConfidenceLevel, sourceCount: number) => void;
  onError: (message: string) => void;
}

/**
 * Send a chat query and consume the SSE stream.
 * Uses fetch + ReadableStream (not EventSource) because we need POST.
 */
export async function streamChat(
  query: string,
  token: string | null,
  callbacks: ChatSSECallbacks
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = (errorData as any)?.error?.message ?? 'Chat request failed';
    callbacks.onError(message);
    return;
  }

  if (!response.body) {
    callbacks.onError('No response stream');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

    let eventType = '';
    let eventData = '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        eventData = line.slice(6);
      } else if (line === '' && eventType && eventData) {
        // End of event — dispatch
        try {
          const parsed = JSON.parse(eventData);
          switch (eventType) {
            case 'cited-nodes':
              callbacks.onCitedNodes(parsed.nodeIds, parsed.confidence);
              break;
            case 'token':
              callbacks.onToken(parsed.text);
              break;
            case 'done':
              callbacks.onDone(parsed.confidence, parsed.sourceCount);
              break;
            case 'error':
              callbacks.onError(parsed.message);
              break;
          }
        } catch {
          // Skip malformed events
        }
        eventType = '';
        eventData = '';
      }
    }
  }
}

/**
 * Fetch a single team graph node by ID (for citation panels).
 */
export async function fetchNodeSummary(nodeId: string, token: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/team-graph/nodes/${nodeId}`, {
    headers,
  });

  if (!response.ok) return null;
  const json = await response.json();
  return json.data;
}

/**
 * Fetch full team graph (for overlay rendering).
 */
export async function fetchTeamGraph(token: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/team-graph`, { headers });
  if (!response.ok) return null;
  const json = await response.json();
  return json.data;
}
