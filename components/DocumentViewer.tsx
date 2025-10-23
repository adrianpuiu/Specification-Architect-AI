import React, { useEffect, useState, useRef, useId } from 'react';
import type { DocumentName } from '../types';
import { DownloadIcon, EditIcon, SaveIcon, CancelIcon, LoadingSpinner } from './icons';
import { downloadFile } from '../utils';
import CodeBlock from './CodeBlock';

// These are expected to be on the window object from the CDN scripts in index.html
declare const ReactMarkdown: any;
declare const remarkGfm: any;
declare const mermaid: any;

interface DocumentViewerProps {
    documentName: DocumentName;
    content: string;
    isEditing: boolean;
    onToggleEdit: (docName: DocumentName) => void;
    onUpdateContent: (docName: DocumentName, content: string) => void;
}

const Mermaid = ({ chartContent }: { chartContent: string }) => {
    const id = useId();
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const render = async () => {
            if (!chartContent) return;
            
            setSvg(null);
            setError(null);

            try {
                const { svg: renderedSvg } = await mermaid.render(id, chartContent);
                if (!isCancelled) {
                    setSvg(renderedSvg);
                }
            } catch (e) {
                console.error("Mermaid.js render error:", e);
                if (!isCancelled) {
                    setError(e instanceof Error ? e.message : String(e));
                }
            }
        };

        render();

        return () => {
            isCancelled = true;
        };
    }, [chartContent, id]);

    if (error) {
        return (
            <div className="my-4 p-4 bg-red-900/20 rounded-lg border border-red-500/50 text-sm">
                <p className="font-bold text-red-400">Mermaid Diagram Error</p>
                <p className="text-red-300/90 mb-2">There was an issue rendering this diagram. Please check the syntax.</p>
                
                <p className="text-xs font-semibold text-gray-400 mt-3 mb-1">Error Details:</p>
                <pre className="text-red-300 font-mono text-xs whitespace-pre-wrap p-2 bg-gray-900/50 rounded">{error}</pre>
                
                <p className="text-xs font-semibold text-gray-400 mt-3 mb-1">Original Code:</p>
                <pre className="text-gray-300 font-mono text-xs whitespace-pre-wrap p-2 bg-gray-900/50 rounded">{chartContent}</pre>
            </div>
        );
    }

    if (svg) {
        // The .mermaid-container class in index.html will make this responsive
        return <div className="mermaid-container my-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
    }

    return (
         <div className="flex justify-center items-center my-4 p-8 bg-gray-800/50 rounded-lg text-gray-400">
            <LoadingSpinner className="mr-2 h-5 w-5" /> Rendering diagram...
         </div>
    );
};


const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentName, content, isEditing, onToggleEdit, onUpdateContent }) => {
    const [editedContent, setEditedContent] = useState(content);
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    const handleDownload = () => {
        downloadFile(`${documentName}.md`, content);
    };

    const handleSave = () => {
        onUpdateContent(documentName, editedContent);
        onToggleEdit(documentName);
    };

    const handleCancel = () => {
        setEditedContent(content);
        onToggleEdit(documentName);
    }

    const Markdown = (window as any).ReactMarkdown;
    const GfmPlugin = (window as any).remarkGfm;
    
    const components = {
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            
            if (!inline && match && match[1] === 'mermaid') {
                return <Mermaid chartContent={String(children).replace(/\n$/, '')} />;
            }
            
            return <CodeBlock inline={inline} className={className} {...props}>{children}</CodeBlock>;
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg w-full flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 flex-shrink-0">
                <h2 className="text-2xl font-bold capitalize text-gray-200 font-sans">{documentName}.md</h2>
                <div className="flex items-center space-x-2">
                    {isEditing ? (
                        <>
                             <button onClick={handleSave} className="p-1.5 rounded-md text-gray-400 hover:bg-green-700 hover:text-white transition-colors" title="Save changes" aria-label="Save changes">
                                <SaveIcon className="w-5 h-5" />
                            </button>
                             <button onClick={handleCancel} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Cancel editing" aria-label="Cancel editing">
                                <CancelIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                         <button onClick={() => onToggleEdit(documentName)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors" title="Edit document" aria-label="Edit document">
                            <EditIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={handleDownload} disabled={!content} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors" title={content ? `Download ${documentName}.md` : 'No content to download'} aria-label={`Download ${documentName}.md`}>
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
             </div>
             <div ref={viewerRef} className="overflow-y-auto flex-grow prose prose-invert prose-sm md:prose-base max-w-none prose-pre:bg-gray-950 prose-pre:p-0 prose-pre:rounded-md font-mono pr-2">
                {isEditing ? (
                    <textarea 
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full h-full bg-gray-950 border border-cyan-500 rounded-md p-4 font-mono text-gray-200 resize-none focus:outline-none"
                    />
                ) : content ? (
                    Markdown && GfmPlugin ? (
                        <Markdown 
                            remarkPlugins={[GfmPlugin]}
                            components={components}
                        >
                            {content}
                        </Markdown>
                    ) : (
                        <pre className="whitespace-pre-wrap font-sans not-prose">{content}</pre>
                    )
                ) : (
                    <div className="text-gray-400 font-sans not-prose">
                        <p>This document has not been generated yet.</p>
                        <p>Proceed through the generation phases in the chat to create it.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentViewer;