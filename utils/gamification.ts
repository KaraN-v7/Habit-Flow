import { Habit, Badge, User, Chapter } from '../types';

export const AVAILABLE_BADGES = [
  // --- Starter Badges ---
  {
    key: 'first_step',
    name: 'Aspirant',
    icon: '🌱',
    description: 'Completed your first study session.',
  },
  {
    key: 'chapter_closer',
    name: 'Chapter Closer',
    icon: '📕',
    description: 'Finished your first syllabus chapter.',
  },

  // --- Streak Badges (Repeatable) ---
  {
    key: 'streak_3',
    name: 'Momentum',
    icon: '🔥',
    description: 'Studied for 3 consecutive days.',
  },
  {
    key: 'streak_7',
    name: 'Week Warrior',
    icon: '⚔️',
    description: 'Consistent effort for 7 days. JEE level dedication.',
  },
  {
    key: 'streak_14',
    name: 'Fortnight Focus',
    icon: '🏰',
    description: 'Two weeks of unbroken consistency.',
  },
  {
    key: 'streak_30',
    name: 'IITian Mindset',
    icon: '🧠',
    description: '30-day streak. Discipline is key.',
  },
  {
    key: 'streak_60',
    name: 'Unstoppable',
    icon: '🚀',
    description: '60-day streak. You are a machine.',
  },

  // --- Volume/Count Badges ---
  {
    key: 'completion_100',
    name: 'Centurion',
    icon: '💯',
    description: 'Completed 100 study tasks.',
  },
  {
    key: 'completion_500',
    name: 'Grandmaster',
    icon: '🧙‍♂️',
    description: 'Completed 500 study tasks.',
  },
  {
    key: 'high_points',
    name: 'Ranker',
    icon: '🏆',
    description: 'Earned over 500 streak points.',
  },

  // --- Time/Schedule Badges ---
  {
    key: 'night_owl',
    name: 'Night Owl',
    icon: '🦉',
    description: 'Completed a task after 11 PM.',
  },
  {
    key: 'early_bird',
    name: 'Brahma Muhurta',
    icon: '🌅',
    description: 'Completed a task before 6 AM.',
  },
  {
    key: 'weekend_warrior',
    name: 'No Days Off',
    icon: '📅',
    description: 'Completed tasks on both Saturday and Sunday.',
  },
  {
    key: '12_hour_titan',
    name: '12-Hour Titan',
    icon: '🏋️',
    description: 'Logged 12+ hours of study in a single day.',
  },

  // --- Subject/Syllabus Badges (Progress) ---
  {
    key: 'syllabus_10',
    name: 'Getting Started',
    icon: '📚',
    description: 'Completed 10% of the total syllabus.',
  },
  {
    key: 'syllabus_50',
    name: 'Halfway There',
    icon: '⛰️',
    description: 'Completed 50% of the total syllabus.',
  },
  {
    key: 'syllabus_100',
    name: 'Syllabus Conqueror',
    icon: '🎓',
    description: 'Completed 100% of the entire syllabus!',
  },
  
  // --- Subject Specific 100% ---
  {
    key: 'physics_master',
    name: 'Newton',
    icon: '🍎',
    description: 'Completed 20% of Physics chapters.',
  },
  {
    key: 'physics_100',
    name: 'Einstein',
    icon: '⚛️',
    description: 'Completed 100% of Physics syllabus.',
  },
  
  {
    key: 'chem_master',
    name: 'Alchemist',
    icon: '🧪',
    description: 'Completed 20% of Chemistry chapters.',
  },
  {
    key: 'chem_100',
    name: 'Marie Curie',
    icon: '⚗️',
    description: 'Completed 100% of Chemistry syllabus.',
  },

  {
    key: 'math_master',
    name: 'Ramanujan',
    icon: '📐',
    description: 'Completed 20% of Mathematics chapters.',
  },
  {
    key: 'math_100',
    name: 'Euler',
    icon: '🔢',
    description: 'Completed 100% of Mathematics syllabus.',
  },

  {
    key: 'chapters_48',
    name: 'Marathon Runner',
    icon: '🏃',
    description: 'Completed 48 Chapters.',
  },
  
  // --- Specific Task Types ---
  {
    key: 'mock_test_survivor',
    name: 'Exam Ready',
    icon: '📝',
    description: 'Completed a Mock Test or Past Paper.',
  },
  {
    key: 'comeback_kid',
    name: 'Comeback Kid',
    icon: '📈',
    description: 'Resumed a streak after missing a day.',
  }
];

