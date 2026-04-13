/**
 * StoryViewer — full-screen overlay for viewing 24h stories
 * Supports auto-advance (5s), keyboard navigation, tap navigation,
 * progress bars, and automatic view tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const STORY_DURATION = 5000; // 5 seconds per story

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StoryViewer({ stories, initialUserIndex = 0, onClose }) {
  const { user } = useAuth();
  const [userIndex, setUserIndex] = useState(initialUserIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);
  const viewedRef = useRef(new Set());

  const currentGroup = stories[userIndex];
  const currentStory = currentGroup?.items?.[storyIndex];

  // Mark story as viewed
  const markViewed = useCallback(
    async (storyId) => {
      if (!storyId || viewedRef.current.has(storyId)) return;
      viewedRef.current.add(storyId);
      try {
        await api.post(`/stories/${storyId}/view`);
      } catch (_) {
        // Non-critical
      }
    },
    []
  );

  // Close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  // Navigate to next story
  const goNext = useCallback(() => {
    const group = stories[userIndex];
    if (storyIndex < group.items.length - 1) {
      // Next story in same user
      setStoryIndex((s) => s + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (userIndex < stories.length - 1) {
      // Next user
      setUserIndex((u) => u + 1);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      // All stories exhausted
      handleClose();
    }
  }, [userIndex, storyIndex, stories, handleClose]);

  // Navigate to previous story
  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((s) => s - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (userIndex > 0) {
      const prevGroup = stories[userIndex - 1];
      setUserIndex((u) => u - 1);
      setStoryIndex(prevGroup.items.length - 1);
      setProgress(0);
      elapsedRef.current = 0;
    }
    // If at very beginning, do nothing
  }, [userIndex, storyIndex, stories]);

  // Mark current story as viewed when it changes
  useEffect(() => {
    if (currentStory?._id) {
      markViewed(currentStory._id);
    }
  }, [currentStory?._id, markViewed]);

  // Auto-advance timer using requestAnimationFrame for smooth progress
  useEffect(() => {
    if (isPaused || !currentStory) return;

    startTimeRef.current = performance.now() - elapsedRef.current;
    let rafId;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        elapsedRef.current = 0;
        goNext();
        return;
      }

      elapsedRef.current = elapsed;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [userIndex, storyIndex, isPaused, currentStory, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, handleClose]);

  // Prevent body scroll while viewer is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  if (!currentGroup || !currentStory) return null;

  const author = currentGroup.author;
  const viewCount = currentStory.viewers?.length || 0;
  const isOwnStory = author._id === user?._id;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(5, 7, 15, 0.95)' }}
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Story card */}
      <div
        className={`relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl transition-transform duration-200 ${
          isClosing ? 'scale-95' : 'scale-100 animate-scale-in'
        }`}
        style={{ minHeight: '70vh', maxHeight: '85vh' }}
      >
        {/* Story content background */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor:
              currentStory.type === 'text'
                ? currentStory.backgroundColor || '#1e2d6b'
                : '#0a0f1e',
          }}
        >
          {currentStory.type === 'image' && currentStory.imageUrl ? (
            <img
              src={currentStory.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="px-6 py-12 flex items-center justify-center w-full h-full">
              <p className="text-white text-lg sm:text-xl font-semibold text-center leading-relaxed drop-shadow-lg break-words max-w-full">
                {currentStory.text}
              </p>
            </div>
          )}
        </div>

        {/* Top gradient overlay for readability */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-0 inset-x-0 flex gap-1 px-3 pt-3 z-10">
          {currentGroup.items.map((item, i) => (
            <div
              key={item._id}
              className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden"
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width:
                    i < storyIndex
                      ? '100%'
                      : i === storyIndex
                      ? `${progress * 100}%`
                      : '0%',
                  backgroundColor:
                    i <= storyIndex
                      ? '#fbbf24'
                      : 'transparent',
                }}
              />
            </div>
          ))}
        </div>

        {/* Author info + close */}
        <div className="absolute top-5 inset-x-0 flex items-center justify-between px-3 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-navy-700 overflow-hidden flex items-center justify-center ring-2 ring-white/20">
              {author.avatar ? (
                <img src={author.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight drop-shadow">
                {author.alias || author.username}
              </p>
              <p className="text-white/60 text-[10px] drop-shadow">
                {timeAgo(currentStory.createdAt)}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation tap zones */}
        <div className="absolute inset-0 flex z-[5]" style={{ minHeight: '70vh' }}>
          {/* Left half — previous */}
          <button
            className="flex-1 cursor-pointer focus:outline-none"
            onClick={goPrev}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            aria-label="Previous story"
          />
          {/* Right half — next */}
          <button
            className="flex-1 cursor-pointer focus:outline-none"
            onClick={goNext}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            aria-label="Next story"
          />
        </div>

        {/* View count at bottom */}
        <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-white/70 text-xs font-medium tabular-nums">
              {viewCount}
            </span>
          </div>
        </div>

        {/* Image caption overlay (for image stories with text) */}
        {currentStory.type === 'image' && currentStory.text && (
          <div className="absolute bottom-14 inset-x-0 px-4 z-10">
            <p className="text-white text-sm text-center drop-shadow-lg bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
              {currentStory.text}
            </p>
          </div>
        )}

        {/* User navigation indicators (left/right arrows for multi-user) */}
        {stories.length > 1 && (
          <>
            {userIndex > 0 && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </div>
            )}
            {userIndex < stories.length - 1 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
