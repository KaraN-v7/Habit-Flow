// App.tsx (replace your root App.tsx with this)
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
import LoadingOverlay from './components/LoadingOverlay';

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
  const [deleteContext, setDeleteContext] = useState<{ habit: Habit; source: 'daily'|'weekly'|'monthly'; date?: string } | null>(null);

  // auth loading indicator so spinner doesn't hang forever
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // dark mode
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
  const toggleTheme = () => setIsDarkMode(p => !p);

  // ---------- helpers ----------
  const loadUserData = async (uid: string) => {
    try {
      const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*').eq('user_id', uid);
      if (!habitsError && habitsData) {
        const mapped = habitsData.map((h:any) => ({
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

      const { data: chaptersData, error: chaptersError } = await supabase.from('chapters').select('*').eq('user_id', uid);
      if (!chaptersError && chaptersData) {
        const mapped = chaptersData.map((c:any) => ({
          id: c.id,
          name: c.name,
          subject: c.subject,
          isCompleted: c.is_completed
        }));
        setChapters(mapped);
      }
    } catch (err) {
      console.error('loadUserData error', err);
    }
  };

  // Ensure a users profile row exists in "users" table keyed by supabase auth id
  const ensureProfileAndLoad = async (uid: string, supaUser: any) => {
    try {
      console.log('[ensureProfileAndLoad] uid', uid);
      const { data: profile, error } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
      let finalProfile = profile;

      if (!finalProfile) {
        const meta = supaUser.user_metadata || {};
        const email = supaUser.email ?? null;
        const usernameGuess = (meta.full_name ? meta.full_name.replace(/\s+/g, '').toLowerCase() : (email ? email.split('@')[0] : `user-${uid.slice(0,8)}`));

        const { data: inserted, error: insertErr } = await supabase.from('users')
          .insert([{
            id: uid,
            username: usernameGuess,
            email,
            avatar: meta.picture ?? null,
            joined_at: new Date().toISOString(),
            badges: [],
            total_streak_points: 0
          }])
          .select().single();

        if (insertErr) {
          console.error('insert profile error', insertErr);
          return;
        }
        finalProfile = inserted;
      }

      if (finalProfile) {
        const userProfile: User = {
          username: finalProfile.username,
          joinedAt: finalProfile.joined_at,
          badges: finalProfile.badges || [],
          totalStreakPoints: finalProfile.total_streak_points || 0,
          pin: finalProfile.pin ?? undefined,
          avatar: finalProfile.avatar ?? undefined,
          email: finalProfile.email ?? undefined,
          phone: finalProfile.phone ?? undefined
        };

        setUser(userProfile);
        setUserId(uid);
        localStorage.setItem('habitflow_session_user', JSON.stringify({ user: userProfile, id: uid }));
        await loadUserData(uid);
      }
    } catch (err) {
      console.error('ensureProfileAndLoad error', err);
    }
  };

  // Replace your current auth-init useEffect with this block
useEffect(() => {
  let cancelled = false;

  const parseHashTokens = (hash: string) => {
    // Parse a URL fragment like "#access_token=...&refresh_token=...&expires_at=..."
    const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
    const params = new URLSearchParams(trimmed);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const expires_at = params.get('expires_at');
    return { access_token, refresh_token, expires_at };
  };

  const initAuth = async () => {
    setIsAuthLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const hasHash = !!window.location.hash && window.location.hash.includes('access_token');
        const hasQuery = !!window.location.search && window.location.search.includes('access_token');

        if (hasHash || hasQuery) {
          // 1) Prefer built-in helper if available
          try {
            // @ts-ignore - method may not exist depending on supabase-js version
            if (typeof supabase.auth.getSessionFromUrl === 'function') {
              console.log('[AuthInit] calling supabase.auth.getSessionFromUrl()');
              // storeSession: true persists to localStorage
              // If this method exists it will handle validation + storage
              const result = await (supabase.auth as any).getSessionFromUrl({ storeSession: true });
              console.log('[AuthInit] getSessionFromUrl result', result);
            } else {
              // 2) Fallback: parse URL fragment and set session manually
              console.log('[AuthInit] getSessionFromUrl not available — using fallback parser');
              const tokens = parseHashTokens(window.location.hash || window.location.search || '');
              if (tokens.access_token) {
                // try to set session (v2 clients have setSession)
                try {
                  // @ts-ignore
                  if (typeof supabase.auth.setSession === 'function') {
                    await (supabase.auth as any).setSession({
                      access_token: tokens.access_token,
                      refresh_token: tokens.refresh_token
                    });
                    console.log('[AuthInit] setSession succeeded via fallback tokens');
                  } else if (typeof supabase.auth.signIn === 'function') {
                    // older v1 fallback (less common) — try set session via signIn
                    await (supabase.auth as any).signIn({ provider: 'google' });
                    console.warn('[AuthInit] used signIn fallback (legacy client) — session may not persist');
                  } else {
                    console.error('[AuthInit] no method to set session found on supabase.auth');
                  }
                } catch (err) {
                  console.error('[AuthInit] fallback setSession error', err);
                }
              } else {
                console.warn('[AuthInit] no tokens found in URL to set session with fallback');
              }
            }
          } catch (err) {
            console.error('[AuthInit] error while handling url tokens', err);
          } finally {
            // clean the url to remove tokens (so user doesn't see them)
            try {
              const clean = window.location.origin + window.location.pathname + window.location.search;
              window.history.replaceState({}, document.title, clean);
            } catch (err) { /* ignore */ }
          }
        }
      }

      // Finally, ask supabase client for currently stored session (if any)
      try {
        const { data } = await supabase.auth.getSession();
        const sess = data?.session ?? null;
        console.log('[AuthInit] getSession result', sess);
        if (sess && sess.user) {
          // Ensure profile and load DB data (reuse your ensureProfileAndLoad helper)
          await ensureProfileAndLoad(sess.user.id, sess.user);
        } else {
          // fallback: cached local profile used previously
          const cached = localStorage.getItem('habitflow_session_user');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              setUser(parsed.user);
              setUserId(parsed.id);
              await loadUserData(parsed.id);
            } catch (e) { console.warn('cached session parse error', e); }
          }
        }
      } catch (err) {
        console.error('[AuthInit] getSession() call failed', err);
      }
    } catch (err) {
      console.error('Auth init outer error', err);
    } finally {
      if (!cancelled) setIsAuthLoading(false);
    }
  };

  init();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[onAuthStateChange]', event, session?.user?.id);
    try {
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureProfileAndLoad(session.user.id, session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserId(null);
        setHabits([]);
        setChapters([]);
        localStorage.removeItem('habitflow_session_user');
      }
    } catch (err) {
      console.error('onAuthStateChange handler error', err);
    }
  });

  return () => {
    cancelled = true;
    subscription.unsubscribe();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // ---------- logout ----------
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('signOut error', err);
    } finally {
      setUser(null);
      setUserId(null);
      setHabits([]);
      setChapters([]);
      localStorage.removeItem('habitflow_session_user');
    }
  };

  // --------- rest of app logic unchanged (habits, chapters, badges, toggle, UI) ----------
  // I'll keep these functions concise — they are the same as before and unchanged behavior.
  // (AddRecurringHabit, AddOneTimeTask, AddChapter, deleteChapter, updateBadgesAndPoints,
  //  toggleChapterCompletion, pushChapterToDaily, toggleHabit, promptDeleteHabit, confirmDeleteHabit, getDeleteMessage)
  // For brevity here, re-use your existing helper implementations (copy them into this file as-is).
  // ---- For the actual drop-in: paste your existing helper functions below exactly as they were ----

  // --- For demonstration I will include simple placeholders so the file compiles; replace with your full functions:
  const addRecurringHabit = async (...args: any[]) => { /* paste your full function body here */ };
  const addOneTimeTask = async (...args: any[]) => { /* paste your full function body here */ };
  const addChapter = async (...args: any[]) => { /* paste your full function body here */ };
  const deleteChapter = async (...args: any[]) => { /* paste your full function body here */ };
  const updateBadgesAndPoints = async (...args: any[]) => { /* paste your full function body here */ };
  const toggleChapterCompletion = async (...args: any[]) => { /* paste your full function body here */ };
  const pushChapterToDaily = (chapterName: string, subject: string) => { /* paste full fn body */ };
  const toggleHabit = async (...args: any[]) => { /* paste full fn body */ };
  const promptDeleteHabit = (...args: any[]) => { /* paste full fn body */ };
  const confirmDeleteHabit = async () => { /* paste full fn body */ };
  const getDeleteMessage = () => undefined;

  const renderContent = () => {
    switch (view) {
      case 'daily': return <DailyView habits={habits} toggleHabit={toggleHabit} selectedDate={selectedDate} onPrevDay={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()-1); return n; })} onNextDay={() => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate()+1); return n; })} onAddOneTimeTask={addOneTimeTask} onDeleteHabit={(id)=>promptDeleteHabit(id,'daily', selectedDate.toLocaleDateString('en-CA'))} />;
      case 'weekly': return <WeeklyView habits={habits} toggleHabit={toggleHabit} onDeleteHabit={(id)=>promptDeleteHabit(id,'weekly')} />;
      case 'monthly': return <MonthlyView habits={habits} toggleHabit={toggleHabit} currentDate={selectedDate} onDeleteHabit={(id)=>promptDeleteHabit(id,'monthly')} />;
      case 'syllabus': return <SyllabusView chapters={chapters} onAddChapter={addChapter} onPushToDaily={pushChapterToDaily} onDeleteChapter={deleteChapter} onToggleComplete={toggleChapterCompletion} selectedDate={selectedDate} />;
      case 'analytics': return <Analytics habits={habits} user={user} chapters={chapters} />;
      case 'coach': return <Coach habits={habits} />;
      default: return <DailyView habits={habits} toggleHabit={toggleHabit} selectedDate={selectedDate} onPrevDay={() => {}} onNextDay={() => {}} onAddOneTimeTask={addOneTimeTask} onDeleteHabit={(id)=>promptDeleteHabit(id,'daily', selectedDate.toLocaleDateString('en-CA'))} />;
    }
  };

  // ---------- render ----------
  if (isAuthLoading) return <LoadingOverlay message="Restoring session — please wait..." />;
  if (!user) return <Auth />; // Google-only login

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F7F7F5] dark:bg-[#191919] overflow-hidden transition-colors duration-300">
      <Sidebar currentView={view} setView={setView} onAddHabit={() => setIsModalOpen(true)} user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onOpenProfile={() => setIsProfileOpen(true)} />
      <main className="flex-1 overflow-y-auto p-4 md:p-10 relative">{renderContent()}</main>

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={addRecurringHabit} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onUpdateUser={async (u) => { /* call your handleUpdateUser logic */ }} />
      <ConfirmDeleteModal isOpen={!!deleteContext} onClose={() => setDeleteContext(null)} onConfirm={confirmDeleteHabit} habitName={deleteContext?.habit.name || ''} message={getDeleteMessage()} />
    </div>
  );
};

export default App;
