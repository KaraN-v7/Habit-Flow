import React, { useState } from 'react';
import { X, Trophy, Calendar, LayoutGrid } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, emoji: string, category: string, weeklyGoal: number, monthlyGoal: number, points: number, period: 'weekly' | 'monthly') => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [category, setCategory] = useState('Physics');
  const [weeklyGoal, setWeeklyGoal] = useState(6);
  const [monthlyGoal, setMonthlyGoal] = useState(25);
  const [points, setPoints] = useState(10);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name, emoji, category, weeklyGoal, monthlyGoal, points, period);
      setName('');
      setEmoji('📚');
      setWeeklyGoal(6);
      setMonthlyGoal(25);
      setPoints(10);
      setPeriod('weekly');
      onClose();
    }
  };

  const emojis = ['📚', '⚛️', '🧪', '📐', '📝', '🧘', '⚡', '🕰️', '🧠', '☕', '🚫', '🎯'];
  const categories = ['Physics', 'Chemistry', 'Mathematics', 'Mock Tests', 'Revision', 'Health', 'Distraction Blocking'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#202020] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[#E0E0E0] dark:border-[#333]">
        <div className="flex justify-between items-center p-4 border-b border-[#E0E0E0] dark:border-[#333]">
          <h3 className="font-semibold text-[#37352F] dark:text-[#E0E0E0]">New JEE Goal</h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#37352F] dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F0F0F0] dark:bg-[#2C2C2C] rounded-lg">
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                period === 'weekly' 
                  ? 'bg-white dark:bg-[#444] text-[#37352F] dark:text-white shadow-sm' 
                  : 'text-[#9B9B9B] hover:text-[#37352F] dark:hover:text-[#E0E0E0]'
              }`}
            >
              <LayoutGrid size={14} /> Weekly Grid
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                period === 'monthly' 
                  ? 'bg-white dark:bg-[#444] text-[#37352F] dark:text-white shadow-sm' 
                  : 'text-[#9B9B9B] hover:text-[#37352F] dark:hover:text-[#E0E0E0]'
              }`}
            >
              <Calendar size={14} /> Monthly Grid
            </button>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2">Icon</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-xl transition-colors ${
                    emoji === e 
                      ? 'bg-[#EFEFED] dark:bg-[#444] border border-[#D0D0D0] dark:border-[#666]' 
                      : 'hover:bg-[#F7F7F5] dark:hover:bg-[#333]'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2">Habit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={period === 'weekly' ? "e.g., Solve 20 Physics Numericals" : "e.g., Complete 2 Mock Tests"}
              className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white transition-all"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Selection */}
            <div>
              <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2">Subject / Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Points Selection */}
            <div>
               <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2 flex items-center gap-1">
                 Points Reward <Trophy size={12} className="text-[#D97706]" />
               </label>
               <input
                 type="number"
                 min="1"
                 max="100"
                 value={points}
                 onChange={(e) => setPoints(Number(e.target.value))}
                 className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
               />
               <p className="text-[10px] text-[#9B9B9B] mt-1">Harder tasks = more coins!</p>
            </div>
          </div>

          <div>
             {/* Dynamic Goal Input based on Period */}
             {period === 'weekly' ? (
                 <div>
                  <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2">Weekly Frequency</label>
                  <select
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                  >
                    {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days / week</option>)}
                  </select>
                  <p className="text-[10px] text-[#9B9B9B] mt-1">Shows in Weekly Grid</p>
                </div>
             ) : (
                 <div>
                  <label className="block text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase mb-2 flex items-center gap-1">
                    Monthly Target (Days) <Calendar size={12} />
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyGoal}
                    onChange={(e) => setMonthlyGoal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                  />
                  <p className="text-[10px] text-[#9B9B9B] mt-1">Shows in Monthly Grid</p>
                </div>
             )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-[#37352F] hover:bg-black dark:bg-white dark:hover:bg-[#E0E0E0] dark:text-black text-white font-medium py-2.5 rounded-md transition-colors shadow-sm"
            >
              Create {period === 'weekly' ? 'Weekly' : 'Monthly'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHabitModal;