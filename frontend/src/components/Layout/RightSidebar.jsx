/**
 * RightSidebar — Daily Mood Meter + Who to Follow suggestions
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const DRINK_RECS = {
  burnt_out: [
    { name: 'Espresso Martini', emoji: '☕🍸', tagline: 'Caffeinated desperation in a glass' },
    { name: 'Irish Coffee', emoji: '🥃☕', tagline: 'Because regular coffee gave up on you too' },
    { name: 'Double Shot of Anything', emoji: '🥃🥃', tagline: 'Standards? Never heard of them' },
  ],
  surviving: [
    { name: 'Craft Beer', emoji: '🍺', tagline: 'Sophisticated enough to pretend you\'re fine' },
    { name: 'Gin & Tonic', emoji: '🍸', tagline: 'The official drink of "I\'m managing"' },
    { name: 'Light Lager', emoji: '🍻', tagline: 'Low effort, just like your work today' },
  ],
  need_a_drink: [
    { name: 'Whiskey Sour', emoji: '🥃🍋', tagline: 'Sour, like your mood after that meeting' },
    { name: 'Old Fashioned', emoji: '🥃', tagline: 'For when you need something strong and reliable' },
    { name: 'Tequila Shot', emoji: '🧂🍋', tagline: 'Skip the chaser, embrace the chaos' },
  ],
  party_mode: [
    { name: 'Champagne', emoji: '🥂', tagline: 'Pop bottles, not production servers' },
    { name: 'Margarita', emoji: '🍹', tagline: 'Salt the rim, not your colleagues\' wounds' },
    { name: 'Jager Bomb', emoji: '💣', tagline: 'Tomorrow\'s hangover is future-you\'s problem' },
  ],
};

const MOODS = [
  { id: 'burnt_out',    label: 'Burnt Out',    emoji: '😭', bg: 'bg-red-900/40 border-red-700/50',    selected: 'bg-red-900/60 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' },
  { id: 'surviving',   label: 'Surviving',    emoji: '😐', bg: 'bg-yellow-900/40 border-yellow-700/50', selected: 'bg-yellow-900/60 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
  { id: 'need_a_drink',label: 'Need a Drink', emoji: '🍺', bg: 'bg-amber-900/40 border-amber-700/50',  selected: 'bg-amber-900/60 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
  { id: 'party_mode',  label: 'Party Mode',   emoji: '🥳', bg: 'bg-purple-900/40 border-purple-700/50', selected: 'bg-purple-900/60 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' },
];

export default function RightSidebar() {
  const navigate = useNavigate();
  const [todayMood, setTodayMood] = useState(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    fetchTodayMood();
    fetchSuggestions();
    fetchTrending();
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

  const fetchTrending = async () => {
    try {
      const res = await api.get('/hashtags/trending');
      setTrendingTags(res.data.hashtags || []);
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
      if (res.data.status === 'following') {
        window.dispatchEvent(new Event('feed-refresh'));
      }
    } catch (_) {}
  };

  const selectedMood = MOODS.find((m) => m.id === todayMood);

  // Stable daily drink rec
  const drinkRec = useMemo(() => {
    if (!todayMood || !DRINK_RECS[todayMood]) return null;
    const recs = DRINK_RECS[todayMood];
    const dayIndex = new Date().getDate() % recs.length;
    return recs[dayIndex];
  }, [todayMood]);

  return (
    <div className="flex flex-col gap-3">
      {/* Daily Mood Meter */}
      <div className="card p-4">
        <h4 className="text-gray-300 font-semibold text-sm mb-1 flex items-center gap-2">
          <span className="text-base">📊</span> Daily Mood Check-in
        </h4>
        <p className="text-gray-600 text-xs mb-3">How's the corporate suffering today?</p>

        {moodSaved && selectedMood ? (
          <div className={`flex items-center gap-3 rounded-xl p-3 border transition-all ${selectedMood.selected}`}>
            <span className="text-3xl">{selectedMood.emoji}</span>
            <div>
              <p className="text-white text-sm font-semibold">{selectedMood.label}</p>
              <button
                onClick={() => { setMoodSaved(false); setTodayMood(null); }}
                className="text-gray-400 text-xs hover:text-gold-400 transition-colors mt-0.5"
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
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-200
                  hover:scale-[1.03] active:scale-[0.97]
                  ${todayMood === m.id ? m.selected : `${m.bg} hover:brightness-125`}`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-gray-300 text-xs leading-tight font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drink Recommendation */}
      {moodSaved && drinkRec && (
        <div className="card p-4">
          <h4 className="text-gray-300 font-semibold text-sm mb-2 flex items-center gap-2">
            <span className="text-base">🍹</span> Today's Prescription
          </h4>
          <div className="bg-navy-800 rounded-xl p-3 border border-navy-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{drinkRec.emoji}</span>
              <span className="text-white font-semibold text-sm">{drinkRec.name}</span>
            </div>
            <p className="text-gray-500 text-xs italic">{drinkRec.tagline}</p>
          </div>
        </div>
      )}

      {/* Trending Hashtags */}
      {trendingTags.length > 0 && (
        <div className="card p-4">
          <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-base">🔥</span> Trending
          </h4>
          <div className="flex flex-col gap-1.5">
            {trendingTags.slice(0, 6).map((t) => (
              <button
                key={t.tag}
                onClick={() => navigate(`/hashtag/${t.tag}`)}
                className="flex items-center justify-between px-2 py-1.5 -mx-2 rounded-lg hover:bg-navy-700/50 transition-colors text-left"
              >
                <span className="text-gold-400 text-sm font-medium">#{t.tag}</span>
                <span className="text-gray-600 text-xs">{t.count} posts</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Who to Follow */}
      {suggestions.length > 0 && (
        <div className="card p-4">
          <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="text-base">👥</span> Who to Follow
          </h4>

          <div className="flex flex-col gap-2.5 stagger-list">
            {suggestions.map((u) => {
              const status = followingMap[u._id];
              return (
                <div key={u._id} className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-navy-700/50 transition-all group">
                  <button
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden
                               ring-2 ring-transparent group-hover:ring-gold-600/30 transition-all"
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
                        : 'bg-gold-gradient text-navy-900 hover:shadow-gold hover:scale-[1.03] active:scale-[0.97]'
                    }`}
                  >
                    {status === 'following' ? '✓ Following' : status === 'requested' ? 'Requested' : '+ Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-2 py-3">
        <p className="text-gray-700 text-xs text-center leading-relaxed">
          Drinkedin © 2024<br />
          <span className="italic text-gray-600">"LinkedIn by Day, Drinkedin by Night"</span>
        </p>
      </div>
    </div>
  );
}
