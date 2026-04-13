/**
 * Badges Utility
 * Auto-award badges based on user activity milestones
 */

const BADGE_DEFINITIONS = [
  {
    id: 'first_drink_post',
    name: 'First Drink Post',
    emoji: '🍻',
    description: 'Posted for the first time. The legend begins.',
    trigger: 'first_post',
  },
  {
    id: 'overtime_survivor',
    name: 'Overtime Survivor',
    emoji: '🥴',
    description: 'Made 10 posts. You clearly have too much free time... or no life outside work.',
    trigger: 'post_count_10',
  },
  {
    id: 'production_down_legend',
    name: 'Production Down Legend',
    emoji: '💀',
    description: 'A post reached 50+ likes. You broke production AND the internet.',
    trigger: 'post_likes_50',
  },
  {
    id: 'fake_drinking',
    name: 'Fake Drinking (Office Hours)',
    emoji: '🧃',
    description: 'Posted between 9am–5pm. We see you "working".',
    trigger: 'office_hours_post',
  },
  {
    id: 'confession_king',
    name: 'Confession King',
    emoji: '🤫',
    description: 'Made 5 anonymous confessions. Your secrets are safe... for now.',
    trigger: 'anonymous_posts_5',
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    emoji: '🎉',
    description: 'Posted on a Friday, Saturday, AND Sunday. Unhinged. We respect it.',
    trigger: 'weekend_post_streak',
  },
  {
    id: 'meme_lord',
    name: 'Meme Lord',
    emoji: '🐸',
    description: 'Posted 3 memes. IT department has filed a complaint.',
    trigger: 'meme_count_3',
  },
  {
    id: 'streak_3',
    name: '3-Day Bender',
    emoji: '🔥',
    description: '3-day login streak. Can\'t stop, won\'t stop.',
    trigger: 'login_streak_3',
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    emoji: '💪',
    description: '7-day login streak. Your manager is impressed (and concerned).',
    trigger: 'login_streak_7',
  },
  {
    id: 'streak_30',
    name: 'Corporate Lifer',
    emoji: '🏢',
    description: '30-day login streak. You basically live here now.',
    trigger: 'login_streak_30',
  },
  {
    id: 'mood_streak_7',
    name: 'Emotionally Available',
    emoji: '🧠',
    description: '7-day mood check-in streak. Your therapist would be proud.',
    trigger: 'mood_streak_7',
  },
  {
    id: 'poll_master',
    name: 'Poll Master',
    emoji: '📊',
    description: 'Created 5 polls. Democracy at its finest.',
    trigger: 'poll_count_5',
  },
];

/**
 * Check and award badges to a user based on their current stats
 * Returns array of newly awarded badges
 */
const checkAndAwardBadges = async (user, triggerContext = {}) => {
  const User = require('../models/User');
  const existingBadgeIds = user.badges.map((b) => b.id);
  const newBadges = [];

  // Helper: already has badge?
  const hasBadge = (id) => existingBadgeIds.includes(id);

  // 1. First post
  if (!hasBadge('first_drink_post') && user.postCount >= 1) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'first_drink_post'));
  }

  // 2. Overtime survivor (10 posts)
  if (!hasBadge('overtime_survivor') && user.postCount >= 10) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'overtime_survivor'));
  }

  // 3. Production down legend (50+ reactions on a post)
  if (!hasBadge('production_down_legend') && (triggerContext.reactionsOnPost >= 50 || triggerContext.likesOnPost >= 50)) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'production_down_legend'));
  }

  // 4. Fake drinking (office hours post — 9am–5pm local)
  if (!hasBadge('fake_drinking') && triggerContext.isOfficeHours) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'fake_drinking'));
  }

  // 5. Meme lord (3+ memes)
  if (!hasBadge('meme_lord') && triggerContext.memeCount >= 3) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'meme_lord'));
  }

  // 6. Confession king (5+ anonymous posts)
  if (!hasBadge('confession_king') && triggerContext.anonCount >= 5) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'confession_king'));
  }

  // Streak badges
  const loginStreak = user.streaks?.login?.current || 0;
  const moodStreak = user.streaks?.mood?.current || 0;
  if (!hasBadge('streak_3') && loginStreak >= 3) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'streak_3'));
  }
  if (!hasBadge('streak_7') && loginStreak >= 7) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'streak_7'));
  }
  if (!hasBadge('streak_30') && loginStreak >= 30) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'streak_30'));
  }
  if (!hasBadge('mood_streak_7') && moodStreak >= 7) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'mood_streak_7'));
  }

  // Poll master
  if (!hasBadge('poll_master') && triggerContext.pollCount >= 5) {
    newBadges.push(BADGE_DEFINITIONS.find((b) => b.id === 'poll_master'));
  }

  if (newBadges.length > 0) {
    const badgeEntries = newBadges.map((b) => ({
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      description: b.description,
      earnedAt: new Date(),
    }));

    await User.findByIdAndUpdate(user._id, {
      $push: { badges: { $each: badgeEntries } },
    });
  }

  return newBadges;
};

module.exports = { BADGE_DEFINITIONS, checkAndAwardBadges };
