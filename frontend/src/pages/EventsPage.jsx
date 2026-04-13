/**
 * EventsPage — upcoming events list with create form
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const EVENT_TYPES = [
  { value: 'happy_hour', emoji: '🍻', label: 'Happy Hour' },
  { value: 'rant_session', emoji: '😤', label: 'Rant Session' },
  { value: 'fake_meeting', emoji: '🤡', label: 'Fake Meeting' },
  { value: 'actual_work', emoji: '💼', label: 'Actual Work' },
  { value: 'other', emoji: '🎉', label: 'Other' },
];

const getTypeEmoji = (type) => {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found ? found.emoji : '🎉';
};

const getTypeLabel = (type) => {
  const found = EVENT_TYPES.find((t) => t.value === type);
  return found ? found.label : type;
};

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'happy_hour',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data.events || []);
    } catch (err) {
      setError('Failed to load events. The party planner called in sick.');
    }
    setLoading(false);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.time) return;
    setSubmitting(true);
    try {
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString();
      const res = await api.post('/events', {
        title: form.title.trim(),
        description: form.description.trim(),
        date: dateTime,
        location: form.location.trim(),
        type: form.type,
      });
      setEvents((prev) => [res.data.event, ...prev]);
      setForm({ title: '', description: '', date: '', time: '', location: '', type: 'happy_hour' });
      setShowForm(false);
    } catch (_) {}
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card p-5">
          <div className="skeleton h-7 w-40 rounded mb-2" />
          <div className="skeleton h-3 w-56 rounded" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex gap-3 mb-3">
              <div className="skeleton w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
            </div>
            <div className="skeleton h-3 w-40 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-900/20 via-navy-800 to-gold-900/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/10 rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-white flex items-center gap-2">
              <span>📅</span> Events
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Corporate fun. Emphasis on the "corporate."
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm flex-shrink-0"
          >
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="card p-5 mb-4 border-gold-800/30 animate-slide-up">
          <h2 className="font-display text-lg text-white mb-4">New Event</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1 font-medium">Title *</label>
              <input
                className="input text-sm w-full"
                placeholder="Q4 Drinks & Despair"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1 font-medium">Description</label>
              <textarea
                className="textarea text-sm w-full"
                rows={3}
                placeholder="What fresh corporate hell awaits..."
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1 font-medium">Date *</label>
                <input
                  type="date"
                  className="input text-sm w-full"
                  value={form.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1 font-medium">Time *</label>
                <input
                  type="time"
                  className="input text-sm w-full"
                  value={form.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1 font-medium">Location</label>
              <input
                className="input text-sm w-full"
                placeholder="The usual bar / Zoom purgatory"
                value={form.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1 font-medium">Event Type</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {EVENT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleFormChange('type', type.value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all border
                      ${form.type === type.value
                        ? 'bg-gold-900/30 border-gold-700 text-gold-300'
                        : 'bg-navy-700 border-navy-600 text-gray-400 hover:border-gold-800 hover:text-gray-300'
                      }`}
                  >
                    {type.emoji} {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary text-sm">
                {submitting ? 'Creating...' : 'Create Event'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-5 mb-4 border-red-800/40 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4 animate-float">📅</p>
          <p className="text-gradient-gold font-display text-xl mb-2">No events yet</p>
          <p className="text-gray-500 text-sm">Create one and give people something to dread.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 stagger-list">
          {events.map((event) => (
            <div
              key={event._id}
              onClick={() => navigate(`/events/${event._id}`)}
              className="card p-5 card-hover cursor-pointer transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Type Icon */}
                <div className="w-12 h-12 rounded-xl bg-navy-700 border border-navy-600 flex items-center justify-center text-2xl flex-shrink-0">
                  {getTypeEmoji(event.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg text-white truncate">{event.title}</h3>
                    <span className="badge-pill text-xs flex-shrink-0">{getTypeLabel(event.type)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-400">
                    {event.date && (
                      <span className="flex items-center gap-1">
                        📅 {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        <span className="text-gray-600 ml-1">
                          ({formatDistanceToNow(new Date(event.date), { addSuffix: true })})
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                    {event.location && (
                      <span>📍 {event.location}</span>
                    )}
                    <span>
                      👥 {event.rsvpCount || event.rsvps?.length || 0} going
                    </span>
                    {event.creator && (
                      <span>
                        by {event.creator.alias || event.creator.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
