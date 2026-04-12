# 🍺 Drinkedin

> **"LinkedIn by Day, Drinkedin by Night"**
>
> The semi-anonymous social platform for corporate professionals. Vent. Connect. Cheers.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 OTP Auth | Passwordless login via email (Nodemailer) or SMS (Twilio) |
| 👤 Semi-anonymous profiles | Username/alias system, corporate persona badges |
| 📱 Follow system | Public/private accounts with follow requests |
| 🏠 Main feed | Chronological feed from followed users, infinite scroll |
| 🤫 Confessions | Anonymous posts — no name, no trace |
| 🍺 Groups | Company communities (Developers, QA Survivors, Managers Anonymous…) |
| 🎉 Weekend Mode | Auto-activates Fri–Sun with party UI theme |
| 😂 Meme Generator | 4 built-in templates with custom top/bottom captions |
| 🏆 Badges | Auto-awarded for milestones (first post, 50 likes, office hours post…) |
| 📊 Daily Mood Meter | One-tap daily check-in (Burnt Out / Surviving / Need a Drink / Party Mode) |
| 🔔 Real-time Notifications | Socket.io for likes, follows, comments, badges |

---

## 🏗️ Project Structure

```
drinkedin/
├── backend/
│   ├── server.js              # Express + Socket.io entry point
│   ├── .env.example
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js            # Also includes Comment sub-schema
│   │   ├── Notification.js
│   │   └── Mood.js
│   ├── routes/
│   │   ├── auth.js            # OTP send/verify, complete profile
│   │   ├── users.js           # Search, follow, profile update
│   │   ├── posts.js           # Create, like, comment, repost, delete
│   │   ├── feed.js            # Personalized + trending feed
│   │   ├── groups.js          # Group list, join/leave, group feed
│   │   ├── notifications.js   # List, mark-read
│   │   └── moods.js           # Daily mood check-in
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + optionalAuth
│   │   └── upload.js          # Cloudinary via Multer
│   ├── utils/
│   │   ├── otp.js             # Generate, hash, verify, send OTP
│   │   └── badges.js          # Badge definitions + auto-award logic
│   └── seed/
│       └── seed.js            # 5 users + 13 posts + moods
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             # Router + protected routes
        ├── index.css           # Tailwind + custom design tokens
        ├── utils/api.js        # Axios instance with JWT interceptor
        ├── context/
        │   ├── AuthContext.jsx      # Global auth state
        │   └── WeekendContext.jsx   # Fri–Sun weekend mode detection
        ├── hooks/
        │   └── useSocket.js        # Socket.io real-time hook
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── CompleteProfilePage.jsx
        │   ├── HomePage.jsx         # Main feed
        │   ├── ConfessionsPage.jsx
        │   ├── GroupsPage.jsx
        │   ├── GroupFeedPage.jsx
        │   ├── ProfilePage.jsx
        │   └── NotificationsPage.jsx
        └── components/
            ├── Layout/
            │   ├── Layout.jsx       # Shell: nav + sidebars + outlet
            │   ├── Navbar.jsx       # Search + notification bell
            │   ├── LeftSidebar.jsx  # Profile summary + nav
            │   └── RightSidebar.jsx # Mood meter + suggestions
            ├── Feed/
            │   ├── CreatePost.jsx   # Composer: text/image/meme + anon toggle
            │   └── PostCard.jsx     # Post card: like/comment/repost
            └── Notifications/
                └── NotificationToast.jsx
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Cloudinary account (free tier is fine)
- Gmail account with [App Password](https://support.google.com/accounts/answer/185833) **or** Twilio account for SMS

---

### 1. Clone & install

```bash
# Install backend dependencies
cd drinkedin/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Configure environment

```bash
cd drinkedin/backend
cp .env.example .env
```

Open `.env` and fill in:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/drinkedin
JWT_SECRET=change_this_to_a_long_random_string

OTP_METHOD=email          # or 'sms'

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

CLIENT_URL=http://localhost:5173
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App passwords. Generate one for "Mail".

---

### 3. Seed the database

```bash
cd drinkedin/backend
npm run seed
```

This creates **5 sample users** and **13 pre-loaded posts** including:
- Regular posts, anonymous confessions, a meme post, a weekend post
- Pre-set followers/following relationships
- Sample badges and mood check-ins

Sample user emails (use in login to receive OTP):
```
raj@example.com       — Senior Software Engineer
priya@example.com     — QA Lead
vikram@example.com    — Engineering Manager
ananya@example.com    — UX Designer
kartik@example.com    — Intern
```

