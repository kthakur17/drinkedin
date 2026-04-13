/**
 * AMA Model — Anonymous Q&A sessions within groups
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    asker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // stored but never exposed publicly
    text: { type: String, required: true, maxlength: 500 },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    answer: { type: String, maxlength: 2000 },
    answeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const amaSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: String, required: true }, // group slug
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    questions: [questionSchema],
  },
  { timestamps: true }
);

amaSchema.set('toJSON', { virtuals: true });

// Indexes
amaSchema.index({ group: 1, status: 1 });

module.exports = mongoose.model('AMA', amaSchema);
