
import React from 'react';
import { AIOperation } from '../types';
import { BugIcon } from './icons/BugIcon';
import { CodeIcon } from './icons/CodeIcon';
import { InfoIcon } from './icons/InfoIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CloudUploadIcon } from './icons/CloudUploadIcon';

interface ActionPanelProps {
  onRunAI: (operation: AIOperation) => void;
  onSave: () => void;
  onCommit: () => void;
  isLoading: boolean;
  isSaveDisabled: boolean;
  isCommitDisabled: boolean;
}

const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  label: string;
}> = ({ onClick, disabled, children, label }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex-1 flex flex-col items-center justify-center gap-2 p-3 bg-black/30 border border-[var(--accent-color-secondary)] rounded-md text-[var(--accent-color-secondary)] 
               hover:bg-[var(--accent-color-secondary)]/20 hover:text-white hover:shadow-[0_0_15px_var(--accent-glow-secondary)] transition-all duration-300
               disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-black/30 disabled:hover:text-[var(--accent-color-secondary)] disabled:hover:shadow-none"
  >
    {children}
    <span className="text-xs font-bold tracking-widest">{label}</span>
  </button>
);

const ActionPanel: React.FC<ActionPanelProps> = ({ onRunAI, onSave, onCommit, isLoading, isSaveDisabled, isCommitDisabled }) => {
  return (
    <div className="bg-black/30 border border-[var(--accent-color)]/50 rounded-lg p-3">
      <div className="flex gap-2 md:gap-3">
        <ActionButton onClick={() => onRunAI(AIOperation.EXPLAIN)} disabled={isLoading} label="EXPLAIN">
          <InfoIcon className="w-6 h-6" />
        </ActionButton>
        <ActionButton onClick={() => onRunAI(AIOperation.REFACTOR)} disabled={isLoading} label="REFACTOR">
          <SparklesIcon className="w-6 h-6" />
        </ActionButton>
        <ActionButton onClick={() => onRunAI(AIOperation.DEBUG)} disabled={isLoading} label="DEBUG">
          <BugIcon className="w-6 h-6" />
        </ActionButton>
        <ActionButton onClick={() => onRunAI(AIOperation.GENERATE)} disabled={isLoading} label="GENERATE">
          <CodeIcon className="w-6 h-6" />
        </ActionButton>
         <ActionButton onClick={onSave} disabled={isLoading || isSaveDisabled} label="SAVE">
          <SaveIcon className="w-6 h-6" />
        </ActionButton>
         <ActionButton onClick={onCommit} disabled={isLoading || isCommitDisabled} label="COMMIT">
          <CloudUploadIcon className="w-6 h-6" />
        </ActionButton>
      </div>
    </div>
  );
};

export default ActionPanel;