---

### 4. Start the servers

```bash
# Terminal 1 — Backend
cd drinkedin/backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd drinkedin/frontend
npm run dev
# → http://localhost:5173
```

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary background | `#0a0f1e` (Deep Navy) |
| Card background | `#0d1530 → #111d40` gradient |
| Gold accent | `#f0c040` |
| Display font | Playfair Display (serif) |
| Body font | DM Sans (sans-serif) |
| Mono font | JetBrains Mono |

### Weekend Mode
Automatically activates Friday–Sunday based on the user's local time. Adds:
- Purple-tinted body gradient
- Top banner with random party prompt
- Posts tagged with 🎉 weekend badge
- `isWeekendPost` flag saved to DB

---

## 🔌 API Reference

### Auth
```
POST /api/auth/send-otp          { contact, type }
POST /api/auth/verify-otp        { contact, otp, type }
POST /api/auth/complete-profile  { username, alias, jobTitle, ... }
GET  /api/auth/me
```

### Users
```
GET  /api/users/search?q=        Search by username/alias/company
GET  /api/users/suggestions      Who to follow
GET  /api/users/:username        Profile
PUT  /api/users/profile          Update (multipart for avatar)
POST /api/users/:id/follow
POST /api/users/:id/unfollow
POST /api/users/requests/:id/accept
POST /api/users/requests/:id/decline
```

### Posts
```
POST   /api/posts                Create (multipart)
GET    /api/posts/confessions    Anonymous feed
GET    /api/posts/user/:userId   User's posts
GET    /api/posts/:id
DELETE /api/posts/:id
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
POST   /api/posts/:id/repost
```

### Feed
```
GET /api/feed              Personalized (following + own)
GET /api/feed/trending     Top posts last 7 days
```

### Groups
```
GET  /api/groups
POST /api/groups/:slug/join
POST /api/groups/:slug/leave
GET  /api/groups/:slug/feed
```

### Moods
```
POST /api/moods             { mood }
GET  /api/moods/today
GET  /api/moods/history
```

### Notifications
```
GET /api/notifications
PUT /api/notifications/mark-read
```

---

## 🏆 Badges System

| Badge | Emoji | Trigger |
|---|---|---|
| First Drink Post | 🍻 | First post ever |
| Overtime Survivor | 🥴 | 10 total posts |
| Production Down Legend | 💀 | Any post gets 50+ likes |
| Fake Drinking (Office Hours) | 🧃 | Post between 9am–5pm |
| Meme Lord | 🐸 | 3+ meme posts |
| Confession King | 🤫 | 5+ anonymous posts |
| Weekend Warrior | 🎉 | Posts on Fri + Sat + Sun |

Badges are checked and awarded automatically on every post creation and like event. New badges emit real-time socket notifications.

---

## 🔒 Security Notes

- OTPs are **bcrypt-hashed** before storage, never stored in plain text
- OTPs expire after **10 minutes**
- JWT tokens expire after **30 days** (configurable via `JWT_EXPIRES_IN`)
- Anonymous posts strip author info at the API layer before returning to clients
- Rate limiting: 200 requests per 15-minute window per IP
- Image uploads: 10MB limit, images-only filter, auto-transformed via Cloudinary

---

## 🛠️ Production Deployment

### Backend (Railway / Render / Fly.io)
1. Set all `.env` variables as environment variables
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your frontend domain
4. Run `npm start`

### Frontend (Vercel / Netlify)
1. Build: `npm run build`
2. Set `VITE_API_URL` if using a separate domain (update `vite.config.js` proxy)
3. Deploy the `dist/` folder

### MongoDB
Use [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster. Update `MONGO_URI` to the Atlas connection string.

---

## 📦 Dependencies

### Backend
| Package | Purpose |
|---|---|
| express | HTTP server |
| mongoose | MongoDB ODM |
| socket.io | Real-time notifications |
| jsonwebtoken | JWT auth |
| bcryptjs | OTP hashing |
| nodemailer | Email OTP |
| twilio | SMS OTP |
| multer + cloudinary | File uploads |
| express-rate-limit | Rate limiting |

### Frontend
| Package | Purpose |
|---|---|
| react + react-dom | UI framework |
| react-router-dom v6 | Client routing |
| axios | HTTP client |
| socket.io-client | Real-time connection |
| date-fns | Date formatting |
| tailwindcss | Utility CSS |
| vite | Build tool |

---

*Built with 🍺 and questionable life choices.*
