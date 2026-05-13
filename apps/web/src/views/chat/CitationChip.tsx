import React from 'react';

interface CitationChipProps {
  indices: number[];
  onClick: (index: number) => void;
}

/**
 * Inline citation chip: [1], [2,3] format.
 * Monospace, amber background, clickable.
 * Per design guidelines §9.6.
 */
export const CitationChip: React.FC<CitationChipProps> = ({ indices, onClick }) => {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={() => onClick(indices[0])}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(indices[0]);
        }
      }}
      style={{
        display: 'inline',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        lineHeight: 1.3,
        backgroundColor: 'var(--accent-primary-bg)',
        color: 'var(--accent-primary)',
        padding: '1px 5px',
        borderRadius: '3px',
        cursor: 'pointer',
        verticalAlign: 'super',
        transition: `background-color var(--duration-fast) var(--easing-default)`,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-primary-muted)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--accent-primary-bg)';
      }}
      aria-label={`Citation ${indices.join(', ')}`}
    >
      [{indices.join(',')}]
    </span>
  );
};
