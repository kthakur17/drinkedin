/**
 * GroupsPage — browse and join company communities
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups')
      .then((res) => setGroups(res.data.groups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleMembership = async (slug, isMember) => {
    try {
      if (isMember) {
        await api.post(`/groups/${slug}/leave`);
      } else {
        await api.post(`/groups/${slug}/join`);
      }
      setGroups((prev) =>
        prev.map((g) =>
          g.slug === slug
            ? { ...g, isMember: !isMember, memberCount: g.memberCount + (isMember ? -1 : 1) }
            : g
        )
      );
    } catch (_) {}
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card p-5">
          <div className="skeleton h-6 w-32 rounded mb-2" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-40">
              <div className="skeleton h-5 w-32 rounded mb-3" />
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-3/4 rounded mb-4" />
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="card p-5 mb-4">
        <h1 className="font-display text-2xl text-white mb-1 flex items-center gap-2">
          <span>🍺</span> Groups
        </h1>
        <p className="text-gray-400 text-sm">
          Your corporate tribe. Find your people.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-list">
        {groups.map((group) => (
          <div key={group.slug} className="card-hover p-5 cursor-pointer group">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1" onClick={() => navigate(`/groups/${group.slug}`)}>
                <h3 className="text-white font-display font-bold text-lg mb-1 group-hover:text-gold-400 transition-colors">
                  {group.name}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-3">
                  {group.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-sm">👥</span> {group.memberCount} members
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-sm">📝</span> {group.recentPosts} posts
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-navy-700">
              <button
                onClick={() => navigate(`/groups/${group.slug}`)}
                className="btn-ghost text-sm flex-1"
              >
                View Feed →
              </button>
              <button
                onClick={() => handleToggleMembership(group.slug, group.isMember)}
                className={`text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                  group.isMember
                    ? 'bg-navy-700 text-gray-400 border border-navy-600 hover:bg-red-900/30 hover:text-red-400 hover:border-red-800'
                    : 'bg-gold-gradient text-navy-900 shadow-gold hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.97]'
                }`}
              >
                {group.isMember ? 'Leave' : '+ Join'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
