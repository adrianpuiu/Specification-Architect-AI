import React from 'react';
import type { DocumentName } from '../types';
import { DownloadIcon } from './icons';
import { downloadFile } from '../utils';

// These are expected to be on the window object from the CDN scripts in index.html
declare const ReactMarkdown: any;
declare const remarkGfm: any;


interface DocumentViewerProps {
    documentName: DocumentName;
    content: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentName, content }) => {
    const handleDownload = () => {
        downloadFile(`${documentName}.md`, content);
    };

    // Explicitly access globals from the window object to avoid ReferenceError
    const Markdown = (window as any).ReactMarkdown;
    const GfmPlugin = (window as any).remarkGfm;

    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg w-full flex flex-col h-full overflow-hidden">
             <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 flex-shrink-0">
                <h2 className="text-2xl font-bold capitalize text-gray-200 font-sans">{documentName}.md</h2>
                <button
                    onClick={handleDownload}
                    disabled={!content}
                    className="p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                    title={content ? `Download ${documentName}.md` : 'No content to download'}
                    aria-label={`Download ${documentName}.md`}
                >
                    <DownloadIcon className="w-5 h-5" />
                </button>
             </div>
             <div className="overflow-y-auto flex-grow prose prose-invert prose-sm md:prose-base max-w-none prose-pre:bg-gray-950 prose-pre:p-4 prose-pre:rounded-md font-mono pr-2">
                {content ? (
                    // Check if the CDN libraries have loaded before attempting to use them.
                    // Fall back to a <pre> tag if they haven't to avoid a crash and still show the content.
                    Markdown && GfmPlugin ? (
                        <Markdown remarkPlugins={[GfmPlugin]}>
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