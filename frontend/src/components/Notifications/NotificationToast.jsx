/**
 * NotificationToast — bottom-right real-time notification popup
 */

import { useEffect } from 'react';

export default function NotificationToast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="glass-card rounded-xl px-4 py-3 flex items-start gap-3 max-w-xs shadow-gold-lg animate-slide-in-right">
      <span className="text-xl flex-shrink-0">{toast.emoji}</span>
      <p className="text-gray-200 text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-600 hover:text-gray-300 text-lg flex-shrink-0 leading-none"
      >
        ×
      </button>
    </div>
  );
}
