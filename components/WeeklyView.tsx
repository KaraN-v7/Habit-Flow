import React from 'react';
import { Habit } from '../types';
import { Check, Trash2 } from 'lucide-react';

interface WeeklyViewProps {
  habits: Habit[];
  toggleHabit: (id: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ habits, toggleHabit, onDeleteHabit }) => {
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates();
  // We use local date strings for checking completion (YYYY-MM-DD)
  const weekDateStrings = weekDates.map(d => d.toLocaleDateString('en-CA'));

  // Filter: Show ALL Recurring Habits (Weekly AND Monthly)
  // Monthly habits also show in weekly grid as they are daily habits in essence
  const weeklyHabits = habits.filter(h => !h.specificDate);

  // Calculate stats for this view
  let totalOpportunities = weeklyHabits.length * 7;
  let totalCompleted = 0;

  weeklyHabits.forEach(h => {
    weekDateStrings.forEach(ds => {
        if (h.completedDates.includes(ds)) {
            totalCompleted++;
        }
    });
  });

  const progress = totalOpportunities > 0 ? Math.round((totalCompleted / totalOpportunities) * 100) : 0;

  // Pie Chart Logic
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto overflow-x-auto pb-4">
      <header className="mb-6 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-2">Weekly Overview</h2>
            <p className="text-[#787774] dark:text-[#AAA]">Tracking all recurring habits.</p>
        </div>
      </header>

      {/* Circular Progress Chart */}
      <div className="mb-8 bg-white dark:bg-[#202020] p-4 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm max-w-xs flex items-center gap-4">
         <div className="relative w-20 h-20 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                 <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#F0F0F0] dark:text-[#333]" />
                 <circle 
                    cx="50%" cy="50%" r={radius} 
                    stroke="#8B5CF6" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" 
                 />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#37352F] dark:text-[#E0E0E0]">
                 {progress}%
             </div>
         </div>
         <div>
             <div className="text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-1">
                 Weekly Rate
             </div>
             <div className="text-sm text-[#9B9B9B]">
                 {totalCompleted} / {totalOpportunities} checks
             </div>
         </div>
      </div>

      <div className="min-w-[600px] bg-white dark:bg-[#202020] border border-[#E0E0E0] dark:border-[#333] rounded-lg shadow-sm">
        {/* Header Row */}
        <div className="flex border-b border-[#E0E0E0] dark:border-[#333]">
          <div className="w-48 p-4 font-medium text-[#787774] dark:text-[#AAA] text-sm border-r border-[#E0E0E0] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#252525]">
            Habit
          </div>
          {weekDates.map((d) => (
            <div key={d.toString()} className="flex-1 p-3 text-center border-r border-[#E0E0E0] dark:border-[#333] last:border-r-0 bg-[#FAFAFA] dark:bg-[#252525]">
              <div className="text-xs font-medium text-[#9B9B9B] uppercase mb-1">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`text-sm font-semibold w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                 d.toDateString() === new Date().toDateString() ? 'bg-[#2EAADC] text-white' : 'text-[#37352F] dark:text-[#E0E0E0]'
              }`}>
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Habit Rows */}
        {weeklyHabits.map((habit) => (
          <div key={habit.id} className="group flex border-b border-[#E0E0E0] dark:border-[#333] last:border-b-0 hover:bg-[#FAFAFA] dark:hover:bg-[#252525] transition-colors">
            <div className="w-48 p-4 flex flex-col justify-center border-r border-[#E0E0E0] dark:border-[#333] overflow-hidden relative">
              <div className="flex items-center gap-2">
                <span className="text-lg">{habit.emoji}</span>
                <span className="text-sm font-medium text-[#37352F] dark:text-[#E0E0E0] truncate">{habit.name}</span>
              </div>
              {habit.period === 'monthly' && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 ml-7">Monthly Goal</span>
              )}
              {/* Delete Button */}
              <button 
                onClick={() => onDeleteHabit(habit.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[#202020] shadow-sm rounded-md text-[#9B9B9B] hover:text-red-500 border border-[#E0E0E0] dark:border-[#333]"
                title="Permanently delete recurring habit"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {weekDates.map((d) => {
              // Ensure we use local date string for consistency
              const dateString = d.toLocaleDateString('en-CA');
              const isCompleted = habit.completedDates.includes(dateString);
              return (
                <div key={dateString} className="flex-1 p-2 flex items-center justify-center border-r border-[#E0E0E0] dark:border-[#333] last:border-r-0">
                  <button
                    onClick={() => toggleHabit(habit.id, dateString)}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#2EAADC] text-white'
                        : 'bg-[#F0F0F0] dark:bg-[#333] text-transparent hover:bg-[#E0E0E0] dark:hover:bg-[#444]'
                    }`}
                  >
                    <Check size={16} strokeWidth={3} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        {weeklyHabits.length === 0 && (
            <div className="p-8 text-center text-[#9B9B9B]">
                No recurring habits set. Use the + button to add one.
            </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyView;