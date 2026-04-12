/**
 * Moods Routes — re-exported from notifications module
 */
const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const { protect } = require('../middleware/auth');

// POST /api/moods
router.post('/', protect, async (req, res) => {
  try {
    const { mood } = req.body;
    const today = new Date().toISOString().split('T')[0];

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
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mood = await Mood.findOne({ user: req.user._id, date: today });
    res.json({ mood: mood || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/moods/history
router.get('/history', protect, async (req, res) => {
  try {
    const moods = await Mood.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json({ moods });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
