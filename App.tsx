import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AIOperation, ProjectFile, Projects, EditorSettings, ProjectSourceInfo } from './types';
import { runAIAssistant } from './services/geminiService';
import * as githubService from './services/githubService';
import Header from './components/Header';
import Editor from './components/Editor';
import ActionPanel from './components/ActionPanel';
import OutputDisplay from './components/OutputDisplay';
import FileExplorer from './components/FileExplorer';
import ProjectExplorer from './components/ProjectExplorer';
import ActivityBar from './components/ActivityBar';
import SettingsPanel from './components/SettingsPanel';
import Modal from './components/Modal';
import { isPathTextFile } from './utils/fileHelpers';

declare global {
  interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
  }
  // Add types for File System Access API handles
  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }
  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile: () => Promise<File>;
    createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
  }
  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    values: () => AsyncIterableIterator<FileSystemHandle>;
    getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  }
}

const initialProject: ProjectFile[] = [
    {
      path: 'prompt.txt',
      content: 'Create a simple React app with a button that increments a counter. Use TypeScript and basic styling.',
      isDirty: false
    },
    {
      path: 'README.md',
      content: '## CyberEditor AI\n\nThis is a sample project structure.\n\n1.  **Write a prompt** in `prompt.txt` describing the project you want to create.\n2.  **Select the GENERATE** action from the panel above.\n3.  The AI will generate a new project for you.\n\n You can also use other actions like **DEBUG** or **REFACTOR** on existing code.',
      isDirty: false
    }
];

const getInitialProjects = (): Projects => {
    try {
        const saved = localStorage.getItem('cyber-editor-projects');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null && Object.keys(parsed).length > 0) {
                Object.values(parsed).forEach((project: any) => {
                    project.forEach((file: ProjectFile) => {
                        if (file.isDirty === undefined) file.isDirty = false;
                    });
                });
                return parsed;
            }
        }
    } catch (e) { console.error("Failed to load projects from localStorage", e); }
    return { 'Welcome Project': initialProject };
};

const getInitialSettings = (): EditorSettings => {
    try {
        const saved = localStorage.getItem('cyber-editor-settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed.theme === 'string') {
                return { theme: parsed.theme, githubToken: parsed.githubToken || null, githubUser: parsed.githubUser || null };
            }
        }
    } catch(e) { console.error("Failed to load settings from localStorage", e); }
    return { theme: 'cyan', githubToken: null, githubUser: null };
};

