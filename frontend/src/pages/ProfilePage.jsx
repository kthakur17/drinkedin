/**
 * ProfilePage — user profile with badges, posts, follow/unfollow
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/Feed/PostCard';
import api from '../utils/api';

const MOOD_HISTORY_COLORS = {
  burnt_out:    'bg-red-800',
  surviving:    'bg-yellow-800',
  need_a_drink: 'bg-amber-700',
  party_mode:   'bg-purple-800',
};

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();

  // If no username param, show own profile
  const targetUsername = username || currentUser?.username;
  const isOwn = !username || username === currentUser?.username;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetUsername]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.get(`/users/${targetUsername}`),
        api.get(`/posts/user/${isOwn ? currentUser._id : 'placeholder'}`),
      ]);
      const p = profileRes.data.user;
      setProfile(p);
      setEditForm({
        alias: p.alias || '',
        jobTitle: p.jobTitle || '',
        company: p.company || '',
        bio: p.bio || '',
        corporatePersona: p.corporatePersona || 'Burnt Out Dev',
      });

      // Determine follow status
      if (!isOwn) {
        if (currentUser.following?.some((f) => f._id === p._id || f === p._id)) {
          setFollowStatus('following');
        } else if (currentUser.sentRequests?.includes(p._id)) {
          setFollowStatus('requested');
        } else {
          setFollowStatus('not_following');
        }
      }

      // Load posts
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
      } else {
        const res = await api.post(`/users/${profile._id}/follow`);
        setFollowStatus(res.data.status);
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
      <div className="animate-pulse space-y-4">
        <div className="card h-40" />
        <div className="card p-5 space-y-3">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">🤷</p>
        <p className="text-gray-400">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Card */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-28 bg-gold-gradient relative">
          <div className="absolute -bottom-8 left-5">
            <div className="w-20 h-20 rounded-full border-4 border-navy-800 bg-navy-600 flex items-center justify-center text-3xl overflow-hidden shadow-xl">
              {profile.avatar
                ? <img src={profile.avatar} className="w-full h-full object-cover" alt="" />
                : '👤'}
            </div>
          </div>

          {/* Follow / Edit button in cover corner */}
          <div className="absolute bottom-3 right-4">
            {isOwn ? (
              <button
                onClick={() => setEditMode(!editMode)}
                className="bg-navy-800/90 border border-navy-600 text-gray-300 text-xs px-3 py-1.5 rounded-lg hover:border-gold-700 transition-all"
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className={`text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${
                  followStatus === 'following'
                    ? 'bg-navy-700 text-gray-400 border border-navy-600'
                    : followStatus === 'requested'
                    ? 'bg-navy-700 text-gray-500 border border-navy-600'
                    : 'bg-gold-gradient text-navy-900'
                }`}
              >
                {followStatus === 'following' ? '✓ Following' : followStatus === 'requested' ? 'Requested' : '+ Follow'}
              </button>
            )}
          </div>
        </div>

        <div className="p-5 pt-12">
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
              <div className="flex gap-6 mt-4 pt-4 border-t border-navy-700">
                <div>
                  <p className="text-gold-400 font-semibold">{profile.followers?.length || 0}</p>
                  <p className="text-gray-600 text-xs">Followers</p>
                </div>
                <div>
                  <p className="text-gold-400 font-semibold">{profile.following?.length || 0}</p>
                  <p className="text-gray-600 text-xs">Following</p>
                </div>
                <div>
                  <p className="text-gold-400 font-semibold">{profile.postCount || 0}</p>
                  <p className="text-gray-600 text-xs">Posts</p>
                </div>
              </div>
            </>
          ) : (
            /* Edit form */
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Display alias</label>
                  <input className="input text-sm" value={editForm.alias} onChange={(e) => setEditForm((f) => ({ ...f, alias: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Job title</label>
                  <input className="input text-sm" value={editForm.jobTitle} onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Company</label>
                <input className="input text-sm" value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Bio</label>
                <textarea className="textarea text-sm" rows={2} value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingEdit} className="btn-primary text-sm">{savingEdit ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-ghost text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg text-white mb-3">🏆 Badges</h2>
          <div className="flex flex-wrap gap-3">
            {profile.badges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 hover:border-gold-700 transition-all"
                title={b.description}
              >
                <span className="text-xl">{b.emoji}</span>
                <div>
                  <p className="text-white text-xs font-medium">{b.name}</p>
                  <p className="text-gray-600 text-xs">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div>
        <h2 className="font-display text-lg text-white mb-3 px-1">
          📝 Posts
        </h2>
        {posts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 text-sm">No posts yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((p) => (
              <PostCard
                key={p._id}
                post={p}
                onDelete={isOwn ? (id) => setPosts((prev) => prev.filter((x) => x._id !== id)) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
