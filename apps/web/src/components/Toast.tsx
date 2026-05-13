// apps/web/src/components/Toast.tsx
import React, { useEffect, useState } from 'react';
import './toast.css';

interface ToastItem {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'warning';
}

let nextId = 0;
const listeners: Array<(items: ToastItem[]) => void> = [];
let items: ToastItem[] = [];

function notify(state: ToastItem[]) {
  items = state;
  listeners.forEach((fn) => fn(state));
}

export function showToast(message: string, variant: ToastItem['variant'] = 'success') {
  const id = ++nextId;
  notify([...items, { id, message, variant }]);
  setTimeout(() => notify(items.filter((t) => t.id !== id)), 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.variant}`} role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
}
