import React from 'react';
import { LayoutDashboard, Calendar, BarChart2, Sparkles, Plus, CheckSquare, LogOut, User as UserIcon, Moon, Sun, Settings, BookOpen } from 'lucide-react';
import { ViewMode, User } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  onAddHabit: () => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, setView, onAddHabit, user, onLogout, isDarkMode, toggleTheme, onOpenProfile 
}) => {
  const navItems = [
    { id: 'daily', label: 'Daily Focus', icon: CheckSquare },
    { id: 'weekly', label: 'Weekly Grid', icon: Calendar },
    { id: 'monthly', label: 'Monthly Goals', icon: LayoutDashboard },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'analytics', label: 'Progress', icon: BarChart2 },
    { id: 'coach', label: 'Exam Coach', icon: Sparkles },
  ];

  return (
    <div className="w-full md:w-64 bg-[#F7F7F5] dark:bg-[#191919] border-r border-[#E0E0E0] dark:border-[#333] flex-shrink-0 flex flex-col h-full transition-colors duration-300">
      <div className="p-4 md:p-6 flex-1">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 font-bold text-lg text-[#37352F] dark:text-[#E0E0E0]">
            <div className="w-6 h-6 bg-black dark:bg-white text-white dark:text-black rounded flex items-center justify-center text-sm shadow-sm">J</div>
            JEEFlow
            </div>
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-[#EFEFED] dark:hover:bg-[#333] text-[#787774] dark:text-[#AAA] transition-colors"
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
        
        {user && (
           <div 
             onClick={onOpenProfile}
             className="mb-6 p-3 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#444] rounded-lg flex flex-col gap-3 shadow-sm cursor-pointer hover:border-[#9B9B9B] transition-all group"
           >
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EFEFED] dark:bg-[#444] rounded-full flex items-center justify-center text-[#37352F] overflow-hidden border border-[#E0E0E0] dark:border-[#555]">
                    {user.avatar ? (
                        <img src={user.avatar} alt="DP" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={18} className="dark:text-[#CCC]" />
                    )}
                </div>
                <div className="overflow-hidden flex-1">
                    <div className="text-sm font-semibold text-[#37352F] dark:text-[#E0E0E0] truncate flex justify-between items-center">
                        {user.username}
                        <Settings size={12} className="opacity-0 group-hover:opacity-100 text-[#9B9B9B]" />
                    </div>
                    <div className="text-xs text-[#D97706] font-medium flex items-center gap-1">
                        🔥 {user.totalStreakPoints || 0} Streak Points
                    </div>
                </div>
             </div>

             {/* Badge Row - Showing Icons */}
             {user.badges.length > 0 && (
                 <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-[#F0F0F0] dark:border-[#444]">
                     {user.badges.slice(0, 5).map(b => (
                         <span key={b.id} title={b.name} className="text-lg cursor-help hover:scale-125 transition-transform">{b.icon}</span>
                     ))}
                     {user.badges.length > 5 && (
                         <span className="text-[10px] text-[#9B9B9B] flex items-center">+{user.badges.length - 5}</span>
                     )}
                 </div>
             )}
           </div>
        )}
        
        <button 
          onClick={onAddHabit}
          className="w-full flex items-center gap-2 bg-white dark:bg-[#2C2C2C] hover:bg-[#EFEFED] dark:hover:bg-[#383838] border border-[#D0D0D0] dark:border-[#555] text-[#37352F] dark:text-[#E0E0E0] px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm mb-6"
        >
          <Plus size={16} />
          New Study Habit
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewMode)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#EFEFED] dark:bg-[#333] text-[#37352F] dark:text-white' 
                    : 'text-[#6B6B6B] dark:text-[#999] hover:bg-[#EFEFED] dark:hover:bg-[#2C2C2C] hover:text-[#37352F] dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-black dark:text-white' : 'text-[#9B9B9B]'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-[#E0E0E0] dark:border-[#333]">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#6B6B6B] dark:text-[#999] hover:bg-[#FDECEC] dark:hover:bg-[#422] hover:text-[#D14D4D] transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;