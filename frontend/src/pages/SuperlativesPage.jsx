/**
 * SuperlativesPage — vote for weekly superlatives and view past results
 */

import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function SuperlativesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('vote');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [error, setError] = useState(null);

  // Per-category state
  const [searchQueries, setSearchQueries] = useState({});
  const [searchResults, setSearchResults] = useState({});
  const [searchingFor, setSearchingFor] = useState({});
  const [selectedUsers, setSelectedUsers] = useState({});
  const [votingFor, setVotingFor] = useState(null);
  const [voteSuccess, setVoteSuccess] = useState({});

  const searchTimeoutRef = useRef({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults();
    }
  }, [activeTab, selectedWeek]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/superlatives');
      setCategories(res.data.categories || res.data.superlatives || []);
      if (res.data.weeks) setWeeks(res.data.weeks);
    } catch (err) {
      setError('Failed to load superlatives. The award ceremony is cancelled.');
    }
    setLoadingCategories(false);
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const url = selectedWeek
        ? `/superlatives/results?week=${selectedWeek}`
        : '/superlatives/results';
      const res = await api.get(url);
      setResults(res.data.results || []);
      if (res.data.weeks && weeks.length === 0) setWeeks(res.data.weeks);
    } catch (_) {
      setResults([]);
    }
    setLoadingResults(false);
  };

  const handleUserSearch = (categoryId, query) => {
    setSearchQueries((prev) => ({ ...prev, [categoryId]: query }));

    clearTimeout(searchTimeoutRef.current[categoryId]);
    if (!query.trim()) {
      setSearchResults((prev) => ({ ...prev, [categoryId]: [] }));
      return;
    }

    setSearchingFor((prev) => ({ ...prev, [categoryId]: true }));
    searchTimeoutRef.current[categoryId] = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        setSearchResults((prev) => ({ ...prev, [categoryId]: res.data.users || [] }));
      } catch (_) {
        setSearchResults((prev) => ({ ...prev, [categoryId]: [] }));
      }
      setSearchingFor((prev) => ({ ...prev, [categoryId]: false }));
    }, 300);
  };

  const handleSelectUser = (categoryId, selectedUser) => {
    setSelectedUsers((prev) => ({ ...prev, [categoryId]: selectedUser }));
    setSearchQueries((prev) => ({ ...prev, [categoryId]: '' }));
    setSearchResults((prev) => ({ ...prev, [categoryId]: [] }));
  };

  const handleVote = async (categoryId) => {
    const selectedUser = selectedUsers[categoryId];
    if (!selectedUser || votingFor) return;

    setVotingFor(categoryId);
    try {
      const res = await api.post(`/superlatives/${categoryId}/vote`, {
        nomineeId: selectedUser._id,
      });
      // Update category tallies
      setCategories((prev) =>
        prev.map((c) =>
          c._id === categoryId
            ? { ...c, tallies: res.data.tallies || c.tallies, userVote: selectedUser._id }
            : c
        )
      );
      setVoteSuccess((prev) => ({ ...prev, [categoryId]: true }));
      setTimeout(() => setVoteSuccess((prev) => ({ ...prev, [categoryId]: false })), 2000);
    } catch (_) {}
    setVotingFor(null);
  };

  const getTallies = (category) => {
    const tallies = category.tallies || category.leaderboard || [];
    return [...tallies].sort((a, b) => (b.votes || b.count || 0) - (a.votes || a.count || 0)).slice(0, 5);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-900/20 via-navy-800 to-gold-900/10" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold-600/10 rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-2xl text-white flex items-center gap-2">
            <span>🏆</span> Superlatives
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Vote for your colleagues' most notable achievements. "Notable" used loosely.
          </p>

          {/* Tab Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('vote')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'vote'
                  ? 'bg-gold-gradient text-navy-900 shadow-gold'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
              }`}
            >
              Vote
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'results'
                  ? 'bg-gold-gradient text-navy-900 shadow-gold'
                  : 'bg-navy-700 text-gray-400 hover:text-white border border-navy-600'
              }`}
            >
              Past Results
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-5 mb-4 border-red-800/40 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Vote Tab */}
      {activeTab === 'vote' && (
        <>
          {loadingCategories ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5">
                  <div className="skeleton h-5 w-48 rounded mb-4" />
                  <div className="skeleton h-10 w-full rounded mb-3" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="flex gap-2 items-center">
                        <div className="skeleton w-7 h-7 rounded-full" />
                        <div className="skeleton h-3 flex-1 rounded" />
                        <div className="skeleton h-3 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-5xl mb-4 animate-float">🏆</p>
              <p className="text-gradient-gold font-display text-xl mb-2">No superlatives this week</p>
              <p className="text-gray-500 text-sm">Check back soon. Awards need nominees.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 stagger-list">
              {categories.map((category) => {
                const tallies = getTallies(category);
                const catId = category._id;

                return (
                  <div key={catId} className="card p-5 card-hover">
                    <h2 className="font-display text-lg text-white mb-4">
                      {category.title || category.name}
                    </h2>

                    {/* User Search + Vote */}
                    <div className="relative mb-4">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          {selectedUsers[catId] ? (
                            <div className="input text-sm flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-navy-600 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                {selectedUsers[catId].avatar ? (
                                  <img src={selectedUsers[catId].avatar} className="w-full h-full object-cover" alt="" />
                                ) : '👤'}
                              </div>
                              <span className="text-gray-200 truncate">
                                {selectedUsers[catId].alias || selectedUsers[catId].username}
                              </span>
                              <button
                                onClick={() => setSelectedUsers((prev) => {
                                  const next = { ...prev };
                                  delete next[catId];
                                  return next;
                                })}
                                className="ml-auto text-gray-500 hover:text-red-400 transition-colors text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <input
                              className="input text-sm w-full"
                              placeholder="Search for a colleague to nominate..."
                              value={searchQueries[catId] || ''}
                              onChange={(e) => handleUserSearch(catId, e.target.value)}
                            />
                          )}

                          {/* Search Dropdown */}
                          {(searchResults[catId]?.length > 0) && !selectedUsers[catId] && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-600 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                              {searchResults[catId].map((u) => (
                                <button
                                  key={u._id}
                                  onClick={() => handleSelectUser(catId, u)}
                                  className="w-full flex items-center gap-3 p-2.5 hover:bg-navy-700 transition-colors text-left"
                                >
                                  <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                                    {u.avatar ? (
                                      <img src={u.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : '👤'}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-white text-sm truncate">{u.alias || u.username}</p>
                                    <p className="text-gray-500 text-xs truncate">@{u.username}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          {searchingFor[catId] && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-600 rounded-lg p-3 z-10">
                              <p className="text-gray-500 text-xs">Searching...</p>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleVote(catId)}
                          disabled={!selectedUsers[catId] || votingFor === catId}
                          className="btn-primary text-sm flex-shrink-0"
                        >
                          {votingFor === catId ? (
                            <span className="w-4 h-4 border-2 border-navy-800/30 border-t-navy-800 rounded-full animate-spin inline-block" />
                          ) : voteSuccess[catId] ? '✓ Voted!' : 'Vote'}
                        </button>
                      </div>
                    </div>

                    {/* Current Tallies */}
                    {tallies.length > 0 && (
                      <div className="border-t border-navy-700 pt-3">
                        <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Current Standings</p>
                        <div className="space-y-1.5">
                          {tallies.map((entry, idx) => {
                            const voteCount = entry.votes || entry.count || 0;
                            const maxVotes = tallies[0]?.votes || tallies[0]?.count || 1;
                            const barWidth = Math.max(8, (voteCount / maxVotes) * 100);

                            return (
                              <div key={entry.user?._id || idx} className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs overflow-hidden flex-shrink-0 ring-1 ring-navy-500">
                                  {entry.user?.avatar ? (
                                    <img src={entry.user.avatar} className="w-full h-full object-cover" alt="" />
                                  ) : '👤'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-sm text-gray-300 truncate">
                                      {entry.user?.alias || entry.user?.username || 'Anon'}
                                    </span>
                                    <span className="text-xs text-gold-400 font-semibold flex-shrink-0 ml-2">
                                      {voteCount}
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <>
          {/* Week Selector */}
          {weeks.length > 0 && (
            <div className="card p-4 mb-4">
              <label className="text-gray-400 text-xs font-medium mr-2">Week:</label>
              <select
                className="input text-sm inline-block w-auto"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option value="">Latest</option>
                {weeks.map((week) => (
                  <option key={week.value || week} value={week.value || week}>
                    {week.label || week}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadingResults ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-5 flex items-center gap-4">
                  <div className="skeleton w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-40 rounded" />
                    <div className="skeleton h-3 w-24 rounded" />
                  </div>
                  <div className="skeleton h-3 w-10 rounded" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-5xl mb-4 animate-float">🏆</p>
              <p className="text-gradient-gold font-display text-xl mb-2">No results yet</p>
              <p className="text-gray-500 text-sm">Winners will be announced at the end of the week.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 stagger-list">
              {results.map((result, idx) => (
                <div
                  key={result._id || idx}
                  className="card p-5 relative overflow-hidden card-hover"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-900/10 via-transparent to-transparent" />
                  <div className="relative flex items-center gap-4">
                    {/* Trophy / Winner Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-navy-700 border-2 border-gold-700/50 flex items-center justify-center text-2xl overflow-hidden shadow-gold">
                        {result.winner?.avatar ? (
                          <img src={result.winner.avatar} className="w-full h-full object-cover" alt="" />
                        ) : '👤'}
                      </div>
                      <span className="absolute -top-2 -right-2 text-xl">🏆</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">
                        {result.category?.title || result.category?.name || result.categoryTitle}
                      </p>
                      <p className="font-display text-lg text-gradient-gold truncate">
                        {result.winner?.alias || result.winner?.username || 'Anonymous'}
                      </p>
                      {result.winner?.username && (
                        <p className="text-gray-500 text-xs">@{result.winner.username}</p>
                      )}
                    </div>

                    {/* Vote Count */}
                    <div className="text-right flex-shrink-0">
                      <p className="stat-value text-gold-400">{result.votes || result.voteCount || 0}</p>
                      <p className="stat-label">votes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
