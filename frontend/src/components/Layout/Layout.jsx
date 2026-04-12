/**
 * Layout — main shell with top nav, left sidebar, outlet, right sidebar
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import NotificationToast from '../Notifications/NotificationToast';
import { useSocket } from '../../hooks/useSocket';
import { useWeekend } from '../../context/WeekendContext';

export default function Layout() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const { isWeekend, prompt } = useWeekend();

  // Real-time notifications via socket
  useSocket((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((c) => c + 1);
    setToasts((prev) => [
      ...prev,
      { id: Date.now(), message: notif.message, emoji: notif.badge?.emoji || '🔔' },
    ]);
  });

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen">
      <Navbar unreadCount={unreadCount} onClearUnread={() => setUnreadCount(0)} />

      {/* Weekend Banner */}
      {isWeekend && (
        <div className="border-b border-purple-800/40 weekend-banner py-2 px-4 text-center text-purple-300 text-sm font-medium animate-fade-in">
          🎉 Weekend Mode Activated — {prompt}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-16 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6">
        {/* Left sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <LeftSidebar />
          </div>
        </aside>

        {/* Main feed */}
        <main className="min-w-0">
          <Outlet />
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <RightSidebar />
          </div>
        </aside>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </div>
  );
}
