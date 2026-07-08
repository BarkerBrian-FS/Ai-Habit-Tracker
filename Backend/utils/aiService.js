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