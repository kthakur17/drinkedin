/**
 * Groups Routes
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const GROUPS = [
  { slug: 'developers', name: 'Developers 🍺', description: 'Where bugs are features and coffee is blood.' },
  { slug: 'qa-survivors', name: 'QA Survivors 🐞', description: 'We break things so you don\'t have to. Usually.' },
  { slug: 'managers-anonymous', name: 'Managers Anonymous 😅', description: 'My team thinks I know what I\'m doing.' },
  { slug: 'hr-fears-us', name: 'HR Fears Us 😂', description: 'Unofficially the most dangerous group.' },
  { slug: 'design-disasters', name: 'Design Disasters 🎨', description: '"Can you make the logo bigger?" survivors.' },
  { slug: 'sales-survivors', name: 'Sales Survivors 💼', description: 'Commission pending. Always pending.' },
];

// GET /api/groups — list all groups with member counts
router.get('/', protect, async (req, res) => {
  try {
    const userGroups = req.user.groups || [];
    const groupsWithData = await Promise.all(
      GROUPS.map(async (g) => {
        const memberCount = await User.countDocuments({ groups: g.slug });
        const recentPosts = await Post.countDocuments({ group: g.slug });
        return {
          ...g,
          memberCount,
          recentPosts,
          isMember: userGroups.includes(g.slug),
        };
      })
    );
    res.json({ groups: groupsWithData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:slug/join
router.post('/:slug/join', protect, async (req, res) => {
  try {
    const group = GROUPS.find((g) => g.slug === req.params.slug);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { groups: req.params.slug },
    });
    res.json({ message: `Joined ${group.name}!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:slug/leave
router.post('/:slug/leave', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { groups: req.params.slug },
    });
    res.json({ message: 'Left group' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/:slug/feed
router.get('/:slug/feed', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const posts = await Post.find({ group: req.params.slug })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username alias avatar jobTitle corporatePersona');

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
