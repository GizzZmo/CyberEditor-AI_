/**
 * Custom hook for managing application state with secure storage
 */

import { useState, useEffect, useCallback } from 'react';
import { Projects, EditorSettings, ProjectSourceInfo, ProjectFile } from '../../types';
import { projectStorage, settingsStorage, migrateExistingData } from '../utils/secureStorage';
import { validateProjectName } from '../utils/validation';
import { ErrorHandler } from '../utils/errorHandling';

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
        const saved = projectStorage.load();
        if (saved && typeof saved === 'object' && !Array.isArray(saved) && Object.keys(saved).length > 0) {
            // Ensure all files have isDirty property
            Object.values(saved).forEach((project: any) => {
                if (Array.isArray(project)) {
                    project.forEach((file: ProjectFile) => {
                        if (file.isDirty === undefined) file.isDirty = false;
                    });
                }
            });
            return saved;
        }
    } catch (error) {
        console.error("Failed to load projects from storage", error);
    }
    return { 'Welcome Project': initialProject };
};

const getInitialSettings = (): EditorSettings => {
    try {
        const saved = settingsStorage.load();
        if (saved && typeof saved === 'object') {
            return {
                theme: saved.theme || 'cyan',
                githubToken: saved.githubToken || null,
                githubUser: saved.githubUser || null,
            };
        }
    } catch (error) {
        console.error("Failed to load settings from storage", error);
    }
    return { theme: 'cyan', githubToken: null, githubUser: null };
};

export function useAppState() {
    // Initialize state
    const [projects, setProjects] = useState<Projects>(() => {
        // Migrate existing data on first load
        migrateExistingData();
        return getInitialProjects();
    });
    
    const [settings, setSettings] = useState<EditorSettings>(getInitialSettings);
    const [projectSources, setProjectSources] = useState<Record<string, ProjectSourceInfo>>({});
    const [activeProjectName, setActiveProjectName] = useState<string>(() => {
        const projectNames = Object.keys(getInitialProjects());
        return projectNames.length > 0 ? projectNames[0] : '';
    });

    // Derived state
    const activeProjectFiles = useMemo(() => 
        activeProjectName && projects[activeProjectName] ? projects[activeProjectName] : [],
        [projects, activeProjectName]
    );

    const activeProjectSource = useMemo(() => 
        activeProjectName ? projectSources[activeProjectName] : undefined,
        [projectSources, activeProjectName]
    );

    const dirtyFilePaths = useMemo(() => 
        new Set(activeProjectFiles.filter(f => f.isDirty).map(f => f.path)),
        [activeProjectFiles]
    );

    // Save to storage when state changes
    useEffect(() => {
        try {
            projectStorage.save(projects);
        } catch (error) {
            console.error("Failed to save projects to storage", error);
        }
    }, [projects]);

    useEffect(() => {
        try {
            settingsStorage.save(settings);
            // Apply theme to document
            document.body.className = `theme-${settings.theme}`;
        } catch (error) {
            console.error("Failed to save settings to storage", error);
        }
    }, [settings]);

    // Project management functions
    const createProject = useCallback((name: string, files: ProjectFile[] = []) => {
        const validation = validateProjectName(name);
        if (!validation.valid) {
            throw ErrorHandler.validation(validation.error || 'Invalid project name');
        }

        if (projects[name]) {
            throw ErrorHandler.validation(`Project "${name}" already exists`);
        }

        const newFiles = files.length > 0 ? files : [...initialProject];
        setProjects(prev => ({ ...prev, [name]: newFiles }));
        setProjectSources(prev => ({ ...prev, [name]: { type: 'memory' } }));
        setActiveProjectName(name);
    }, [projects]);

    const deleteProject = useCallback((name: string) => {
        if (!projects[name]) {
            throw ErrorHandler.validation(`Project "${name}" does not exist`);
        }

        setProjects(prev => {
            const { [name]: deleted, ...rest } = prev;
            return rest;
        });
        
        setProjectSources(prev => {
            const { [name]: deleted, ...rest } = prev;
            return rest;
        });

        // Switch to another project if deleting active one
        if (activeProjectName === name) {
            const remainingProjects = Object.keys(projects).filter(p => p !== name);
            setActiveProjectName(remainingProjects.length > 0 ? remainingProjects[0] : '');
        }
    }, [projects, activeProjectName]);

    const updateProject = useCallback((name: string, files: ProjectFile[]) => {
        setProjects(prev => ({ ...prev, [name]: files }));
    }, []);

    const updateProjectSource = useCallback((name: string, source: ProjectSourceInfo) => {
        setProjectSources(prev => ({ ...prev, [name]: source }));
    }, []);

    const switchToProject = useCallback((name: string) => {
        if (!projects[name]) {
            throw ErrorHandler.validation(`Project "${name}" does not exist`);
        }
        setActiveProjectName(name);
    }, [projects]);

    // File management functions
    const updateFile = useCallback((path: string, content: string) => {
        if (!activeProjectName) {
            throw ErrorHandler.validation('No active project');
        }

        const source = projectSources[activeProjectName];
        const isDirty = source?.type !== 'local';

        setProjects(prev => ({
            ...prev,
            [activeProjectName]: prev[activeProjectName].map(file =>
                file.path === path
                    ? { ...file, content, isDirty }
                    : file
            )
        }));
    }, [activeProjectName, projectSources]);

    const addFile = useCallback((path: string, content: string = '') => {
        if (!activeProjectName) {
            throw ErrorHandler.validation('No active project');
        }

        const source = projectSources[activeProjectName];
        const isDirty = source?.type !== 'local';

        setProjects(prev => ({
            ...prev,
            [activeProjectName]: [
                ...prev[activeProjectName],
                { path, content, isDirty }
            ]
        }));
    }, [activeProjectName, projectSources]);

    const deleteFile = useCallback((path: string) => {
        if (!activeProjectName) {
            throw ErrorHandler.validation('No active project');
        }

        setProjects(prev => ({
            ...prev,
            [activeProjectName]: prev[activeProjectName].filter(file => file.path !== path)
        }));
    }, [activeProjectName]);

    const markFilesSaved = useCallback((filePaths?: string[]) => {
        if (!activeProjectName) return;

        setProjects(prev => ({
            ...prev,
            [activeProjectName]: prev[activeProjectName].map(file =>
                !filePaths || filePaths.includes(file.path)
                    ? { ...file, isDirty: false }
                    : file
            )
        }));
    }, [activeProjectName]);

    return {
        // State
        projects,
        settings,
        projectSources,
        activeProjectName,
        activeProjectFiles,
        activeProjectSource,
        dirtyFilePaths,
        
        // Actions
        setProjects,
        setSettings,
        setProjectSources,
        setActiveProjectName,
        
        // Project management
        createProject,
        deleteProject,
        updateProject,
        updateProjectSource,
        switchToProject,
        
        // File management
        updateFile,
        addFile,
        deleteFile,
        markFilesSaved,
    };
}