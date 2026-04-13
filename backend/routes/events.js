/**
 * Event Routes — Events and hangouts (happy hours, rant sessions, etc.)
 */

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');

// ─── POST /api/events ───────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, date, endDate, location, type, group, imageUrl } = req.body;

    const event = await Event.create({
      creator: req.user._id,
      title,
      description,
      date,
      endDate,
      location,
      type,
      group: group || null,
      imageUrl,
    });

    const populated = await Event.findById(event._id).populate('creator', 'username alias avatar');

    res.status(201).json({ event: populated });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/events ────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = { date: { $gte: new Date() } };

    if (req.query.group) {
      filter.group = req.query.group;
    }

    const events = await Event.find(filter)
      .sort({ date: 1 })
      .populate('creator', 'username alias avatar');

    res.json({ events });
  } catch (err) {
    console.error('List events error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/events/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'username alias avatar')
      .populate('rsvps.user', 'username alias avatar');

    if (!event) return res.status(404).json({ message: 'Event not found' });

    res.json({ event });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/events/:id/rsvp ──────────────────────────────────────────────
router.post('/:id/rsvp', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Find existing RSVP by this user
    const existingIndex = event.rsvps.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      event.rsvps[existingIndex].status = status;
    } else {
      event.rsvps.push({ user: req.user._id, status });
    }

    await event.save();

    const updated = await Event.findById(req.params.id)
      .populate('creator', 'username alias avatar')
      .populate('rsvps.user', 'username alias avatar');

    res.json({ event: updated });
  } catch (err) {
    console.error('RSVP error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/events/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
