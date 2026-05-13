// TODO: once Gabe's authStore is wired, import useAuthStore and pass token automatically.
// For now, callers pass the token explicitly. Swap to: const token = useAuthStore.getState().token
import type { ApiResponse, OrganizeResponse } from '../types/index';

const BASE_URL = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_API_URL ?? 'http://localhost:3000')
  : 'http://localhost:3000';

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
  const { token, body, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers as Record<string, string>),
  };

  // Set JSON content-type only for string bodies (JSON.stringify output).
  // FormData bodies must NOT set Content-Type — browser adds the multipart boundary.
  if (typeof body === 'string') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      body,
      headers: requestHeaders,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        error: {
          code: String(res.status),
          message: json?.error?.message ?? res.statusText,
          retryable: res.status >= 500,
        },
      };
    }

    return { data: json.data as T };
  } catch (err) {
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error',
        retryable: true,
      },
    };
  }
}

export async function organizeNote(
  content: string,
  token: string
): Promise<ApiResponse<OrganizeResponse>> {
  return apiRequest<OrganizeResponse>('/api/organize', {
    method: 'POST',
    body: JSON.stringify({ content }),
    token,
  });
}

export async function transcribeAudio(
  blob: Blob,
  token: string
): Promise<ApiResponse<{ transcript: string }>> {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  return apiRequest<{ transcript: string }>('/api/transcribe', {
    method: 'POST',
    body: form,
    token,
  });
}

export async function analyzeImage(
  file: File,
  token: string
): Promise<ApiResponse<{ text: string; description: string }>> {
  const form = new FormData();
  form.append('image', file);
  return apiRequest<{ text: string; description: string }>('/api/vision', {
    method: 'POST',
    body: form,
    token,
  });
}
