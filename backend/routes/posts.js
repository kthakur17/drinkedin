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

// ─── POST /api/posts/:id/like ─────────────────────────────────────────────────
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: req.user._id } });
      return res.json({ liked: false, likeCount: post.likes.length - 1 });
    } else {
      await Post.findByIdAndUpdate(req.params.id, { $addToSet: { likes: req.user._id } });

      const newLikeCount = post.likes.length + 1;

      // Notify author (if not anonymous and not self-like)
      if (!post.isAnonymous && post.author.toString() !== req.user._id.toString()) {
        const notif = await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'post_like',
          post: post._id,
          message: `${req.user.displayName || req.user.username} liked your post`,
        });
        await emitNotification(req.app, post.author, notif);
      }

      // Badge check: production down legend (50+ likes)
      if (newLikeCount >= 50) {
        const postAuthor = await User.findById(post.author);
        const newBadges = await checkAndAwardBadges(postAuthor, { likesOnPost: newLikeCount });
        if (newBadges.length > 0) {
          await emitBadgeNotifications(req.app, postAuthor, newBadges);
        }
        // Update totalLikesReceived
        await User.findByIdAndUpdate(post.author, { $inc: { totalLikesReceived: 1 } });
      }

      return res.json({ liked: true, likeCount: newLikeCount });
    }
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
