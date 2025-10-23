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
    activeDocument: DocumentName;
    isThinkingMode: boolean;
    error: string | null;
    isEditing: Record<DocumentName, boolean>;
}

export type Action =
  | { type: 'SET_CHAT'; payload: Chat }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'STREAM_UPDATE'; payload: string }
  | { type: 'STREAM_COMPLETE'; payload: { content: string; sources?: GroundingChunk[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PHASE'; payload: Phase }
  | { type: 'SET_DOCUMENT'; payload: { docName: DocumentName; content: string } }
  | { type: 'SET_ACTIVE_DOCUMENT'; payload: DocumentName }
  | { type: 'SET_THINKING_MODE'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_EDITING'; payload: DocumentName }
  | { type: 'UPDATE_DOCUMENT_CONTENT', payload: { docName: DocumentName, content: string }};