// Helper to parse duration
const parseDuration = (name: string): number => {
  const match = name.match(/(\d+(\.\d+)?)\s*(h|hr|hours?|m|min|minutes?)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[3].toLowerCase();
  return unit.startsWith('m') ? value / 60 : value;
};

// Returns an array of ALL contiguous streak lengths found in the dates
// e.g. dates for Jan 1,2,3, Jan 6,7 would return [3, 2]
const getStreakLengths = (dates: string[]): number[] => {
  if (dates.length === 0) return [];
  const uniqueDates = Array.from(new Set(dates));
  const sorted = uniqueDates.sort((a, b) => a.localeCompare(b));
  
  const lengths: number[] = [];
  let currentStreak = 1;
  
  for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i-1]);
      const curr = new Date(sorted[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays === 1) {
          currentStreak++;
      } else {
          lengths.push(currentStreak);
          currentStreak = 1;
      }
  }
  lengths.push(currentStreak); // push the last one
  return lengths;
};

// UI Helper for current streak
export const calculateCurrentStreak = (dates: string[]): number => {
  // This logic is used for the "Streak" display on habit cards
  if (dates.length === 0) return 0;
  
  const now = new Date();
  const today = now.toLocaleDateString('en-CA');
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toLocaleDateString('en-CA');

  const validDates = dates.filter(d => d <= today);
  const uniqueDates = Array.from(new Set(validDates));
  const sorted = uniqueDates.sort((a, b) => b.localeCompare(a)); // Descending

  if (sorted.length === 0) return 0;
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 1;
  let currentDateStr = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(currentDateStr);
      const prevDate = new Date(curr);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toLocaleDateString('en-CA');
      if (sorted[i] === prevDateStr) {
          streak++;
          currentDateStr = prevDateStr;
      } else {
          break;
      }
  }
  return streak;
};

