/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const { cloudinary } = require('../middleware/upload');

// ─── GET /api/users/search ────────────────────────────────────────────────────
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { alias: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user._id },
      isVerified: true,
    })
      .select('username alias avatar jobTitle company corporatePersona')
      .limit(20);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/users/suggestions ───────────────────────────────────────────────
router.get('/suggestions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const excluded = [...user.following, user._id];

    const suggestions = await User.find({
      _id: { $nin: excluded },
      isVerified: true,
    })
      .select('username alias avatar jobTitle company corporatePersona followers')
      .limit(5);

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/users/:username ─────────────────────────────────────────────────
router.get('/:username', protect, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-otpHash -otpExpiry -email -phone')
      .populate('followers', 'username alias avatar')
      .populate('following', 'username alias avatar');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
router.put('/profile', protect, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const { alias, jobTitle, company, bio, corporatePersona, isPrivate } = req.body;
    const updateData = { alias, jobTitle, company, bio, corporatePersona, isPrivate };

    if (req.file) {
      // Delete old avatar
      if (req.user.avatarPublicId) {
        await cloudinary.uploader.destroy(req.user.avatarPublicId);
      }
      updateData.avatar = req.file.path;
      updateData.avatarPublicId = req.file.filename;
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-otpHash -otpExpiry');

    res.json({ user: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ─── POST /api/users/:id/follow ───────────────────────────────────────────────
router.post('/:id/follow', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't follow yourself 🥲" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');

    // Already following?
    if (req.user.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    if (targetUser.isPrivate) {
      // Send follow request
      if (!targetUser.followRequests.includes(req.user._id)) {
        await User.findByIdAndUpdate(targetUser._id, {
          $addToSet: { followRequests: req.user._id },
        });
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { sentRequests: targetUser._id },
        });

        // Notification
        const notif = await Notification.create({
          recipient: targetUser._id,
          sender: req.user._id,
          type: 'follow_request',
          message: `${req.user.displayName || req.user.username} wants to follow you`,
        });

        const socketId = connectedUsers.get(targetUser._id.toString());
        if (socketId) {
          io.to(socketId).emit('notification', notif);
        }

        return res.json({ message: 'Follow request sent', status: 'requested' });
      }
      return res.json({ message: 'Request already sent', status: 'requested' });
    } else {
      // Public account — follow directly
      await User.findByIdAndUpdate(targetUser._id, {
        $addToSet: { followers: req.user._id },
      });
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: targetUser._id },
      });

      const notif = await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'new_follower',
        message: `${req.user.displayName || req.user.username} started following you`,
      });

      const socketId = connectedUsers.get(targetUser._id.toString());
      if (socketId) {
        io.to(socketId).emit('notification', notif);
      }

      return res.json({ message: 'Following!', status: 'following' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/users/:id/unfollow ─────────────────────────────────────────────
router.post('/:id/unfollow', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: req.params.id },
    });
    res.json({ message: 'Unfollowed', status: 'not_following' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/users/requests/:id/accept ─────────────────────────────────────
router.post('/requests/:id/accept', protect, async (req, res) => {
  try {
    const requesterId = req.params.id;

    // Add to followers/following
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followRequests: requesterId },
      $addToSet: { followers: requesterId },
    });
    await User.findByIdAndUpdate(requesterId, {
      $pull: { sentRequests: req.user._id },
      $addToSet: { following: req.user._id },
    });

    // Notify requester
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers');
    const notif = await Notification.create({
      recipient: requesterId,
      sender: req.user._id,
      type: 'follow_accepted',
      message: `${req.user.displayName || req.user.username} accepted your follow request`,
    });

    const socketId = connectedUsers.get(requesterId);
    if (socketId) io.to(socketId).emit('notification', notif);

    res.json({ message: 'Follow request accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/users/requests/:id/decline ────────────────────────────────────
router.post('/requests/:id/decline', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { followRequests: req.params.id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { sentRequests: req.user._id },
    });
    res.json({ message: 'Follow request declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
