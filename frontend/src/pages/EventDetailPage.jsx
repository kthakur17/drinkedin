/**
 * EventDetailPage — single event with countdown, RSVP, and attendee list
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EVENT_TYPE_MAP = {
  happy_hour: { emoji: '🍻', label: 'Happy Hour' },
  rant_session: { emoji: '😤', label: 'Rant Session' },
  fake_meeting: { emoji: '🤡', label: 'Fake Meeting' },
  actual_work: { emoji: '💼', label: 'Actual Work' },
  other: { emoji: '🎉', label: 'Other' },
};

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(computeDiff(targetDate));

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      setTimeLeft(computeDiff(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function computeDiff(targetDate) {
  if (!targetDate) return null;
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const countdown = useCountdown(event?.date);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.event || res.data);
    } catch (err) {
      setError('Event not found. It was probably cancelled. Classic.');
    }
    setLoading(false);
  };

  const handleRsvp = async (status) => {
    setRsvpLoading(status);
    try {
      const res = await api.post(`/events/${id}/rsvp`, { status });
      setEvent(res.data.event || res.data);
    } catch (_) {}
    setRsvpLoading(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this event? There\'s no undo. Like most corporate decisions.')) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${id}`);
      navigate('/events');
    } catch (_) {}
    setDeleting(false);
  };

  const isCreator = event?.creator?._id === user?._id || event?.creator === user?._id;

  const getUserRsvpStatus = () => {
    if (!event?.rsvps || !user) return null;
    const rsvp = event.rsvps.find(
      (r) => r.user?._id === user._id || r.user === user._id
    );
    return rsvp?.status || null;
  };

  const currentRsvp = getUserRsvpStatus();

  const groupedRsvps = {
    going: (event?.rsvps || []).filter((r) => r.status === 'going'),
    maybe: (event?.rsvps || []).filter((r) => r.status === 'maybe'),
    cant_make_it: (event?.rsvps || []).filter((r) => r.status === 'cant_make_it'),
  };

  const typeMeta = EVENT_TYPE_MAP[event?.type] || { emoji: '🎉', label: event?.type };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card p-5">
          <div className="skeleton h-3 w-20 rounded mb-4" />
          <div className="skeleton h-7 w-64 rounded mb-3" />
          <div className="skeleton h-3 w-full rounded mb-2" />
          <div className="skeleton h-3 w-3/4 rounded mb-4" />
          <div className="flex gap-4">
            <div className="skeleton h-16 w-24 rounded-lg" />
            <div className="skeleton h-16 w-24 rounded-lg" />
            <div className="skeleton h-16 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <p className="text-5xl mb-4 animate-float">📅</p>
        <p className="text-red-400 font-display text-lg">{error}</p>
        <button onClick={() => navigate('/events')} className="btn-secondary text-sm mt-4">
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Event Card */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-900/10 via-navy-800 to-navy-900" />
        <div className="relative">
          {/* Back & Actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/events')}
              className="text-gray-500 text-xs hover:text-gold-400 transition-colors"
            >
              ← All Events
            </button>
            {isCreator && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger text-xs py-1.5 px-3"
              >
                {deleting ? 'Deleting...' : '🗑 Delete Event'}
              </button>
            )}
          </div>

          {/* Title & Type */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-navy-700 border border-navy-600 flex items-center justify-center text-3xl flex-shrink-0">
              {typeMeta.emoji}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl text-white">{event.title}</h1>
              <span className="badge-pill mt-1 inline-flex">{typeMeta.label}</span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-gray-300 text-sm leading-relaxed mb-5">{event.description}</p>
          )}

          {/* Countdown Timer */}
          {countdown && (
            <div className="mb-5">
              {countdown.isPast ? (
                <div className="glass-card p-4 text-center border-gray-700/50">
                  <p className="text-gray-400 font-display text-lg">This event has passed</p>
                  <p className="text-gray-600 text-sm mt-1">You survived. Or missed it. Either way.</p>
                </div>
              ) : (
                <div className="glass-card p-4">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 text-center">Countdown</p>
                  <div className="flex justify-center gap-4">
                    <CountdownUnit value={countdown.days} label="Days" />
                    <CountdownUnit value={countdown.hours} label="Hours" />
                    <CountdownUnit value={countdown.minutes} label="Mins" />
                    <CountdownUnit value={countdown.seconds} label="Secs" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
            {event.date && (
              <div className="flex items-center gap-1.5">
                <span>📅</span>
                <span>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.creator && (
              <div className="flex items-center gap-1.5">
                <span>👤</span>
                <span>Created by {event.creator.alias || event.creator.username}</span>
              </div>
            )}
          </div>

          {/* RSVP Buttons */}
          <div className="border-t border-navy-700 pt-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your RSVP</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { status: 'going', emoji: '🍻', label: 'Going', activeClass: 'bg-green-900/30 border-green-700 text-green-300' },
                { status: 'maybe', emoji: '🤔', label: 'Maybe', activeClass: 'bg-yellow-900/30 border-yellow-700 text-yellow-300' },
                { status: 'cant_make_it', emoji: '😢', label: "Can't Make It", activeClass: 'bg-red-900/30 border-red-700 text-red-300' },
              ].map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => handleRsvp(opt.status)}
                  disabled={rsvpLoading !== null}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
                    ${currentRsvp === opt.status
                      ? opt.activeClass
                      : 'bg-navy-700 border-navy-600 text-gray-400 hover:border-gold-800 hover:text-gray-300'
                    }
                    ${rsvpLoading === opt.status ? 'animate-pulse' : ''}`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RsvpGroup
          title="Going"
          emoji="🍻"
          rsvps={groupedRsvps.going}
          accentClass="border-green-800/30"
        />
        <RsvpGroup
          title="Maybe"
          emoji="🤔"
          rsvps={groupedRsvps.maybe}
          accentClass="border-yellow-800/30"
        />
        <RsvpGroup
          title="Can't Make It"
          emoji="😢"
          rsvps={groupedRsvps.cant_make_it}
          accentClass="border-red-800/30"
        />
      </div>
    </div>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <div className="text-center">
      <p className="stat-value text-2xl font-display text-gradient-gold">
        {String(value).padStart(2, '0')}
      </p>
      <p className="stat-label text-xs">{label}</p>
    </div>
  );
}

function RsvpGroup({ title, emoji, rsvps, accentClass }) {
  return (
    <div className={`card p-4 ${accentClass}`}>
      <h3 className="font-display text-sm text-white mb-3 flex items-center gap-1.5">
        <span>{emoji}</span> {title}
        <span className="text-gray-500 font-body ml-1">({rsvps.length})</span>
      </h3>
      {rsvps.length === 0 ? (
        <p className="text-gray-600 text-xs">No one yet</p>
      ) : (
        <div className="space-y-2">
          {rsvps.map((rsvp, idx) => {
            const u = rsvp.user;
            return (
              <div key={u?._id || idx} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs overflow-hidden flex-shrink-0 ring-1 ring-navy-500">
                  {u?.avatar ? (
                    <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                  ) : '👤'}
                </div>
                <span className="text-sm text-gray-300 truncate">
                  {u?.alias || u?.username || 'Someone'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
