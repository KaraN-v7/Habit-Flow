// App.tsx
import React, { useEffect, useState, useRef } from 'react';
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
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // Supabase UUID
  const [view, setView] = useState<ViewMode>('daily');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteContext, setDeleteContext] = useState<{
    habit: Habit;
    source: 'daily' | 'weekly' | 'monthly';
    date?: string;
  } | null>(null);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitflow_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // For cross-device sync: we use a window focus listener
  const focusListenerRef = useRef<((this: Window, ev: FocusEvent) => any) | null>(null);

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

  // -------------- DATA LOADING & SYNC --------------

  const loadUserData = async (uid: string) => {
    try {
      // Load Habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', uid);

      if (habitsError) {
        console.error('Error loading habits', habitsError);
      } else if (habitsData) {
        const mappedHabits: Habit[] = habitsData.map((h: any) => ({
          id: h.id,
          name: h.name,
          emoji: h.emoji,
          frequency: h.frequency,
          period: h.period,
          specificDate: h.specific_date,
          category: h.category,
          streak: h.streak,
          completedDates: h.completed_dates || [],
          createdAt: h.created_at,
          weeklyGoal: h.weekly_goal,
          monthlyGoal: h.monthly_goal,
          points: h.points,
          skippedDates: h.skipped_dates || []
        }));
        setHabits(mappedHabits);
      }

      // Load Chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', uid);

      if (chaptersError) {
        console.error('Error loading chapters', chaptersError);
      } else if (chaptersData) {
        const mappedChapters: Chapter[] = chaptersData.map((c: any) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          isCompleted: c.is_completed
        }));
        setChapters(mappedChapters);
      }
    } catch (err) {
      console.error('loadUserData error', err);
    }
  };

  const startSync = (uid: string) => {
    stopSync(); // clear old listener first

    const onFocus = () => {
      if (uid) {
        loadUserData(uid);
      }
    };

    window.addEventListener('focus', onFocus);
    focusListenerRef.current = onFocus;
  };

  const stopSync = () => {
    if (focusListenerRef.current) {
      window.removeEventListener('focus', focusListenerRef.current);
      focusListenerRef.current = null;
    }
  };

  const clearSessionState = () => {
    stopSync();
    setUser(null);
    setUserId(null);
    setHabits([]);
    setChapters([]);
    localStorage.removeItem('habitflow_session_user');
    setView('daily');
  };

  // -------------- PROFILE HANDLING (GOOGLE-ONLY) --------------

  const ensureProfileAndLoad = async (uid: string, supaUser: any) => {
    try {
      // 1. Try by id
      const { data: byId, error: byIdError } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();

      let profile = byId;

      if (byIdError && byIdError.code !== 'PGRST116') {
        console.warn('Error fetching user profile by id', byIdError);
      }

      // 2. If not found, try by email (merge legacy account if same email)
      if (!profile) {
        const email = supaUser.email ?? null;
        if (email) {
          const { data: usersByEmail, error: byEmailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

          if (byEmailError) {
            console.warn('Error fetching user by email', byEmailError);
          } else if (usersByEmail && usersByEmail.length > 0) {
            // Legacy user exists with same email but different id
            const legacy = usersByEmail[0];
            const oldId = legacy.id;

            if (oldId && oldId !== uid) {
              console.log(`Merging legacy user ${oldId} into new auth user ${uid}`);

              // Move habits
              const { error: habErr } = await supabase
                .from('habits')
                .update({ user_id: uid })
                .eq('user_id', oldId);
              if (habErr) console.error('Error migrating habits', habErr);

              // Move chapters
              const { error: chapErr } = await supabase
                .from('chapters')
                .update({ user_id: uid })
                .eq('user_id', oldId);
              if (chapErr) console.error('Error migrating chapters', chapErr);

              // Delete old user row
              const { error: delErr } = await supabase
                .from('users')
                .delete()
                .eq('id', oldId);
              if (delErr) console.error('Error deleting old user row', delErr);
            }
          }
        }
      }

      // 3. After potential merge, fetch again by id
      if (!profile) {
        const { data: byIdAfterMerge } = await supabase
          .from('users')
          .select('*')
          .eq('id', uid)
          .single();
        profile = byIdAfterMerge;
      }

      // 4. If still no profile, create a new one
      if (!profile) {
        const meta = supaUser.user_metadata || {};
        const email = supaUser.email ?? null;
        const usernameGuess =
          (meta.full_name && meta.full_name.replace(/\s+/g, '').toLowerCase()) ||
          (email ? email.split('@')[0] : `user-${uid.slice(0, 8)}`);

        const { data: inserted, error: insErr } = await supabase
          .from('users')
          .insert([{
            id: uid,
            username: usernameGuess,
            email,
            avatar: meta.picture ?? null,
            joined_at: new Date().toISOString(),
            badges: [],
            total_streak_points: 0
          }])
          .select()
          .single();

        if (insErr) {
          console.error('Failed to insert profile', insErr);
          return;
        }
        profile = inserted;
      }

      if (profile) {
        const userProfile: User = {
          username: profile.username,
          joinedAt: profile.joined_at,
          badges: profile.badges || [],
          totalStreakPoints: profile.total_streak_points || 0,
          pin: profile.pin ?? undefined,       // not used anymore, just matches type
          avatar: profile.avatar ?? undefined,
          email: profile.email ?? undefined,
          phone: profile.phone ?? undefined
        };

        setUser(userProfile);
        setUserId(uid);
        localStorage.setItem('habitflow_session_user', JSON.stringify({ user: userProfile, id: uid }));

        // start focus-based sync
        startSync(uid);

        // load data
        await loadUserData(uid);
      }
    } catch (err) {
      console.error('ensureProfileAndLoad error', err);
    }
  };

  // -------------- AUTH EFFECT (GOOGLE OAUTH) --------------

  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== 'undefined') {
          // Handle tokens returned in URL after Google redirect
          const hasHash = window.location.hash?.includes('access_token');
          const hasQuery = window.location.search?.includes('access_token');
          if (hasHash || hasQuery) {
            const { error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) {
              console.error('getSessionFromUrl error', error);
            }
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        }
      } catch (err) {
        console.error('Error while processing OAuth redirect', err);
      }

      // Initial session check
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        await ensureProfileAndLoad(session.user.id, session.user);
      } else {
        // Fallback: use local cache if any (for quick UI)
        const stored = localStorage.getItem('habitflow_session_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed.user);
          setUserId(parsed.id);
          startSync(parsed.id);
          loadUserData(parsed.id);
        }
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            await ensureProfileAndLoad(session.user.id, session.user);
          } else if (event === 'SIGNED_OUT') {
            clearSessionState();
          }
        } catch (err) {
          console.error('auth state change error', err);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      stopSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error', err);
    } finally {
      clearSessionState();
      try {
        window.location.replace(window.location.origin);
      } catch {
        window.location.reload();
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!userId) return;
    setUser(updatedUser);
    localStorage.setItem('habitflow_session_user', JSON.stringify({ user: updatedUser, id: userId }));
    await supabase.from('users').update({
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar
    }).eq('id', userId);
  };

  // -------------- HABITS & CHAPTERS (same as before, no PIN) --------------

  const addRecurringHabit = async (
    name: string,
    emoji: string,
    category: string,
    weeklyGoal: number,
    monthlyGoal: number,
    points: number,
    period: 'weekly' | 'monthly'
  ) => {
    if (!userId) return;

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
      points: 0,
      skippedDates: []
    };

    setHabits(prev => [...prev, newHabit]);

    const { data, error } = await supabase
      .from('habits')
      .insert([{
        user_id: userId,
        name,
        emoji,
        category,
        frequency: 'daily',
        period,
        weekly_goal: weeklyGoal,
        monthly_goal: monthlyGoal,
        points: 0,
        streak: 0,
        completed_dates: [],
        skipped_dates: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting habit', error);
    } else if (data) {
      setHabits(prev => prev.map(h => h.id === newHabit.id ? { ...h, id: data.id } : h));
    }
  };

  const addOneTimeTask = async (name: string, date: string) => {
    if (!userId) return;

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
      points: 0,
      specificDate: date,
      skippedDates: []
    };

    setHabits(prev => [...prev, newHabit]);

    const { data, error } = await supabase
      .from('habits')
      .insert([{
        user_id: userId,
        name,
        emoji: '📝',
        category: 'Daily Task',
        frequency: 'daily',
        specific_date: date,
        streak: 0,
        completed_dates: [],
        skipped_dates: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting one-time task', error);
    } else if (data) {
      setHabits(prev => prev.map(h => h.id === newHabit.id ? { ...h, id: data.id } : h));
    }
  };

  const addChapter = async (name: string, subject: 'Physics' | 'Chemistry' | 'Mathematics') => {
    if (!userId) return;

    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      name,
      subject,
      isCompleted: false
    };

    setChapters(prev => [...prev, newChapter]);

    const { data, error } = await supabase
      .from('chapters')
      .insert([{
        user_id: userId,
        name,
        subject,
        is_completed: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting chapter', error);
    } else if (data) {
      setChapters(prev => prev.map(c => c.id === newChapter.id ? { ...c, id: data.id } : c));
    }
  };

  const deleteChapter = async (id: string) => {
    if (!userId) return;
    setChapters(prev => prev.filter(c => c.id !== id));
    await supabase.from('chapters').delete().eq('id', id);
  };

  const updateBadgesAndPoints = async (
    currentUser: User,
    currentUserId: string,
    currentHabits: Habit[],
    currentChapters: Chapter[]
  ) => {
    const badgesToUpdate = checkNewBadges(currentUser, currentHabits, currentChapters);
    let updatedUser = { ...currentUser };
    let hasUpdates = false;

    if (badgesToUpdate.length > 0) {
      const currentBadges = [...currentUser.badges];
      const newBadgesList: Badge[] = [];

      badgesToUpdate.forEach(nb => {
        const existingIndex = currentBadges.findIndex(b => b.key === nb.key);
        if (existingIndex >= 0) {
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
        alert(`🎉 Badge Unlocked: ${newBadgesList[0].name}!`);
        updatedUser.badges = currentBadges;
        hasUpdates = true;
      }
    }

    if (hasUpdates || updatedUser.totalStreakPoints !== currentUser.totalStreakPoints) {
      setUser(updatedUser);
      localStorage.setItem('habitflow_session_user', JSON.stringify({ user: updatedUser, id: currentUserId }));
      await supabase
        .from('users')
        .update({
          badges: updatedUser.badges,
          total_streak_points: updatedUser.totalStreakPoints
        })
        .eq('id', currentUserId);
    }
  };

  const toggleChapterCompletion = async (id: string) => {
    if (!user || !userId) return;

    const updatedChapters = chapters.map(c =>
      c.id === id ? { ...c, isCompleted: !c.isCompleted } : c
    );
    setChapters(updatedChapters);

    const target = updatedChapters.find(c => c.id === id);
    if (target) {
      await supabase
        .from('chapters')
        .update({ is_completed: target.isCompleted })
        .eq('id', id);
    }

    await updateBadgesAndPoints(user, userId, habits, updatedChapters);
  };

  const pushChapterToDaily = (chapterName: string, subject: string) => {
    const dateString = selectedDate.toLocaleDateString('en-CA');
    const taskName = `Study: ${chapterName} (${subject})`;
    addOneTimeTask(taskName, dateString);
    alert(`Added "${taskName}" to ${selectedDate.toLocaleDateString()}`);
  };

  const toggleHabit = async (id: string, date: string) => {
    if (!user || !userId) return;

    let pointsDelta = 0;
    let targetHabit: Habit | undefined;

    const updatedHabits = habits.map(habit => {
      if (habit.id !== id) return habit;

      const isCompleted = habit.completedDates.includes(date);
      let newCompletedDates;
      let newStreak = 0;

      if (isCompleted) {
        const currentStreak = calculateCurrentStreak(habit.completedDates);
        if (currentStreak > 1) pointsDelta = -1;
        newCompletedDates = habit.completedDates.filter(d => d !== date);
        newStreak = calculateCurrentStreak(newCompletedDates);
      } else {
        newCompletedDates = [...habit.completedDates, date];
        newStreak = calculateCurrentStreak(newCompletedDates);
        if (newStreak > 1) pointsDelta = 1;
      }

      const updated = {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak
      };
      targetHabit = updated;
      return updated;
    });

    setHabits(updatedHabits);

    if (targetHabit) {
      await supabase
        .from('habits')
        .update({
          completed_dates: targetHabit.completedDates,
          streak: targetHabit.streak
        })
        .eq('id', id);
    }

    const updatedUser = {
      ...user,
      totalStreakPoints: Math.max(0, (user.totalStreakPoints || 0) + pointsDelta)
    };
    await updateBadgesAndPoints(updatedUser, userId, updatedHabits, chapters);
  };

  const promptDeleteHabit = (
    habitId: string,
    source: 'daily' | 'weekly' | 'monthly',
    date?: string
  ) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setDeleteContext({ habit, source, date });
    }
  };

  const confirmDeleteHabit = async () => {
    if (!deleteContext || !userId) return;

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

      const target = updatedHabits.find(h => h.id === habit.id);
      if (target) {
        await supabase
          .from('habits')
          .update({
            skipped_dates: target.skippedDates
          })
          .eq('id', habit.id);
      }
    } else {
      setHabits(prev => prev.filter(h => h.id !== habit.id));
      await supabase.from('habits').delete().eq('id', habit.id);
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
        return (
          <DailyView
            habits={habits}
            toggleHabit={toggleHabit}
            selectedDate={selectedDate}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
            onAddOneTimeTask={addOneTimeTask}
            onDeleteHabit={(id) =>
              promptDeleteHabit(id, 'daily', selectedDate.toLocaleDateString('en-CA'))
            }
          />
        );
      case 'weekly':
        return (
          <WeeklyView
            habits={habits}
            toggleHabit={toggleHabit}
            onDeleteHabit={(id) => promptDeleteHabit(id, 'weekly')}
          />
        );
      case 'monthly':
        return (
          <MonthlyView
            habits={habits}
            toggleHabit={toggleHabit}
            currentDate={selectedDate}
            onDeleteHabit={(id) => promptDeleteHabit(id, 'monthly')}
          />
        );
      case 'syllabus':
        return (
          <SyllabusView
            chapters={chapters}
            onAddChapter={addChapter}
            onPushToDaily={pushChapterToDaily}
            onDeleteChapter={deleteChapter}
            onToggleComplete={toggleChapterCompletion}
            selectedDate={selectedDate}
          />
        );
      case 'analytics':
        return <Analytics habits={habits} user={user} chapters={chapters} />;
      case 'coach':
        return <Coach habits={habits} />;
      default:
        return (
          <DailyView
            habits={habits}
            toggleHabit={toggleHabit}
            selectedDate={selectedDate}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
            onAddOneTimeTask={addOneTimeTask}
            onDeleteHabit={(id) =>
              promptDeleteHabit(id, 'daily', selectedDate.toLocaleDateString('en-CA'))
            }
          />
        );
    }
  };

  // -------------- RENDER --------------

  if (!user) {
    return <Auth />; // Google-only login screen
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
