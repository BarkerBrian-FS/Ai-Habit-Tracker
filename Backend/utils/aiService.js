import { GoogleGenAI } from "@google/genai";

let client = null;

const getClient = () => {
    if(client) return client;
    const key = process.env.GEMINI_API_KEY;
    if(!key) return null;
    client = new GoogleGenAI({ apiKey: key });
    return client;
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const isAIEnabled = () => !!process.env.GEMINI_API_KEY;


export const parseJSON = (text) => {
    let cleaned = (text || "").trim();
    if(cleaned.startsWith('```json')){
        cleaned = cleaned.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleaned.startsWith("```")){
        cleaned = cleaned.replace(/```\n?/g, "");
    }
    return JSON.parse(cleaned.trim());
};

export const chatCompletion = async({ system, user, temperature=0.7 }) => {
    const c = getClient();
    if(!c){
        return {
            ok: false,
            content:
            "AI features are disabled - set Gemini API Key in backend .env to enable real AI responses"
        };
    }
    try {
        const res = await c.models.generateContent({
            model: MODEL,
            contents: user,
            config: {
                systemInstruction: system,
                temperature,
            },
        });
        return { ok: true, content: (res.text || "").trim()}
    } catch (error) {
        console.error("AI error:", error.message);
        return { ok: false, content: "AI request failed. Please try again later" };
    }
};

export const SYSTEM_PROMPTS = {
  weekly: `
You are a supportive habit coach. Analyze the user's last 7 days of habit data. Summarize their progress, mention one strength, one area to improve, and one recommendation. Keep the response concise.

Return ONLY valid JSON. Do not include markdown, code fences, or extra text.
`,

  suggestion: `
You are a habit coach. Based on the user's goals, completed habits, missed habits, and consistency, suggest up to three practical improvements. Keep recommendations realistic and brief.

Return ONLY valid JSON. Do not include markdown, code fences, or extra text.
`,

  recovery: `
You are a supportive habit coach. The user has missed habits or broken a streak. Encourage them, suggest a simple recovery plan, and recommend one small action to restart. Keep the response short.

Return ONLY valid JSON. Do not include markdown, code fences, or extra text.
`,

  chat: `
You are a habit coach. Answer the user's question with clear, practical advice. Keep responses brief and focused.

Return ONLY valid JSON. Do not include markdown, code fences, or extra text.
`,

  morning: `
You are a positive morning habit coach. Motivate the user, highlight today's top priority, and suggest one simple first step. Keep the response concise.

Return ONLY valid JSON. Do not include markdown, code fences, or extra text.
`,
};