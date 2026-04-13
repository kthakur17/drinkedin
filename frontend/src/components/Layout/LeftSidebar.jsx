/**
 * LeftSidebar — profile summary + navigation links
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Home Feed', emoji: '🏠', end: true },
  { to: '/confessions', label: 'Confessions', emoji: '🤫' },
  { to: '/groups', label: 'Groups', emoji: '🍺' },
  { to: '/notifications', label: 'Notifications', emoji: '🔔' },
];

export default function LeftSidebar() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-3">
      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Cover strip with animated gradient */}
        <div className="h-16 bg-gold-gradient relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-7 left-4">
            <div className="w-14 h-14 rounded-full border-[3px] border-navy-800 bg-navy-600 flex items-center justify-center text-2xl overflow-hidden shadow-lg ring-2 ring-gold-600/20">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : '👤'
              }
            </div>
          </div>
        </div>

        <div className="p-4 pt-10">
          <NavLink to="/profile" className="block group">
            <h3 className="font-display font-bold text-white leading-tight group-hover:text-gold-400 transition-colors">
              {user?.alias || user?.username}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">@{user?.username}</p>
          </NavLink>

          {(user?.jobTitle || user?.company) && (
            <p className="text-gray-400 text-xs mt-2 leading-relaxed">
              {user?.jobTitle}
              {user?.jobTitle && user?.company && ' · '}
              {user?.company}
            </p>
          )}

          {user?.corporatePersona && (
            <span className="badge-pill mt-2 text-xs">
              🎭 {user.corporatePersona}
            </span>
          )}

          {/* Stats row */}
          <div className="divider" />
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <p className="stat-value text-sm">{user?.followers?.length || 0}</p>
              <p className="stat-label">Followers</p>
            </div>
            <div className="w-px bg-navy-600" />
            <div className="flex-1">
              <p className="stat-value text-sm">{user?.following?.length || 0}</p>
              <p className="stat-label">Following</p>
            </div>
            <div className="w-px bg-navy-600" />
            <div className="flex-1">
              <p className="stat-value text-sm">{user?.postCount || 0}</p>
              <p className="stat-label">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="card p-2">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
            >
              <span className="text-lg w-6 text-center">{item.emoji}</span>
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Badges preview */}
      {user?.badges?.length > 0 && (
        <div className="card p-4">
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>🏆</span> My Badges
          </h4>
          <div className="flex flex-wrap gap-2">
            {user.badges.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="w-9 h-9 rounded-xl bg-navy-700 border border-navy-600 flex items-center justify-center text-lg
                           hover:scale-110 hover:border-gold-700 hover:bg-navy-600 transition-all duration-200 cursor-default"
                title={`${b.name} — ${b.description}`}
              >
                {b.emoji}
              </div>
            ))}
          </div>
          {user.badges.length > 6 && (
            <p className="text-gray-600 text-xs mt-2">+{user.badges.length - 6} more</p>
          )}
        </div>
      )}
    </div>
  );
}
