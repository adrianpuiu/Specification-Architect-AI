
import type { Chat } from '@google/genai';

export enum Phase {
  INITIAL = 'INITIAL',
  RESEARCH = 'RESEARCH',
  BLUEPRINT = 'BLUEPRINT',
  REQUIREMENTS = 'REQUIREMENTS',
  DESIGN = 'DESIGN',
  TASKS = 'TASKS',
  VALIDATION = 'VALIDATION',
  COMPLETE = 'COMPLETE',
  EXECUTION = 'EXECUTION',
}

export type DocumentName = 'blueprint' | 'requirements' | 'design' | 'tasks' | 'validation';

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  sources?: GroundingChunk[];
}

export type Documents = Record<DocumentName, string>;

export interface ChatState {
    chat: Chat | null;
    messages: Message[];
    isLoading: boolean;
    currentPhase: Phase;
    documents: Documents;
    activeDocument: DocumentName | null;
    isThinkingMode: boolean;
    error: string | null;
}
