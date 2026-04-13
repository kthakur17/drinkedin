/**
 * HashtagFeedPage — feed filtered by hashtag with infinite scroll
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../components/Feed/PostCard';
import api from '../utils/api';

export default function HashtagFeedPage() {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPosts = useCallback(async (pageNum = 1) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.get(`/feed/hashtag/${tag}?page=${pageNum}&limit=15`);
      const newPosts = res.data.posts || [];
      setPosts((prev) => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      setHasMore(res.data.hasMore);
      setTotalCount(res.data.totalCount || 0);
      setPage(pageNum);
    } catch (_) {}
    setLoading(false);
    setInitialLoad(false);
  }, [loading, tag]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoad(true);
    fetchPosts(1);
  }, [tag]);

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
        fetchPosts(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page, fetchPosts]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="card p-5 mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-900/20 via-navy-800 to-gold-900/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-600/10 rounded-full blur-3xl" />
        <div className="relative">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 text-xs hover:text-gold-400 transition-colors mb-2"
          >
            ← Back to Feed
          </button>
          <h1 className="font-display text-2xl text-gradient-gold">#{tag}</h1>
          {!initialLoad && (
            <p className="text-gray-400 text-sm mt-1">
              {totalCount} {totalCount === 1 ? 'post' : 'posts'}
            </p>
          )}
        </div>
      </div>

      {/* Posts */}
      {initialLoad ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center animate-fade-in">
          <div className="text-6xl mb-4 animate-float">#</div>
          <p className="text-gradient-gold font-display text-xl mb-2">No posts with #{tag}</p>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            Be the first to use this hashtag. Make history. Or at least a post.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 stagger-list">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={handlePostDeleted}
            />
          ))}

          {loading && !initialLoad && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
                <span className="w-4 h-4 border-2 border-gold-600/30 border-t-gold-500 rounded-full animate-spin" />
                Pouring more posts...
              </div>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-gray-600 text-sm border-t border-navy-700">
              <span className="text-lg">#</span>
              <p className="mt-1">That's everything tagged #{tag}.</p>
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
        <div key={i} className="card p-5">
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
            <div className="skeleton h-8 w-24 rounded-xl" />
            <div className="skeleton h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
