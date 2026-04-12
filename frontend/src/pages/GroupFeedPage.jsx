/**
 * GroupFeedPage — individual group feed
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreatePost from '../components/Feed/CreatePost';
import PostCard from '../components/Feed/PostCard';
import api from '../utils/api';

const GROUP_META = {
  developers: { name: 'Developers 🍺', description: 'Where bugs are features and coffee is blood.' },
  'qa-survivors': { name: 'QA Survivors 🐞', description: 'We break things so you don\'t have to. Usually.' },
  'managers-anonymous': { name: 'Managers Anonymous 😅', description: 'My team thinks I know what I\'m doing.' },
  'hr-fears-us': { name: 'HR Fears Us 😂', description: 'Unofficially the most dangerous group.' },
  'design-disasters': { name: 'Design Disasters 🎨', description: '"Can you make the logo bigger?" survivors.' },
  'sales-survivors': { name: 'Sales Survivors 💼', description: 'Commission pending. Always pending.' },
};

export default function GroupFeedPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const meta = GROUP_META[slug] || { name: slug, description: '' };

  useEffect(() => {
    api.get(`/groups/${slug}/feed`)
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div>
      <div className="card p-5 mb-4">
        <button onClick={() => navigate('/groups')} className="text-gray-500 text-xs hover:text-gold-400 transition-colors mb-2">
          ← All Groups
        </button>
        <h1 className="font-display text-2xl text-white">{meta.name}</h1>
        <p className="text-gray-400 text-sm mt-1">{meta.description}</p>
      </div>

      <CreatePost onPostCreated={(p) => setPosts((prev) => [p, ...prev])} groupSlug={slug} />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-32">
              <div className="skeleton h-3 w-full rounded mb-2" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🍺</p>
          <p className="text-gray-400">No posts yet. Be the founding poster.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard key={p._id} post={p} onDelete={(id) => setPosts((prev) => prev.filter((x) => x._id !== id))} />
          ))}
        </div>
      )}
    </div>
  );
}
