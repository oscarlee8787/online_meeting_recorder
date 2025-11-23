import { GoogleGenAI, Type } from "@google/genai";
import { ParsedMeetingData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseScheduleText = async (text: string): Promise<ParsedMeetingData[]> => {
  const now = new Date().toISOString();
  
  const prompt = `
    I have a raw text copy of my schedule or calendar. 
    Current Reference Time (Now): ${now}.
    
    Please extract all meetings that have a joinable link (Zoom, Google Meet, Teams, Webex, etc.).
    If a meeting does not have a specific end time, assume it is 1 hour long.
    Convert all times to absolute ISO 8601 format based on the "Current Reference Time".
    
    Text to parse:
    ${text}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              startTime: { type: Type.STRING, description: "ISO 8601 start time" },
              endTime: { type: Type.STRING, description: "ISO 8601 end time" },
              link: { type: Type.STRING, description: "The URL to join the meeting" }
            },
            required: ["title", "startTime", "endTime", "link"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "[]");
    return parsed as ParsedMeetingData[];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Failed to parse schedule text.");
  }
};