import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchTeamGraph } from '../../api/chat';

interface QueryOverlayProps {
  active: boolean;
  citedNodeIds: string[];
  onDismiss: () => void;
}

const NODE_COLORS: Record<string, string> = {
  insight: '#9d4edd',
  matter: '#06d6a0',
  party: '#ef476f',
  lawyer: '#118ab2',
  judge: '#073b4c',
  witness: '#ffd60a',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#d62828',
};

/**
 * Deterministic hash to produce stable "random" jitter per node index.
 * Avoids Math.random() in the render loop which causes jitter every frame.
 */
function stableJitter(index: number, seed: number): number {
  const x = Math.sin(index * 9301 + seed * 49297) * 49297;
  return x - Math.floor(x); // 0..1
}

/**
 * QueryOverlay — Hero Moment 3 (design guidelines §8.3)
 *
 * Full-screen overlay that:
 *   1. Fades in with backdrop blur (400ms)
 *   2. Renders team graph at center with all nodes at 15% opacity
 *   3. Pulses cited nodes to 100% in rank order (150ms stagger)
 *   4. Edges between cited nodes illuminate to orange
 *   5. Holds for ~1s then fades out (600ms)
 *
 * Uses canvas for performance (60fps).
 * Respects prefers-reduced-motion.
 */
export const QueryOverlay: React.FC<QueryOverlayProps> = ({
  active,
  citedNodeIds,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [visible, setVisible] = useState(false);
  const animationRef = useRef<number>(0);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Fetch team graph data on first activation
  useEffect(() => {
    if (active && !graphData) {
      fetchTeamGraph(null).then((data) => setGraphData(data));
    }
  }, [active, graphData]);

  // Escape key handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && active) onDismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, onDismiss]);

  // Main animation loop — draws the graph onto the canvas
  const animate = useCallback(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window (device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];

    // Position nodes with deterministic jitter (stable across frames)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;

    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node: any, i: number) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const jitter = stableJitter(i, 42);
      const r = radius * (0.7 + jitter * 0.6);
      nodePositions.set(node.id, {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      });
    });

    // Clear
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw edges
    for (const edge of edges) {
      const source = nodePositions.get(edge.source_node_id);
      const target = nodePositions.get(edge.target_node_id);
      if (!source || !target) continue;

      const isCitedEdge =
        citedNodeIds.includes(edge.source_node_id) &&
        citedNodeIds.includes(edge.target_node_id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isCitedEdge
        ? `rgba(251, 133, 0, ${overlayOpacity})`
        : `rgba(48, 54, 61, ${overlayOpacity * 0.4})`;
      ctx.lineWidth = isCitedEdge ? 2 : 0.5;
      ctx.stroke();
    }

    // Draw nodes
    for (const node of nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const isCited = citedNodeIds.includes(node.id);
      const nodeColor = NODE_COLORS[node.node_type] ?? '#7d8590';
      const nodeOpacity = isCited ? overlayOpacity : overlayOpacity * 0.15;
      const nodeSize = isCited ? 8 : 5;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.globalAlpha = nodeOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Glow effect for cited nodes
      if (isCited && overlayOpacity > 0.5) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeSize + 4, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = nodeOpacity * 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }, [graphData, citedNodeIds, overlayOpacity]);

  // Fade-in / fade-out animation driven by `active` prop
  useEffect(() => {
    if (active && graphData) {
      setVisible(true);

      if (prefersReducedMotion.current) {
        setOverlayOpacity(1);
        const timeout = setTimeout(() => setOverlayOpacity(1), 800);
        return () => clearTimeout(timeout);
      }

      // Fade in over 400ms using rAF
      const start = performance.now();
      const fadeIn = (now: number) => {
        const progress = Math.min((now - start) / 400, 1);
        setOverlayOpacity(progress);
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(fadeIn);
        }
      };
      animationRef.current = requestAnimationFrame(fadeIn);
      return () => cancelAnimationFrame(animationRef.current);
    } else if (!active && visible) {
      if (prefersReducedMotion.current) {
        setOverlayOpacity(0);
        setVisible(false);
        return;
      }

      // Fade out over 600ms
      const start = performance.now();
      const fadeOut = (now: number) => {
        const progress = Math.min((now - start) / 600, 1);
        setOverlayOpacity(1 - progress);
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(fadeOut);
        } else {
          setVisible(false);
        }
      };
      animationRef.current = requestAnimationFrame(fadeOut);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [active, graphData, visible]);

  // Re-draw canvas whenever opacity or data changes
  useEffect(() => {
    if (visible) {
      animate();
    }
  }, [visible, overlayOpacity, animate]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        backgroundColor: `rgba(13, 17, 23, ${0.95 * overlayOpacity})`,
        backdropFilter: `blur(${8 * overlayOpacity}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onDismiss}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Label */}
      <AnimatePresence>
        {overlayOpacity > 0.4 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              bottom: '48px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Searching firm knowledge
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 999,
                    background: 'var(--accent-primary)',
                    display: 'inline-block',
                  }}
                />
              ))}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
