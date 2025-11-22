import React, { useState } from 'react';
import { Chapter } from '../types';
import { Plus, Book, Atom, Calculator, FlaskConical, CalendarPlus, Trash2, CheckCircle, Circle } from 'lucide-react';

interface SyllabusViewProps {
  chapters: Chapter[];
  onAddChapter: (name: string, subject: 'Physics' | 'Chemistry' | 'Mathematics') => void;
  onPushToDaily: (chapterName: string, subject: string) => void;
  onDeleteChapter: (id: string) => void;
  onToggleComplete: (id: string) => void;
  selectedDate: Date;
}

const SyllabusView: React.FC<SyllabusViewProps> = ({ 
  chapters, 
  onAddChapter, 
  onPushToDaily, 
  onDeleteChapter,
  onToggleComplete,
  selectedDate 
}) => {
  const [inputs, setInputs] = useState({
    Physics: '',
    Chemistry: '',
    Mathematics: ''
  });

  const subjects: Array<'Physics' | 'Chemistry' | 'Mathematics'> = ['Physics', 'Chemistry', 'Mathematics'];
  
  const getIcon = (subject: string) => {
    switch(subject) {
      case 'Physics': return <Atom className="text-blue-500" />;
      case 'Chemistry': return <FlaskConical className="text-green-500" />;
      case 'Mathematics': return <Calculator className="text-red-500" />;
      default: return <Book />;
    }
  };

  const getColor = (subject: string) => {
    switch(subject) {
      case 'Physics': return '#3B82F6';
      case 'Chemistry': return '#22C55E';
      case 'Mathematics': return '#EF4444';
      default: return '#8B5CF6';
    }
  };

  // Reusable Circular Progress Component (Small version for subjects)
  const CircularChart = ({ percentage, color, size = 50, stroke = 5 }: { percentage: number, color: string, size?: number, stroke?: number }) => {
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
           <svg className="w-full h-full transform -rotate-90">
             <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-[#F0F0F0] dark:text-[#333]" />
             <circle 
                cx="50%" cy="50%" r={radius} 
                stroke={color} 
                strokeWidth={stroke} 
                fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={offset} 
                strokeLinecap="round" 
                className="transition-all duration-500 ease-out" 
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#37352F] dark:text-[#E0E0E0]">
             {percentage}%
           </div>
        </div>
    );
  };

  // Stats Calculation
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter(c => c.isCompleted).length;
  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const handleInputChange = (subject: string, value: string) => {
    setInputs(prev => ({ ...prev, [subject]: value }));
  };

  const handleSubmit = (subject: 'Physics' | 'Chemistry' | 'Mathematics') => {
    if (inputs[subject].trim()) {
      onAddChapter(inputs[subject].trim(), subject);
      setInputs(prev => ({ ...prev, [subject]: '' }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8">
        <header>
            <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-2">JEE Syllabus</h2>
            <p className="text-[#787774] dark:text-[#AAA]">
            Track chapter completion and plan daily study.
            </p>
        </header>
        
        {/* Overall Progress Chart */}
        <div className="mt-4 md:mt-0 flex items-center gap-4 bg-white dark:bg-[#202020] px-4 py-3 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm">
            <CircularChart percentage={overallProgress} color="#37352F" size={60} stroke={6} />
            <div>
                <div className="text-xs font-bold text-[#787774] dark:text-[#AAA] uppercase">Total Completion</div>
                <div className="text-sm font-medium text-[#37352F] dark:text-[#E0E0E0]">{completedChapters} / {totalChapters} Chapters</div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {subjects.map(subject => {
          const subjectChapters = chapters.filter(c => c.subject === subject);
          const subTotal = subjectChapters.length;
          const subCompleted = subjectChapters.filter(c => c.isCompleted).length;
          const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;
          
          return (
            <div key={subject} className="bg-white dark:bg-[#202020] rounded-lg border border-[#E0E0E0] dark:border-[#333] flex flex-col shadow-sm h-full max-h-[80vh]">
              {/* Header */}
              <div className="p-4 border-b border-[#E0E0E0] dark:border-[#333] flex items-center justify-between bg-[#FAFAFA] dark:bg-[#252525] rounded-t-lg sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {getIcon(subject)}
                    <div>
                        <h3 className="font-bold text-[#37352F] dark:text-[#E0E0E0] leading-tight">{subject}</h3>
                        <div className="text-xs text-[#787774] dark:text-[#999]">{subCompleted}/{subTotal} Done</div>
                    </div>
                </div>
                <CircularChart percentage={subProgress} color={getColor(subject)} size={40} stroke={4} />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1">
                {subjectChapters.length === 0 ? (
                  <div className="text-center py-10 text-[#9B9B9B] text-sm italic">
                    No chapters added yet.
                  </div>
                ) : (
                  subjectChapters.map(chapter => (
                    <div key={chapter.id} className="group flex items-center justify-between p-3 rounded hover:bg-[#F0F0F0] dark:hover:bg-[#2C2C2C] transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <button 
                            onClick={() => onToggleComplete(chapter.id)}
                            className={`flex-shrink-0 transition-colors ${chapter.isCompleted ? 'text-[#22C55E]' : 'text-[#D0D0D0] hover:text-[#9B9B9B]'}`}
                          >
                              {chapter.isCompleted ? <CheckCircle size={18} fill="currentColor" className="text-white dark:text-[#202020]" /> : <Circle size={18} />}
                          </button>
                          <div className={`text-sm font-medium truncate mr-2 transition-all ${chapter.isCompleted ? 'text-[#9B9B9B] line-through' : 'text-[#37352F] dark:text-[#E0E0E0]'}`}>
                            {chapter.name}
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onPushToDaily(chapter.name, subject)}
                          className="p-1.5 text-[#9B9B9B] hover:text-[#2EAADC] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title={`Add "${chapter.name}" to ${selectedDate.toLocaleDateString()}`}
                        >
                          <CalendarPlus size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteChapter(chapter.id)}
                          className="p-1.5 text-[#9B9B9B] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete Chapter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Footer */}
              <div className="p-4 border-t border-[#E0E0E0] dark:border-[#333]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputs[subject]}
                    onChange={(e) => handleInputChange(subject, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(subject)}
                    placeholder="Add Chapter..."
                    className="flex-1 text-sm px-3 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] bg-white dark:bg-[#2C2C2C] dark:text-white focus:outline-none focus:border-[#37352F] dark:focus:border-white"
                  />
                  <button
                    onClick={() => handleSubmit(subject)}
                    disabled={!inputs[subject].trim()}
                    className="p-2 bg-[#37352F] dark:bg-white text-white dark:text-black rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusView;