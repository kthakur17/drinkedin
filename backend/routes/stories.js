/**
 * Story Routes — 24h disappearing stories
 */

const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── POST /api/stories ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { type, text, backgroundColor, imageUrl } = req.body;

    const story = await Story.create({
      author: req.user._id,
      type: type || 'text',
      text,
      backgroundColor,
      imageUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const populated = await Story.findById(story._id).populate('author', 'username alias avatar');

    res.status(201).json({ story: populated });
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/stories/feed ───────────────────────────────────────────────────
router.get('/feed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const followingIds = user.following || [];
    const authorIds = [...followingIds, req.user._id];
    const now = new Date();

    const stories = await Story.aggregate([
      {
        $match: {
          author: { $in: authorIds },
          expiresAt: { $gt: now },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$author',
          items: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'authorInfo',
        },
      },
      { $unwind: '$authorInfo' },
      {
        $project: {
          _id: 0,
          author: {
            _id: '$authorInfo._id',
            username: '$authorInfo.username',
            alias: '$authorInfo.alias',
            avatar: '$authorInfo.avatar',
          },
          items: 1,
        },
      },
    ]);

    res.json({ stories });
  } catch (err) {
    console.error('Story feed error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/stories/:id/view ─────────────────────────────────────────────
router.post('/:id/view', protect, async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.user._id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('View story error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/stories/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.json({ message: 'Story deleted' });
  } catch (err) {
    console.error('Delete story error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
