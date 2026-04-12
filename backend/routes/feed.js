/**
 * Feed Route
 * GET /api/feed — personalized feed from followed users + trending
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// GET /api/feed
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const following = req.user.following || [];

    // Include own posts + followed users posts
    const authorIds = [...following, req.user._id];

    const posts = await Post.find({ author: { $in: authorIds } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username alias avatar jobTitle corporatePersona')
      .populate('comments.author', 'username alias avatar')
      .populate({
        path: 'repostOf',
        populate: { path: 'author', select: 'username alias avatar' },
      });

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/feed/trending — public trending posts
router.get('/trending', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
    const posts = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $addFields: { score: { $add: [{ $size: '$likes' }, { $multiply: [{ $size: '$comments' }, 2] }] } } },
      { $sort: { score: -1 } },
      { $limit: 10 },
    ]);

    const populated = await Post.populate(posts, [
      { path: 'author', select: 'username alias avatar jobTitle corporatePersona' },
    ]);

    res.json({ posts: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
