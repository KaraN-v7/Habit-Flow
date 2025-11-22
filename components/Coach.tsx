import React, { useState } from 'react';
import { Habit } from '../types';
import { getHabitInsights } from '../services/geminiService';
import { Sparkles, Loader2, MessageSquareQuote } from 'lucide-react';

interface CoachProps {
  habits: Habit[];
}

const Coach: React.FC<CoachProps> = ({ habits }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetInsight = async () => {
    if (habits.length === 0) {
      setInsight("Please add some habits first so I can analyze them!");
      return;
    }
    setLoading(true);
    const result = await getHabitInsights(habits);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-2">AI Coach</h2>
        <p className="text-[#787774] dark:text-[#AAA]">Get personalized insights powered by Gemini.</p>
      </header>

      <div className="bg-white dark:bg-[#202020] p-8 rounded-lg border border-[#E0E0E0] dark:border-[#333] shadow-sm text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-[#37352F] dark:text-[#E0E0E0] mb-3">
          {insight ? "Your Weekly Analysis" : "Ready to analyze your progress?"}
        </h3>
        
        <p className="text-[#787774] dark:text-[#999] mb-8 max-w-md mx-auto">
          {insight 
            ? "Here are some tips based on your recent activity." 
            : "I can analyze your study habits, streaks, and consistency to provide actionable tips for your JEE preparation."}
        </p>

        {loading ? (
          <button disabled className="bg-[#E0E0E0] dark:bg-[#333] text-[#787774] dark:text-[#AAA] font-medium py-2 px-6 rounded-full flex items-center gap-2 mx-auto cursor-not-allowed">
            <Loader2 className="animate-spin" size={18} />
            Analyzing...
          </button>
        ) : (
          !insight && (
            <button 
              onClick={handleGetInsight}
              className="bg-[#37352F] hover:bg-black dark:bg-white dark:hover:bg-[#E0E0E0] dark:text-black text-white font-medium py-2 px-6 rounded-full transition-all shadow-md active:scale-95"
            >
              Generate Insights
            </button>
          )
        )}

        {insight && (
          <div className="mt-8 text-left bg-[#FAFAFA] dark:bg-[#252525] p-6 rounded-lg border border-[#F0F0F0] dark:border-[#333] animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex gap-3 mb-4 text-[#37352F] dark:text-[#E0E0E0] font-semibold">
                <MessageSquareQuote className="flex-shrink-0" />
                <span>Coach Says:</span>
             </div>
             <div className="prose prose-sm max-w-none text-[#37352F] dark:text-[#CCC] whitespace-pre-line leading-relaxed">
               {insight}
             </div>
             <div className="mt-6 text-center">
                <button 
                  onClick={() => setInsight(null)}
                  className="text-sm text-[#787774] hover:text-[#37352F] dark:hover:text-white underline decoration-dotted"
                >
                  Clear and start over
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Coach;