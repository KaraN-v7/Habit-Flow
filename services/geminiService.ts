import { GoogleGenAI } from "@google/genai";
import { Habit, GeminiModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getHabitInsights = async (habits: Habit[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment.";
  }

  const habitSummary = habits.map(h => {
    const last7Days = h.completedDates.filter(d => {
      const date = new Date(d);
      const now = new Date();
      const diff = Math.abs(now.getTime() - date.getTime());
      return diff / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    return `- ${h.emoji} ${h.name}: ${last7Days} times in last 7 days. Total: ${h.completedDates.length}. Streak: ${h.streak}.`;
  }).join('\n');

  const prompt = `
    You are a habit coaching assistant. Analyze the following user habit data and provide 3 brief, encouraging, and actionable insights or tips in a friendly, "Notion-style" clean tone.
    Focus on consistency and small improvements. Keep it under 150 words.

    User's Habits:
    ${habitSummary}
  `;

  try {
    const response = await ai.models.generateContent({
      model: GeminiModel.FLASH,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful productivity coach.",
      }
    });
    return response.text || "Keep going! You're doing great.";
  } catch (error) {
    console.error("Error fetching insights:", error);
    return "I couldn't analyze your habits right now. Try again later!";
  }
};