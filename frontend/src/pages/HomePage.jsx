/**
 * HomePage — Main feed with infinite scroll
 */

import { useState, useEffect, useCallback } from 'react';
import CreatePost from '../components/Feed/CreatePost';
import PostCard from '../components/Feed/PostCard';
import api from '../utils/api';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchFeed = useCallback(async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/feed?page=${pageNum}&limit=15`);
      const newPosts = res.data.posts || [];
      setPosts((prev) => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (_) {}
    setLoading(false);
    setInitialLoad(false);
  }, [loading]);

  useEffect(() => {
    fetchFeed(1);
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 400 &&
        hasMore &&
        !loading
      ) {
        fetchFeed(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, fetchFeed]);

  return (
    <div>
      <CreatePost onPostCreated={handlePostCreated} />

      {initialLoad ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <p className="text-5xl mb-4">🍺</p>
          <p className="text-gray-400 font-display text-xl mb-2">Your feed is empty</p>
          <p className="text-gray-600 text-sm">
            Follow some colleagues or be the first to post! 
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
            />
          ))}

          {loading && !initialLoad && (
            <div className="text-center py-6 text-gray-500 text-sm">
              Pouring more posts... 🍺
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-gray-600 text-sm border-t border-navy-700">
              You've reached the bottom of the barrel. 🪣
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex gap-3 mb-4">
            <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-2 w-20 rounded" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-4/5 rounded" />
            <div className="skeleton h-3 w-3/5 rounded" />
          </div>
          <div className="flex gap-4 pt-2 border-t border-navy-700">
            <div className="skeleton h-7 w-20 rounded-lg" />
            <div className="skeleton h-7 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
