export interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: 'daily' | 'weekly';
  period?: 'weekly' | 'monthly'; // New field for separation
  specificDate?: string; // If defined, this is a one-time task for this date (YYYY-MM-DD)
  category: string;
  streak: number;
  completedDates: string[]; // ISO Date strings YYYY-MM-DD
  createdAt: string;
  weeklyGoal: number; // Target completions per week
  monthlyGoal: number; // Target completions per month
  points: number; // Points awarded per completion (Configured but overridden by streak logic for user score)
  skippedDates?: string[]; // Dates where this recurring habit was removed/skipped from daily view
}

export interface Badge {
  id: string;
  key: string; // unique key for logic checks
  name: string;
  icon: string;
  description: string;
  dateEarned: string;
  count?: number; // Number of times earned
}

export interface User {
  username: string;
  email?: string;
  phone?: string;
  avatar?: string; // Base64 string for DP
  joinedAt: string;
  badges: Badge[];
  totalStreakPoints: number; // Renamed from totalPoints
  pin?: string; // 4-digit security pin
}

export interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'analytics' | 'coach' | 'syllabus';

export interface Chapter {
  id: string;
  name: string;
  subject: 'Physics' | 'Chemistry' | 'Mathematics';
  isCompleted?: boolean; 
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
}