import React, { useEffect, useState, useRef } from 'react';
import type { DocumentName } from '../types';
import { DownloadIcon, EditIcon, SaveIcon, CancelIcon } from './icons';
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

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentName, content, isEditing, onToggleEdit, onUpdateContent }) => {
    const [editedContent, setEditedContent] = useState(content);
    const viewerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    useEffect(() => {
        // When content changes or we exit edit mode, try to render diagrams
        if (!isEditing && content && viewerRef.current) {
            try {
                const mermaidElements = viewerRef.current.querySelectorAll('.language-mermaid');
                if (mermaidElements.length > 0) {
                    // We need to give mermaid a unique ID for each graph to avoid rendering errors on updates
                     mermaidElements.forEach((el, i) => {
                        el.innerHTML = el.textContent || '';
                        el.removeAttribute('data-processed');
                    });
                    mermaid.run({ nodes: mermaidElements });
                }
            } catch (e) {
                console.error("Error rendering mermaid diagram:", e);
            }
        }
    }, [content, isEditing]);


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
                            components={{
                                code: CodeBlock
                            }}
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