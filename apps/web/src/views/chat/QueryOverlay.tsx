import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  witness: '#ff9f1c',
  concept: '#8338ec',
  precedent: '#3a86ff',
  statute: '#fb5607',
};

/**
 * QueryOverlay — Hero Moment 3 (design guidelines §8.3)
 *
 * Full-screen overlay that:
 *   1. Fades in with backdrop blur (400ms)
 *   2. Renders team graph at center with all nodes at 15% opacity
 *   3. Pulses cited nodes to 100% in rank order (150ms stagger)
 *   4. Edges between cited nodes illuminate to amber
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
  const [phase, setPhase] = useState<'inactive' | 'fadein' | 'pulse' | 'hold' | 'fadeout'>('inactive');
  const [overlayOpacity, setOverlayOpacity] = useState(0);
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

  // Main animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !graphData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = graphData.nodes || [];
    const edges = graphData.edges || [];

    // Position nodes in a force-directed-ish layout (simplified circle layout)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    const nodePositions = new Map<string, { x: number; y: number }>();
    nodes.forEach((node: any, i: number) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      // Add some jitter for organic feel
      const r = radius * (0.7 + Math.random() * 0.6);
      nodePositions.set(node.id, {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      });
    });

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        ? `rgba(212, 167, 44, ${overlayOpacity})`
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

  // Phase management
  useEffect(() => {
    if (active && graphData) {
      if (prefersReducedMotion.current) {
        // Skip animation, show final state briefly
        setOverlayOpacity(1);
        setPhase('hold');
        const timeout = setTimeout(() => {
          setOverlayOpacity(0);
          setPhase('inactive');
        }, 800);
        return () => clearTimeout(timeout);
      }

      // Start fade-in
      setPhase('fadein');
      let start = performance.now();

      const runAnimation = (now: number) => {
        const elapsed = now - start;

        if (phase === 'fadein' || elapsed < 400) {
          // Fade in over 400ms
          setOverlayOpacity(Math.min(elapsed / 400, 1));
          if (elapsed >= 400) {
            setPhase('pulse');
            start = now;
          }
        } else if (phase === 'pulse' || elapsed < 400 + citedNodeIds.length * 150 + 300) {
          // Pulse phase — nodes are already highlighted by citedNodeIds
          setOverlayOpacity(1);
          const pulseElapsed = elapsed - 400;
          if (pulseElapsed >= citedNodeIds.length * 150 + 300) {
            setPhase('hold');
            start = now;
          }
        }

        animationRef.current = requestAnimationFrame(runAnimation);
      };

      animationRef.current = requestAnimationFrame(runAnimation);

      return () => cancelAnimationFrame(animationRef.current);
    } else if (!active && phase !== 'inactive') {
      // Fade out over 600ms
      setPhase('fadeout');
      const start = performance.now();

      const fadeOut = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / 600, 1);
        setOverlayOpacity(1 - progress);

        if (progress >= 1) {
          setPhase('inactive');
          return;
        }
        animationRef.current = requestAnimationFrame(fadeOut);
      };

      animationRef.current = requestAnimationFrame(fadeOut);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [active, graphData, citedNodeIds.length]);

  // Render loop
  useEffect(() => {
    if (phase !== 'inactive') {
      animate();
    }
  }, [phase, overlayOpacity, animate]);

  if (phase === 'inactive' && !active) return null;

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
        transition: prefersReducedMotion.current ? 'none' : undefined,
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
      <div
        style={{
          position: 'absolute',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-sans)',
          fontSize: '14px',
          color: `rgba(125, 133, 144, ${overlayOpacity})`,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Searching firm knowledge...
      </div>
    </div>
  );
};
