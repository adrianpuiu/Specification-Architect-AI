
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { continueChat, initChat } from './services/geminiService';
import Sidebar from './components/Sidebar';
import DocumentViewer from './components/DocumentViewer';
import ThinkingModeToggle from './components/ThinkingModeToggle';
import { UserIcon, BotIcon, SendIcon, LoadingSpinner } from './components/icons';
import { PHASE_PROMPTS, PHASE_CONFIG } from './constants';
import type { ChatState, Message, DocumentName, GroundingChunk } from './types';
import { Phase } from './types';
import type { Chat } from '@google/genai';

const WelcomeScreen: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col flex-1 items-center justify-center text-center p-8">
        <BotIcon className="w-20 h-20 text-cyan-500 mb-6" />
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Spec Architect AI</h1>
        <div className="max-w-md bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-200">{message}</p>
        </div>
    </div>
);


const App: React.FC = () => {
    const [state, setState] = useState<ChatState>({
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
    });

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const processAiResponseRef = useRef<(responseText: string, phaseForResponse: Phase, sources?: GroundingChunk[]) => void>(() => {});


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [state.messages]);
    
    useEffect(() => {
        const chatInstance = initChat();
        setState(s => ({
            ...s,
            chat: chatInstance,
            messages: [{
                role: 'model',
                content: "Welcome! Describe the application or system you want to build. For complex projects, ensure 'Thinking Mode' is enabled for best results."
            }]
        }));
    }, []);

    const runAutoPhase = useCallback(async (phase: Phase) => {
        setState(s => ({ ...s, isLoading: true }));

        const { chat, isThinkingMode, messages } = state;
        if (!chat) {
             setState(s => ({ ...s, isLoading: false, error: 'Chat not initialized.' }));
             return;
        };

        if (phase === Phase.COMPLETE) {
            setState(s => ({
                ...s,
                isLoading: false,
                currentPhase: Phase.COMPLETE,
                messages: [...s.messages, { role: 'model', content: "All documents generated and validated. The specification is ready.\n\nPlease type `execute` to finalize the process." }]
            }));
            return;
        }

        const phaseTitle = PHASE_CONFIG[phase].title;
        const progressMessage: Message = { role: 'model', content: `*Automatically proceeding to ${phaseTitle}...*` };
        setState(s => ({
            ...s,
            currentPhase: phase,
            messages: [...s.messages, progressMessage],
        }));

        try {
            const phasePrompt = PHASE_PROMPTS[phase];
            const response = await continueChat(chat, phasePrompt, isThinkingMode, phase);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
            processAiResponseRef.current(response.text, phase, sources);
        } catch (err) {
             const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
             setState(s => ({
                ...s,
                isLoading: false,
                error: errorMsg,
                messages: [...s.messages, { role: 'model', content: `Error: ${errorMsg}` }]
            }));
        }
    }, [state]);

    const processAiResponse = useCallback((responseText: string, phaseForResponse: Phase, sources?: GroundingChunk[]) => {
        const phaseConfig = PHASE_CONFIG[phaseForResponse];
        let contentForDoc = '';
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
                    contentForDoc = match[1].trim();
                    displayMessage = responseText.replace(docContentRegex, `*The content for ${docName}.md has been generated. You can view it in the documents panel.*`).trim();
                }
            }
        }
        
        const approvalGateKeywords = ['do you approve', 'proceed to', 'plan is validated', 'specification is ready', 'to begin implementation'];
        if (approvalGateKeywords.some(keyword => responseText.toLowerCase().includes(keyword))) {
            approvalGateFound = true;
        }

        setState(s => ({
            ...s,
            isLoading: false,
            messages: [...s.messages, { role: 'model', content: displayMessage, sources }],
            documents: contentForDoc && phaseConfig.outputDoc 
                ? { ...s.documents, [phaseConfig.outputDoc]: contentForDoc } 
                : s.documents,
        }));

        if (approvalGateFound) {
            setTimeout(() => {
                runAutoPhase(phaseConfig.next);
            }, 500);
        }
    }, [runAutoPhase]);
    
    useEffect(() => {
        processAiResponseRef.current = processAiResponse;
    }, [processAiResponse]);

    const handleExecute = () => {
        setState(s => ({
            ...s,
            messages: [
                ...s.messages,
                { role: 'user', content: 'execute' },
                { role: 'model', content: 'Execution command received. The specification process is finalized. The generated documents are ready for the development team.' }
            ],
            currentPhase: Phase.EXECUTION,
        }));
    };


    const handleSendMessage = async (content: string) => {
        if (!content.trim() || state.isLoading || !state.chat) return;

        if (content.trim().toLowerCase() === 'execute' && state.currentPhase === Phase.COMPLETE) {
            handleExecute();
            return;
        }

        const newMessages: Message[] = [...state.messages, { role: 'user', content }];
        setState(s => ({ ...s, messages: newMessages, isLoading: true, error: null }));
        
        const currentPhaseForPrompt = state.currentPhase === Phase.INITIAL ? Phase.RESEARCH : state.currentPhase;
        const phasePrompt = PHASE_PROMPTS[currentPhaseForPrompt];
        const fullPrompt = `${phasePrompt}\n\nUser request: "${content}"`;

        try {
            const response = await continueChat(state.chat, fullPrompt, state.isThinkingMode, currentPhaseForPrompt);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
            const phaseForResponse = state.currentPhase === Phase.INITIAL ? Phase.RESEARCH : state.currentPhase;

            processAiResponse(response.text, phaseForResponse, sources);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setState(s => ({
                ...s,
                isLoading: false,
                error: errorMsg,
                messages: [...newMessages, { role: 'model', content: `Error: ${errorMsg}` }]
            }));
        }
    };

    return (
        <div className="flex h-screen bg-gray-950 text-gray-200 font-sans">
            <Sidebar 
                currentPhase={state.currentPhase}
                activeDocument={state.activeDocument}
                onSelectDocument={(docName) => setState(s => ({...s, activeDocument: docName}))}
                documents={state.documents}
            />
            <main className="flex-1 flex flex-col h-screen p-4 gap-4">
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Chat Panel */}
                    <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                       {state.messages.length === 1 ? (
                            <WelcomeScreen message={state.messages[0].content} />
                        ) : (
                             <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                                {state.messages.map((msg, index) => (
                                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                        {msg.role === 'model' && <BotIcon className="h-8 w-8 text-cyan-500 flex-shrink-0 mt-1"/>}
                                        <div className={`max-w-2xl p-4 rounded-xl ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-4 pt-3 border-t border-gray-700">
                                                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                                                    <ul className="space-y-1 text-sm">
                                                        {msg.sources.map((source, i) => (
                                                            <li key={i} className="flex items-start">
                                                               <span className="text-gray-500 mr-2">{i + 1}.</span>
                                                               <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">
                                                                   {source.web.title || source.web.uri}
                                                               </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        {msg.role === 'user' && <UserIcon className="h-8 w-8 text-gray-700 flex-shrink-0 mt-1"/>}
                                    </div>
                                ))}
                                {state.isLoading && (
                                    <div className="flex items-start gap-4">
                                        <BotIcon className="h-8 w-8 text-cyan-500 flex-shrink-0 mt-1"/>
                                        <div className="max-w-2xl p-4 rounded-xl bg-gray-800 flex items-center space-x-3">
                                            <LoadingSpinner/>
                                            <span className="text-gray-400">Generating...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <ChatInput onSendMessage={handleSendMessage} isLoading={state.isLoading || state.currentPhase === Phase.EXECUTION} isThinkingMode={state.isThinkingMode} setIsThinkingMode={(val) => setState(s=>({...s, isThinkingMode: val}))} />
                    </div>
                    {/* Document Viewer Panel */}
                    <div className="flex-1 flex flex-col">
                        {state.activeDocument && (
                            <DocumentViewer documentName={state.activeDocument} content={state.documents[state.activeDocument]} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    isLoading: boolean;
    isThinkingMode: boolean;
    setIsThinkingMode: (value: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isThinkingMode, setIsThinkingMode }) => {
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [content]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onSendMessage(content);
            setContent('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder="Describe your project..."
                    className="w-full bg-gray-800 rounded-lg p-4 pr-14 text-gray-200 resize-none max-h-48 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-transparent focus:border-cyan-500 transition"
                    rows={1}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !content.trim()} className="absolute right-3 top-3.5 p-2 rounded-full bg-cyan-500 text-white disabled:bg-gray-700 disabled:text-gray-400 hover:bg-cyan-600 transition-colors">
                    <SendIcon className="w-5 h-5"/>
                </button>
            </div>
            <div className="pt-3 flex justify-end">
                <ThinkingModeToggle isThinkingMode={isThinkingMode} setIsThinkingMode={setIsThinkingMode} disabled={isLoading} />
            </div>
        </form>
    );
};


export default App;
