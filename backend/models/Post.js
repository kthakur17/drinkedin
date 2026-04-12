/**
 * Post Model
 * Supports text, image, meme, and anonymous confession types
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
    isAnonymous: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Content
    type: {
      type: String,
      enum: ['text', 'image', 'meme', 'confession'],
      default: 'text',
    },
    text: { type: String, maxlength: 2000 },
    imageUrl: { type: String },           // Cloudinary URL
    imagePublicId: { type: String },

    // Meme specific
    memeTemplate: { type: String },       // template name key
    memeTopCaption: { type: String },
    memeBottomCaption: { type: String },

    // Anonymity
    isAnonymous: { type: Boolean, default: false },

    // Group post
    group: { type: String, default: null },   // group slug if in a group

    // Engagement
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    repostOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },

    // Mood at time of posting
    moodAtPost: {
      type: String,
      enum: ['burnt_out', 'surviving', 'need_a_drink', 'party_mode'],
      default: null,
    },

    // Weekend flag
    isWeekendPost: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtuals
postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});
postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

postSchema.set('toJSON', { virtuals: true });

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ group: 1, createdAt: -1 });
postSchema.index({ isAnonymous: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
