import React from 'react';
import type { Documents } from '../types';
import { DownloadIcon } from './icons';

declare const JSZip: any;

interface DownloadAllButtonProps {
    documents: Documents;
}

const DownloadAllButton: React.FC<DownloadAllButtonProps> = ({ documents }) => {
    const handleDownloadAll = async () => {
        const zip = new JSZip();
        let filesAdded = 0;

        for (const [docName, content] of Object.entries(documents)) {
            if (content) {
                zip.file(`${docName}.md`, content);
                filesAdded++;
            }
        }

        if (filesAdded > 0) {
            try {
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'specification-documents.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            } catch (error) {
                console.error("Failed to create or download zip file:", error);
            }
        }
    };

    const hasContent = Object.values(documents).some(content => !!content);

    return (
        <div className="mt-4 pt-4 border-t border-gray-800">
             <button
                onClick={handleDownloadAll}
                disabled={!hasContent}
                className="w-full flex items-center justify-center p-2.5 rounded-md text-sm font-medium transition-colors bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:bg-gray-800/50 disabled:text-gray-600 disabled:cursor-not-allowed"
                aria-label="Download all documents as a zip file"
            >
                <DownloadIcon className="w-4 h-4 mr-2" />
                <span>Download All (.zip)</span>
            </button>
        </div>
    );
};

export default DownloadAllButton;