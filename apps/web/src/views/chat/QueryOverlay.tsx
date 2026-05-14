import React, { useEffect, useRef, useState } from 'react';
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

/* ── Timing constants (design-guidelines §8.3 / vault/concepts/query-overlay-animation.md) ── */
const FADE_IN_MS = 400;
const PULSE_STAGGER_MS = 150; // Per cited node, in rank order
const PULSE_DURATION_MS = 300; // One pulse: scale 1 → 1.15 → 1
const FADE_OUT_MS = 600;
const ACCENT_RGB = '251, 133, 0';

/** Deterministic jitter so node positions don't shift between frames. */
function stableJitter(index: number, seed: number): number {
  const x = Math.sin(index * 9301 + seed * 49297) * 49297;
  return x - Math.floor(x);
}

/** Triangle pulse: 0 → 1 → 0 with peak at t=0.5. */
function triangle(t: number): number {
  return 1 - Math.abs(2 * t - 1);
}

/** Smooth ease-out for opacity ramps. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * QueryOverlay — Hero Moment 3 (design-guidelines §8.3,
 * vault/concepts/query-overlay-animation.md).
 *
 * Choreography:
 *   1. Backdrop fades in over 400ms (blur + dim)
 *   2. All nodes render at 15% opacity (the firm graph baseline)
 *   3. Cited nodes pulse to 100% in rank order, one every 150ms.
 *      Each pulse: scale 1.0 → 1.15 → 1.0 over 300ms, opacity 15% → 100%.
 *   4. Edges between cited nodes illuminate to accent-primary once BOTH
 *      endpoints have lit (progressive cited-path reveal).
 *   5. Holds until parent sets active=false → fade out over 600ms.
 *
 * Renderer: a single `<canvas>` with one rAF loop. Honors prefers-reduced-motion.
 */
