/**
 * Superlative Routes — Weekly office superlatives with voting
 */

const express = require('express');
const router = express.Router();
const Superlative = require('../models/Superlative');
const { protect } = require('../middleware/auth');

// Superlative categories
const CATEGORIES = [
  'Most Likely to Deploy on Friday',
  'Most Likely to Rage Quit',
  'Best Slack Reactor',
  'Office DJ (Didn\'t Ask)',
  'Most Mysterious Commit Message',
  'Most Likely Sleeping in Meetings',
  'Corporate Buzzword Champion',
  'Most Dramatic Email Signature',
];

// Helper: get ISO week string e.g. "2026-W16"
const getCurrentWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// Helper: get last week's ISO week string
const getLastWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// ─── GET /api/superlatives/current ──────────────────────────────────────────
router.get('/current', protect, async (req, res) => {
  try {
    const week = getCurrentWeek();

    // Get or create superlatives for each category
    const superlatives = await Promise.all(
      CATEGORIES.map(async (category) => {
        let superlative = await Superlative.findOne({ week, category })
          .populate('votes.voter', 'username alias avatar')
          .populate('votes.nominee', 'username alias avatar');

        if (!superlative) {
          superlative = await Superlative.create({ week, category, votes: [] });
          // Re-fetch with population
          superlative = await Superlative.findById(superlative._id)
            .populate('votes.voter', 'username alias avatar')
            .populate('votes.nominee', 'username alias avatar');
        }

        return superlative;
      })
    );

    res.json({ superlatives });
  } catch (err) {
    console.error('Get current superlatives error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/superlatives/:id/vote ────────────────────────────────────────
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { nomineeId } = req.body;
    if (!nomineeId) {
      return res.status(400).json({ message: 'nomineeId is required' });
    }

    const superlative = await Superlative.findById(req.params.id);
    if (!superlative) return res.status(404).json({ message: 'Superlative not found' });

    if (superlative.finalized) {
      return res.status(400).json({ message: 'Voting is closed for this superlative' });
    }

    // Check if user already voted
    const existingVoteIndex = superlative.votes.findIndex(
      (v) => v.voter.toString() === req.user._id.toString()
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      superlative.votes[existingVoteIndex].nominee = nomineeId;
    } else {
      // Add new vote
      superlative.votes.push({ voter: req.user._id, nominee: nomineeId });
    }

    await superlative.save();

    const populated = await Superlative.findById(superlative._id)
      .populate('votes.voter', 'username alias avatar')
      .populate('votes.nominee', 'username alias avatar');

    res.json({ superlative: populated });
  } catch (err) {
    console.error('Vote superlative error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/superlatives/results ──────────────────────────────────────────
router.get('/results', protect, async (req, res) => {
  try {
    const week = req.query.week || getLastWeek();

    let superlatives = await Superlative.find({ week })
      .populate('votes.voter', 'username alias avatar')
      .populate('votes.nominee', 'username alias avatar')
      .populate('winner', 'username alias avatar');

    // Auto-finalize if the week is past and not yet finalized
    const currentWeek = getCurrentWeek();
    if (week < currentWeek) {
      for (const superlative of superlatives) {
        if (!superlative.finalized && superlative.votes.length > 0) {
          // Tally votes to find the winner
          const tally = {};
          for (const vote of superlative.votes) {
            const nomineeStr = vote.nominee.toString();
            tally[nomineeStr] = (tally[nomineeStr] || 0) + 1;
          }

          // Find nominee with most votes
          let maxVotes = 0;
          let winnerId = null;
          for (const [id, count] of Object.entries(tally)) {
            if (count > maxVotes) {
              maxVotes = count;
              winnerId = id;
            }
          }

          superlative.winner = winnerId;
          superlative.finalized = true;
          await superlative.save();
        }
      }

      // Re-fetch with population after finalization
      superlatives = await Superlative.find({ week })
        .populate('votes.voter', 'username alias avatar')
        .populate('votes.nominee', 'username alias avatar')
        .populate('winner', 'username alias avatar');
    }

    res.json({ superlatives });
  } catch (err) {
    console.error('Superlative results error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
