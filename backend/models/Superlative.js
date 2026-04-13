/**
 * Superlative Model — Office superlatives with weekly voting
 */

const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    voter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nominee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const superlativeSchema = new mongoose.Schema(
  {
    week: { type: String, required: true }, // ISO week e.g. "2026-W16"
    category: { type: String, required: true },
    votes: [voteSchema],
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    finalized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtuals
superlativeSchema.virtual('voteCount').get(function () {
  return this.votes.length;
});

superlativeSchema.set('toJSON', { virtuals: true });

// Indexes
superlativeSchema.index({ week: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Superlative', superlativeSchema);
