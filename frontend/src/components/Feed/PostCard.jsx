/**
 * PostCard — renders a single post with all interactions
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const MOOD_LABELS = {
  burnt_out:    { emoji: '😭', label: 'Burnt Out',    bg: 'bg-red-900/30 text-red-400' },
  surviving:    { emoji: '😐', label: 'Surviving',    bg: 'bg-yellow-900/30 text-yellow-400' },
  need_a_drink: { emoji: '🍺', label: 'Need a Drink', bg: 'bg-amber-900/30 text-amber-400' },
  party_mode:   { emoji: '🥳', label: 'Party Mode',   bg: 'bg-purple-900/30 text-purple-400' },
};

const MEME_COLORS = {
  standup:         'from-blue-900 to-navy-900',
  production_bug:  'from-red-900 to-navy-900',
  deadline_panic:  'from-orange-900 to-navy-900',
  client_call:     'from-green-900 to-navy-900',
};

export default function PostCard({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAnon, setCommentAnon] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isOwn = post.author?._id === user?._id;
  const isAnon = post.isAnonymous;
  const authorName = isAnon ? 'Anonymous Colleague 🤫' : (post.author?.alias || post.author?.username || 'Unknown');
  const authorAvatar = isAnon ? null : post.author?.avatar;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const mood = post.moodAtPost ? MOOD_LABELS[post.moodAtPost] : null;

  const handleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch (_) {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post._id}/comment`, {
        text: commentText,
        isAnonymous: commentAnon,
      });
      setPost((p) => ({ ...p, comments: [...(p.comments || []), res.data.comment] }));
      setCommentText('');
    } catch (_) {}
    setSubmittingComment(false);
  };

  const handleRepost = async () => {
    try {
      await api.post(`/posts/${post._id}/repost`);
      setPost((p) => ({ ...p, reposts: [...(p.reposts || []), user._id] }));
    } catch (_) {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? 🗑️')) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (_) {}
  };

  const alreadyReposted = post.reposts?.includes(user?._id);

  return (
    <article className="card p-5 post-enter animate-fade-in">
      {/* Repost indicator */}
      {post.repostOf && (
        <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
          <span>🔁</span> Reposted
        </p>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg overflow-hidden flex-shrink-0 ${isAnon ? 'bg-navy-600' : 'bg-navy-700'}`}>
            {isAnon ? '🤫' : (authorAvatar
              ? <img src={authorAvatar} className="w-full h-full object-cover" alt="" />
              : '👤')}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAnon ? (
                <span className="text-gray-300 font-medium text-sm">{authorName}</span>
              ) : (
                <Link
                  to={`/profile/${post.author?.username}`}
                  className="text-white font-medium text-sm hover:text-gold-400 transition-colors"
                >
                  {authorName}
                </Link>
              )}
              {!isAnon && post.author?.corporatePersona && (
                <span className="text-gold-600 text-xs">• {post.author.corporatePersona}</span>
              )}
              {mood && (
                <span className={`mood-tag ${mood.bg} text-xs`}>
                  {mood.emoji} {mood.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
              {!isAnon && post.author?.jobTitle && (
                <span>{post.author.jobTitle}</span>
              )}
              <span>{timeAgo}</span>
              {post.isWeekendPost && <span className="text-purple-400">🎉 weekend</span>}
              {post.group && <span className="text-gold-700">#{post.group}</span>}
            </div>
          </div>
        </div>

        {isOwn && (
          <button
            onClick={handleDelete}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm p-1 rounded"
            title="Delete post"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Content */}
      {post.type === 'meme' ? (
        <MemeDisplay post={post} />
      ) : (
        <>
          {post.text && (
            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-line mb-3">
              {post.text}
            </p>
          )}
          {post.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-3 max-h-96 bg-navy-800">
              <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </>
      )}

      {/* Reposted original */}
      {post.repostOf && (
        <div className="border border-navy-600 rounded-xl p-3 mb-3 bg-navy-800/50">
          <p className="text-gray-500 text-xs mb-1">
            Original by @{post.repostOf?.author?.username || 'unknown'}
          </p>
          <p className="text-gray-300 text-sm">{post.repostOf?.text}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-navy-700">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
            liked
              ? 'text-gold-400 bg-gold-900/30'
              : 'text-gray-500 hover:text-gold-400 hover:bg-navy-700'
          }`}
        >
          <span className={`text-base transition-transform ${liked ? 'scale-110' : ''}`}>
            {liked ? '🍺' : '🤍'}
          </span>
          <span className="font-medium">{likeCount > 0 ? likeCount : ''}</span>
          <span className="hidden sm:inline">{liked ? 'Cheers!' : 'Cheers'}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-blue-400 hover:bg-navy-700 transition-all"
        >
          <span className="text-base">💬</span>
          {post.comments?.length > 0 && <span className="font-medium">{post.comments.length}</span>}
          <span className="hidden sm:inline">Comment</span>
        </button>

        {/* Repost */}
        <button
          onClick={handleRepost}
          disabled={alreadyReposted}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
            alreadyReposted
              ? 'text-green-500 bg-green-900/20 cursor-default'
              : 'text-gray-500 hover:text-green-400 hover:bg-navy-700'
          }`}
        >
          <span className="text-base">🔁</span>
          {post.reposts?.length > 0 && <span className="font-medium">{post.reposts.length}</span>}
          <span className="hidden sm:inline">{alreadyReposted ? 'Reposted' : 'Repost'}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Existing comments */}
          {post.comments?.map((c, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden mt-0.5">
                {c.isAnonymous ? '🤫' : (c.author?.avatar
                  ? <img src={c.author.avatar} className="w-full h-full object-cover" alt="" />
                  : '👤')}
              </div>
              <div className="bg-navy-800 rounded-xl px-3 py-2 flex-1">
                <p className="text-gray-400 text-xs font-medium mb-0.5">
                  {c.isAnonymous ? 'Anonymous' : (c.author?.alias || c.author?.username || 'Unknown')}
                </p>
                <p className="text-gray-200 text-sm">{c.text}</p>
              </div>
            </div>
          ))}

          {/* Comment input */}
          <form onSubmit={handleComment} className="flex gap-2 items-start">
            <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs flex-shrink-0 mt-1 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : '👤'}
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="textarea py-2 text-sm"
                rows={2}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-gray-300">
                  <input
                    type="checkbox"
                    checked={commentAnon}
                    onChange={(e) => setCommentAnon(e.target.checked)}
                    className="accent-gold-500"
                  />
                  Post anonymously
                </label>
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="btn-primary py-1.5 px-3 text-xs disabled:opacity-50"
                >
                  {submittingComment ? '...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

// ── Meme display sub-component ────────────────────────────────────────────────
function MemeDisplay({ post }) {
  const gradient = MEME_COLORS[post.memeTemplate] || 'from-navy-800 to-navy-900';

  const TEMPLATE_LABELS = {
    standup:        '☕ Standup Meeting',
    production_bug: '🚨 Production Bug',
    deadline_panic: '⏰ Deadline Panic',
    client_call:    '📞 Client Call',
  };

  return (
    <div className={`relative rounded-xl overflow-hidden mb-3 bg-gradient-to-br ${gradient} min-h-[200px] flex flex-col items-center justify-between p-4`}>
      {/* Template label */}
      <div className="text-xs text-gray-500 self-start mb-2 font-mono">
        {TEMPLATE_LABELS[post.memeTemplate] || post.memeTemplate}
      </div>

      {/* Top caption */}
      {post.memeTopCaption && (
        <p className="meme-caption text-white text-lg font-black text-center uppercase w-full">
          {post.memeTopCaption}
        </p>
      )}

      {/* Center emoji mascot */}
      <div className="text-8xl py-4 select-none">
        {post.memeTemplate === 'standup' && '☕'}
        {post.memeTemplate === 'production_bug' && '🐛'}
        {post.memeTemplate === 'deadline_panic' && '😱'}
        {post.memeTemplate === 'client_call' && '📞'}
        {!['standup','production_bug','deadline_panic','client_call'].includes(post.memeTemplate) && '🍺'}
      </div>

      {/* Bottom caption */}
      {post.memeBottomCaption && (
        <p className="meme-caption text-white text-lg font-black text-center uppercase w-full">
          {post.memeBottomCaption}
        </p>
      )}

      {/* Post text below */}
      {post.text && (
        <p className="text-gray-300 text-xs text-center mt-2 italic">{post.text}</p>
      )}
    </div>
  );
}
