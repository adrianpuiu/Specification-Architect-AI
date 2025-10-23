import { useReducer, useEffect, useCallback } from 'react';
import type { Chat, GenerateContentResponse } from '@google/genai';
import type { GroundingChunk } from '../types';
import { initChat, continueChatStream } from '../services/geminiService';
import { Phase, type Action, type ChatState, type DocumentName } from '../types';
import { PHASE_PROMPTS, PHASE_CONFIG, DOC_NAMES } from '../constants';

const initialState: ChatState = {
    chat: null,
    messages: [],
    isLoading: false,
    currentPhase: Phase.INITIAL,
    documents: {
        blueprint: '',
        requirements: '',
        design: '',
        tasks: '',
        validation: ''
    },
    activeDocument: 'blueprint',
    isThinkingMode: true,
    error: null,
    isEditing: {
        blueprint: false,
        requirements: false,
        design: false,
        tasks: false,
        validation: false
    },
};

function chatReducer(state: ChatState, action: Action): ChatState {
    switch (action.type) {
        case 'SET_CHAT':
            return { ...state, chat: action.payload };
        case 'ADD_MESSAGE':
            // When adding a new model message for streaming, ensure isLoading is true
            const isLoading = action.payload.role === 'model' ? true : state.isLoading;
            return { ...state, messages: [...state.messages, action.payload], isLoading };
        case 'STREAM_UPDATE': {
            if (state.messages.length === 0 || state.messages[state.messages.length - 1].role !== 'model') {
                return state;
            }
            const lastMessage = state.messages[state.messages.length - 1];
            const updatedMessage = { ...lastMessage, content: lastMessage.content + action.payload };
            return { ...state, messages: [...state.messages.slice(0, -1), updatedMessage] };
        }
        case 'STREAM_COMPLETE': {
             if (state.messages.length === 0 || state.messages[state.messages.length - 1].role !== 'model') {
                return state;
            }
            const lastMessage = state.messages[state.messages.length - 1];
            const updatedMessage = { ...lastMessage, content: action.payload.content, sources: action.payload.sources };
            return { ...state, messages: [...state.messages.slice(0, -1), updatedMessage], isLoading: false };
        }
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_PHASE':
            return { ...state, currentPhase: action.payload };
        case 'SET_DOCUMENT':
            return { ...state, documents: { ...state.documents, [action.payload.docName]: action.payload.content } };
        case 'SET_ACTIVE_DOCUMENT':
            return { ...state, activeDocument: action.payload };
        case 'SET_THINKING_MODE':
            return { ...state, isThinkingMode: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'TOGGLE_EDITING':
            return { ...state, isEditing: { ...state.isEditing, [action.payload]: !state.isEditing[action.payload] } };
        case 'UPDATE_DOCUMENT_CONTENT':
            return { ...state, documents: { ...state.documents, [action.payload.docName]: action.payload.content } };
        default:
            return state;
    }
}


export const useSpecificationChat = () => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const { chat, isThinkingMode, currentPhase } = state;

    useEffect(() => {
        const chatInstance = initChat();
        dispatch({ type: 'SET_CHAT', payload: chatInstance });
        dispatch({
            type: 'ADD_MESSAGE',
            payload: { role: 'model', content: "Welcome! Describe the application or system you want to build. The first phase of our process will use Google Search to research up-to-date technologies and patterns for your project. For complex projects, ensure 'Thinking Mode' is enabled for best results." }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
    }, []);

    const processResponseText = useCallback((responseText: string, phaseForResponse: Phase) => {
        const phaseConfig = PHASE_CONFIG[phaseForResponse];
        let displayMessage = responseText;
        let approvalGateFound = false;

        if (phaseConfig.outputDoc) {
            const docName = phaseConfig.outputDoc;
            const startDelimiter = `<<<${docName}_START>>>`;
            const endDelimiter = `<<<${docName}_END>>>`;

            if (responseText.includes(startDelimiter) && responseText.includes(endDelimiter)) {
                const docContentRegex = new RegExp(`${startDelimiter}([\\s\\S]*?)${endDelimiter}`);
                const match = responseText.match(docContentRegex);
                if (match && match[1]) {
                    const contentForDoc = match[1].trim();
                    dispatch({ type: 'SET_DOCUMENT', payload: { docName, content: contentForDoc } });
                    displayMessage = responseText.replace(docContentRegex, `*The content for ${docName}.md has been generated. You can view it in the documents panel.*`).trim();
                }
            }
        }
        
        const approvalGateKeywords = ['do you approve', 'proceed to', 'plan is validated', 'specification is ready', 'to begin implementation'];
        if (approvalGateKeywords.some(keyword => responseText.toLowerCase().includes(keyword))) {
            approvalGateFound = true;
        }

        return { displayMessage, approvalGateFound };

    }, []);

    const runAutoPhase = useCallback(async (phase: Phase) => {
        if (!chat) return;

        if (phase === Phase.COMPLETE) {
            dispatch({ type: 'SET_PHASE', payload: Phase.COMPLETE });
            dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: "All documents generated and validated. The specification is ready." } });
            return;
        }

        const phaseTitle = PHASE_CONFIG[phase].title;
        dispatch({ type: 'SET_PHASE', payload: phase });
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: `*Automatically proceeding to ${phaseTitle}...*` } });
        
        // Add an empty model message to stream into
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: '' } });

        try {
            const phasePrompt = PHASE_PROMPTS[phase];
            const result = await continueChatStream(chat, phasePrompt, isThinkingMode, phase);
            
            let fullText = '';
            let finalChunk: GenerateContentResponse | null = null;
            for await (const chunk of result) {
                const chunkText = chunk.text;
                fullText += chunkText;
                dispatch({ type: 'STREAM_UPDATE', payload: chunkText });
                finalChunk = chunk;
            }
            
            const sources = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
            const { displayMessage, approvalGateFound } = processResponseText(fullText, phase);

            dispatch({ type: 'STREAM_COMPLETE', payload: { content: displayMessage, sources } });

            if (approvalGateFound) {
                setTimeout(() => runAutoPhase(PHASE_CONFIG[phase].next), 500);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: `Error: ${errorMsg}` } });
        }

    }, [chat, isThinkingMode, processResponseText]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !chat || state.isLoading) return;

        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content } });
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: '' } }); // Placeholder for streaming

        const phaseForPrompt = currentPhase === Phase.INITIAL ? Phase.RESEARCH : currentPhase;
        
        if (phaseForPrompt !== currentPhase) {
            dispatch({ type: 'SET_PHASE', payload: phaseForPrompt });
        }
        
        const docsContext = DOC_NAMES
            .map(docName => state.documents[docName] ? `<<<${docName}.md>>>\n${state.documents[docName]}\n<<</${docName}.md>>>` : '')
            .join('\n\n');

        const phasePrompt = PHASE_PROMPTS[phaseForPrompt];
        const fullPrompt = `${docsContext}\n\n${phasePrompt}\n\nUser request: "${content}"`;

        try {
            const result = await continueChatStream(chat, fullPrompt, isThinkingMode, phaseForPrompt);
            
            let fullText = '';
            let finalChunk: GenerateContentResponse | null = null;
            for await (const chunk of result) {
                const chunkText = chunk.text;
                fullText += chunkText;
                dispatch({ type: 'STREAM_UPDATE', payload: chunkText });
                finalChunk = chunk;
            }
            
            const sources = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
            const { displayMessage, approvalGateFound } = processResponseText(fullText, phaseForPrompt);
            
            dispatch({ type: 'STREAM_COMPLETE', payload: { content: displayMessage, sources } });
            
            if (approvalGateFound) {
                 const nextPhase = PHASE_CONFIG[phaseForPrompt].next;
                 setTimeout(() => runAutoPhase(nextPhase), 500);
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            dispatch({ type: 'SET_ERROR', payload: errorMsg });
            dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: `Error: ${errorMsg}` } });
        }
    }, [chat, currentPhase, isThinkingMode, state.isLoading, state.documents, processResponseText, runAutoPhase]);
    
    const executePhase = () => {
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'user', content: 'execute' } });
        dispatch({ type: 'ADD_MESSAGE', payload: { role: 'model', content: 'Execution command received. The specification process is finalized. The generated documents are ready for the development team.' } });
        dispatch({ type: 'SET_PHASE', payload: Phase.EXECUTION });
    };

    return { state, dispatch, sendMessage, executePhase };
};