/**
 * Post Routes
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { uploadPost } = require('../middleware/upload');
const { checkAndAwardBadges } = require('../utils/badges');

// Helper: emit notification via socket
const emitNotification = async (app, recipientId, notif) => {
  const io = app.get('io');
  const connectedUsers = app.get('connectedUsers');
  const socketId = connectedUsers.get(recipientId.toString());
  if (socketId) io.to(socketId).emit('notification', notif);
};

// Helper: emit badge awards
const emitBadgeNotifications = async (app, user, newBadges) => {
  for (const badge of newBadges) {
    const notif = await Notification.create({
      recipient: user._id,
      type: 'badge_earned',
      badge: { id: badge.id, name: badge.name, emoji: badge.emoji },
      message: `You earned the "${badge.emoji} ${badge.name}" badge!`,
    });
    await emitNotification(app, user._id, notif);
  }
};

// ─── POST /api/posts ──────────────────────────────────────────────────────────
router.post('/', protect, uploadPost.single('image'), async (req, res) => {
  try {
    const { type, text, isAnonymous, group, memeTemplate, memeTopCaption, memeBottomCaption } = req.body;

    const now = new Date();
    const hour = now.getHours();
    const isOfficeHours = hour >= 9 && hour < 17;
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

    // Parse hashtags from text
    const hashtags = text ? [...new Set((text.match(/(?:^|\s)#(\w+)/g) || []).map(t => t.trim().slice(1).toLowerCase()))] : [];

    // Build poll options if poll type
    let parsedPollOptions = [];
    const pollQuestion = req.body.pollQuestion;
    const pollExpiresAt = req.body.pollExpiresAt;
    if ((type || 'text') === 'poll' && req.body.pollOptions) {
      const opts = typeof req.body.pollOptions === 'string' ? JSON.parse(req.body.pollOptions) : req.body.pollOptions;
      parsedPollOptions = opts.map(o => ({ text: typeof o === 'string' ? o : o.text, votes: [] }));
    }

    const postData = {
      author: req.user._id,
      type: type || 'text',
      text,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      group: group || null,
      memeTemplate,
      memeTopCaption,
      memeBottomCaption,
      isWeekendPost: isWeekend,
      hashtags,
      ...(type === 'poll' && { pollQuestion, pollOptions: parsedPollOptions, pollExpiresAt: pollExpiresAt || null }),
    };

    if (req.file) {
      postData.imageUrl = req.file.path;
      postData.imagePublicId = req.file.filename;
    }

    const post = await Post.create(postData);

    // Increment user post count and track memes/anon posts
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { postCount: 1 },
    });

    const updatedUser = await User.findById(req.user._id);

    // Get meme and anon counts for badge check
    const memeCount = await Post.countDocuments({ author: req.user._id, type: 'meme' });
    const anonCount = await Post.countDocuments({ author: req.user._id, isAnonymous: true });

    const newBadges = await checkAndAwardBadges(updatedUser, {
      isOfficeHours,
      memeCount,
      anonCount,
    });

    if (newBadges.length > 0) {
      await emitBadgeNotifications(req.app, updatedUser, newBadges);
    }

    const populated = await Post.findById(post._id).populate('author', 'username alias avatar jobTitle corporatePersona');

    res.status(201).json({ post: populated, newBadges });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/posts/user/:userId ──────────────────────────────────────────────
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username alias avatar jobTitle corporatePersona');

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/posts/confessions ───────────────────────────────────────────────
router.get('/confessions', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.find({ isAnonymous: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username alias avatar');  // will be hidden on frontend

    // Strip author info for anonymous posts
    const sanitized = posts.map((p) => {
      const obj = p.toJSON();
      obj.author = null;
      return obj;
    });

    res.json({ posts: sanitized, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/react ────────────────────────────────────────────────
const REACTION_EMOJIS = { beer: '🍺', whiskey: '🥃', wine: '🍷', coffee: '☕', puke: '🤮' };

router.post('/:id/react', protect, async (req, res) => {
  try {
    const { type } = req.body;
    if (!REACTION_EMOJIS[type]) return res.status(400).json({ message: 'Invalid reaction type' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existing = post.reactions.find(r => r.user.toString() === req.user._id.toString());

    if (existing && existing.type === type) {
      // Toggle off same reaction
      post.reactions.pull(existing._id);
    } else if (existing) {
      // Switch reaction type
      existing.type = type;
    } else {
      // Add new reaction
      post.reactions.push({ user: req.user._id, type });
    }

    await post.save();

    const reactionCounts = {};
    for (const r of post.reactions) {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    }
    const userReaction = post.reactions.find(r => r.user.toString() === req.user._id.toString());

    // Notify author
    if (!existing && !post.isAnonymous && post.author.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_reaction',
        post: post._id,
        message: `${req.user.displayName || req.user.username} reacted ${REACTION_EMOJIS[type]} to your post`,
      });
      await emitNotification(req.app, post.author, notif);
    }

    // Badge check
    if (post.reactions.length >= 50) {
      const postAuthor = await User.findById(post.author);
      const newBadges = await checkAndAwardBadges(postAuthor, { reactionsOnPost: post.reactions.length });
      if (newBadges.length > 0) await emitBadgeNotifications(req.app, postAuthor, newBadges);
    }

    res.json({ reacted: !!userReaction, reactionType: userReaction?.type || null, reactionCounts, totalReactions: post.reactions.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/like (backward compat) ──────────────────────────────
router.post('/:id/like', protect, async (req, res) => {
  req.body.type = 'beer';
  return router.handle(req, res);
});

// ─── POST /api/posts/:id/vote (polls) ────────────────────────────────────────
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post || post.type !== 'poll') return res.status(404).json({ message: 'Poll not found' });
    if (post.pollExpiresAt && new Date() > new Date(post.pollExpiresAt)) {
      return res.status(400).json({ message: 'Poll has expired' });
    }
    if (optionIndex < 0 || optionIndex >= post.pollOptions.length) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    // Check if already voted on any option
    const alreadyVoted = post.pollOptions.some(opt => opt.votes.includes(req.user._id));
    if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

    post.pollOptions[optionIndex].votes.push(req.user._id);
    await post.save();

    const totalVotes = post.pollOptions.reduce((sum, o) => sum + o.votes.length, 0);
    const options = post.pollOptions.map(o => ({ text: o.text, votes: o.votes.length, percentage: totalVotes ? Math.round((o.votes.length / totalVotes) * 100) : 0 }));

    res.json({ options, totalVotes, votedIndex: optionIndex });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/bookmark ─────────────────────────────────────────────
router.post('/:id/bookmark', protect, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isBookmarked = req.user.savedPosts?.includes(postId);
    if (isBookmarked) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { savedPosts: postId } });
      return res.json({ bookmarked: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { savedPosts: postId } });
      return res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/posts/saved ─────────────────────────────────────────────────────
router.get('/saved', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const user = await User.findById(req.user._id);
    const savedIds = user.savedPosts || [];

    const posts = await Post.find({ _id: { $in: savedIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username alias avatar jobTitle corporatePersona');

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/comment ──────────────────────────────────────────────
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text, isAnonymous } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text is required' });

    const comment = {
      author: req.user._id,
      text: text.trim(),
      isAnonymous: !!isAnonymous,
    };

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: comment } },
      { new: true }
    ).populate('comments.author', 'username alias avatar');

    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Notify post author
    if (!post.isAnonymous && post.author.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'post_comment',
        post: post._id,
        message: `${req.user.displayName || req.user.username} commented on your post`,
      });
      await emitNotification(req.app, post.author, notif);
    }

    const newComment = post.comments[post.comments.length - 1];
    res.json({ comment: newComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/posts/:id/repost ───────────────────────────────────────────────
router.post('/:id/repost', protect, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ message: 'Post not found' });

    // Add user to reposts array on original
    await Post.findByIdAndUpdate(req.params.id, {
      $addToSet: { reposts: req.user._id },
    });

    // Create repost
    const repost = await Post.create({
      author: req.user._id,
      type: originalPost.type,
      text: originalPost.text,
      imageUrl: originalPost.imageUrl,
      repostOf: originalPost._id,
      isAnonymous: false,
    });

    const populated = await Post.findById(repost._id)
      .populate('author', 'username alias avatar')
      .populate('repostOf');

    res.json({ post: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.user._id, { $inc: { postCount: -1 } });

    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username alias avatar jobTitle corporatePersona')
      .populate('comments.author', 'username alias avatar')
      .populate('repostOf');

    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
