/**
 * RightSidebar — Daily Mood Meter + Who to Follow suggestions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const MOODS = [
  { id: 'burnt_out',    label: 'Burnt Out',    emoji: '😭', color: 'hover:bg-red-900/40 data-[selected]:bg-red-900/60 data-[selected]:border-red-700' },
  { id: 'surviving',   label: 'Surviving',    emoji: '😐', color: 'hover:bg-yellow-900/40 data-[selected]:bg-yellow-900/60 data-[selected]:border-yellow-700' },
  { id: 'need_a_drink',label: 'Need a Drink', emoji: '🍺', color: 'hover:bg-amber-900/40 data-[selected]:bg-amber-900/60 data-[selected]:border-amber-700' },
  { id: 'party_mode',  label: 'Party Mode',   emoji: '🥳', color: 'hover:bg-purple-900/40 data-[selected]:bg-purple-900/60 data-[selected]:border-purple-700' },
];

export default function RightSidebar() {
  const navigate = useNavigate();
  const [todayMood, setTodayMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    fetchTodayMood();
    fetchSuggestions();
  }, []);

  const fetchTodayMood = async () => {
    try {
      const res = await api.get('/moods/today');
      if (res.data.mood) {
        setTodayMood(res.data.mood.mood);
        setMoodSaved(true);
      }
    } catch (_) {}
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/users/suggestions');
      setSuggestions(res.data.suggestions || []);
    } catch (_) {}
  };

  const handleMoodSelect = async (moodId) => {
    setTodayMood(moodId);
    try {
      await api.post('/moods', { mood: moodId });
      setMoodSaved(true);
    } catch (_) {}
  };

  const handleFollow = async (userId) => {
    try {
      const res = await api.post(`/users/${userId}/follow`);
      setFollowingMap((m) => ({ ...m, [userId]: res.data.status }));
    } catch (_) {}
  };

  const selectedMood = MOODS.find((m) => m.id === todayMood);

  return (
    <div className="flex flex-col gap-3">
      {/* Daily Mood Meter */}
      <div className="card p-4">
        <h4 className="text-gray-300 font-semibold text-sm mb-1 flex items-center gap-2">
          <span>📊</span> Daily Mood Check-in
        </h4>
        <p className="text-gray-600 text-xs mb-3">How's the corporate suffering today?</p>

        {moodSaved && selectedMood ? (
          <div className="flex items-center gap-3 bg-navy-800 rounded-xl p-3">
            <span className="text-2xl">{selectedMood.emoji}</span>
            <div>
              <p className="text-white text-sm font-medium">{selectedMood.label}</p>
              <button
                onClick={() => { setMoodSaved(false); setTodayMood(null); }}
                className="text-gray-600 text-xs hover:text-gold-400 transition-colors"
              >
                Change mood
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMoodSelect(m.id)}
                data-selected={todayMood === m.id ? '' : undefined}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border border-navy-600 text-center transition-all duration-150 ${m.color}`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-gray-300 text-xs leading-tight">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Who to Follow */}
      {suggestions.length > 0 && (
        <div className="card p-4">
          <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
            <span>👥</span> Who to Follow
          </h4>

          <div className="flex flex-col gap-3">
            {suggestions.map((u) => {
              const status = followingMap[u._id];
              return (
                <div key={u._id} className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden hover:ring-2 hover:ring-gold-600 transition-all"
                  >
                    {u.avatar
                      ? <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                      : '👤'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/profile/${u.username}`)}
                      className="text-white text-sm font-medium hover:text-gold-400 transition-colors block truncate text-left"
                    >
                      {u.alias || u.username}
                    </button>
                    <p className="text-gray-600 text-xs truncate">{u.corporatePersona}</p>
                  </div>
                  <button
                    onClick={() => handleFollow(u._id)}
                    disabled={!!status}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                      status === 'following'
                        ? 'bg-navy-600 text-gray-400'
                        : status === 'requested'
                        ? 'bg-navy-600 text-gray-500'
                        : 'bg-gold-gradient text-navy-900'
                    }`}
                  >
                    {status === 'following' ? 'Following' : status === 'requested' ? 'Requested' : '+ Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2">
        <p className="text-gray-700 text-xs text-center leading-relaxed">
          Drinkedin © 2024<br />
          <span className="italic">"LinkedIn by Day, Drinkedin by Night"</span>
        </p>
      </div>
    </div>
  );
}
