import React, { useState } from 'react';
import { Habit } from '../types';
import { Check, ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from 'lucide-react';

interface DailyViewProps {
  habits: Habit[];
  toggleHabit: (id: string, date: string) => void;
  selectedDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onAddOneTimeTask: (name: string, date: string) => void;
  onDeleteHabit: (id: string) => void;
}

const DailyView: React.FC<DailyViewProps> = ({ 
  habits, 
  toggleHabit, 
  selectedDate, 
  onPrevDay, 
  onNextDay,
  onAddOneTimeTask,
  onDeleteHabit
}) => {
  const [newTaskName, setNewTaskName] = useState('');
  // Correctly handle timezone issues by using local date string logic
  const dateString = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const isToday = new Date().toLocaleDateString('en-CA') === dateString;

  // Helper to extract hours/minutes from habit name (e.g., "Study Physics 2.5 hours")
  const parseDuration = (name: string): number => {
    // Regex matches: "2.5 hours", "3 hrs", "45 mins", "1h"
    const match = name.match(/(\d+(\.\d+)?)\s*(h|hr|hours?|m|min|minutes?)/i);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[3].toLowerCase();
    
    if (unit.startsWith('m')) {
      return value / 60; // convert minutes to hours
    }
    return value; // assume hours
  };

  // Filter habits for this view
  const todaysHabits = habits.filter(h => {
    // 1. Check if explicitly skipped for this date
    if (h.skippedDates && h.skippedDates.includes(dateString)) return false;

    // 2. One-time tasks specific to this EXACT date
    if (h.specificDate === dateString) return true;
    
    // 3. All Recurring habits (Weekly AND Monthly goals show up daily)
    if (!h.specificDate) return true;

    return false;
  });

  // Sort: One-time tasks first, then recurring
  todaysHabits.sort((a, b) => {
      if (a.specificDate && !b.specificDate) return -1;
      if (!a.specificDate && b.specificDate) return 1;
      return 0;
  });

  // Calculate Total Study Hours vs Completed
  let totalStudyHours = 0;
  let completedStudyHours = 0;
  let totalTasks = todaysHabits.length;
  let completedTasks = 0;

  todaysHabits.forEach(h => {
    const duration = parseDuration(h.name);
    // Add to total hours regardless of completion
    totalStudyHours += duration;
    
    if (h.completedDates.includes(dateString)) {
      completedTasks++;
      completedStudyHours += duration;
    }
  });

  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const timeProgress = totalStudyHours > 0 ? Math.round((completedStudyHours / totalStudyHours) * 100) : 0;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddOneTimeTask(newTaskName, dateString);
      setNewTaskName('');
    }
  };

  // Reusable Circular Progress Component (Donut Chart Style)
  const CircularChart = ({ percentage, color, icon: Icon, label, subtext }: { percentage: number, color: string, icon?: React.ElementType, label: string, subtext: string }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="bg-white dark:bg-[#202020] p-4 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
           {/* Background Circle */}
           <svg className="w-full h-full transform -rotate-90">
             <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#F0F0F0] dark:text-[#333]" />
             {/* Progress Circle */}
             <circle 
                cx="50%" cy="50%" r={radius} 
                stroke={color} 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={offset} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out" 
             />
           </svg>
           {/* Center Text */}
           <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#37352F] dark:text-[#E0E0E0]">
             {percentage}%
           </div>
        </div>
        <div className="flex-1">
            <div className="text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-1 flex items-center gap-1">
                {Icon && <Icon size={12} />} {label}
            </div>
            <div className="text-sm font-medium text-[#37352F] dark:text-[#E0E0E0]">{subtext}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Date Header with Navigation */}
      <header className="mb-6 flex items-center justify-between">
        <button onClick={onPrevDay} className="p-2 hover:bg-[#E0E0E0] dark:hover:bg-[#333] rounded-md text-[#787774] dark:text-[#AAA] transition-colors">
            <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
            <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-1">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-[#787774] dark:text-[#AAA] text-sm">
                {isToday ? "Make today count." : "Reviewing your plan."}
            </p>
        </div>

        <button onClick={onNextDay} className="p-2 hover:bg-[#E0E0E0] dark:hover:bg-[#333] rounded-md text-[#787774] dark:text-[#AAA] transition-colors">
            <ChevronRight size={24} />
        </button>
      </header>

      {/* Pie/Donut Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
         {/* Task Completion Chart */}
         <CircularChart 
            percentage={taskProgress} 
            color="#37352F" 
            label="Daily Goals"
            subtext={`${completedTasks} of ${totalTasks} done`}
         />

         {/* Study Time Chart */}
         <CircularChart 
            percentage={timeProgress} 
            color="#2EAADC" 
            icon={Clock}
            label="Study Time (AI)"
            subtext={`${completedStudyHours.toFixed(1)} / ${totalStudyHours.toFixed(1)} Hrs`}
         />
      </div>

      {/* Notion-style Task List */}
      <div className="space-y-1">
        {todaysHabits.map(habit => {
          const isCompleted = habit.completedDates.includes(dateString);
          return (
            <div 
              key={habit.id}
              className={`group flex items-center p-2 rounded hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] transition-colors cursor-pointer ${
                  isCompleted ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => toggleHabit(habit.id, dateString)}
                className={`w-5 h-5 mr-3 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0 ${
                  isCompleted
                    ? 'bg-[#2EAADC] border-[#2EAADC] text-white'
                    : 'border-[#9B9B9B] group-hover:bg-[#D0D0D0] dark:group-hover:bg-[#444]'
                }`}
              >
                {isCompleted && <Check size={12} strokeWidth={3} />}
              </button>
              
              <div className="flex-1 flex items-center gap-3 overflow-hidden">
                <span className="text-lg flex-shrink-0">{habit.emoji}</span>
                <span className={`text-sm font-medium truncate ${isCompleted ? 'line-through text-[#9B9B9B]' : 'text-[#37352F] dark:text-[#E0E0E0]'}`}>
                  {habit.name}
                </span>
                
                {habit.specificDate && (
                    <span className="text-[10px] bg-[#F0F0F0] dark:bg-[#333] px-1.5 py-0.5 rounded text-[#787774] dark:text-[#999] flex-shrink-0">One-time</span>
                )}
                {!habit.specificDate && habit.period === 'monthly' && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded flex-shrink-0">Monthly</span>
                )}
                {!habit.specificDate && (habit.period === 'weekly' || !habit.period) && (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded flex-shrink-0">Weekly</span>
                )}
              </div>

              {habit.points > 0 && (
                  <span className="text-xs text-[#D97706] opacity-0 group-hover:opacity-100 transition-opacity font-medium mr-2">
                      +{habit.points} pts
                  </span>
              )}

              {/* Delete Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteHabit(habit.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-[#9B9B9B] hover:text-red-500 hover:bg-[#FFE5E5] dark:hover:bg-[#331111] rounded transition-all"
                title={habit.specificDate ? "Delete task" : "Remove from today (Skip)"}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {/* Quick Add Input */}
        <form onSubmit={handleQuickAdd} className="flex items-center p-2 text-[#9B9B9B] hover:text-[#37352F] dark:hover:text-[#E0E0E0] group">
            <div className="w-5 h-5 mr-3 flex items-center justify-center flex-shrink-0">
                <Plus size={16} />
            </div>
            <input 
                type="text" 
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Add a new goal for today (e.g., 'Study Maths 2 hours')..." 
                className="bg-transparent border-none focus:outline-none w-full text-sm placeholder-[#9B9B9B] text-[#37352F] dark:text-[#E0E0E0]"
            />
        </form>
      </div>
      
      {todaysHabits.length === 0 && !newTaskName && (
          <div className="mt-8 text-center text-[#9B9B9B] text-sm">
              No tasks for this day. Type above to add one!
          </div>
      )}
    </div>
  );
};

export default DailyView;