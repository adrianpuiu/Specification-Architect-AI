import React from 'react';
import { Phase } from '../types';
import { PHASE_CONFIG } from '../constants';

interface PhaseTrackerProps {
    currentPhase: Phase;
}

const PhaseTracker: React.FC<PhaseTrackerProps> = ({ currentPhase }) => {
    const phases = [Phase.RESEARCH, Phase.BLUEPRINT, Phase.REQUIREMENTS, Phase.DESIGN, Phase.TASKS, Phase.VALIDATION];
    const currentIndex = phases.indexOf(currentPhase);

    return (
        <div className="space-y-4">
            {phases.map((phase, index) => {
                const isCompleted = currentIndex > index || currentPhase === Phase.COMPLETE || currentPhase === Phase.EXECUTION;
                const isActive = currentIndex === index;

                return (
                    <div key={phase} className="flex items-center">
                        <div className="flex flex-col items-center mr-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                isActive ? 'border-cyan-500 bg-cyan-500 text-gray-900' : isCompleted ? 'border-green-600 bg-green-600 text-gray-900' : 'border-gray-700 bg-gray-800'
                            }`}>
                                {isCompleted ? (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                ) : (
                                    <span className={`font-bold text-xs ${isActive ? 'text-white' : 'text-gray-500'}`}>{index + 1}</span>
                                )}
                            </div>
                            {index < phases.length - 1 && (
                                <div className={`w-0.5 h-4 mt-1 ${isCompleted ? 'bg-green-600' : 'bg-gray-700'}`}></div>
                            )}
                        </div>
                        <span className={`font-medium text-sm ${
                            isActive ? 'text-cyan-400' : isCompleted ? 'text-gray-200' : 'text-gray-500'
                        }`}>
                            {PHASE_CONFIG[phase].title}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default PhaseTracker;
