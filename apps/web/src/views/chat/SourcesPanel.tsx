import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SourcesPanelProps {
  citedNodeIds: string[];
  // In a full implementation, we'd fetch node summaries. For now, show IDs.
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Expandable sources section at the bottom of an assistant response.
 * Collapsed by default for high-confidence; expanded for medium/low.
 */
export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  citedNodeIds,
  expanded,
  onToggle,
}) => {
  if (citedNodeIds.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '8px',
        borderRadius: '8px',
        border: '1px solid var(--border-muted)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-surface-raised)',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span>Sources ({citedNodeIds.length})</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div style={{ padding: '8px 12px', backgroundColor: 'var(--bg-surface)' }}>
          {citedNodeIds.map((id, idx) => (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <span
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: 500,
                  minWidth: '24px',
                }}
              >
                [{idx + 1}]
              </span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {id}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
