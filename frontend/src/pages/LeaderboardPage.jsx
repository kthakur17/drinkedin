/**
 * LeaderboardPage — weekly/monthly leaderboards across categories
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BOARDS = [
  { key: 'cheersLeaders', title: 'Most Cheers\'d', emoji: '🍺' },
  { key: 'postLeaders', title: 'Top Posters', emoji: '📝' },
  { key: 'memeLeaders', title: 'Meme Lords', emoji: '😂' },
  { key: 'confessionLeaders', title: 'Top Confessors', emoji: '🤫' },
];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/leaderboard?period=${period}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to load leaderboard. The scoreboard had too many drinks.');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-900/20 via-navy-800 to-gold-900/10" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold-600/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-2xl text-white flex items-center gap-2">
            <span>🏆</span> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Who's winning the corporate drinking game this {period === 'weekly' ? 'week' : 'month'}?
          </p>

          {/* Period Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'weekly'
                  ? 'bg-gold-gradient text-navy-900 shadow-gold'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === 'monthly'
                  ? 'bg-gold-gradient text-navy-900 shadow-gold'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-5 mb-4 border-red-800/40 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchLeaderboard} className="btn-secondary text-xs mt-3">Try Again</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-5 w-40 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="skeleton w-6 h-6 rounded" />
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="skeleton h-3 w-28 rounded" />
                    </div>
                    <div className="skeleton h-3 w-10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-list">
          {BOARDS.map((board) => {
            const leaders = data[board.key] || [];
            return (
              <div key={board.key} className="card p-5 card-hover">
                <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
                  <span>{board.emoji}</span> {board.title}
                </h2>

                {leaders.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    No leaders yet. Get drinking!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {leaders.map((entry, idx) => (
                      <div
                        key={entry.user?._id || idx}
                        onClick={() => entry.user?.username && navigate(`/profile/${entry.user.username}`)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer
                          ${idx < 3
                            ? 'bg-gold-900/10 border border-gold-800/20 hover:border-gold-700/40'
                            : 'hover:bg-navy-700/50'
                          }`}
                      >
                        {/* Rank */}
                        <span className="w-6 text-center text-lg flex-shrink-0">
                          {idx < 3 ? MEDALS[idx] : (
                            <span className="text-gray-500 text-sm font-medium">{idx + 1}</span>
                          )}
                        </span>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-sm overflow-hidden flex-shrink-0 ring-1 ring-navy-500">
                          {entry.user?.avatar ? (
                            <img src={entry.user.avatar} className="w-full h-full object-cover" alt="" />
                          ) : '👤'}
                        </div>

                        {/* Name */}
                        <span className="flex-1 text-sm text-gray-200 truncate font-medium">
                          {entry.user?.alias || entry.user?.username || 'Anonymous'}
                        </span>

                        {/* Count */}
                        <span className={`text-sm font-semibold flex-shrink-0 ${
                          idx === 0 ? 'text-gold-400' : 'text-gray-400'
                        }`}>
                          {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