export const QueryOverlay: React.FC<QueryOverlayProps> = ({
  active,
  citedNodeIds,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  // Animation phase state (refs — no React re-render per frame)
  const phaseRef = useRef<'in' | 'hold' | 'out'>('in');
  const phaseStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  // Fetch team graph once we're activated
  useEffect(() => {
    if (active && !graphData) {
      fetchTeamGraph(null).then((data) => setGraphData(data));
    }
  }, [active, graphData]);

  // Escape key dismisses
  useEffect(() => {
    if (!active) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, onDismiss]);

  // Drive phase transitions
  useEffect(() => {
    if (active && graphData && !visible) {
      setVisible(true);
      phaseRef.current = 'in';
      phaseStartRef.current = performance.now();
    } else if (!active && visible) {
      phaseRef.current = 'out';
      phaseStartRef.current = performance.now();
    }
  }, [active, graphData, visible]);

  // Single continuous rAF loop while visible
  useEffect(() => {
    if (!visible || !graphData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pre-compute node layout once (avoid re-laying-out every frame)
    const layoutNodes = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.32;
      const positions = new Map<string, { x: number; y: number }>();
      const nodes = graphData.nodes ?? [];
      nodes.forEach((node: any, i: number) => {
        const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1);
        const jitter = stableJitter(i, 42);
        const r = radius * (0.72 + jitter * 0.55);
        positions.set(node.id, {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        });
      });
      return positions;
    };

    let positions = layoutNodes();
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    // Indexed activation start time per cited node (rank order = array order)
    const activationStart = (citedIndex: number) =>
      FADE_IN_MS + citedIndex * PULSE_STAGGER_MS;

    /**
     * Per-node state at elapsed time.
     * @returns { progress: 0..1, scale: 1..1.15..1, isLit: boolean }
     */
    const nodeState = (nodeId: string, elapsed: number) => {
      const citedIndex = citedNodeIds.indexOf(nodeId);
      if (citedIndex < 0) {
        return { progress: 0, scale: 1, isLit: false };
      }
      // Reduced motion: snap to final state once fade-in completes
      if (prefersReducedMotion.current) {
        return { progress: elapsed > FADE_IN_MS ? 1 : 0, scale: 1, isLit: elapsed > FADE_IN_MS };
      }
      const start = activationStart(citedIndex);
      if (elapsed < start) {
        return { progress: 0, scale: 1, isLit: false };
      }
      const local = Math.min((elapsed - start) / PULSE_DURATION_MS, 1);
      const opacityProgress = easeOut(local);
      const scale = 1 + 0.15 * triangle(local);
      return { progress: opacityProgress, scale, isLit: local >= 1 };
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const now = performance.now();
      const elapsed = now - phaseStartRef.current;

      // Phase → overlay opacity envelope
      let envelope = 1;
      if (phaseRef.current === 'in') {
        envelope = Math.min(elapsed / FADE_IN_MS, 1);
      } else if (phaseRef.current === 'out') {
        envelope = Math.max(1 - elapsed / FADE_OUT_MS, 0);
        if (envelope <= 0) {
          setVisible(false);
          return;
        }
      }

      // Re-size canvas if viewport changed
      if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        positions = layoutNodes();
      }
      const dpr = window.devicePixelRatio || 1;
      const targetW = lastW * dpr;
      const targetH = lastH * dpr;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, lastW, lastH);

      const nodes = graphData.nodes ?? [];
      const edges = graphData.edges ?? [];

      // Edges first (so nodes render on top)
      for (const edge of edges) {
        const src = positions.get(edge.source_node_id);
        const tgt = positions.get(edge.target_node_id);
        if (!src || !tgt) continue;

        const srcState = nodeState(edge.source_node_id, elapsed);
        const tgtState = nodeState(edge.target_node_id, elapsed);
        const isCitedEdge = srcState.isLit && tgtState.isLit ||
          (srcState.progress > 0 && tgtState.progress > 0 && citedNodeIds.includes(edge.source_node_id) && citedNodeIds.includes(edge.target_node_id));
        // Edge progress = min of endpoint progresses (both must light up first)
        const edgeProgress = Math.min(srcState.progress, tgtState.progress);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        if (isCitedEdge && edgeProgress > 0) {
          ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${envelope * (0.4 + 0.6 * edgeProgress)})`;
          ctx.lineWidth = 1 + 1.4 * edgeProgress;
          ctx.shadowColor = `rgba(${ACCENT_RGB}, ${envelope * 0.5 * edgeProgress})`;
          ctx.shadowBlur = 8 * edgeProgress;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = `rgba(48, 54, 61, ${envelope * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // Nodes
      const baseSize = 5;
      const litSize = 9;
      for (const node of nodes) {
        const pos = positions.get(node.id);
        if (!pos) continue;

        const color = NODE_COLORS[node.node_type] ?? '#7d8590';
        const state = nodeState(node.id, elapsed);
        const isCited = citedNodeIds.includes(node.id);

        // Opacity: non-cited stays at 15%; cited ramps 15% → 100% via state.progress
        const nodeOpacity = isCited
          ? (0.15 + 0.85 * state.progress) * envelope
          : 0.15 * envelope;
        // Size: non-cited stays small; cited grows then pulses
        const size = isCited
          ? (baseSize + (litSize - baseSize) * state.progress) * state.scale
          : baseSize;

        // Outer glow halo for cited nodes once they've lit
        if (isCited && state.progress > 0.4) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, size + 6, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = nodeOpacity * 0.22 * state.progress;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = nodeOpacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible, graphData, citedNodeIds]);

  if (!visible) return null;

  // Container drives the React-level fade for the backdrop only.
  // The canvas paints its own time-based envelope, so this fade is purely
  // for the backdrop blur container (subtle, but lets us use motion).
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        backgroundColor: 'rgba(13, 17, 23, 0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      onClick={onDismiss}
      role="presentation"
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        aria-hidden
      />

      {/* Status label */}
      <AnimatePresence>
        <motion.div
          key="label"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1], delay: 0.2 }}
          style={{
            position: 'absolute',
            bottom: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          Searching firm knowledge
          <span style={{ display: 'inline-flex', gap: 4 }}>
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
      </AnimatePresence>

      {/* Escape hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.2, duration: 0.4 }}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.04em',
          pointerEvents: 'none',
        }}
      >
        ESC to dismiss
      </motion.div>
    </motion.div>
  );
};
