/**
 * NotificationsPage — full notifications list
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const TYPE_CONFIG = {
  follow_request:  { emoji: '👋', label: 'Follow request',   accent: 'notif-accent-follow' },
  follow_accepted: { emoji: '🤝', label: 'Request accepted', accent: 'notif-accent-follow' },
  new_follower:    { emoji: '👥', label: 'New follower',      accent: 'notif-accent-follow' },
  post_like:       { emoji: '🍺', label: 'Post liked',        accent: 'notif-accent-like' },
  post_reaction:   { emoji: '🍺', label: 'Reaction',          accent: 'notif-accent-like' },
  post_comment:    { emoji: '💬', label: 'New comment',        accent: 'notif-accent-comment' },
  badge_earned:    { emoji: '🏆', label: 'Badge earned',       accent: 'notif-accent-badge' },
  repost:          { emoji: '🔁', label: 'Repost',             accent: 'notif-accent-like' },
  direct_message:  { emoji: '💬', label: 'Message',            accent: 'notif-accent-comment' },
  event_invite:    { emoji: '📅', label: 'Event',              accent: 'notif-accent-badge' },
  ama_answer:      { emoji: '❓', label: 'AMA Answer',         accent: 'notif-accent-comment' },
  poll_vote:       { emoji: '📊', label: 'Poll vote',          accent: 'notif-accent-like' },
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
        <div className="card p-5">
          <div className="skeleton h-6 w-40 rounded" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 flex gap-3">
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
    <div className="animate-fade-in">
      <div className="card p-5 mb-4">
        <h1 className="font-display text-2xl text-white flex items-center gap-2">
          <span>🔔</span> Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4 animate-float">🔕</p>
          <p className="text-gray-400 font-display text-lg">No notifications yet</p>
          <p className="text-gray-600 text-sm mt-1">Post something to start the chaos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 stagger-list">
          {notifications.map((notif) => {
            const meta = TYPE_CONFIG[notif.type] || { emoji: '🔔', label: '', accent: '' };
            return (
              <div
                key={notif._id}
                className={`card p-4 flex items-start gap-3 transition-all hover:shadow-card-hover ${meta.accent}
                  ${!notif.isRead ? 'border-gold-800/30 bg-gold-900/5' : ''}`}
              >
                {/* Sender avatar or badge emoji */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-navy-700 flex-shrink-0 overflow-hidden ring-1 ring-navy-600">
                  {notif.type === 'badge_earned'
                    ? notif.badge?.emoji || '🏆'
                    : notif.sender?.avatar
                    ? <img src={notif.sender.avatar} className="w-full h-full object-cover" alt="" />
                    : '👤'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm leading-snug">{notif.message}</p>
                  <p className="text-gray-600 text-xs mt-1 flex items-center gap-1.5">
                    <span>{meta.emoji}</span>
                    <span>{meta.label}</span>
                    <span className="text-gray-700">·</span>
                    <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                  </p>

                  {/* Follow request actions */}
                  {notif.type === 'follow_request' && !notif.resolved && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleFollowRequest(notif, 'accept')}
                        className="btn-primary text-xs py-1.5 px-4"
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
                    <p className={`text-xs mt-1.5 font-medium ${notif.resolved === 'accept' ? 'text-green-500' : 'text-gray-600'}`}>
                      {notif.resolved === 'accept' ? '✓ Accepted' : '✗ Declined'}
                    </p>
                  )}

                  {/* Navigate to post */}
                  {notif.post && (
                    <button
                      onClick={() => navigate('/')}
                      className="text-gold-600 text-xs mt-1.5 hover:text-gold-400 transition-colors font-medium"
                    >
                      View post →
                    </button>
                  )}
                </div>

                {!notif.isRead && (
                  <div className="w-2.5 h-2.5 rounded-full bg-gold-500 flex-shrink-0 mt-1.5 animate-pulse-gold" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
