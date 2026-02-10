
import { GoogleGenAI, Type } from "@google/genai";
import { TimeEntry } from "../types";

export const getAIInsights = async (entries: TimeEntry[]) => {
  // Always initialize GoogleGenAI inside the function to ensure the correct environment variables are captured.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Analyze my time log for today and provide insights. Here are the entries: ${JSON.stringify(entries)}. 
  Provide a summary of where my time went, 3 actionable suggestions to improve productivity or balance, and a productivity score from 0-100.
  Answer in Simplified Chinese.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            productivityScore: { type: Type.NUMBER }
          },
          required: ["summary", "suggestions", "productivityScore"]
        }
      }
    });

    // Access the .text property directly as it is a getter, not a method.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};
