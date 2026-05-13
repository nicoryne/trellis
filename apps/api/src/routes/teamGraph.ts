import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { getFullTeamGraph, getNodeById } from '../db/queries';

const router = Router();

/**
 * GET /api/team-graph
 * Return all team graph nodes and edges for rendering.
 */
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const graph = await getFullTeamGraph();
    return res.json({ data: graph });
  } catch (err) {
    console.error('[team-graph] Failed to fetch graph:', err);
    return res.status(500).json({
      error: {
        code: 'GRAPH_ERROR',
        message: 'Failed to load team graph',
        retryable: true,
      },
    });
  }
});

/**
 * GET /api/team-graph/nodes/:id
 * Return a single node with its connections (for citation summary panels).
 */
router.get('/nodes/:id', auth, async (req: Request, res: Response) => {
  try {
    const node = await getNodeById(String(req.params.id));
    if (!node) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Node not found',
          retryable: false,
        },
      });
    }
    return res.json({ data: node });
  } catch (err) {
    console.error('[team-graph] Failed to fetch node:', err);
    return res.status(500).json({
      error: {
        code: 'NODE_ERROR',
        message: 'Failed to load node',
        retryable: true,
      },
    });
  }
});

export default router;
