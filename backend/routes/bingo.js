/**
 * Bingo Routes — Corporate Bingo cards (weekly)
 */

const express = require('express');
const router = express.Router();
const BingoCard = require('../models/BingoCard');
const { protect } = require('../middleware/auth');

// Corporate bingo phrases pool
const BINGO_PHRASES = [
  'Let\'s take this offline',
  'Circle back',
  'Synergy',
  'Moving forward',
  'Per my last email',
  'Can everyone see my screen?',
  'Let\'s table this',
  'Low-hanging fruit',
  'Think outside the box',
  'Deep dive',
  'Touch base',
  'Bandwidth',
  'EOD',
  'Run it up the flagpole',
  'Pivot',
  'Actionable insights',
  'Best practices',
  'Quick win',
  'Paradigm shift',
  'Value add',
  'Leverage',
  'Holistic approach',
  'Drill down',
  'Alignment',
  'Stakeholder buy-in',
  'Mission critical',
  'Game changer',
  'Disruptive innovation',
  'Scalable solution',
  'At the end of the day',
  'I\'ll ping you',
  'Let me loop in...',
  'Take ownership',
  'Bleeding edge',
  'Boil the ocean',
  'Unpack this',
  'Right-size',
  'North star',
  'Ecosystem',
  'Monetize',
  'Optimize',
  'Deliverables',
  'KPI',
  'OKR',
  'Agile',
  'Sprint',
  'Stand-up could\'ve been a Slack',
  'Hard stop at...',
  'Let\'s sync up',
  'I have a hard stop',
];

// Helper: get ISO week string e.g. "2026-W16"
const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

// Helper: check bingo lines (rows, cols, diagonals)
const checkBingoLines = (squares) => {
  let lines = 0;

  // Check 5 rows
  for (let row = 0; row < 5; row++) {
    const allMarked = squares
      .slice(row * 5, row * 5 + 5)
      .every((s) => s.marked);
    if (allMarked) lines++;
  }

  // Check 5 columns
  for (let col = 0; col < 5; col++) {
    let allMarked = true;
    for (let row = 0; row < 5; row++) {
      if (!squares[row * 5 + col].marked) {
        allMarked = false;
        break;
      }
    }
    if (allMarked) lines++;
  }

  // Check diagonal (top-left to bottom-right)
  let diag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!squares[i * 5 + i].marked) {
      diag1 = false;
      break;
    }
  }
  if (diag1) lines++;

  // Check diagonal (top-right to bottom-left)
  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!squares[i * 5 + (4 - i)].marked) {
      diag2 = false;
      break;
    }
  }
  if (diag2) lines++;

  return lines;
};

// Helper: shuffle array (Fisher-Yates)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── GET /api/bingo/card ────────────────────────────────────────────────────
router.get('/card', protect, async (req, res) => {
  try {
    const currentWeek = getISOWeek(new Date());

    let card = await BingoCard.findOne({
      user: req.user._id,
      week: currentWeek,
    });

    if (!card) {
      // Pick 25 random phrases, set center as FREE SPACE
      const shuffled = shuffle(BINGO_PHRASES).slice(0, 25);
      const squares = shuffled.map((phrase, i) => {
        if (i === 12) {
          return { phrase: 'FREE SPACE', marked: true, markedAt: new Date() };
        }
        return { phrase, marked: false, markedAt: null };
      });

      card = await BingoCard.create({
        user: req.user._id,
        week: currentWeek,
        squares,
        completedLines: 0,
        isBlackout: false,
      });
    }

    res.json({ card });
  } catch (err) {
    console.error('Get bingo card error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/bingo/card/mark ──────────────────────────────────────────────
router.post('/card/mark', protect, async (req, res) => {
  try {
    const { squareIndex } = req.body;

    if (squareIndex === undefined || squareIndex < 0 || squareIndex > 24) {
      return res.status(400).json({ message: 'Invalid square index (0-24)' });
    }

    const currentWeek = getISOWeek(new Date());
    const card = await BingoCard.findOne({
      user: req.user._id,
      week: currentWeek,
    });

    if (!card) {
      return res.status(404).json({ message: 'No card found for this week' });
    }

    // Toggle marked state
    const square = card.squares[squareIndex];
    square.marked = !square.marked;
    square.markedAt = square.marked ? new Date() : null;

    // Recalculate completed lines and blackout
    card.completedLines = checkBingoLines(card.squares);
    card.isBlackout = card.squares.every((s) => s.marked);

    await card.save();

    res.json({ card });
  } catch (err) {
    console.error('Mark bingo square error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/bingo/leaderboard ─────────────────────────────────────────────
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const currentWeek = getISOWeek(new Date());

    const leaderboard = await BingoCard.find({ week: currentWeek })
      .sort({ completedLines: -1 })
      .limit(10)
      .populate('user', 'username alias avatar');

    res.json({ leaderboard });
  } catch (err) {
    console.error('Bingo leaderboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
