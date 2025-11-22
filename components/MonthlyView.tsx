import React, { useRef, useEffect } from 'react';
import { Habit } from '../types';
import { Check, Trash2 } from 'lucide-react';

interface MonthlyViewProps {
  habits: Habit[];
  toggleHabit: (id: string, date: string) => void;
  currentDate: Date;
  onDeleteHabit: (id: string) => void;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ habits, toggleHabit, currentDate, onDeleteHabit }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let i = 1; i <= days; i++) {
      result.push(new Date(year, month, i));
    }
    return result;
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Filter: Only show Recurring Habits where period is 'monthly'
  const monthlyHabits = habits.filter(h => !h.specificDate && h.period === 'monthly');

  // Calculate Monthly Stats
  let totalMonthlyOps = monthlyHabits.length * days.length;
  let totalMonthlyDone = 0;
  monthlyHabits.forEach(h => {
     days.forEach(d => {
         if (h.completedDates.includes(d.toLocaleDateString('en-CA'))) totalMonthlyDone++;
     })
  });
  const monthlyProgress = totalMonthlyOps > 0 ? Math.round((totalMonthlyDone/totalMonthlyOps)*100) : 0;

  // Pie Chart Logic
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (monthlyProgress / 100) * circumference;

  // Scroll to today on mount
  useEffect(() => {
      if (scrollRef.current) {
          const today = new Date().getDate();
          // Approximate scroll position (40px per column roughly)
          scrollRef.current.scrollLeft = (today - 5) * 40;
      }
  }, [currentDate]);

  return (
    <div className="max-w-[100vw] overflow-hidden pb-4">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-2">{monthName}</h2>
        <p className="text-[#787774] dark:text-[#AAA]">Long-term consistency tracker.</p>
      </header>

       {/* Circular Progress Chart */}
       <div className="mb-8 bg-white dark:bg-[#202020] p-4 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm max-w-xs flex items-center gap-4">
         <div className="relative w-20 h-20 flex-shrink-0">
             <svg className="w-full h-full transform -rotate-90">
                 <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#F0F0F0] dark:text-[#333]" />
                 <circle 
                    cx="50%" cy="50%" r={radius} 
                    stroke="#D97706" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round" 
                    className="transition-all duration-1000 ease-out" 
                 />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#37352F] dark:text-[#E0E0E0]">
                 {monthlyProgress}%
             </div>
         </div>
         <div>
             <div className="text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-1">
                 Monthly Grid
             </div>
             <div className="text-sm text-[#9B9B9B]">
                 {totalMonthlyDone} / {totalMonthlyOps}
             </div>
         </div>
      </div>

      <div className="bg-white dark:bg-[#202020] border border-[#E0E0E0] dark:border-[#333] rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Table Container with Horizontal Scroll */}
        <div className="overflow-x-auto custom-scrollbar" ref={scrollRef}>
             <div className="inline-block min-w-full align-middle">
                 {/* Header Row */}
                 <div className="flex border-b border-[#E0E0E0] dark:border-[#333]">
                    <div className="w-56 p-4 font-medium text-[#787774] dark:text-[#AAA] text-sm border-r border-[#E0E0E0] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#252525] sticky left-0 z-10 flex-shrink-0">
                        Habit
                    </div>
                    {days.map(d => (
                        <div key={d.toString()} className="w-10 flex-shrink-0 p-2 text-center border-r border-[#E0E0E0] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#252525]">
                            <div className="text-[10px] font-medium text-[#9B9B9B] uppercase mb-1">
                                {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                            </div>
                            <div className={`text-xs font-semibold w-6 h-6 mx-auto flex items-center justify-center rounded-full ${
                                d.toDateString() === new Date().toDateString() ? 'bg-[#D97706] text-white' : 'text-[#37352F] dark:text-[#E0E0E0]'
                            }`}>
                                {d.getDate()}
                            </div>
                        </div>
                    ))}
                 </div>

                 {/* Habit Rows */}
                 {monthlyHabits.map(habit => (
                     <div key={habit.id} className="group flex border-b border-[#E0E0E0] dark:border-[#333] last:border-b-0 hover:bg-[#FAFAFA] dark:hover:bg-[#252525] transition-colors">
                        <div className="w-56 p-3 flex items-center gap-2 border-r border-[#E0E0E0] dark:border-[#333] bg-white dark:bg-[#202020] sticky left-0 z-10 flex-shrink-0 relative">
                            <span className="text-lg">{habit.emoji}</span>
                            <div className="overflow-hidden">
                                <div className="text-sm font-medium text-[#37352F] dark:text-[#E0E0E0] truncate w-40">{habit.name}</div>
                                <div className="text-[10px] text-[#9B9B9B]">Goal: {habit.monthlyGoal} / mo</div>
                            </div>
                            {/* Delete Button */}
                            <button 
                                onClick={() => onDeleteHabit(habit.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-white dark:bg-[#202020] shadow-sm rounded-md text-[#9B9B9B] hover:text-red-500 border border-[#E0E0E0] dark:border-[#333]"
                                title="Permanently delete monthly habit"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        {days.map(d => {
                            const dateString = d.toLocaleDateString('en-CA');
                            const isCompleted = habit.completedDates.includes(dateString);
                            return (
                                <div key={dateString} className="w-10 flex-shrink-0 border-r border-[#E0E0E0] dark:border-[#333] flex items-center justify-center">
                                    <button
                                        onClick={() => toggleHabit(habit.id, dateString)}
                                        className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                                            isCompleted 
                                            ? 'bg-[#D97706] text-white' 
                                            : 'bg-transparent hover:bg-[#F0F0F0] dark:hover:bg-[#333]'
                                        }`}
                                    >
                                        {isCompleted && <Check size={12} strokeWidth={3} />}
                                    </button>
                                </div>
                            )
                        })}
                     </div>
                 ))}
                 
                 {monthlyHabits.length === 0 && (
                     <div className="p-8 text-center text-[#9B9B9B] sticky left-0">
                         No monthly habits set. Select "Monthly Grid" when adding a new habit.
                     </div>
                 )}
             </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyView;