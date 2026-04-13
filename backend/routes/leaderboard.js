/**
 * Leaderboard Routes — Engagement leaderboards by period
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: populate user info for aggregation results
const populateLeaders = async (results) => {
  const userIds = results.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select('username alias avatar').lean();
  const userMap = {};
  users.forEach((u) => {
    userMap[u._id.toString()] = u;
  });

  return results.map((r) => ({
    user: userMap[r._id.toString()] || null,
    count: r.count,
  }));
};

// ─── GET /api/leaderboard ───────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const daysAgo = period === 'monthly' ? 30 : 7;
    const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // 1. Top by reactions (likes) received
    const cheersLeadersRaw = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$likes' },
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 2. Top posters
    const postLeadersRaw = await Post.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 3. Top meme lords
    const memeLeadersRaw = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, type: 'meme' } },
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 4. Top confessors (anonymous posts)
    const confessionLeadersRaw = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, isAnonymous: true } },
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Populate user info for all leaderboards
    const [cheersLeaders, postLeaders, memeLeaders, confessionLeaders] = await Promise.all([
      populateLeaders(cheersLeadersRaw),
      populateLeaders(postLeadersRaw),
      populateLeaders(memeLeadersRaw),
      populateLeaders(confessionLeadersRaw),
    ]);

    res.json({ cheersLeaders, postLeaders, memeLeaders, confessionLeaders });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
