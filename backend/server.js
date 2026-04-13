/**
 * Drinkedin — Main Server Entry Point
 * "LinkedIn by Day, Drinkedin by Night"
 */

require('dotenv').config();
if (process.env.NODE_ENV !== 'production') {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const feedRoutes = require('./routes/feed');
const groupRoutes = require('./routes/groups');
const notificationRoutes = require('./routes/notifications');
const moodRoutes = require('./routes/moods');
const hashtagRoutes = require('./routes/hashtags');
const messageRoutes = require('./routes/messages');
const storyRoutes = require('./routes/stories');
const bingoRoutes = require('./routes/bingo');
const eventRoutes = require('./routes/events');
const amaRoutes = require('./routes/ama');
const leaderboardRoutes = require('./routes/leaderboard');
const superlativeRoutes = require('./routes/superlatives');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so routes can emit events
app.set('io', io);

// Track connected users: { userId -> socketId }
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Register user's socket on login
  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered with socket ${socket.id}`);
  });

  // DM room management
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv_${conversationId}`);
  });
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv_${conversationId}`);
  });
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(`conv_${conversationId}`).emit('typing', { conversationId, userId });
  });

  socket.on('disconnect', () => {
    // Remove user from map
    for (const [userId, sId] of connectedUsers.entries()) {
      if (sId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

// Expose connected users map to routes
app.set('connectedUsers', connectedUsers);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/bingo', bingoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ama', amaRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/superlatives', superlativeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🍺 Drinkedin backend is running!' });
});

// ─── Serve Frontend in Production ────────────────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// All non-API routes serve the React app (client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Database & Server Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/drinkedin';

console.log(`🚀 Starting Drinkedin server...`);
console.log(`   PORT: ${PORT}`);
console.log(`   MONGO_URI: ${MONGO_URI ? '***set***' : '!!!MISSING!!!'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => {
      console.log(`🍺 Drinkedin server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
