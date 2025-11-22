// App.tsx
import React, { useEffect, useState } from 'react';
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
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('daily');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteContext, setDeleteContext] = useState<{ habit: Habit, source: 'daily'|'weekly'|'monthly', date?: string } | null>(null);

  // Dark mode state (keeps your original behavior)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('habitflow_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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
  const goToPrevDay = () => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() - 1); setSelectedDate(newDate); };
  const goToNextDay = () => { const newDate = new Date(selectedDate); newDate.setDate(selectedDate.getDate() + 1); setSelectedDate(newDate); };

  // load habits & chapters for user
  const loadUserData = async (uid: string) => {
    try {
      const { data: habitsData, error: habErr } = await supabase.from('habits').select('*').eq('user_id', uid);
      if (habErr) console.error('fetch habits error', habErr);
      if (habitsData) {
        const mapped: Habit[] = habitsData.map((h: any) => ({
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
        setHabits(mapped);
      }

      const { data: chaptersData, error: chapErr } = await supabase.from('chapters').select('*').eq('user_id', uid);
      if (chapErr) console.error('fetch chapters error', chapErr);
      if (chaptersData) {
        const mappedChapters: Chapter[] = chaptersData.map((c: any) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          isCompleted: c.is_completed
        }));
        setChapters(mappedChapters);
      }
    } catch (e) {
      console.error('loadUserData error', e);
    }
  };

  // Auth listener & initial session check
  useEffect(() => {
    let mounted = true;

    // initial session check
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.user) {
          const uid = session.user.id;
          // try to load profile & data
          await ensureProfileAndLoad(uid, session.user);
        } else {
          // fallback: check local storage cached profile (fast UI)
          const stored = localStorage.getItem('habitflow_session_user');
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setUser(parsed.user);
            setUserId(parsed.id);
            loadUserData(parsed.id);
          }
        }
      } catch (err) {
        console.error('initial session check error', err);
      }
    })();

    // subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureProfileAndLoad(session.user.id, session.user);
        } else if (event === 'SIGNED_OUT') {
          await handleLogout();
        }
      } catch (e) {
        console.error('onAuthStateChange error', e);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ensure profile row exists in `users` table and then load data
  const ensureProfileAndLoad = async (uid: string, supaUser: any) => {
    try {
      // try fetch profile
      const { data: customUser, error: fetchErr } = await supabase.from('users').select('*').eq('id', uid).single();
      let profile = customUser;

      if (!profile) {
        // create profile using provider metadata if missing
        const meta = supaUser.user_metadata || {};
        const email = supaUser.email ?? null;
        const usernameGuess =
          (meta.full_name && meta.full_name.replace(/\s+/g, '').toLowerCase()) ||
          (email ? email.split('@')[0] : `user-${uid.slice(0,8)}`);

        const { data: inserted, error: insErr } = await supabase.from('users').insert([{
          id: uid,
          username: usernameGuess,
          email,
          avatar: meta.picture ?? null,
          joined_at: new Date().toISOString(),
          badges: [],
          total_streak_points: 0
        }]).select().single();

        if (insErr) {
          console.error('Failed to insert profile', insErr);
        } else {
          profile = inserted;
        }
      }

      if (profile) {
        const userProfile: User = {
          username: profile.username,
          joinedAt: profile.joined_at,
          badges: profile.badges || [],
          totalStreakPoints: profile.total_streak_points || 0,
          pin: profile.pin ?? undefined,
          avatar: profile.avatar ?? undefined,
          email: profile.email ?? undefined,
          phone: profile.phone ?? undefined
        };
        setUser(userProfile);
        setUserId(uid);
        localStorage.setItem('habitflow_session_user', JSON.stringify({ user: userProfile, id: uid }));
        loadUserData(uid);
      }
    } catch (err) {
      console.error('ensureProfileAndLoad error', err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error', err);
    }
    setUser(null);
    setUserId(null);
    setHabits([]);
    setChapters([]);
    localStorage.removeItem('habitflow_session_user');
    setView('daily');
  };

  // ----- your existing CRUD functions below unchanged (except they rely on userId)
  // addRecurringHabit, addOneTimeTask, addChapter, deleteChapter, updateBadgesAndPoints,
  // toggleChapterCompletion, pushChapterToDaily, toggleHabit, promptDeleteHabit, confirmDeleteHabit, getDeleteMessage
  // (copy your existing implementations exactly here)
  // For brevity in this snippet I'm not repeating them; paste your existing functions from your previous App.tsx
  // make sure they reference userId variable as before.

  // Render logic
  if (!user) {
    return <Auth />;
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
        {/* renderContent: paste your renderContent function from existing App.tsx */}
      </main>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={/* pass your addRecurringHabit function */ (name:any,emoji:any,category:any,weeklyGoal:any,monthlyGoal:any,points:any,period:any)=>{}} 
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={/* pass handleUpdateUser if present */ (u:any)=>{}}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteContext}
        onClose={() => setDeleteContext(null)}
        onConfirm={() => {}}
        habitName={deleteContext?.habit.name || ''}
        message={getDeleteMessage ? getDeleteMessage() : undefined}
      />
    </div>
  );
};

export default App;
