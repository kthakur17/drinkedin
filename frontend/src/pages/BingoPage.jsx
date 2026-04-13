/**
 * BingoPage — corporate bingo with 5x5 grid and weekly leaderboard
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function BingoPage() {
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingIndex, setMarkingIndex] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [celebration, setCelebration] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetchCard();
    fetchLeaders();
  }, []);

  const fetchCard = async () => {
    try {
      const res = await api.get('/bingo/card');
      setCard(res.data);
    } catch (err) {
      setError('Failed to load your bingo card. HR must be involved.');
    }
    setLoading(false);
  };

  const fetchLeaders = async () => {
    try {
      const res = await api.get('/bingo/leaderboard');
      setLeaders(res.data.leaders || []);
    } catch (_) {}
    setLoadingLeaders(false);
  };

  const handleMark = async (squareIndex) => {
    if (!card || markingIndex !== null) return;
    // Don't mark already marked squares or the free space
    if (card.squares[squareIndex].marked) return;
    if (squareIndex === 12) return; // center free space

    setMarkingIndex(squareIndex);
    try {
      const res = await api.post('/bingo/card/mark', { squareIndex });
      const prevLines = card.completedLines || 0;
      setCard(res.data);

      // Celebrate new line completions
      if (res.data.completedLines > prevLines) {
        setCelebration(res.data.isBlackout ? 'blackout' : 'line');
        setTimeout(() => setCelebration(null), 3000);
      }
    } catch (_) {}
    setMarkingIndex(null);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await api.post('/bingo/card/share');
      setCelebration('shared');
      setTimeout(() => setCelebration(null), 2000);
    } catch (_) {}
    setSharing(false);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card p-5 mb-4">
          <div className="skeleton h-7 w-48 rounded mb-2" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
        <div className="card p-5">
          <div className="grid grid-cols-5 gap-2">
            {[...Array(25)].map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <p className="text-5xl mb-4 animate-float">🎯</p>
        <p className="text-red-400 font-display text-lg">{error}</p>
        <button onClick={() => { setError(null); setLoading(true); fetchCard(); }} className="btn-secondary text-sm mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Celebration Overlay */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-scale-in text-center">
            {celebration === 'blackout' ? (
              <>
                <p className="text-6xl mb-4">🎉🍺🎉</p>
                <p className="font-display text-3xl text-gradient-gold">BLACKOUT!</p>
                <p className="text-gray-300 text-lg mt-2">You've completed the entire board!</p>
              </>
            ) : celebration === 'line' ? (
              <>
                <p className="text-6xl mb-4">🎊🍻🎊</p>
                <p className="font-display text-3xl text-gradient-gold">BINGO!</p>
                <p className="text-gray-300 text-lg mt-2">You completed a line!</p>
              </>
            ) : celebration === 'shared' ? (
              <>
                <p className="text-5xl mb-3">📢</p>
                <p className="font-display text-2xl text-gradient-gold">Shared!</p>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-900/20 via-navy-800 to-gold-900/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-white flex items-center gap-2">
              <span>🎯</span> Corporate Bingo
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Spot the corporate cliches. Mark your card. Win absolutely nothing.
            </p>
          </div>
          {card && (
            <div className="text-right flex-shrink-0">
              <p className="stat-value">{card.completedLines || 0}</p>
              <p className="stat-label">Lines</p>
            </div>
          )}
        </div>

        {/* Status badges */}
        {card && (
          <div className="relative flex gap-2 mt-3">
            {card.isBlackout && (
              <span className="badge-pill bg-gold-900/30 text-gold-400 border-gold-700">
                🏆 Blackout!
              </span>
            )}
            {card.completedLines > 0 && !card.isBlackout && (
              <span className="badge-pill">
                {card.completedLines} {card.completedLines === 1 ? 'line' : 'lines'} complete
              </span>
            )}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="btn-secondary text-xs py-1 px-3 ml-auto"
            >
              {sharing ? 'Sharing...' : '📢 Share Results'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Bingo Grid */}
        <div className="flex-1">
          <div className="card p-4">
            {card && (
              <div className="grid grid-cols-5 gap-2">
                {card.squares.map((square, idx) => {
                  const isFreeSpace = idx === 12;
                  const isMarked = square.marked || isFreeSpace;
                  const isMarking = markingIndex === idx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMark(idx)}
                      disabled={isMarked || isMarking}
                      className={`aspect-square rounded-lg p-1.5 flex flex-col items-center justify-center text-center
                        transition-all duration-200 border relative overflow-hidden
                        ${isFreeSpace
                          ? 'bg-gold-gradient border-gold-600 text-navy-900 shadow-gold cursor-default'
                          : isMarked
                          ? 'bg-gold-900/30 border-gold-700/50 text-gold-300 cursor-default'
                          : isMarking
                          ? 'bg-navy-600 border-navy-500 animate-pulse'
                          : 'bg-navy-800 border-navy-600 text-gray-300 hover:border-gold-700 hover:bg-navy-700 hover:shadow-gold cursor-pointer active:scale-95'
                        }`}
                    >
                      {isFreeSpace ? (
                        <>
                          <span className="text-lg font-bold">FREE</span>
                          <span className="text-xs">SPACE</span>
                          <span className="text-lg mt-0.5">🍺</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs leading-tight font-body line-clamp-3">
                            {square.phrase}
                          </span>
                          {isMarked && (
                            <span className="absolute top-1 right-1 text-gold-400 text-sm">✓</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard Side Panel */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="card p-5">
            <h2 className="font-display text-lg text-white mb-4 flex items-center gap-2">
              <span>🏆</span> This Week's Leaders
            </h2>

            {loadingLeaders ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-6 h-6 rounded" />
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="skeleton h-3 flex-1 rounded" />
                  </div>
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No leaders yet this week.
              </p>
            ) : (
              <div className="space-y-2">
                {leaders.map((entry, idx) => (
                  <div
                    key={entry.user?._id || idx}
                    onClick={() => entry.user?.username && navigate(`/profile/${entry.user.username}`)}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer
                      ${idx < 3 ? 'bg-gold-900/10 border border-gold-800/20' : 'hover:bg-navy-700/50'}`}
                  >
                    <span className="w-5 text-center flex-shrink-0">
                      {idx < 3
                        ? ['🥇', '🥈', '🥉'][idx]
                        : <span className="text-gray-500 text-xs">{idx + 1}</span>}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                      {entry.user?.avatar ? (
                        <img src={entry.user.avatar} className="w-full h-full object-cover" alt="" />
                      ) : '👤'}
                    </div>
                    <span className="text-sm text-gray-200 truncate flex-1">
                      {entry.user?.alias || entry.user?.username || 'Anon'}
                    </span>
                    <span className="text-xs text-gold-400 font-semibold flex-shrink-0">
                      {entry.completedLines || 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
