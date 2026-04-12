/**
 * Drinkedin — Database Seed Script
 * Run with: npm run seed
 *
 * Populates: users, posts (including anonymous confessions), group posts
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Mood = require('../models/Mood');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/drinkedin';

// ─── Seed Users ───────────────────────────────────────────────────────────────
const seedUsers = [
  {
    username: 'burnt_dev_raj',
    alias: 'Raj (Probably Debugging)',
    jobTitle: 'Senior Software Engineer',
    company: 'TechCorp India',
    bio: 'I write code. Code breaks. I drink. Repeat.',
    corporatePersona: 'Burnt Out Dev',
    isVerified: true,
    email: 'raj@example.com',
    groups: ['developers', 'hr-fears-us'],
    badges: [
      { id: 'first_drink_post', name: 'First Drink Post', emoji: '🍻', description: 'Posted for the first time.' },
      { id: 'overtime_survivor', name: 'Overtime Survivor', emoji: '🥴', description: 'Made 10 posts.' },
    ],
    postCount: 12,
  },
  {
    username: 'priya_qa_ghost',
    alias: 'Priya QA 🐞',
    jobTitle: 'QA Lead',
    company: 'StartupX',
    bio: 'I find bugs in production that devs swear don\'t exist.',
    corporatePersona: 'QA Ghost',
    isVerified: true,
    email: 'priya@example.com',
    groups: ['qa-survivors', 'developers'],
    badges: [
      { id: 'first_drink_post', name: 'First Drink Post', emoji: '🍻', description: 'Posted for the first time.' },
    ],
    postCount: 5,
  },
  {
    username: 'manager_vikram',
    alias: 'Vikram (In Meetings)',
    jobTitle: 'Engineering Manager',
    company: 'MegaCorp',
    bio: 'My calendar is full. My soul is empty.',
    corporatePersona: 'Chaos Manager',
    isVerified: true,
    email: 'vikram@example.com',
    groups: ['managers-anonymous'],
    badges: [
      { id: 'fake_drinking', name: 'Fake Drinking (Office Hours)', emoji: '🧃', description: 'Posted between 9am–5pm.' },
    ],
    postCount: 7,
  },
  {
    username: 'ananya_design',
    alias: 'Ananya 🎨',
    jobTitle: 'UX Designer',
    company: 'PixelPerfect Agency',
    bio: '"Can you make the logo bigger?" — said no designer ever.',
    corporatePersona: 'Senior Slack Sender',
    isVerified: true,
    email: 'ananya@example.com',
    groups: ['design-disasters', 'hr-fears-us'],
    badges: [],
    postCount: 3,
  },
  {
    username: 'the_real_intern',
    alias: 'Intern Kartik',
    jobTitle: 'Software Intern',
    company: 'TechCorp India',
    bio: 'Day 1: Excited. Day 30: Send help.',
    corporatePersona: 'The Intern',
    isVerified: true,
    email: 'kartik@example.com',
    groups: ['developers'],
    badges: [
      { id: 'first_drink_post', name: 'First Drink Post', emoji: '🍻', description: 'First post!' },
    ],
    postCount: 2,
  },
];

// ─── Seed Posts ───────────────────────────────────────────────────────────────
const buildPosts = (userMap) => [
  // ── Regular posts ──────────────────────────────────────────────
  {
    author: userMap['burnt_dev_raj'],
    type: 'text',
    text: 'Survived 5 meetings that could\'ve been emails. Cheers 🍻',
    isAnonymous: false,
    likes: [userMap['priya_qa_ghost'], userMap['manager_vikram'], userMap['ananya_design']],
  },
  {
    author: userMap['priya_qa_ghost'],
    type: 'text',
    text: 'Daily standup completed. Now standing up at bar 🍺',
    isAnonymous: false,
    likes: [userMap['burnt_dev_raj'], userMap['manager_vikram']],
  },
  {
    author: userMap['manager_vikram'],
    type: 'text',
    text: 'Client escalation = bottle escalation 🥃\n\nThe bigger the ticket, the stronger the drink.',
    isAnonymous: false,
    likes: [userMap['burnt_dev_raj'], userMap['priya_qa_ghost'], userMap['ananya_design'], userMap['the_real_intern']],
  },
  {
    author: userMap['burnt_dev_raj'],
    type: 'text',
    text: 'Production bug fixed. Liver damage pending. 🥂\n\nAt least the customers are happy. I am not.',
    isAnonymous: false,
    likes: [userMap['priya_qa_ghost'], userMap['manager_vikram']],
    group: 'developers',
  },
  {
    author: userMap['ananya_design'],
    type: 'text',
    text: '"We need to redesign the entire app by Monday." — said on Friday at 5 PM 😭\n\nI have accepted my fate.',
    isAnonymous: false,
    likes: [userMap['burnt_dev_raj'], userMap['priya_qa_ghost'], userMap['manager_vikram'], userMap['the_real_intern']],
  },
  {
    author: userMap['the_real_intern'],
    type: 'text',
    text: 'First week at work: Pushed to production. Second week: Still in therapy. 🫡',
    isAnonymous: false,
    likes: [userMap['burnt_dev_raj'], userMap['priya_qa_ghost']],
    group: 'developers',
  },

  // ── Anonymous confessions ─────────────────────────────────────
  {
    author: userMap['burnt_dev_raj'],
    type: 'confession',
    text: 'I joined the meeting on mute and went to make Maggi 🍜\n\nCame back to "can you share your screen?" 😐',
    isAnonymous: true,
    likes: [userMap['priya_qa_ghost'], userMap['manager_vikram'], userMap['ananya_design'], userMap['the_real_intern']],
  },
  {
    author: userMap['manager_vikram'],
    type: 'confession',
    text: 'My "network issue" is actually me at a bar 🍺\n\nThe ping is better here honestly.',
    isAnonymous: true,
    likes: [userMap['burnt_dev_raj'], userMap['priya_qa_ghost']],
  },
  {
    author: userMap['priya_qa_ghost'],
    type: 'confession',
    text: 'I found a critical bug before the release and... said nothing. It was after 6 PM. 🤫',
    isAnonymous: true,
    likes: [userMap['burnt_dev_raj'], userMap['ananya_design']],
  },
  {
    author: userMap['ananya_design'],
    type: 'confession',
    text: 'I\'ve been billing 8 hrs/day but my actual productive hours are... let\'s say 2.5. The rest is Slack and coffee. ☕',
    isAnonymous: true,
    likes: [userMap['manager_vikram'], userMap['the_real_intern']],
  },

  // ── Meme post ─────────────────────────────────────────────────
  {
    author: userMap['priya_qa_ghost'],
    type: 'meme',
    text: 'Every. Single. Sprint.',
    memeTemplate: 'standup',
    memeTopCaption: 'QA: Found 47 bugs',
    memeBottomCaption: 'Dev: Those are features',
    isAnonymous: false,
    likes: [userMap['burnt_dev_raj'], userMap['manager_vikram'], userMap['ananya_design']],
    group: 'qa-survivors',
  },

  // ── Weekend post ──────────────────────────────────────────────
  {
    author: userMap['burnt_dev_raj'],
    type: 'text',
    text: 'What are we drinking tonight? 🥃\n\nI\'m thinking something that erases last week\'s sprint review.',
    isAnonymous: false,
    isWeekendPost: true,
    likes: [userMap['priya_qa_ghost'], userMap['ananya_design'], userMap['the_real_intern']],
  },
];

// ─── Main Seed Function ───────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Mood.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = await User.insertMany(seedUsers);
    console.log(`👤 Created ${createdUsers.length} users`);

    // Build userId map
    const userMap = {};
    createdUsers.forEach((u) => {
      userMap[u.username] = u._id;
    });

    // Set up follow relationships
    // raj follows priya, vikram, ananya
    // priya follows raj, kartik
    // vikram follows raj
    await User.findByIdAndUpdate(userMap['burnt_dev_raj'], {
      following: [userMap['priya_qa_ghost'], userMap['manager_vikram'], userMap['ananya_design']],
    });
    await User.findByIdAndUpdate(userMap['priya_qa_ghost'], {
      followers: [userMap['burnt_dev_raj']],
      following: [userMap['burnt_dev_raj'], userMap['the_real_intern']],
    });
    await User.findByIdAndUpdate(userMap['manager_vikram'], {
      followers: [userMap['burnt_dev_raj']],
    });
    await User.findByIdAndUpdate(userMap['ananya_design'], {
      followers: [userMap['burnt_dev_raj']],
    });
    await User.findByIdAndUpdate(userMap['the_real_intern'], {
      followers: [userMap['priya_qa_ghost']],
    });

    // Create posts with timestamps spread over last 7 days
    const posts = buildPosts(userMap);
    const now = Date.now();

    const postsWithTimestamps = posts.map((p, i) => ({
      ...p,
      createdAt: new Date(now - i * 3 * 60 * 60 * 1000), // 3 hrs apart
      updatedAt: new Date(now - i * 3 * 60 * 60 * 1000),
    }));

    // Add sample comments to first post
    postsWithTimestamps[0].comments = [
      {
        author: userMap['priya_qa_ghost'],
        text: 'Bro same. I counted. It was 6. The 6th one was about scheduling the next meeting. 😭',
        isAnonymous: false,
        createdAt: new Date(),
      },
      {
        author: userMap['manager_vikram'],
        text: 'At least you were in the meetings. I was in meetings about meetings.',
        isAnonymous: false,
        createdAt: new Date(),
      },
    ];

    const createdPosts = await Post.insertMany(postsWithTimestamps);
    console.log(`📝 Created ${createdPosts.length} posts`);

    // Seed today's moods
    const today = new Date().toISOString().split('T')[0];
    await Mood.insertMany([
      { user: userMap['burnt_dev_raj'], mood: 'need_a_drink', date: today },
      { user: userMap['priya_qa_ghost'], mood: 'surviving', date: today },
      { user: userMap['manager_vikram'], mood: 'burnt_out', date: today },
    ]);
    console.log('😄 Seeded today\'s moods');

    console.log('\n🍺 Seed complete! Drinkedin is ready to party.');
    console.log('\nSample login credentials (use OTP flow in app):');
    seedUsers.forEach((u) => console.log(`  • ${u.username} — ${u.email}`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
