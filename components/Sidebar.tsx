import React from 'react';
import { Phase, type DocumentName, type Documents } from '../types';
import { DOC_NAMES, PHASE_CONFIG } from '../constants';
import { DocumentIcon, DownloadIcon } from './icons';
import DownloadAllButton from './DownloadAllButton';
import { downloadFile } from '../utils';
import PhaseTracker from './PhaseTracker';

interface SidebarProps {
    currentPhase: Phase;
    activeDocument: DocumentName | null;
    onSelectDocument: (docName: DocumentName) => void;
    documents: Documents;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPhase, activeDocument, onSelectDocument, documents }) => {
    const isPhaseComplete = (phase: Phase) => {
        const phasesOrder = Object.keys(PHASE_CONFIG);
        return phasesOrder.indexOf(currentPhase) >= phasesOrder.indexOf(phase);
    };

    return (
        <aside className="w-72 bg-gray-900 p-4 flex flex-col border-r border-gray-800">
            <div className="mb-8">
                <h1 className="text-xl font-bold text-gray-200">Spec Architect AI</h1>
                <p className="text-sm text-gray-400">Your AI-powered spec generator</p>
            </div>
            
            <div className="mb-8">
                 <h2 className="text-xs font-semibold uppercase text-gray-400 mb-3">Progress</h2>
                 <PhaseTracker currentPhase={currentPhase} />
            </div>

            <nav className="flex-grow">
                <h2 className="text-xs font-semibold uppercase text-gray-400 mb-3">Documents</h2>
                <ul className="space-y-1">
                    {DOC_NAMES.map(docName => {
                        const docPhase = Object.values(PHASE_CONFIG).find(p => p.outputDoc === docName);
                        const isGenerated = docPhase ? isPhaseComplete(docPhase.next) || [Phase.COMPLETE, Phase.EXECUTION].includes(currentPhase) : false;
                        const isDownloadable = !!documents[docName];

                        return (
                            <li key={docName}>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectDocument(docName)}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectDocument(docName)}
                                    className={`w-full flex items-center p-2.5 rounded-md text-left transition-colors relative group cursor-pointer ${
                                        activeDocument === docName
                                            ? 'bg-gray-800 text-gray-200'
                                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                    }`}
                                >
                                    {activeDocument === docName && <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-500 rounded-r-full"></div>}
                                    <DocumentIcon className={`mr-3 flex-shrink-0 ${isGenerated ? 'text-cyan-500' : 'text-gray-700'}`} />
                                    <span className="flex-grow capitalize">{docName}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isDownloadable) {
                                                downloadFile(`${docName}.md`, documents[docName]);
                                            }
                                        }}
                                        disabled={!isDownloadable}
                                        className="p-1 rounded-md text-gray-500 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-gray-700 hover:text-cyan-400 focus:opacity-100 disabled:opacity-0 transition-all"
                                        title={isDownloadable ? `Download ${docName}.md` : 'Document not yet generated'}
                                        aria-label={`Download ${docName}.md`}
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <DownloadAllButton documents={documents} />
            </nav>

            <div className="text-xs text-gray-600 mt-auto pt-4">
                <p>&copy; 2024 AI Solutions</p>
            </div>
        </aside>
    );
};

export default Sidebar;