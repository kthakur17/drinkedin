/**
 * Story Model — 24h disappearing stories with TTL auto-expiry
 */

const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['text', 'image'],
      default: 'text',
    },
    text: { type: String, maxlength: 300 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    backgroundColor: { type: String, default: '#1e2d6b' },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-set expiresAt to 24h from creation
storySchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

storySchema.set('toJSON', { virtuals: true });

// Indexes
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
storySchema.index({ author: 1, expiresAt: -1 });

module.exports = mongoose.model('Story', storySchema);
