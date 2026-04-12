/**
 * NotificationsPage — full notifications list
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const TYPE_ICONS = {
  follow_request:  { emoji: '👋', label: 'Follow request' },
  follow_accepted: { emoji: '🤝', label: 'Request accepted' },
  new_follower:    { emoji: '👥', label: 'New follower' },
  post_like:       { emoji: '🍺', label: 'Post liked' },
  post_comment:    { emoji: '💬', label: 'New comment' },
  badge_earned:    { emoji: '🏆', label: 'Badge earned' },
  repost:          { emoji: '🔁', label: 'Repost' },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      // Mark all as read
      await api.put('/notifications/mark-read');
    } catch (_) {}
    setLoading(false);
  };

  const handleFollowRequest = async (notif, action) => {
    try {
      await api.post(`/users/requests/${notif.sender._id}/${action}`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notif._id ? { ...n, resolved: action } : n
        )
      );
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse flex gap-3">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-2 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="card p-5 mb-4">
        <h1 className="font-display text-2xl text-white">🔔 Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🔕</p>
          <p className="text-gray-400">No notifications yet. Post something to start the chaos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => {
            const meta = TYPE_ICONS[notif.type] || { emoji: '🔔', label: '' };
            return (
              <div
                key={notif._id}
                className={`card p-4 flex items-start gap-3 transition-all ${!notif.isRead ? 'border-gold-800/40 bg-gold-900/5' : ''}`}
              >
                {/* Sender avatar or badge emoji */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-navy-700 flex-shrink-0 overflow-hidden">
                  {notif.type === 'badge_earned'
                    ? notif.badge?.emoji || '🏆'
                    : notif.sender?.avatar
                    ? <img src={notif.sender.avatar} className="w-full h-full object-cover" alt="" />
                    : '👤'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm leading-snug">{notif.message}</p>
                  <p className="text-gray-600 text-xs mt-1">
                    {meta.emoji} {meta.label} · {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>

                  {/* Follow request actions */}
                  {notif.type === 'follow_request' && !notif.resolved && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleFollowRequest(notif, 'accept')}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleFollowRequest(notif, 'decline')}
                        className="btn-ghost text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {notif.resolved && (
                    <p className="text-xs text-gray-600 mt-1">
                      {notif.resolved === 'accept' ? '✓ Accepted' : '✗ Declined'}
                    </p>
                  )}

                  {/* Navigate to post */}
                  {notif.post && (
                    <button
                      onClick={() => navigate('/')}
                      className="text-gold-600 text-xs mt-1 hover:text-gold-400 transition-colors"
                    >
                      View post →
                    </button>
                  )}
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
