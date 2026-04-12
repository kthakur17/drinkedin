/**
 * Weekend Context
 * Automatically activates Friday–Sunday with party UI theme
 */

import { createContext, useContext, useEffect, useState } from 'react';

const WeekendContext = createContext({ isWeekend: false });

const WEEKEND_PROMPTS = [
  "What are we drinking tonight? 🥃",
  "Rate your week: 🍺 to 🥃",
  "Friday! Forget the sprint retro, start the bar retro 🍻",
  "The only standup that matters tonight is at the bar 🍺",
  "Weekend mode activated. Slack notifications: ignored 📵",
];

export const WeekendProvider = ({ children }) => {
  const [isWeekend, setIsWeekend] = useState(false);
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    const checkWeekend = () => {
      const day = new Date().getDay(); // 0=Sun, 5=Fri, 6=Sat
      const weekend = day === 0 || day === 5 || day === 6;
      setIsWeekend(weekend);

      if (weekend) {
        document.body.classList.add('weekend-mode');
        setPrompt(WEEKEND_PROMPTS[Math.floor(Math.random() * WEEKEND_PROMPTS.length)]);
      } else {
        document.body.classList.remove('weekend-mode');
      }
    };

    checkWeekend();
    // Re-check at midnight
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(() => {
      checkWeekend();
    }, msUntilMidnight);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove('weekend-mode');
    };
  }, []);

  return (
    <WeekendContext.Provider value={{ isWeekend, prompt }}>
      {children}
    </WeekendContext.Provider>
  );
};

export const useWeekend = () => useContext(WeekendContext);
