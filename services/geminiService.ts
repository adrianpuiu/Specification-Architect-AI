import { GoogleGenAI, Chat, GenerateContentParameters } from "@google/genai";
import { INITIAL_SYSTEM_PROMPT } from '../constants';
import { Phase } from "../types";

let ai: GoogleGenAI | null = null;

function getAi() {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export function initChat(): Chat {
    const aiInstance = getAi();
    return aiInstance.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: INITIAL_SYSTEM_PROMPT,
        },
    });
}

export async function continueChatStream(chat: Chat, message: string, isThinkingMode: boolean, phase: Phase) {
    try {
        const config: GenerateContentParameters['config'] = isThinkingMode ? { thinkingConfig: { thinkingBudget: 24576 } } : {};
        
        if (phase === Phase.RESEARCH) {
            config.tools = [{googleSearch: {}}];
        }

        const result = await chat.sendMessageStream({
            message,
            config
        });
        
        return result;
    } catch (error) {
        console.error("Error in continueChatStream:", error);
        throw error;
    }
}