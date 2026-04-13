/**
 * Message Routes — DM conversations and messages
 */

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Helper: emit notification via socket
const emitNotification = async (app, recipientId, notif) => {
  const io = app.get('io');
  const connectedUsers = app.get('connectedUsers');
  const socketId = connectedUsers.get(recipientId.toString());
  if (socketId) io.to(socketId).emit('notification', notif);
};

// ─── GET /api/messages/conversations ─────────────────────────────────────────
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username alias avatar')
      .populate('lastMessage');

    res.json({ conversations });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/messages/conversations ────────────────────────────────────────
router.post('/conversations', protect, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'recipientId is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check for existing conversation between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, recipientId] },
    })
      .populate('participants', 'username alias avatar')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, recipientId],
      });
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'username alias avatar')
        .populate('lastMessage');
    }

    res.json({ conversation });
  } catch (err) {
    console.error('Create conversation error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/messages/conversations/:id ─────────────────────────────────────
router.get('/conversations/:id', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    // Verify user is a participant
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username alias avatar');

    // Mark messages as read by current user
    await Message.updateMany(
      {
        conversation: req.params.id,
        sender: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    const total = await Message.countDocuments({ conversation: req.params.id });
    const hasMore = page * limit < total;

    // Populate conversation participants for the frontend
    const populatedConversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username alias avatar')
      .populate('lastMessage');

    res.json({ conversation: populatedConversation, messages, page, hasMore });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── POST /api/messages/conversations/:id ────────────────────────────────────
router.post('/conversations/:id', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create the message
    let message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      text: text.trim(),
      readBy: [req.user._id],
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    message = await Message.findById(message._id).populate('sender', 'username alias avatar');

    // Emit socket event to conversation room
    const io = req.app.get('io');
    if (io) {
      io.to(`conv_${req.params.id}`).emit('new_message', message);
    }

    // Create notification for recipient(s)
    const recipients = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );

    for (const recipientId of recipients) {
      const notif = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: 'direct_message',
        message: `${req.user.displayName || req.user.username} sent you a message`,
      });
      await emitNotification(req.app, recipientId, notif);
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
