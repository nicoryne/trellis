/**
 * RAG Service — Retrieval-Augmented Generation for Team Brain queries
 * Owner: Nicolo
 *
 * Pipeline (from architecture §4.3):
 *   1. Embed query → text-embedding-004 (768 dim)
 *   2. Vector similarity search → top-8 by cosine distance
 *   3. 1-hop graph expansion from top hits
 *   4. Filter expanded set → keep cosine > 0.55
 *   5. Construct context array
 *   6. Stream response via Gemini Pro with grounding prompt
 *   7. Calculate confidence level
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generateEmbedding } from './embedding';
import { vectorSearch, expandOneHop } from '../db/queries';

/**
 * Resolve prompt file path. Works under both:
 *   - Dev mode (tsx): __dirname = apps/api/src/services
 *   - Production (node dist/): __dirname = apps/api/dist/services
 *     In production, the Dockerfile copies prompts to dist/prompts.
 */
function resolvePromptPath(): string {
  // Try relative to __dirname first (works in both tsx and post-copy dist)
  const localPath = join(__dirname, '../prompts/chat.md');
  if (existsSync(localPath)) return localPath;

  // Fallback: resolve from cwd (useful for Railway/Docker)
  const cwdPath = join(process.cwd(), 'src/prompts/chat.md');
  if (existsSync(cwdPath)) return cwdPath;

  throw new Error('[rag] Cannot find chat.md prompt file');
}

const chatSystemPrompt = readFileSync(resolvePromptPath(), 'utf-8');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'refuse';

export interface RagContext {
  id: string;
  title: string;
  body: string | null;
  summary: string | null;
  type: string;
  similarity: number;
}

export interface RagResult {
  citedNodeIds: string[];
  confidence: ConfidenceLevel;
  contexts: RagContext[];
}

/**
 * Calculate confidence level based on retrieval quality.
 * From architecture §4.3:
 *   High:   3+ nodes above 0.80 similarity
 *   Medium: 2+ nodes above 0.70
 *   Low:    only 1 node above 0.75
 *   Refuse: zero nodes above 0.75
 */
function calculateConfidence(contexts: RagContext[]): ConfidenceLevel {
  const above080 = contexts.filter((c) => c.similarity >= 0.80).length;
  const above075 = contexts.filter((c) => c.similarity >= 0.75).length;
  const above070 = contexts.filter((c) => c.similarity >= 0.70).length;

  if (above080 >= 3) return 'high';
  if (above070 >= 2) return 'medium';
  if (above075 >= 1) return 'low';
  return 'refuse';
}

/**
 * Retrieve relevant context for a query.
 * Returns cited node IDs, confidence, and context array.
 */
export async function retrieveContext(query: string): Promise<RagResult> {
  // Step 1: Embed query
  const queryEmbedding = await generateEmbedding(query);

  // Step 2: Vector similarity search (top-8)
  const topHits = await vectorSearch(queryEmbedding, 8);

  if (topHits.length === 0) {
    return { citedNodeIds: [], confidence: 'refuse', contexts: [] };
  }

  // Step 3: 1-hop graph expansion
  const seedNodeIds = topHits.map((h: any) => h.id);
  const expanded = await expandOneHop(seedNodeIds);

  // Step 4: Filter — keep nodes with similarity > 0.55
  // Top hits already have similarity computed; neighbors need recomputing
  const contexts: RagContext[] = topHits
    .filter((h: any) => h.similarity > 0.55)
    .map((h: any) => ({
      id: h.id,
      title: h.title,
      body: h.body,
      summary: h.summary,
      type: h.node_type,
      similarity: h.similarity,
    }));

  // Add neighbor nodes that are insights (for richer context)
  for (const neighbor of expanded.nodes) {
    if (
      neighbor.node_type === 'insight' &&
      !contexts.find((c) => c.id === neighbor.id)
    ) {
      contexts.push({
        id: neighbor.id,
        title: neighbor.title,
        body: neighbor.body,
        summary: neighbor.summary,
        type: neighbor.node_type,
        similarity: 0.55, // Mark as graph-expanded
      });
    }
  }

  // Sort by similarity descending
  contexts.sort((a, b) => b.similarity - a.similarity);

  // Calculate confidence
  const confidence = calculateConfidence(contexts);
  const citedNodeIds = contexts.map((c) => c.id);

  return { citedNodeIds, confidence, contexts };
}

/**
 * Stream a RAG response for a query.
 * Yields text chunks as they arrive from Gemini.
 */
export async function* streamRagResponse(
  query: string,
  contexts: RagContext[],
  confidence: ConfidenceLevel
): AsyncGenerator<string> {
  // Refuse if no relevant context
  if (confidence === 'refuse' || contexts.length === 0) {
    yield "I don't have firm knowledge that directly addresses this. You may want to capture your own thinking on this topic as a starting point.";
    return;
  }

  // Build context payload for the LLM
  const contextPayload = contexts.map((c) => ({
    id: c.id,
    title: c.title,
    body: c.body,
    summary: c.summary,
    type: c.type,
  }));

  const userMessage = `Context:\n${JSON.stringify(contextPayload, null, 2)}\n\nQuestion: ${query}`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: chatSystemPrompt,
  });

  const result = await model.generateContentStream(userMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}
