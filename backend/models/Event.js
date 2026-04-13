/**
 * Event Model — Events and hangouts (happy hours, rant sessions, etc.)
 */

const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going'],
      default: 'going',
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, maxlength: 2000 },
    date: { type: Date, required: true },
    endDate: { type: Date, default: null },
    location: { type: String, maxlength: 200 },
    type: {
      type: String,
      enum: ['happy_hour', 'rant_session', 'fake_meeting', 'actual_work', 'other'],
      default: 'happy_hour',
    },
    rsvps: [rsvpSchema],
    group: { type: String, default: null },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

// Virtuals
eventSchema.virtual('goingCount').get(function () {
  return this.rsvps.filter(r => r.status === 'going').length;
});
eventSchema.virtual('maybeCount').get(function () {
  return this.rsvps.filter(r => r.status === 'maybe').length;
});

eventSchema.set('toJSON', { virtuals: true });

// Indexes
eventSchema.index({ date: 1 });
eventSchema.index({ creator: 1 });

module.exports = mongoose.model('Event', eventSchema);
