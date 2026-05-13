import React from 'react';
import type { ConfidenceLevel } from '../../types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  sourceCount?: number;
}

const BADGE_CONFIG: Record<ConfidenceLevel, { color: string; bg: string; dot: string; label: string }> = {
  high: {
    color: 'var(--success)',
    bg: 'rgba(63, 185, 80, 0.12)',
    dot: 'var(--success)',
    label: 'High',
  },
  medium: {
    color: 'var(--warning)',
    bg: 'rgba(210, 153, 34, 0.12)',
    dot: 'var(--warning)',
    label: 'Medium',
  },
  low: {
    color: 'var(--danger)',
    bg: 'rgba(248, 81, 73, 0.12)',
    dot: 'var(--danger)',
    label: 'Low',
  },
  refuse: {
    color: 'var(--text-muted)',
    bg: 'rgba(72, 79, 88, 0.12)',
    dot: 'var(--text-muted)',
    label: 'Insufficient',
  },
};

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, sourceCount }) => {
  const config = BADGE_CONFIG[confidence];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '12px',
        backgroundColor: config.bg,
        color: config.color,
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        fontWeight: 500,
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      Confidence: {config.label}
      {sourceCount !== undefined && (
        <span style={{ color: 'var(--text-secondary)', marginLeft: '2px' }}>
          · {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      )}
    </span>
  );
};
