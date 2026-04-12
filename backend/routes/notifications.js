/**
 * Notifications Routes
 */

const express = require('express');
const notifRouter = express.Router();
const moodRouter = express.Router();
const Notification = require('../models/Notification');
const Mood = require('../models/Mood');
const { protect } = require('../middleware/auth');

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

// GET /api/notifications
notifRouter.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username alias avatar');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/mark-read
notifRouter.put('/mark-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── MOODS ────────────────────────────────────────────────────────────────────

// POST /api/moods
moodRouter.post('/', protect, async (req, res) => {
  try {
    const { mood } = req.body;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const existing = await Mood.findOne({ user: req.user._id, date: today });
    if (existing) {
      existing.mood = mood;
      await existing.save();
      return res.json({ mood: existing, isUpdate: true });
    }

    const newMood = await Mood.create({ user: req.user._id, mood, date: today });
    res.json({ mood: newMood, isUpdate: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/moods/today
moodRouter.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mood = await Mood.findOne({ user: req.user._id, date: today });
    res.json({ mood: mood || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/moods/history
moodRouter.get('/history', protect, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json({ moods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = notifRouter;
