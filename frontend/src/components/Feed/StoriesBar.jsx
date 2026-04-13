/**
 * StoriesBar — horizontal scrollable bar of 24h disappearing stories
 * Displayed above the feed. Fetches its own data from GET /api/stories/feed.
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';

export default function StoriesBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [viewerData, setViewerData] = useState(null); // { initialUserIndex }
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories/feed');
      setStories(res.data.stories || []);
    } catch (_) {
      // Silently fail — stories bar is non-critical
    } finally {
      setLoading(false);
    }
  };

  const hasUnseenStories = (storyGroup) => {
    if (!user?._id) return false;
    return storyGroup.items.some(
      (item) => !item.viewers?.includes(user._id)
    );
  };

  const handleStoryCreated = () => {
    setShowCreator(false);
    fetchStories();
  };

  const handleViewerClose = () => {
    setViewerData(null);
    // Refresh to update seen states
    fetchStories();
  };

  // Don't render anything while loading or if no stories and no user
  if (loading) {
    return (
      <div className="card p-4 mb-4">
        <div className="flex gap-4 overflow-hidden">
          {/* Skeleton placeholders */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-navy-700" />
              <div className="w-10 h-2 rounded bg-navy-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card p-4 mb-4 animate-fade-in">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* "Your Story" — always first */}
          <button
            onClick={() => setShowCreator(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center overflow-hidden ring-2 ring-navy-600 group-hover:ring-gold-500/50 transition-all duration-300">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-lg">👤</span>
                )}
              </div>
              {/* Gold "+" badge */}
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 text-xs font-bold shadow-lg ring-2 ring-navy-800">
                +
              </div>
            </div>
            <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors w-14 text-center truncate">
              Your Story
            </span>
          </button>

          {/* Other users' stories */}
          {stories.map((storyGroup, index) => {
            const unseen = hasUnseenStories(storyGroup);
            const author = storyGroup.author;

            return (
              <button
                key={author._id}
                onClick={() => setViewerData({ initialUserIndex: index })}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start group"
              >
                <div
                  className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    unseen
                      ? 'ring-2 ring-gold-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                      : 'ring-2 ring-gray-600'
                  }`}
                  style={
                    unseen
                      ? {
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
                          padding: '2px',
                        }
                      : undefined
                  }
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-navy-700 flex items-center justify-center">
                    {unseen ? (
                      /* Inner circle with 2px gap for the gradient ring effect */
                      <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-full overflow-hidden bg-navy-700 flex items-center justify-center">
                        {author.avatar ? (
                          <img src={author.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                    ) : author.avatar ? (
                      <img src={author.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition-colors w-14 text-center truncate">
                  {author.alias || author.username}
                </span>
              </button>
            );
          })}
        </div>

        {/* CSS to hide scrollbar */}
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      {/* Create Story Modal */}
      {showCreator && (
        <CreateStoryModal
          onClose={() => setShowCreator(false)}
          onCreated={handleStoryCreated}
        />
      )}

      {/* Story Viewer */}
      {viewerData && stories.length > 0 && (
        <StoryViewer
          stories={stories}
          initialUserIndex={viewerData.initialUserIndex}
          onClose={handleViewerClose}
        />
      )}
    </>
  );
}
