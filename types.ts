export enum AIOperation {
  EXPLAIN = 'EXPLAIN',
  REFACTOR = 'REFACTOR',
  DEBUG = 'DEBUG',
  GENERATE = 'GENERATE',
}

export interface ProjectFile {
  path: string;
  content: string;
  isDirty?: boolean;
}

export type Projects = {
  [projectName: string]: ProjectFile[];
};

export type AccentTheme = 'cyan' | 'green' | 'magenta';

export interface GithubUser {
    name: string;
    email: string;
}

export interface EditorSettings {
    theme: AccentTheme;
    githubToken: string | null;
    githubUser: GithubUser | null;
}

export type LocalProjectSource = {
    type: 'local';
    handle: FileSystemDirectoryHandle;
};

export type GitHubProjectSource = {
    type: 'github';
    owner: string;
    repo: string;
    branch: string;
    baseCommitSha: string;
};

export type InMemoryProjectSource = {
    type: 'memory';
}

export type ProjectSourceInfo = LocalProjectSource | GitHubProjectSource | InMemoryProjectSource;

export type ModalConfig = {
    type: 'prompt' | 'confirm' | 'alert';
    title: string;
    message: React.ReactNode;
    inputLabel?: string;
    defaultValue?: string;
    onConfirm: (value?: string) => void;
    onCancel?: () => void;
};
