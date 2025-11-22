import React from 'react';
import { Habit, User, Chapter } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AVAILABLE_BADGES } from '../utils/gamification';

interface AnalyticsProps {
  habits: Habit[];
  user: User | null;
  chapters?: Chapter[];
}

interface SyllabusDonutProps {
  label: string;
  value: number;
  color: string;
  subtext: string;
}

// Reusable Donut Chart for Syllabus - Moved outside to fix prop typing and performance
const SyllabusDonut: React.FC<SyllabusDonutProps> = ({ label, value, color, subtext }) => {
  const data = [
      { name: 'Done', value: value },
      { name: 'Remaining', value: 100 - value }
  ];
  return (
      <div className="flex flex-col items-center p-4">
          <div className="relative w-32 h-32 mb-3">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill={color} />
                        <Cell fill="#E5E7EB" />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#37352F] dark:text-[#E0E0E0]">
                <span className="text-xl font-bold">{value}%</span>
            </div>
          </div>
          <h4 className="font-bold text-sm text-[#37352F] dark:text-[#E0E0E0]">{label}</h4>
          <p className="text-xs text-[#787774] dark:text-[#999]">{subtext}</p>
      </div>
  );
};

const Analytics: React.FC<AnalyticsProps> = ({ habits, user, chapters = [] }) => {
  // Calculate Total Stats
  const totalCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const avgStreak = habits.length > 0 
    ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / habits.length) 
    : 0;

  // 1. Prepare Data for Category Distribution (Subject Wise)
  const categoryMap: Record<string, number> = {};
  habits.forEach(h => {
    if (!categoryMap[h.category]) categoryMap[h.category] = 0;
    categoryMap[h.category] += h.completedDates.length;
  });
  
  const categoryData = Object.keys(categoryMap)
    .map(cat => ({ name: cat, value: categoryMap[cat] }))
    .filter(d => d.value > 0);

  // 2. Prepare Data for Habit Share
  const habitData = habits
    .map(h => ({ name: h.name, value: h.completedDates.length }))
    .filter(d => d.value > 0);

  // 3. Syllabus Overview Data
  const subjects = ['Physics', 'Chemistry', 'Mathematics'];
  const syllabusData = subjects.map(subject => {
      const subjectChapters = chapters.filter(c => c.subject === subject);
      const total = subjectChapters.length;
      const completed = subjectChapters.filter(c => c.isCompleted).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { name: subject, value: percentage, total, completed };
  });


  // Colors for the Pie Charts
  const COLORS = ['#37352F', '#D97706', '#2EAADC', '#8B5CF6', '#10B981', '#EF4444', '#6B7280'];
  const DARK_COLORS = ['#E0E0E0', '#F59E0B', '#38BDF8', '#A78BFA', '#34D399', '#F87171', '#9CA3AF'];
  const SUBJECT_COLORS: Record<string, string> = {
      'Physics': '#3B82F6',
      'Chemistry': '#22C55E',
      'Mathematics': '#EF4444'
  };

  // Helper to determine color
  const getColor = (index: number) => COLORS[index % COLORS.length];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-2">Analytics</h2>
        <p className="text-[#787774] dark:text-[#AAA]">Visualizing your progress and consistency.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm">
          <div className="text-sm text-[#787774] dark:text-[#999] mb-1">Total Tasks Done</div>
          <div className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0]">{totalCompletions}</div>
        </div>
        <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm">
          <div className="text-sm text-[#787774] dark:text-[#999] mb-1">Active Habits</div>
          <div className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0]">{habits.length}</div>
        </div>
        <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm">
          <div className="text-sm text-[#787774] dark:text-[#999] mb-1">Average Streak</div>
          <div className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0]">{avgStreak} <span className="text-lg text-[#9B9B9B]">days</span></div>
        </div>
      </div>

      {/* Syllabus Overview Section */}
      <div className="bg-white dark:bg-[#202020] rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm mb-8 overflow-hidden">
          <div className="p-6 border-b border-[#E0E0E0] dark:border-[#333]">
              <h3 className="text-lg font-bold text-[#37352F] dark:text-[#E0E0E0]">Syllabus Completion Overview</h3>
              <p className="text-xs text-[#787774] dark:text-[#999]">Aggregate view of your curriculum progress.</p>
          </div>
          <div className="p-6">
              {chapters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E0E0E0] dark:divide-[#333]">
                      {syllabusData.map(s => (
                          <SyllabusDonut 
                            key={s.name} 
                            label={s.name} 
                            value={s.value} 
                            color={SUBJECT_COLORS[s.name]} 
                            subtext={`${s.completed}/${s.total} Chapters`}
                          />
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 text-[#9B9B9B] bg-[#FAFAFA] dark:bg-[#252525]">
                      No syllabus data found. Add chapters in the Syllabus tab to see analytics here.
                  </div>
              )}
          </div>
      </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Chart 1: Subject/Category Distribution */}
        <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-[#37352F] dark:text-[#E0E0E0] mb-2">Study Focus Distribution</h3>
          <p className="text-xs text-[#787774] dark:text-[#999] mb-4">Where are you spending your effort?</p>
          
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index)} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#202020', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9B9B9B] text-sm">
              No data available yet.
            </div>
          )}
        </div>

        {/* Chart 2: Habit Share */}
        <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm h-96 flex flex-col">
          <h3 className="text-lg font-semibold text-[#37352F] dark:text-[#E0E0E0] mb-2">Habit Consistency Share</h3>
          <p className="text-xs text-[#787774] dark:text-[#999] mb-4">Which tasks are you most consistent with?</p>
          
          {habitData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={habitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {habitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(index + 2)} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', backgroundColor: '#202020', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex-1 flex items-center justify-center text-[#9B9B9B] text-sm">
              No data available yet.
            </div>
          )}
        </div>

      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-[#202020] p-6 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm">
        <h3 className="text-lg font-semibold text-[#37352F] dark:text-[#E0E0E0] mb-6">Achievements Gallery</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {AVAILABLE_BADGES.map((badgeDef) => {
              const isUnlocked = user?.badges.some(b => b.key === badgeDef.key);
              return (
                <div 
                  key={badgeDef.key} 
                  className={`p-4 rounded-lg border text-center transition-all relative group ${
                    isUnlocked 
                      ? 'bg-[#FAFAFA] dark:bg-[#333] border-[#E0E0E0] dark:border-[#555] opacity-100' 
                      : 'bg-[#F7F7F5] dark:bg-[#252525] border-transparent opacity-50 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-2 transition-transform group-hover:scale-110">{badgeDef.icon}</div>
                  <div className="font-semibold text-sm text-[#37352F] dark:text-[#E0E0E0] mb-1">{badgeDef.name}</div>
                  <div className="text-[10px] text-[#787774] dark:text-[#999] leading-tight">{badgeDef.description}</div>
                  {isUnlocked && (
                      <div className="absolute top-2 right-2 text-green-500 text-[10px]">
                          ✓
                      </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  );
};

export default Analytics;