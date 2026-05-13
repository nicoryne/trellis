import { useState } from 'react';
import TextCapture from './TextCapture';
import AudioCapture from './AudioCapture';
import ImageCapture from './ImageCapture';

type Tab = 'write' | 'record' | 'upload';

const TAB_LABELS: Record<Tab, string> = {
  write: 'Write',
  record: 'Record',
  upload: 'Upload',
};

export default function CaptureView() {
  const [activeTab, setActiveTab] = useState<Tab>('write');

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
      >
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom:
                activeTab === tab
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'write' && <TextCapture />}
        {activeTab === 'record' && <AudioCapture />}
        {activeTab === 'upload' && <ImageCapture />}
      </div>
    </div>
  );
}
