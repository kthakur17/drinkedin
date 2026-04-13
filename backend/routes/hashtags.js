/**
 * Hashtag Routes — Trending hashtags aggregation
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

// ─── GET /api/hashtags/trending ──────────────────────────────────────────────
router.get('/trending', protect, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const hashtags = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1,
        },
      },
    ]);

    res.json({ hashtags });
  } catch (err) {
    console.error('Trending hashtags error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