export const checkNewBadges = (user: User, habits: Habit[], chapters: Chapter[] = []): Badge[] => {
  const badgesToUpdate: Badge[] = [];
  const userBadgesMap = new Map(user.badges.map(b => [b.key, b]));

  // 1. Basic Stats
  const totalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  
  // --- Global Streak Calculation ---
  const allCompletedDates = new Set<string>();
  habits.forEach(h => h.completedDates.forEach(d => allCompletedDates.add(d)));
  const datesList = Array.from(allCompletedDates);
  
  // Get all streak segments to check for multiples (e.g. two 7-day streaks)
  const streakLengths = getStreakLengths(datesList);
  
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA');
  const hour = now.getHours();

  // 2. Syllabus Stats
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.isCompleted).length;
  const syllabusPct = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

  const physChapters = chapters.filter(c => c.subject === 'Physics');
  const chemChapters = chapters.filter(c => c.subject === 'Chemistry');
  const mathChapters = chapters.filter(c => c.subject === 'Mathematics');

  const physPct = physChapters.length > 0 ? (physChapters.filter(c => c.isCompleted).length / physChapters.length) * 100 : 0;
  const chemPct = chemChapters.length > 0 ? (chemChapters.filter(c => c.isCompleted).length / chemChapters.length) * 100 : 0;
  const mathPct = mathChapters.length > 0 ? (mathChapters.filter(c => c.isCompleted).length / mathChapters.length) * 100 : 0;

  // --- Helper to Check/Update Badge ---
  const check = (key: string, condition: boolean, count: number = 1) => {
    if (condition) {
        const existing = userBadgesMap.get(key);
        // If new badge OR existing badge has lower count
        if (!existing || (existing.count || 1) < count) {
            const badge = createBadge(key);
            badge.count = count;
            // Preserve original date if updating count
            if (existing) badge.dateEarned = existing.dateEarned; 
            badgesToUpdate.push(badge);
        }
    }
  };

  // --- REPEATABLE LOGIC ---
  // Calculate how many times a streak has been achieved
  const calcRepeatableCount = (divisor: number) => {
      return streakLengths.reduce((acc, len) => acc + Math.floor(len / divisor), 0);
  };

  const streak3Count = calcRepeatableCount(3);
  const streak7Count = calcRepeatableCount(7);
  const streak14Count = calcRepeatableCount(14);
  const streak30Count = calcRepeatableCount(30);
  const streak60Count = calcRepeatableCount(60);

  check('streak_3', streak3Count >= 1, streak3Count);
  check('streak_7', streak7Count >= 1, streak7Count);
  check('streak_14', streak14Count >= 1, streak14Count);
  check('streak_30', streak30Count >= 1, streak30Count);
  check('streak_60', streak60Count >= 1, streak60Count);

  // Weekend Warrior Repeatable
  // Count distinct weekends
  let weekendCount = 0;
  // Filter all Saturdays from completed dates
  const saturdays = datesList.filter(d => new Date(d).getDay() === 6);
  saturdays.forEach(sat => {
      const satDate = new Date(sat);
      const sunDate = new Date(satDate);
      sunDate.setDate(satDate.getDate() + 1);
      const sunStr = sunDate.toLocaleDateString('en-CA');
      if (allCompletedDates.has(sunStr)) {
          weekendCount++;
      }
  });
  check('weekend_warrior', weekendCount >= 1, weekendCount);


  // --- NON-REPEATABLE LOGIC (Count always 1) ---
  
  // Volume
  check('first_step', totalCompletions >= 1);
  check('completion_100', totalCompletions >= 100);
  check('completion_500', totalCompletions >= 500);
  check('high_points', user.totalStreakPoints >= 500);

  // Syllabus
  check('chapter_closer', completedChapters >= 1);
  check('chapters_48', completedChapters >= 48);
  
  check('syllabus_10', syllabusPct >= 10);
  check('syllabus_50', syllabusPct >= 50);
  check('syllabus_100', syllabusPct >= 100);
  
  check('physics_master', physPct >= 20);
  check('physics_100', physPct >= 100);
  
  check('chem_master', chemPct >= 20);
  check('chem_100', chemPct >= 100);
  
  check('math_master', mathPct >= 20);
  check('math_100', mathPct >= 100);

  // Time / Schedule
  check('night_owl', hour >= 23);
  check('early_bird', hour < 6);

  // 12-Hour Titan
  let todaysHours = 0;
  habits.forEach(h => {
      if (h.completedDates.includes(todayStr)) {
          todaysHours += parseDuration(h.name);
      }
  });
  check('12_hour_titan', todaysHours >= 12);

  // Mock Test Survivor
  const hasMockTest = habits.some(h => 
      (h.name.toLowerCase().includes('mock') || h.name.toLowerCase().includes('test') || h.name.toLowerCase().includes('paper')) && 
      h.completedDates.length > 0
  );
  check('mock_test_survivor', hasMockTest);

  return badgesToUpdate;
};

const createBadge = (key: string): Badge => {
  const def = AVAILABLE_BADGES.find(b => b.key === key)!;
  return {
    id: crypto.randomUUID(),
    key: def.key,
    name: def.name,
    icon: def.icon,
    description: def.description,
    dateEarned: new Date().toISOString(),
    count: 1
  };
};