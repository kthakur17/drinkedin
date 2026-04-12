/**
 * Notification Model
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // null for system notifications
    type: {
      type: String,
      enum: [
        'follow_request',
        'follow_accepted',
        'new_follower',
        'post_like',
        'post_comment',
        'badge_earned',
        'repost',
      ],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    badge: {
      id: String,
      name: String,
      emoji: String,
    },
    message: { type: String },    // human-readable message
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
