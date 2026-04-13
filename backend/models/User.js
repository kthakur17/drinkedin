/**
 * User Model
 * Supports semi-anonymous profiles with alias/username
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Auth fields
    email: { type: String, sparse: true, lowercase: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    otpHash: { type: String },       // bcrypt hashed OTP
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },

    // Profile
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    alias: { type: String, trim: true, maxlength: 30 },   // optional display alias
    realName: { type: String, trim: true },                // private, never shown publicly
    jobTitle: { type: String, trim: true, maxlength: 80 },
    company: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 300 },
    avatar: { type: String, default: '' },       // Cloudinary URL
    avatarPublicId: { type: String },

    // Privacy
    isPrivate: { type: Boolean, default: false },
    corporatePersona: {
      type: String,
      enum: ['Burnt Out Dev', 'Chaos Manager', 'QA Ghost', 'HR Spy', 'The Intern', 'CTO (Chief Tequila Officer)', 'Senior Slack Sender'],
      default: 'Burnt Out Dev',
    },

    // Social graph
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // incoming requests
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],    // outgoing requests

    // Groups
    groups: [{ type: String }],

    // Saved / Bookmarked posts
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    // Streaks
    streaks: {
      login:   { current: { type: Number, default: 0 }, longest: { type: Number, default: 0 }, lastDate: { type: String, default: '' } },
      posting: { current: { type: Number, default: 0 }, longest: { type: Number, default: 0 }, lastDate: { type: String, default: '' } },
      mood:    { current: { type: Number, default: 0 }, longest: { type: Number, default: 0 }, lastDate: { type: String, default: '' } },
    },

    // Gamification
    badges: [
      {
        id: String,
        name: String,
        emoji: String,
        description: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    postCount: { type: Number, default: 0 },
    totalLikesReceived: { type: Number, default: 0 },

    // Settings
    weekendModeEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Note: email/phone already indexed via sparse:true, username via unique:true

// Virtual: display name (alias ?? username)
userSchema.virtual('displayName').get(function () {
  return this.alias || this.username;
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
