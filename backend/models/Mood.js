/**
 * Mood Model — Daily mood check-ins
 */

const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood: {
      type: String,
      enum: ['burnt_out', 'surviving', 'need_a_drink', 'party_mode'],
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD for easy daily lookup
  },
  { timestamps: true }
);

// One mood per user per day
moodSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Mood', moodSchema);
