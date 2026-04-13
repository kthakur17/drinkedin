/**
 * NotificationToast — bottom-right popup for real-time notifications
 */

import { useEffect } from 'react';

export default function NotificationToast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="glass-card rounded-xl px-4 py-3 max-w-xs animate-slide-in-right shadow-gold flex items-start gap-3 group">
      <span className="text-xl flex-shrink-0">{toast.emoji}</span>
      <p className="text-gray-200 text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-500 hover:text-white text-sm flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5"
      >
        ×
      </button>
    </div>
  );
}
