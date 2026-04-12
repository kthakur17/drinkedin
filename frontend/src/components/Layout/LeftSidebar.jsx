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

const MOOD_MAP = {
  burnt_out: { label: 'Burnt Out', emoji: '😭', color: 'text-red-400' },
  surviving: { label: 'Surviving', emoji: '😐', color: 'text-yellow-400' },
  need_a_drink: { label: 'Need a Drink', emoji: '🍺', color: 'text-amber-400' },
  party_mode: { label: 'Party Mode', emoji: '🥳', color: 'text-purple-400' },
};

export default function LeftSidebar() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-3">
      {/* Profile Card */}
      <div className="card p-4">
        {/* Cover strip */}
        <div className="h-14 rounded-xl bg-gold-gradient mb-4 -mx-4 -mt-4 relative">
          <div className="absolute -bottom-6 left-4">
            <div className="w-14 h-14 rounded-full border-4 border-navy-800 bg-navy-600 flex items-center justify-center text-2xl overflow-hidden shadow-lg">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : '👤'
              }
            </div>
          </div>
        </div>

        <div className="mt-8">
          <NavLink to="/profile" className="block hover:text-gold-400 transition-colors">
            <h3 className="font-display font-bold text-white leading-tight">
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
        </div>

        {/* Stats row */}
        <div className="divider" />
        <div className="flex justify-between text-center">
          <div>
            <p className="text-gold-400 font-semibold text-sm">{user?.followers?.length || 0}</p>
            <p className="text-gray-600 text-xs">Followers</p>
          </div>
          <div>
            <p className="text-gold-400 font-semibold text-sm">{user?.following?.length || 0}</p>
            <p className="text-gray-600 text-xs">Following</p>
          </div>
          <div>
            <p className="text-gold-400 font-semibold text-sm">{user?.postCount || 0}</p>
            <p className="text-gray-600 text-xs">Posts</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="card p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : 'nav-link'
            }
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Badges preview */}
      {user?.badges?.length > 0 && (
        <div className="card p-4">
          <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            My Badges
          </h4>
          <div className="flex flex-wrap gap-2">
            {user.badges.slice(0, 6).map((b) => (
              <div
                key={b.id}
                className="text-xl cursor-default"
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
