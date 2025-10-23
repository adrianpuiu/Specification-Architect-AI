import React, { useRef, useEffect } from 'react';
import { useSpecificationChat } from './hooks/useSpecificationChat';
import Sidebar from './components/Sidebar';
import DocumentViewer from './components/DocumentViewer';
import ThinkingModeToggle from './components/ThinkingModeToggle';
import { UserIcon, BotIcon, SendIcon, LoadingSpinner } from './components/icons';
import { Phase } from './types';
import type { ChatState, Message, DocumentName } from './types';

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
    const { state, dispatch, sendMessage, executePhase } = useSpecificationChat();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const {
        messages,
        isLoading,
        currentPhase,
        documents,
        activeDocument,
        isThinkingMode,
        isEditing
    } = state;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (content: string) => {
        sendMessage(content);
    };
    
    return (
        <div className="flex h-screen bg-gray-950 text-gray-200 font-sans">
            <Sidebar 
                currentPhase={currentPhase}
                activeDocument={activeDocument}
                onSelectDocument={(docName) => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: docName })}
                documents={documents}
            />
            <main className="flex-1 flex flex-col h-screen p-4 gap-4">
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Chat Panel */}
                    <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                       {messages.length <= 1 ? (
                            <WelcomeScreen message={messages.length > 0 ? messages[0].content : "Loading..."} />
                        ) : (
                             <div ref={chatContainerRef} className="flex-1 p-6 space-y-6 overflow-y-auto">
                                {messages.map((msg, index) => (
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
                                {isLoading && messages[messages.length - 1]?.role !== 'model' && (
                                    <div className="flex items-start gap-4">
                                        <BotIcon className="h-8 w-8 text-cyan-500 flex-shrink-0 mt-1"/>
                                        <div className="max-w-2xl p-4 rounded-xl bg-gray-800 flex items-center space-x-3">
                                            <LoadingSpinner/>
                                            <span className="text-gray-400">{
                                                currentPhase === Phase.RESEARCH ? 'Researching with Google Search...' : 'Generating...'
                                            }</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <ChatInput 
                            onSendMessage={handleSendMessage}
                            onExecute={executePhase}
                            isLoading={isLoading} 
                            isThinkingMode={isThinkingMode} 
                            setIsThinkingMode={(val) => dispatch({ type: 'SET_THINKING_MODE', payload: val })}
                            currentPhase={currentPhase}
                        />
                    </div>
                    {/* Document Viewer Panel */}
                    <div className="flex-1 flex flex-col">
                        {activeDocument && (
                            <DocumentViewer 
                                documentName={activeDocument} 
                                content={documents[activeDocument]}
                                isEditing={isEditing[activeDocument]}
                                onToggleEdit={(docName) => dispatch({type: 'TOGGLE_EDITING', payload: docName})}
                                onUpdateContent={(docName, content) => dispatch({type: 'UPDATE_DOCUMENT_CONTENT', payload: {docName, content}})}
                             />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    onExecute: () => void;
    isLoading: boolean;
    isThinkingMode: boolean;
    setIsThinkingMode: (value: boolean) => void;
    currentPhase: Phase;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onExecute, isLoading, isThinkingMode, setIsThinkingMode, currentPhase }) => {
    const [content, setContent] = React.useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    
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
    
    const isFinalPhase = currentPhase === Phase.COMPLETE;
    const isDone = currentPhase === Phase.EXECUTION;

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800 bg-gray-900">
            {isFinalPhase ? (
                 <button type="button" onClick={onExecute} className="w-full p-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    Finalize & Execute
                </button>
            ) : (
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
                        placeholder={isDone ? "Process complete. You can download the documents." : "Describe your project..."}
                        className="w-full bg-gray-800 rounded-lg p-4 pr-14 text-gray-200 resize-none max-h-48 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-transparent focus:border-cyan-500 transition"
                        rows={1}
                        disabled={isLoading || isDone}
                    />
                    <button type="submit" disabled={isLoading || isDone || !content.trim()} className="absolute right-3 top-3.5 p-2 rounded-full bg-cyan-500 text-white disabled:bg-gray-700 disabled:text-gray-400 hover:bg-cyan-600 transition-colors">
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            )}
            <div className="pt-3 flex justify-end">
                <ThinkingModeToggle isThinkingMode={isThinkingMode} setIsThinkingMode={setIsThinkingMode} disabled={isLoading || isDone || currentPhase !== Phase.INITIAL} />
            </div>
        </form>
    );
};


export default App;