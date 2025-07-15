
import React from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  hasActiveProject: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, disabled, hasActiveProject }) => {
  const getPlaceholder = () => {
    if (!hasActiveProject) return "Select or create a project to begin...";
    if (disabled) return "AI is busy. Please wait...";
    if (value === '') return "Enter code here, or write a prompt for the AI (e.g., 'Create a snake game in javascript') and press GENERATE...";
    return "Enter code or describe what you want to generate...";
  };
  
  return (
    <div className={`flex-grow h-full bg-black/30 border-2 border-[var(--accent-color)] rounded-lg p-1 cyber-glow relative ${disabled ? 'opacity-60' : ''}`}>
       <div className="absolute top-2 left-3 text-[var(--accent-color-secondary)] text-xs">// INPUT_TERMINAL</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-full bg-transparent text-white p-4 pt-8 resize-none focus:outline-none custom-scrollbar disabled:cursor-not-allowed"
        placeholder={getPlaceholder()}
        spellCheck="false"
      />
    </div>
  );
};

export default Editor;
