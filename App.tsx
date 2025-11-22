import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyView from './components/DailyView';
import WeeklyView from './components/WeeklyView';
import MonthlyView from './components/MonthlyView';
import Analytics from './components/Analytics';
import Coach from './components/Coach';
import SyllabusView from './components/SyllabusView';
import AddHabitModal from './components/AddHabitModal';
import ProfileModal from './components/ProfileModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import Auth from './components/Auth';
import { Habit, ViewMode, User, Chapter, Badge } from './types';
import { checkNewBadges, calculateCurrentStreak } from './utils/gamification';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>('daily');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Delete State - Enhanced to track context
  const [deleteContext, setDeleteContext] = useState<{ 
      habit: Habit, 
      source: 'daily' | 'weekly' | 'monthly', 
      date?: string // Only for daily view deletions
  } | null>(null);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitflow_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('habitflow_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('habitflow_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Date Navigation
  const goToPrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Load user session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('habitflow_current_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure backward compatibility if totalStreakPoints is undefined
      if (parsedUser.totalStreakPoints === undefined && parsedUser.totalPoints !== undefined) {
          parsedUser.totalStreakPoints = parsedUser.totalPoints;
      }
      setUser(parsedUser);
      loadUserData(parsedUser.username);
    }
  }, []);

  const loadUserData = (username: string) => {
    // Load Habits
    const dataKey = `habitflow_data_${username}`;
    const savedHabits = localStorage.getItem(dataKey);
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits));
    } else {
      // Default onboarding habits for new user
      const defaultHabits: Habit[] = [
        {
          id: crypto.randomUUID(),
          name: 'Physics Revision',
          emoji: '⚛️',
          frequency: 'daily',
          period: 'weekly',
          category: 'Physics',
          streak: 0,
          completedDates: [],
          createdAt: new Date().toISOString(),
          weeklyGoal: 6,
          monthlyGoal: 25,
          points: 0,
          skippedDates: []
        }
      ];
      setHabits(defaultHabits);
      localStorage.setItem(dataKey, JSON.stringify(defaultHabits));
    }

    // Load Syllabus
    const syllabusKey = `habitflow_syllabus_${username}`;
    const savedChapters = localStorage.getItem(syllabusKey);
    if (savedChapters) {
      setChapters(JSON.parse(savedChapters));
    }
  };

  const handleLogin = (username: string, pin: string, isRegistering: boolean) => {
    const userKey = `habitflow_user_profile_${username}`;
    const existingProfile = localStorage.getItem(userKey);
    
    if (isRegistering) {
        // REGISTRATION LOGIC
        if (existingProfile) {
            alert("Account already exists! Please sign in instead.");
            return;
        }
        
        const userProfile: User = {
            username,
            joinedAt: new Date().toISOString(),
            badges: [],
            totalStreakPoints: 0,
            pin: pin
        };
        localStorage.setItem(userKey, JSON.stringify(userProfile));
        setUser(userProfile);
        localStorage.setItem('habitflow_current_user', JSON.stringify(userProfile));
        loadUserData(username);
    } else {
        // LOGIN LOGIC
        if (!existingProfile) {
            alert("Account not found! Please create an account.");
            return;
        }
        
        const userProfile = JSON.parse(existingProfile);
        if (userProfile.totalStreakPoints === undefined && userProfile.totalPoints !== undefined) {
            userProfile.totalStreakPoints = userProfile.totalPoints;
        }
        
        // Verify PIN
        if (userProfile.pin && userProfile.pin !== pin) {
            alert("Incorrect PIN! Please try again.");
            return;
        }
        
        setUser(userProfile);
        localStorage.setItem('habitflow_current_user', JSON.stringify(userProfile));
        loadUserData(username);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setHabits([]);
    setChapters([]);
    localStorage.removeItem('habitflow_current_user');
    setView('daily');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem(`habitflow_user_profile_${updatedUser.username}`, JSON.stringify(updatedUser));
      localStorage.setItem('habitflow_current_user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(`habitflow_data_${user.username}`, JSON.stringify(habits));
    }
  }, [habits, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`habitflow_syllabus_${user.username}`, JSON.stringify(chapters));
    }
  }, [chapters, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`habitflow_user_profile_${user.username}`, JSON.stringify(user));
      localStorage.setItem('habitflow_current_user', JSON.stringify(user));
    }
  }, [user]);

  // Adds a RECURRING habit (Weekly/Monthly view)
  const addRecurringHabit = (name: string, emoji: string, category: string, weeklyGoal: number, monthlyGoal: number, points: number, period: 'weekly' | 'monthly') => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      emoji,
      frequency: 'daily',
      period,
      category,
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
      weeklyGoal,
      monthlyGoal,
      points: 0, // We rely on streak logic now, setting default 0 to avoid confusion
      specificDate: undefined, 
      skippedDates: []
    };
    setHabits([...habits, newHabit]);
  };

  // Adds a ONE-TIME task (Daily view)
  const addOneTimeTask = (name: string, date: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      emoji: '📝',
      frequency: 'daily',
      category: 'Daily Task',
      streak: 0,
      completedDates: [],
      createdAt: new Date().toISOString(),
      weeklyGoal: 0,
      monthlyGoal: 0,
      points: 0, // Streak logic handles points
      specificDate: date,
      skippedDates: []
    };
    setHabits([...habits, newHabit]);
  }

  const addChapter = (name: string, subject: 'Physics' | 'Chemistry' | 'Mathematics') => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      name,
      subject,
      isCompleted: false
    };
    setChapters([...chapters, newChapter]);
  };

  const deleteChapter = (id: string) => {
    setChapters(chapters.filter(c => c.id !== id));
  };

  const updateBadges = (user: User, habits: Habit[], chapters: Chapter[]) => {
      const badgesToUpdate = checkNewBadges(user, habits, chapters);
      
      if (badgesToUpdate.length > 0) {
          const currentBadges = [...user.badges];
          const newBadgesList: Badge[] = [];
          
          badgesToUpdate.forEach(nb => {
              const existingIndex = currentBadges.findIndex(b => b.key === nb.key);
              if (existingIndex >= 0) {
                   // Only update if count is different (higher)
                   if ((nb.count || 1) > (currentBadges[existingIndex].count || 1)) {
                       currentBadges[existingIndex] = nb;
                       newBadgesList.push(nb);
                   }
              } else {
                  currentBadges.push(nb);
                  newBadgesList.push(nb);
              }
          });
          
          if (newBadgesList.length > 0) {
             // Only alert for the first new one to avoid spam
             alert(`🎉 Badge Unlocked: ${newBadgesList[0].name} ${newBadgesList[0].count && newBadgesList[0].count > 1 ? `(x${newBadgesList[0].count})` : ''}!`);
          }
          
          return { ...user, badges: currentBadges };
      }
      return user;
  };

  const toggleChapterCompletion = (id: string) => {
    if (!user) return;

    const updatedChapters = chapters.map(c => 
      c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
    );
    setChapters(updatedChapters);
    
    // Check for Syllabus badges
    const updatedUser = updateBadges(user, habits, updatedChapters);
    if (updatedUser !== user) {
        setUser(updatedUser);
    }
  };

  const pushChapterToDaily = (chapterName: string, subject: string) => {
    const dateString = selectedDate.toLocaleDateString('en-CA');
    const taskName = `Study: ${chapterName} (${subject})`;
    addOneTimeTask(taskName, dateString);
    alert(`Added "${taskName}" to ${selectedDate.toLocaleDateString()}`);
  };

  const toggleHabit = (id: string, date: string) => {
    if (!user) return;

    let pointsDelta = 0;

    const updatedHabits = habits.map(habit => {
      if (habit.id !== id) return habit;

      const isCompleted = habit.completedDates.includes(date);
      let newCompletedDates;
      let newStreak = 0;
      
      if (isCompleted) {
        // Unchecking
        const currentStreak = calculateCurrentStreak(habit.completedDates);
        if (currentStreak > 1) {
            pointsDelta = -1;
        }
        newCompletedDates = habit.completedDates.filter(d => d !== date);
        newStreak = calculateCurrentStreak(newCompletedDates);
      } else {
        // Checking
        newCompletedDates = [...habit.completedDates, date];
        newStreak = calculateCurrentStreak(newCompletedDates);
        
        // Add 1 point ONLY if streak is greater than 1 (consistency reward)
        if (newStreak > 1) {
            pointsDelta = 1;
        }
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak
      };
    });

    setHabits(updatedHabits);

    // Update User Points
    let updatedUser = { ...user, totalStreakPoints: Math.max(0, (user.totalStreakPoints || 0) + pointsDelta) };
    
    // Check for new badges and merge them
    updatedUser = updateBadges(updatedUser, updatedHabits, chapters);

    setUser(updatedUser);
  };

  // --- Delete Logic Enhanced ---
  const promptDeleteHabit = (habitId: string, source: 'daily' | 'weekly' | 'monthly', date?: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setDeleteContext({ habit, source, date });
    }
  };

  const confirmDeleteHabit = () => {
    if (!deleteContext) return;
    const { habit, source, date } = deleteContext;

    if (source === 'daily' && date && !habit.specificDate) {
        const updatedHabits = habits.map(h => {
            if (h.id === habit.id) {
                return {
                    ...h,
                    skippedDates: [...(h.skippedDates || []), date]
                };
            }
            return h;
        });
        setHabits(updatedHabits);
    } 
    else {
        setHabits(habits.filter(h => h.id !== habit.id));
    }
    
    setDeleteContext(null);
  };

  const getDeleteMessage = () => {
      if (!deleteContext) return undefined;
      const { habit, source } = deleteContext;
      if (source === 'daily' && !habit.specificDate) {
          return `Remove "${habit.name}" from today's list? It will remain active for other days.`;
      }
      return undefined;
  };

  const renderContent = () => {
    switch (view) {
      case 'daily':
        return <DailyView 
          habits={habits} 
          toggleHabit={toggleHabit} 
          selectedDate={selectedDate}
          onPrevDay={goToPrevDay}
          onNextDay={goToNextDay}
          onAddOneTimeTask={addOneTimeTask}
          onDeleteHabit={(id) => promptDeleteHabit(id, 'daily', selectedDate.toLocaleDateString('en-CA'))}
        />;
      case 'weekly':
        return <WeeklyView habits={habits} toggleHabit={toggleHabit} onDeleteHabit={(id) => promptDeleteHabit(id, 'weekly')} />;
      case 'monthly':
        return <MonthlyView habits={habits} toggleHabit={toggleHabit} currentDate={selectedDate} onDeleteHabit={(id) => promptDeleteHabit(id, 'monthly')} />;
      case 'syllabus':
        return <SyllabusView 
            chapters={chapters} 
            onAddChapter={addChapter} 
            onPushToDaily={pushChapterToDaily}
            onDeleteChapter={deleteChapter}
            onToggleComplete={toggleChapterCompletion}
            selectedDate={selectedDate}
        />;
      case 'analytics':
        return <Analytics habits={habits} user={user} chapters={chapters} />;
      case 'coach':
        return <Coach habits={habits} />;
      default:
        return <DailyView 
          habits={habits} 
          toggleHabit={toggleHabit} 
          selectedDate={selectedDate}
          onPrevDay={goToPrevDay}
          onNextDay={goToNextDay}
          onAddOneTimeTask={addOneTimeTask}
          onDeleteHabit={(id) => promptDeleteHabit(id, 'daily', selectedDate.toLocaleDateString('en-CA'))}
        />;
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F7F7F5] dark:bg-[#191919] overflow-hidden transition-colors duration-300">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        onAddHabit={() => setIsModalOpen(true)} 
        user={user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        onOpenProfile={() => setIsProfileOpen(true)}
      />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">
        {renderContent()}
      </main>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addRecurringHabit} 
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteContext}
        onClose={() => setDeleteContext(null)}
        onConfirm={confirmDeleteHabit}
        habitName={deleteContext?.habit.name || ''}
        message={getDeleteMessage()}
      />
    </div>
  );
};

export default App;