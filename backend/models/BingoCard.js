/**
 * BingoCard Model — Corporate bingo cards (weekly)
 */

const mongoose = require('mongoose');

const squareSchema = new mongoose.Schema(
  {
    phrase: { type: String },
    marked: { type: Boolean, default: false },
    markedAt: { type: Date, default: null },
  },
  { _id: false }
);

const bingoCardSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    squares: { type: [squareSchema], validate: [arr => arr.length === 25, 'Must have exactly 25 squares'] },
    completedLines: { type: Number, default: 0 },
    isBlackout: { type: Boolean, default: false },
    week: { type: String }, // ISO week e.g. "2026-W16"
  },
  { timestamps: true }
);

bingoCardSchema.set('toJSON', { virtuals: true });

// Indexes
bingoCardSchema.index({ user: 1, week: 1 }, { unique: true });

module.exports = mongoose.model('BingoCard', bingoCardSchema);
