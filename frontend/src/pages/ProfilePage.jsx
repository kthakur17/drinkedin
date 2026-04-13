/**
 * ProfilePage — user profile with badges, posts, follow/unfollow
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/Feed/PostCard';
import api from '../utils/api';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  const targetUsername = username || currentUser?.username;
  const isOwn = !username || username === currentUser?.username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    loadProfile();
  }, [targetUsername]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const profileRes = await api.get(`/users/${targetUsername}`);
      const p = profileRes.data.user;
      setProfile(p);
      setEditForm({
        alias: p.alias || '',
        jobTitle: p.jobTitle || '',
        company: p.company || '',
        bio: p.bio || '',
        corporatePersona: p.corporatePersona || 'Burnt Out Dev',
      });

      if (!isOwn) {
        if (currentUser.following?.some((f) => f._id === p._id || f === p._id)) {
          setFollowStatus('following');
        } else if (currentUser.sentRequests?.includes(p._id)) {
          setFollowStatus('requested');
        } else {
          setFollowStatus('not_following');
        }
      }

      const postsRes2 = await api.get(`/posts/user/${p._id}`);
      setPosts(postsRes2.data.posts || []);
    } catch (_) {}
    setLoading(false);
  };

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (followStatus === 'following') {
        await api.post(`/users/${profile._id}/unfollow`);
        setFollowStatus('not_following');
        window.dispatchEvent(new Event('feed-refresh'));
      } else {
        const res = await api.post(`/users/${profile._id}/follow`);
        setFollowStatus(res.data.status);
        if (res.data.status === 'following') {
          window.dispatchEvent(new Event('feed-refresh'));
        }
      }
    } catch (_) {}
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.put('/users/profile', editForm);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditMode(false);
    } catch (_) {}
    setSavingEdit(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card overflow-hidden">
          <div className="skeleton h-32 rounded-none" />
          <div className="p-5 pt-12 space-y-3">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-3 w-56 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-12 text-center animate-fade-in">
        <p className="text-5xl mb-4 animate-float">🤷</p>
        <p className="text-gray-400 font-display text-lg">User not found</p>
        <p className="text-gray-600 text-sm mt-1">They might have left the party.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gold-gradient relative group/cover">
          <div className="absolute inset-0 bg-gradient-to-t from-navy-800/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -bottom-10 left-5">
            <div className="w-20 h-20 rounded-full border-4 border-navy-800 bg-navy-600 flex items-center justify-center text-3xl overflow-hidden shadow-xl ring-2 ring-gold-600/20">
              {profile.avatar
                ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                : '👤'}
            </div>
          </div>

          {/* Follow / Edit button */}
          <div className="absolute bottom-3 right-4">
            {isOwn ? (
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-navy-800/90 backdrop-blur-sm border border-navy-600 text-gray-300 text-xs px-4 py-2 rounded-lg hover:border-gold-700 hover:text-gold-400 transition-all"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`text-xs px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  followStatus === 'following'
                    ? 'bg-navy-700/90 backdrop-blur-sm text-gray-400 border border-navy-600 hover:bg-red-900/30 hover:text-red-400 hover:border-red-800'
                    : followStatus === 'requested'
                    ? 'bg-navy-700/90 backdrop-blur-sm text-gray-500 border border-navy-600'
                    : 'bg-gold-gradient text-navy-900 shadow-gold hover:shadow-gold-glow hover:scale-[1.03] active:scale-[0.97]'
                }`}
              >
                {followStatus === 'following' ? '✓ Following' : followStatus === 'requested' ? 'Requested' : '+ Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="p-5 pt-14">
          {!editMode ? (
            <>
              <h1 className="font-display text-2xl font-bold text-white">
                {profile.alias || profile.username}
              </h1>
              <p className="text-gray-500 text-sm">@{profile.username}</p>

              {(profile.jobTitle || profile.company) && (
                <p className="text-gray-400 text-sm mt-2">
                  {profile.jobTitle}{profile.jobTitle && profile.company && ' · '}{profile.company}
                </p>
              )}
              {profile.bio && (
                <p className="text-gray-300 text-sm mt-2 leading-relaxed">{profile.bio}</p>
              )}
              {profile.corporatePersona && (
                <span className="badge-pill mt-3 inline-flex">🎭 {profile.corporatePersona}</span>
              )}

              {/* Stats */}
              <div className="flex gap-8 mt-5 pt-4 border-t border-navy-700">
                <div className="text-center">
                  <p className="stat-value">{profile.followers?.length || 0}</p>
                  <p className="stat-label">Followers</p>
                </div>
                <div className="text-center">
                  <p className="stat-value">{profile.following?.length || 0}</p>
                  <p className="stat-label">Following</p>
                </div>
                <div className="text-center">
                  <p className="stat-value">{profile.postCount || 0}</p>
                  <p className="stat-label">Posts</p>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSaveEdit} className="space-y-3 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-medium">Display alias</label>
                  <input className="input text-sm" value={editForm.alias} onChange={(e) => setEditForm((f) => ({ ...f, alias: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-medium">Job title</label>
                  <input className="input text-sm" value={editForm.jobTitle} onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1 font-medium">Company</label>
                <input className="input text-sm" value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1 font-medium">Bio</label>
                <textarea className="textarea text-sm" rows={2} value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingEdit} className="btn-primary text-sm">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg text-white mb-3 flex items-center gap-2">
            <span>🏆</span> Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2
                           hover:border-gold-700 hover:shadow-gold hover:scale-[1.02] transition-all duration-200 cursor-default"
                title={b.description}
              >
                <span className="text-xl">{b.emoji}</span>
                <div>
                  <p className="text-white text-xs font-semibold">{b.name}</p>
                  <p className="text-gray-600 text-xs">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts / Saved tabs */}
      <div>
        <div className="flex items-center gap-1 mb-3 px-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`font-display text-lg px-3 py-1 rounded-lg transition-all ${activeTab === 'posts' ? 'text-white bg-navy-700' : 'text-gray-500 hover:text-gray-300'}`}
          >
            📝 Posts
          </button>
          {isOwn && (
            <button
              onClick={async () => {
                setActiveTab('saved');
                if (savedPosts.length === 0) {
                  try {
                    const res = await api.get('/posts/saved');
                    setSavedPosts(res.data.posts || []);
                  } catch (_) {}
                }
              }}
              className={`font-display text-lg px-3 py-1 rounded-lg transition-all ${activeTab === 'saved' ? 'text-white bg-navy-700' : 'text-gray-500 hover:text-gray-300'}`}
            >
              🔖 Saved
            </button>
          )}
        </div>

        {activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-gray-500 text-sm">No posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 stagger-list">
              {posts.map((p) => (
                <PostCard key={p._id} post={p} onDelete={isOwn ? (id) => setPosts((prev) => prev.filter((x) => x._id !== id)) : undefined} />
              ))}
            </div>
          )
        ) : (
          savedPosts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-2">🔖</p>
              <p className="text-gray-500 text-sm">No saved posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 stagger-list">
              {savedPosts.map((p) => (
                <PostCard key={p._id} post={p} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
