/**
 * Streaks Utility
 * Helper to update user streaks (login, posting, mood)
 */

/**
 * Update a user's streak for a given type
 * @param {Object} user - Mongoose User document
 * @param {string} streakType - 'login' | 'posting' | 'mood'
 * @returns {{ current: number, longest: number, isNewRecord: boolean }}
 */
const updateStreak = async (user, streakType) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Initialize streaks object if it doesn't exist
  if (!user.streaks) {
    user.streaks = {};
  }

  if (!user.streaks[streakType]) {
    user.streaks[streakType] = {
      current: 0,
      longest: 0,
      lastDate: null,
    };
  }

  const streak = user.streaks[streakType];

  // If already updated today, no-op
  if (streak.lastDate === today) {
    return {
      current: streak.current,
      longest: streak.longest,
      isNewRecord: false,
    };
  }

  let isNewRecord = false;

  if (streak.lastDate === yesterdayStr) {
    // Consecutive day — increment
    streak.current += 1;
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
      isNewRecord = true;
    }
  } else {
    // Streak broken — reset to 1
    streak.current = 1;
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
      isNewRecord = true;
    }
  }

  streak.lastDate = today;

  // Mark the nested path as modified so Mongoose saves it
  user.markModified(`streaks.${streakType}`);
  await user.save();

  return {
    current: streak.current,
    longest: streak.longest,
    isNewRecord,
  };
};

module.exports = { updateStreak };
