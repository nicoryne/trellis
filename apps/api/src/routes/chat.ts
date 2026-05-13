import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { retrieveContext, streamRagResponse } from '../services/rag';

const router = Router();

const chatSchema = z.object({
  query: z.string().min(1).max(10_000),
});

/**
 * POST /api/chat
 * RAG query with Server-Sent Events streaming.
 *
 * SSE event protocol:
 *   event: cited-nodes   → { nodeIds: string[], confidence: string }
 *   event: token         → { text: string }
 *   event: done          → { confidence: string, sourceCount: number }
 */
router.post('/chat', async (req: Request, res: Response) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: parsed.error.message,
        retryable: false,
      },
    });
  }

  const { query } = parsed.data;

  try {
    // Step 1: Retrieve context (vector search + graph expansion)
    const { citedNodeIds, confidence, contexts } = await retrieveContext(query);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Step 2: Send cited node IDs (triggers overlay animation on frontend)
    res.write(
      `event: cited-nodes\ndata: ${JSON.stringify({
        nodeIds: citedNodeIds,
        confidence,
      })}\n\n`
    );

    // Step 3: Stream response tokens
    const stream = streamRagResponse(query, contexts, confidence);
    for await (const chunk of stream) {
      res.write(`event: token\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Step 4: Send done event
    res.write(
      `event: done\ndata: ${JSON.stringify({
        confidence,
        sourceCount: contexts.length,
      })}\n\n`
    );

    res.end();
  } catch (err) {
    console.error('[chat] RAG query failed:', err);
    // If headers haven't been sent yet, return JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: 'CHAT_ERROR',
          message: 'Failed to process query',
          retryable: true,
        },
      });
    }
    // If streaming already started, send error as SSE event
    res.write(
      `event: error\ndata: ${JSON.stringify({
        message: 'Stream interrupted',
      })}\n\n`
    );
    res.end();
  }
});

export default router;
