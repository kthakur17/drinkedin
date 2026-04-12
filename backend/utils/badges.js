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

  // 3. Production down legend (50+ likes on a post)
  if (!hasBadge('production_down_legend') && triggerContext.likesOnPost >= 50) {
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
