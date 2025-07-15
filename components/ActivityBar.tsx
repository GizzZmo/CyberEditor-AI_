import React from 'react';
import { FilesIcon } from './icons/FilesIcon';
import { SettingsIcon } from './icons/SettingsIcon';

type ActiveView = 'explorer' | 'settings';

interface ActivityBarProps {
  activeView: ActiveView;
  onSetActiveView: (view: ActiveView) => void;
}

const ActivityBarButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-full p-3 flex justify-center items-center relative transition-colors duration-200
        ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
      `}
    >
      {children}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-glow)]"></div>
      )}
    </button>
  );
};

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onSetActiveView }) => {
  return (
    <div className="w-16 bg-black/30 h-full flex flex-col items-center py-2 rounded-lg border border-white/10">
      <ActivityBarButton
        label="Explorer"
        isActive={activeView === 'explorer'}
        onClick={() => onSetActiveView('explorer')}
      >
        <FilesIcon className="w-7 h-7" />
      </ActivityBarButton>
      <ActivityBarButton
        label="Settings"
        isActive={activeView === 'settings'}
        onClick={() => onSetActiveView('settings')}
      >
        <SettingsIcon className="w-7 h-7" />
      </ActivityBarButton>
    </div>
  );
};

export default ActivityBar;
