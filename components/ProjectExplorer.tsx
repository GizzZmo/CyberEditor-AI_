
import React from 'react';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { GithubIcon } from './icons/GithubIcon';
import { TrashIcon } from './icons/TrashIcon';

interface ProjectExplorerProps {
  projects: string[];
  activeProjectName: string | null;
  onSelectProject: (name: string) => void;
  onNewProject: () => void;
  onOpenFolder: () => void;
  onImportFromGithub: () => void;
  onDeleteProject: (name: string) => void;
  isLoading: boolean;
  isSandboxed: boolean;
}

const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  projects,
  activeProjectName,
  onSelectProject,
  onNewProject,
  onOpenFolder,
  onImportFromGithub,
  onDeleteProject,
  isLoading,
  isSandboxed
}) => {
  const handleOpenClick = () => {
    if (isSandboxed) {
      window.open(window.location.href, '_blank');
    } else {
      onOpenFolder();
    }
  };

  return (
    <div className="h-full bg-black/30 border-2 border-[var(--accent-color)] rounded-lg p-3 flex flex-col cyber-glow">
      <h2 className="text-[var(--accent-color)] text-sm font-bold tracking-widest mb-3 px-1">// PROJECT_LIST</h2>
      
      <div className="flex gap-2 mb-3">
        <button 
            onClick={onNewProject} 
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-black/30 border border-[var(--accent-color)] rounded-md text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="New Project"
        >
            <FolderPlusIcon className="w-5 h-5" />
        </button>
        <button 
            onClick={handleOpenClick} 
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-black/30 border border-[var(--accent-color)] rounded-md text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isSandboxed ? "Open in new tab to enable folder access" : "Open Folder"}
        >
            {isSandboxed ? <ExternalLinkIcon className="w-5 h-5" /> : <FolderOpenIcon className="w-5 h-5" />}
        </button>
         <button 
            onClick={onImportFromGithub} 
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-black/30 border border-[var(--accent-color)] rounded-md text-[var(--accent-color)] hover:bg-[var(--accent-color)]/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Import from GitHub"
        >
            <GithubIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <ul className="space-y-1">
          {projects.map((name) => (
            <li key={name} className="group relative">
              <button
                onClick={() => onSelectProject(name)}
                disabled={isLoading}
                className={`w-full text-left p-2 rounded-md transition-colors duration-200 text-sm truncate pr-8
                  ${activeProjectName === name
                    ? 'bg-[var(--accent-color-secondary)]/30 text-[var(--accent-color-secondary)] font-semibold'
                    : 'text-gray-300 hover:bg-[var(--accent-color)]/20 hover:text-white'
                  }
                  disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {name}
              </button>
              <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(name);
                }}
                disabled={isLoading}
                title={`Delete project "${name}"`}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 rounded-md opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 focus:opacity-100 transition-opacity disabled:opacity-0"
              >
                  <TrashIcon className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProjectExplorer;
