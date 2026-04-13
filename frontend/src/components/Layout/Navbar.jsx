/**
 * Navbar — top navigation with search and notification bell
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function Navbar({ unreadCount, onClearUnread }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQ)}`);
        setSearchResults(res.data.users);
      } catch (_) {}
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQ]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = () => {
    onClearUnread();
    navigate('/notifications');
  };

  return (
    <nav className="sticky top-0 z-40 bg-navy-900/90 backdrop-blur-xl border-b border-navy-600/80 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">💼🍺</span>
          <span className="font-display font-black text-gradient-gold text-xl hidden sm:block tracking-tight">
            Drinkedin
          </span>
        </Link>

        {/* Search */}
        <div ref={searchRef} className="flex-1 max-w-sm relative">
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search colleagues..."
            className="input py-2 pl-9 text-sm bg-navy-800/60"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-xl overflow-hidden z-50 animate-scale-in">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    navigate(`/profile/${u.username}`);
                    setSearchQ('');
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-700/60 transition-colors text-left group/result"
                >
                  <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center text-sm flex-shrink-0 overflow-hidden
                                  ring-2 ring-transparent group-hover/result:ring-gold-600/30 transition-all">
                    {u.avatar ? <img src={u.avatar} className="avatar w-full h-full" alt="" /> : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover/result:text-gold-400 transition-colors">{u.alias || u.username}</p>
                    <p className="text-gray-500 text-xs truncate">{u.jobTitle} {u.company ? `@ ${u.company}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Desktop nav links */}
          <Link to="/" className="btn-ghost hidden sm:flex text-lg" title="Home">🏠</Link>
          <Link to="/groups" className="btn-ghost hidden sm:flex text-lg" title="Groups">🍺</Link>
          <Link to="/confessions" className="btn-ghost hidden sm:flex text-lg" title="Confessions">🤫</Link>

          {/* Notifications */}
          <button
            onClick={handleNotifClick}
            className="btn-ghost relative text-lg"
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-gradient text-navy-900 text-xs font-bold rounded-full flex items-center justify-center animate-pulse-gold shadow-gold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-navy-700 transition-all group/menu"
            >
              <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-sm overflow-hidden flex-shrink-0
                              ring-2 ring-transparent group-hover/menu:ring-gold-600/30 transition-all">
                {user?.avatar
                  ? <img src={user.avatar} className="avatar w-full h-full" alt="" />
                  : <span>👤</span>
                }
              </div>
              <span className="text-gray-300 text-sm font-medium hidden sm:block max-w-[100px] truncate">
                {user?.alias || user?.username}
              </span>
              <span className={`text-gray-500 text-xs transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 glass-card rounded-xl overflow-hidden z-50 animate-scale-in">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-navy-700/60 text-gray-300 text-sm transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  👤 My Profile
                </Link>
                <Link
                  to="/notifications"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-navy-700/60 text-gray-300 text-sm transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  🔔 Notifications
                </Link>
                <div className="border-t border-navy-600/60 my-0" />
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-900/30 text-red-400 text-sm transition-colors"
                >
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
