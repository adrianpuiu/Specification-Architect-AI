
import React from 'react';

interface ThinkingModeToggleProps {
  isThinkingMode: boolean;
  setIsThinkingMode: (value: boolean) => void;
  disabled?: boolean;
}

const ThinkingModeToggle: React.FC<ThinkingModeToggleProps> = ({ isThinkingMode, setIsThinkingMode, disabled = false }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="thinking-mode-toggle" className={`text-sm font-medium transition-colors ${disabled ? 'text-gray-600' : 'text-gray-400'}`}>
        Thinking Mode
      </label>
      <button
        id="thinking-mode-toggle"
        onClick={() => setIsThinkingMode(!isThinkingMode)}
        disabled={disabled}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 ${
          isThinkingMode ? 'bg-cyan-600' : 'bg-gray-600'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
            isThinkingMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ThinkingModeToggle;