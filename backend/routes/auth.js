/**
 * Auth Routes
 * POST /api/auth/send-otp     — send OTP to email or phone
 * POST /api/auth/verify-otp   — verify OTP and login/register
 * GET  /api/auth/me           — get current user
 * POST /api/auth/complete-profile — complete profile after first login
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../utils/otp');
const { protect } = require('../middleware/auth');

// Helper: generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// ─── POST /api/auth/send-otp ──────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { contact, type } = req.body; // contact = email or phone, type = 'email'|'sms'

    if (!contact) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    const method = type || process.env.OTP_METHOD || 'email';

    // Find or prepare user
    const query = method === 'email' ? { email: contact.toLowerCase() } : { phone: contact };
    let user = await User.findOne(query);

    const { hash, expiry } = await sendOTP(contact, method);

    if (user) {
      user.otpHash = hash;
      user.otpExpiry = expiry;
      await user.save();
    } else {
      // Store contact temporarily — user is created on verify
      user = new User({
        ...(method === 'email' ? { email: contact.toLowerCase() } : { phone: contact }),
        username: `user_${Date.now()}`,  // temp username
        otpHash: hash,
        otpExpiry: expiry,
      });
      await user.save();
    }

    res.json({ message: `OTP sent to ${contact}`, isNewUser: !user.isVerified });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { contact, otp, type } = req.body;

    if (!contact || !otp) {
      return res.status(400).json({ message: 'Contact and OTP are required' });
    }

    const method = type || process.env.OTP_METHOD || 'email';
    const query = method === 'email' ? { email: contact.toLowerCase() } : { phone: contact };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please request a new OTP.' });
    }

    // Check expiry
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Verify
    const isValid = await verifyOTP(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP
    user.otpHash = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);
    const isNewUser = !user.username || user.username.startsWith('user_');

    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isNewUser,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
});

// ─── POST /api/auth/complete-profile ─────────────────────────────────────────
router.post('/complete-profile', protect, async (req, res) => {
  try {
    const { username, alias, jobTitle, company, bio, corporatePersona, isPrivate } = req.body;

    // Validate username uniqueness
    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Username already taken. Try something more creative 🍺' });
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { username, alias, jobTitle, company, bio, corporatePersona, isPrivate },
      { new: true, runValidators: true }
    ).select('-otpHash -otpExpiry');

    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-otpHash -otpExpiry')
    .populate('followers', 'username alias avatar')
    .populate('following', 'username alias avatar');

  res.json({ user });
});

module.exports = router;
