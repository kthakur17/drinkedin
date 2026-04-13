/**
 * AMA Routes — Anonymous Q&A sessions within groups
 */

const express = require('express');
const router = express.Router();
const AMA = require('../models/AMA');
const { protect } = require('../middleware/auth');

// ─── POST /api/ama ──────────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { group, title, description } = req.body;

    const ama = await AMA.create({
      host: req.user._id,
      group,
      title,
      description,
    });

    const populated = await AMA.findById(ama._id).populate('host', 'username alias avatar');

    res.status(201).json({ ama: populated });
  } catch (err) {
    console.error('Create AMA error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/ama ───────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};

    if (req.query.group) {
      filter.group = req.query.group;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const amas = await AMA.find(filter)
      .sort({ createdAt: -1 })
      .populate('host', 'username alias avatar');

    res.json({ amas });
  } catch (err) {
    console.error('List AMAs error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/ama/:id ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const ama = await AMA.findById(req.params.id).populate('host', 'username alias avatar');

    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    // Sort questions by upvotes count descending
    const amaObj = ama.toJSON();
    amaObj.questions.sort((a, b) => (b.upvotes?.length || 0) - (a.upvotes?.length || 0));

    // Strip asker field from questions (anonymous Q&A)
    amaObj.questions = amaObj.questions.map((q) => {
      const { asker, ...rest } = q;
      return rest;
    });

    res.json({ ama: amaObj });
  } catch (err) {
    console.error('Get AMA error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/ama/:id/questions ────────────────────────────────────────────
router.post('/:id/questions', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    const ama = await AMA.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    if (ama.status === 'closed') {
      return res.status(400).json({ message: 'This AMA is closed' });
    }

    const question = {
      asker: req.user._id,
      text: text.trim(),
      upvotes: [],
    };

    ama.questions.push(question);
    await ama.save();

    // Return the newly added question without the asker field
    const newQuestion = ama.questions[ama.questions.length - 1].toJSON();
    const { asker, ...sanitized } = newQuestion;

    res.status(201).json({ question: sanitized });
  } catch (err) {
    console.error('Submit question error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/ama/:id/questions/:qid/upvote ───────────────────────────────
router.post('/:id/questions/:qid/upvote', protect, async (req, res) => {
  try {
    const ama = await AMA.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    const question = ama.questions.id(req.params.qid);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Toggle upvote
    const existingIndex = question.upvotes.findIndex(
      (uid) => uid.toString() === req.user._id.toString()
    );

    if (existingIndex !== -1) {
      question.upvotes.splice(existingIndex, 1);
    } else {
      question.upvotes.push(req.user._id);
    }

    await ama.save();

    res.json({ upvoteCount: question.upvotes.length });
  } catch (err) {
    console.error('Upvote question error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/ama/:id/questions/:qid/answer ───────────────────────────────
router.post('/:id/questions/:qid/answer', protect, async (req, res) => {
  try {
    const ama = await AMA.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    // Only host can answer
    if (ama.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can answer questions' });
    }

    const question = ama.questions.id(req.params.qid);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    question.answer = text.trim();
    question.answeredAt = new Date();

    await ama.save();

    // Return question without asker
    const questionObj = question.toJSON();
    const { asker, ...sanitized } = questionObj;

    res.json({ question: sanitized });
  } catch (err) {
    console.error('Answer question error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/ama/:id/close ─────────────────────────────────────────────────
router.put('/:id/close', protect, async (req, res) => {
  try {
    const ama = await AMA.findById(req.params.id);
    if (!ama) return res.status(404).json({ message: 'AMA not found' });

    // Only host can close
    if (ama.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the host can close this AMA' });
    }

    ama.status = 'closed';
    await ama.save();

    const populated = await AMA.findById(ama._id).populate('host', 'username alias avatar');

    res.json({ ama: populated });
  } catch (err) {
    console.error('Close AMA error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