type ModalConfig = {
    type: 'prompt' | 'confirm' | 'alert';
    title: string;
    message: React.ReactNode;
    inputLabel?: string;
    defaultValue?: string;
    onConfirm: (value?: string) => void;
    onCancel?: () => void;
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Projects>(getInitialProjects);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(Object.keys(projects)[0] || null);
  const [projectSources, setProjectSources] = useState<{ [projectName: string]: ProjectSourceInfo }>({'Welcome Project': {type: 'memory'}});
  
  const activeProjectFiles = useMemo(() => activeProjectName ? projects[activeProjectName] : [], [projects, activeProjectName]);
  const activeProjectSource = useMemo(() => activeProjectName ? projectSources[activeProjectName] : null, [projectSources, activeProjectName]);

  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('> AI output will appear here...\n\nTo start, select a project and file.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSandboxed, setIsSandboxed] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'explorer' | 'settings'>('explorer');
  const [settings, setSettings] = useState<EditorSettings>(getInitialSettings);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const closeModal = () => setModalConfig(null);

  useEffect(() => { if (window.self !== window.top) setIsSandboxed(true); }, []);
  useEffect(() => { try { localStorage.setItem('cyber-editor-projects', JSON.stringify(projects)); } catch (e) { console.error("Failed to save projects to localStorage", e); } }, [projects]);
  useEffect(() => { try { localStorage.setItem('cyber-editor-settings', JSON.stringify(settings)); document.body.className = `theme-${settings.theme}`; } catch (e) { console.error("Failed to save settings to localStorage", e); } }, [settings]);
  useEffect(() => {
    const files = activeProjectName ? projects[activeProjectName] : [];
    if (!files.some(f => f.path === activeFilePath)) setActiveFilePath(files.length > 0 ? files[0].path : null);
  }, [activeProjectName, projects, activeFilePath]);

  const activeFile = useMemo(() => activeProjectFiles.find(f => f.path === activeFilePath) || null, [activeProjectFiles, activeFilePath]);
  
  const handleFileSelect = (path: string) => setActiveFilePath(path);
  const handleProjectSelect = (name: string) => setActiveProjectName(name);

  const handleEditorChange = (newContent: string) => {
    if (!activeFile || !activeProjectName) return;
    setProjects(prev => ({ ...prev, [activeProjectName]: prev[activeProjectName].map(file => 
        file.path === activeFilePath ? { ...file, content: newContent, isDirty: true } : file
    )}));
  };

  const handleNewProject = () => {
    setModalConfig({
        type: 'prompt',
        title: 'New Project',
        message: 'Enter a name for the new project.',
        inputLabel: 'Project Name',
        onConfirm: (projectName) => {
            if (!projectName) return;
            if (projects[projectName]) {
                setModalConfig(prev => ({ ...prev!, message: <span className="text-red-400">A project with this name already exists.</span> }));
                return;
            }
            const newProjectFiles = [{ path: 'README.md', content: `# ${projectName}\n\nStart your project here.`, isDirty: false }];
            setProjects(prev => ({...prev, [projectName]: newProjectFiles}));
            setProjectSources(prev => ({...prev, [projectName]: { type: 'memory' }}));
            setActiveProjectName(projectName);
            closeModal();
        },
        onCancel: closeModal
    });
  };

  const handleDeleteProject = (projectName: string) => {
    setModalConfig({
        type: 'confirm',
        title: 'Delete Project',
        message: <span>Are you sure you want to delete the project <strong className="text-[var(--accent-color-secondary)]">{projectName}</strong>? This action cannot be undone.</span>,
        onConfirm: () => {
            const currentProjects = { ...projects };
            delete currentProjects[projectName];
            setProjects(currentProjects);
        
            const currentSources = { ...projectSources };
            delete currentSources[projectName];
            setProjectSources(currentSources);
        
            if (activeProjectName === projectName) {
                const remainingProjects = Object.keys(currentProjects);
                setActiveProjectName(remainingProjects.length > 0 ? remainingProjects[0] : null);
            }
            closeModal();
        },
        onCancel: closeModal
    });
  };
  
  const saveFileToDisk = async (dirHandle: FileSystemDirectoryHandle, path: string, content: string): Promise<void> => {
    const pathParts = path.split('/');
    const fileName = pathParts.pop();
    if (!fileName) throw new Error(`Invalid file path: ${path}`);
    let currentDirHandle = dirHandle;
    for (const part of pathParts) { currentDirHandle = await currentDirHandle.getDirectoryHandle(part, { create: true }); }
    const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };
  
  const handleSaveActiveFile = async () => {
    if (!activeProjectName || !activeFile || !activeFile.isDirty || activeProjectSource?.type !== 'local') return;
    setIsLoading(true);
    setError(null);
    try {
        await saveFileToDisk(activeProjectSource.handle, activeFile.path, activeFile.content);
        setProjects(prev => ({ ...prev, [activeProjectName]: prev[activeProjectName].map(f => 
            f.path === activeFile.path ? { ...f, isDirty: false } : f
        )}));
        setOutput(`> File saved to disk: ${activeFile.path}`);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(`Failed to save file: ${msg}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    if (!window.showDirectoryPicker) { 
      setModalConfig({ type: 'alert', title: 'Unsupported Browser', message: 'Your browser does not support the File System Access API.', onConfirm: closeModal });
      return; 
    }
    try {
        const dirHandle = await window.showDirectoryPicker();
        setIsLoading(true);
        setError(null);
        setOutput(`> Reading directory: ${dirHandle.name}...`);
        const files: ProjectFile[] = [];
        const processEntry = async (entry: FileSystemHandle, currentPath: string): Promise<void> => {
            const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                const fileHandle = entry as FileSystemFileHandle;
                const file = await fileHandle.getFile();
                // Use the more robust isPathTextFile utility
                if (isPathTextFile(newPath, file.type)) {
                   const content = await file.text();
                   files.push({ path: newPath, content, isDirty: false });
                }
            } else if (entry.kind === 'directory') {
                for await (const subEntry of (entry as FileSystemDirectoryHandle).values()) { await processEntry(subEntry, newPath); }
            }
        };
        for await (const entry of dirHandle.values()) { await processEntry(entry, ''); }
        const projectName = dirHandle.name;
        
        const setProjectData = () => {
            setProjectSources(prev => ({ ...prev, [projectName]: { type: 'local', handle: dirHandle } }));
            setProjects(prev => ({ ...prev, [projectName]: files }));
            setActiveProjectName(projectName);
            setOutput(`> Loaded project "${projectName}" with ${files.length} files.`);
            closeModal();
        };

        if (projects[projectName]) {
            setModalConfig({
                type: 'confirm', title: 'Overwrite Project',
                message: <span>A project named <strong className="text-[var(--accent-color-secondary)]">{projectName}</strong> already exists. Overwrite?</span>,
                onConfirm: setProjectData,
                onCancel: () => { setOutput('> Operation cancelled.'); closeModal(); }
            });
        } else {
            setProjectData();
        }
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') { setOutput('> Folder selection cancelled.'); } 
        else { setError(err instanceof Error ? err.message : 'An unknown error occurred.'); }
    } finally { setIsLoading(false); }
  };

  const handleImportFromGithub = async () => {
    if (!settings.githubToken) {
        setModalConfig({ type: 'alert', title: 'GitHub Token Missing', message: 'Please set your GitHub Personal Access Token in Settings first.', onConfirm: closeModal });
        return;
    }
    setModalConfig({
        type: 'prompt', title: 'Import from GitHub', message: "Enter GitHub repository path.", inputLabel: "e.g., 'owner/repo'",
        onConfirm: async (repoPath) => {
            if (!repoPath) return;
            const [owner, repo] = repoPath.split('/');
            if (!owner || !repo) {
                setModalConfig(prev => ({ ...prev!, message: <span className="text-red-400">Invalid format. Use 'owner/repo'.</span> }));
                return;
            }
            
            closeModal();
            setIsLoading(true);
            setError(null);
            setOutput(`> Importing from GitHub: ${owner}/${repo}...`);
            try {
              const { files, latestCommitSha, branch } = await githubService.getRepoContents(owner, repo, settings.githubToken!);
              const projectName = `${owner}/${repo}`;

              const setProjectData = () => {
                setProjects(prev => ({ ...prev, [projectName]: files }));
                setProjectSources(prev => ({...prev, [projectName]: { type: 'github', owner, repo, branch, baseCommitSha: latestCommitSha }}));
                setActiveProjectName(projectName);
                setOutput(`> Imported ${files.length} files from ${projectName} on branch ${branch}.`);
                closeModal();
              };

              if (projects[projectName]) {
                setModalConfig({
                    type: 'confirm', title: 'Overwrite Project',
                    message: <span>A project named <strong className="text-[var(--accent-color-secondary)]">{projectName}</strong> already exists. Overwrite?</span>,
                    onConfirm: setProjectData,
                    onCancel: () => { setOutput('> Import cancelled.'); closeModal(); }
                });
              } else {
                setProjectData();
              }
            } catch (err) {
              setError(err instanceof Error ? `GitHub Import Error: ${err.message}` : 'An unknown error occurred.');
            } finally {
              setIsLoading(false);
            }
        },
        onCancel: closeModal,
    });
  };

  const handleCommitToGithub = async () => {
    if (activeProjectSource?.type !== 'github' || !activeProjectName) return;

    if (!settings.githubUser || !settings.githubUser.name || !settings.githubUser.email) {
        setModalConfig({
            type: 'alert',
            title: 'GitHub Identity Missing',
            message: "Please go to Settings and use 'Verify Token' to fetch your user information before committing.",
            onConfirm: closeModal
        });
        return;
    }

    setModalConfig({
        type: 'prompt', title: 'Commit Changes', message: "Enter a commit message to describe your changes.", inputLabel: "Commit Message",
        onConfirm: async (commitMessage) => {
            if (!commitMessage) return;

            closeModal();
            setIsLoading(true);
            setError(null);
            setOutput(`> Committing changes to ${activeProjectSource.repo}...`);
            try {
              const filesToCommit = activeProjectFiles.filter(f => f.isDirty);
              const newCommitSha = await githubService.commitFiles(
                activeProjectSource.owner,
                activeProjectSource.repo,
                activeProjectSource.branch,
                activeProjectSource.baseCommitSha,
                filesToCommit,
                commitMessage,
                settings.githubToken!,
                settings.githubUser!
              );
              setProjectSources(prev => ({ ...prev, [activeProjectName!]: { ...activeProjectSource, baseCommitSha: newCommitSha } }));
              setProjects(prev => ({ ...prev, [activeProjectName!]: prev[activeProjectName!].map(f => ({ ...f, isDirty: false })) }));
              setOutput(`> Successfully committed to ${activeProjectSource.branch}.\nNew commit SHA: ${newCommitSha}`);
            } catch (err) {
                if (err instanceof Error) {
                    if (err.message.includes('Repository rule violations') || err.message.includes('signature')) {
                        setError(`GitHub Commit Error: ${err.message}\n\nThis is often caused by a branch protection rule on your repository that requires commits to be signed. Web-based applications cannot create signed commits. Please check your repository settings.`);
                    } else {
                        setError(`GitHub Commit Error: ${err.message}`);
                    }
                } else {
                  setError('An unknown error occurred during commit.');
                }
            } finally {
              setIsLoading(false);
            }
        },
        onCancel: closeModal,
    });
  };

  const handleRunAI = useCallback(async (operation: AIOperation) => {
    if (!activeProjectName && operation !== AIOperation.GENERATE) { setError("No active project."); return; }
    
    const startAIGeneration = async (projectName: string) => {
        setOutput(`> Generating project: ${projectName}...`);
        const userRequest = activeFile?.content || 'Perform the operation on the entire project.';
        try {
            const result = await runAIAssistant(AIOperation.GENERATE, [], userRequest);
            let newFiles = JSON.parse(result) as ProjectFile[];
            newFiles = newFiles.map(f => ({ ...f, isDirty: false }));

            setProjects(prev => ({ ...prev, [projectName]: newFiles }));
            setProjectSources(prev => ({...prev, [projectName]: { type: 'memory' }}));
            setActiveProjectName(projectName);
            setOutput(`> PROJECT GENERATED: "${projectName}"\n\n${newFiles.length} files created.`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(msg);
        } finally {
            setIsLoading(false);
            closeModal();
        }
    };
    
    if (operation === AIOperation.GENERATE) {
        setModalConfig({
            type: 'prompt', title: 'Generate New Project', message: 'Enter a name for the new project to be generated.', inputLabel: 'Project Name',
            onConfirm: (projectName) => {
                if (!projectName) return;
                if (projects[projectName]) {
                    setModalConfig(prev => ({...prev!, message: <span className="text-red-400">A project named "{projectName}" already exists.</span>}));
                    return;
                }
                setIsLoading(true);
                setError(null);
                setOutput('');
                startAIGeneration(projectName);
            },
            onCancel: () => { setOutput("> Project generation cancelled."); closeModal(); }
        });
        return;
    }
    
    // For other operations
    setIsLoading(true);
    setError(null);
    setOutput('');
    const userRequest = activeFile?.content || 'Perform the operation on the entire project.';
    let result = '';

    try {
        if (!activeProjectName) {
            setError("No active project selected for this operation.");
            setIsLoading(false);
            return;
        }

        result = await runAIAssistant(operation, activeProjectFiles, userRequest);
        const source = projectSources[activeProjectName];

        const updateAndSaveFiles = async (updatedFiles: ProjectFile[]) => {
          let finalFiles = updatedFiles.map(f => ({ ...f, isDirty: source?.type !== 'local' }));
          if (source?.type === 'local') {
            setOutput(`> AI op complete. Saving ${updatedFiles.length} file(s) to disk...`);
            await Promise.all(updatedFiles.map(file => saveFileToDisk(source.handle, file.path, file.content)));
            finalFiles = updatedFiles.map(f => ({ ...f, isDirty: false }));
            setOutput(prev => prev + `\n> All changes saved to disk.`);
          } else if (source?.type === 'github') {
              setOutput(prev => prev + `\n> ${updatedFiles.length} file(s) updated. Review changes and commit.`);
          }
          return finalFiles;
        };

        if (operation === AIOperation.REFACTOR || operation === AIOperation.DEBUG) {
            const response = JSON.parse(result);
            const changedFiles = response.files as ProjectFile[];
            const summary = response.summary || response.diagnosis || "No files were changed.";

            if (!changedFiles || changedFiles.length === 0) {
                setOutput(`> OPERATION COMPLETED.\n\n${summary}`);
                setIsLoading(false);
                return;
            }

            const savedFiles = await updateAndSaveFiles(changedFiles);
            const updatedFilesMap = new Map(activeProjectFiles.map(f => [f.path, f]));
            savedFiles.forEach(f => updatedFilesMap.set(f.path, f));
            setProjects(prev => ({...prev, [activeProjectName]: Array.from(updatedFilesMap.values())}));
            setOutput(prev => prev + `\n\n> OPERATION COMPLETED.\n\n${summary}`);
        } else { // EXPLAIN
            setOutput(result);
        }
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
      if (err instanceof SyntaxError) { setError(`SYSTEM_ERROR: Failed to parse AI response as JSON.\n\nRaw Response:\n${result.substring(0, 500)}`); } 
      else { setError(msg); }
      setOutput('');
    } finally { setIsLoading(false); }
  }, [activeProjectName, projects, activeFile, activeProjectFiles, projectSources, settings]);
  
  const dirtyFilePaths = useMemo(() => new Set(activeProjectFiles.filter(f => f.isDirty).map(f => f.path)), [activeProjectFiles]);
  const isSaveDisabled = activeProjectSource?.type !== 'local' || dirtyFilePaths.size === 0;
  const isCommitDisabled = activeProjectSource?.type !== 'github' || dirtyFilePaths.size === 0;

  const ModalController: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        if (modalConfig) setInputValue(modalConfig.defaultValue || '');
    }, [modalConfig]);
    if (!modalConfig) return null;

    const { type, message, inputLabel, onConfirm, onCancel } = modalConfig;

    const handleConfirm = () => onConfirm(inputValue);
    const handleCancel = () => { if (onCancel) onCancel(); else closeModal(); };
    const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
        if (e.key === 'Escape') { handleCancel(); }
    };
    
    return (
        <div className="flex flex-col gap-4">
            <div className="text-gray-200">{message}</div>
            {type === 'prompt' && (
                <div className="flex flex-col gap-2">
                    {inputLabel && <label htmlFor="modal-input" className="text-sm text-[var(--accent-color-secondary)]">{inputLabel}</label>}
                    <input
                        id="modal-input" type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeydown} autoFocus
                        className="w-full bg-black/50 border border-white/20 rounded-md p-2 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    />
                </div>
            )}
            <div className="flex gap-4 justify-end pt-4">
                {(type === 'prompt' || type === 'confirm') && (
                    <button onClick={handleCancel} className="p-2 px-4 bg-black/30 border border-gray-500 rounded-md text-gray-300 hover:bg-gray-500/20 hover:text-white transition-colors">
                        Cancel
                    </button>
                )}
                <button onClick={handleConfirm} className="p-2 px-6 bg-black/30 border border-[var(--accent-color-secondary)] rounded-md text-[var(--accent-color-secondary)] hover:bg-[var(--accent-color-secondary)]/20 hover:text-white transition-colors">
                    {type === 'alert' ? 'OK' : 'Confirm'}
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0221] text-[#f0f0f0] font-mono p-4 lg:p-6 relative flex flex-col">
      <div className="scanlines"></div><div className="noise"></div>
      
      <Modal isOpen={!!modalConfig} onClose={closeModal} title={modalConfig?.title || 'Dialog'}>
        <ModalController />
      </Modal>

      <Header />
      <main className="mt-4 flex-grow flex gap-4 h-[calc(100vh-100px)]">
        <ActivityBar activeView={activeView} onSetActiveView={setActiveView} />
        <div className="w-[300px] flex-shrink-0 flex flex-col gap-4 h-full">
          {activeView === 'explorer' ? (
            <>
            <div className="flex-1 min-h-0">
               <ProjectExplorer 
                  projects={Object.keys(projects)} activeProjectName={activeProjectName} onSelectProject={handleProjectSelect}
                  onNewProject={handleNewProject} onOpenFolder={handleOpenFolder} onImportFromGithub={handleImportFromGithub}
                  onDeleteProject={handleDeleteProject}
                  isLoading={isLoading} isSandboxed={isSandboxed} />
            </div>
            <div className="flex-1 min-h-0">
               <FileExplorer 
                  files={activeProjectFiles} activeFilePath={activeFilePath} onSelectFile={handleFileSelect}
                  isLoading={isLoading} hasActiveProject={!!activeProjectName} dirtyFilePaths={dirtyFilePaths} />
            </div>
            </>
          ) : (
            <SettingsPanel settings={settings} onSettingsChange={setSettings} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-4 h-full min-w-0">
          <ActionPanel onRunAI={handleRunAI} isLoading={isLoading} onSave={handleSaveActiveFile}
            isSaveDisabled={isSaveDisabled} onCommit={handleCommitToGithub} isCommitDisabled={isCommitDisabled} />
          <Editor value={activeFile?.content ?? ''} onChange={handleEditorChange} disabled={!activeFile || isLoading}
            hasActiveProject={!!activeProjectName} />
        </div>
        <div className="flex-1 h-full min-w-0">
          <OutputDisplay output={output} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
};

export default App;
