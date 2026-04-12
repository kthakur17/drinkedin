/**
 * ConfessionsPage — anonymous confessions feed
 */

import { useState, useEffect } from 'react';
import PostCard from '../components/Feed/PostCard';
import CreatePost from '../components/Feed/CreatePost';
import api from '../utils/api';

export default function ConfessionsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchConfessions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/posts/confessions?page=${pageNum}&limit=15`);
      const newPosts = res.data.posts || [];
      setPosts((prev) => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchConfessions(1); }, []);

  const handlePostCreated = (newPost) => {
    if (newPost.isAnonymous) {
      setPosts((prev) => [{ ...newPost, author: null }, ...prev]);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card p-5 mb-4 border-purple-800/40 bg-gradient-to-r from-navy-800 to-purple-900/20">
        <h1 className="font-display text-2xl text-white mb-1">🤫 Confessions</h1>
        <p className="text-gray-400 text-sm">
          Anonymous thoughts from your colleagues. We see you. We don't judge. We drink.
        </p>
      </div>

      {/* Create confession (always anonymous) */}
      <CreatePost
        onPostCreated={handlePostCreated}
        defaultAnonymous
      />

      {loading && posts.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🤫</p>
          <p className="text-gray-400">No confessions yet. Be the first to unburden your soul.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => fetchConfessions(page + 1)}
              disabled={loading}
              className="btn-secondary w-full"
            >
              {loading ? 'Loading...' : 'Load more confessions'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
