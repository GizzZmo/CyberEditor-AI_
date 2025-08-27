/**
 * Application constants and configuration
 */

// API Configuration
export const API_CONFIG = {
  GITHUB_BASE_URL: 'https://api.github.com',
  GITHUB_ACCEPT_HEADER: 'application/vnd.github.v3+json',
  GEMINI_MODEL: 'gemini-2.5-flash',
} as const;

// UI Constants
export const UI_CONFIG = {
  THEMES: ['cyan', 'green', 'magenta'] as const,
  SAVE_STATUS_TIMEOUT: 2000,
  DEBOUNCE_DELAY: 300,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  PROJECTS: 'cyber-editor-projects',
  SETTINGS: 'cyber-editor-settings',
} as const;

// File System Constants
export const FILE_SYSTEM = {
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_TEXT_EXTENSIONS: [
    '.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css',
    '.scss', '.sass', '.less', '.xml', '.yaml', '.yml', '.toml', '.ini',
    '.env', '.gitignore', '.gitattributes', '.py', '.java', '.c', '.cpp',
    '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd', '.vue',
    '.svelte', '.astro', '.sql', '.dockerfile', '.dockerignore'
  ],
} as const;

// Security Constants
export const SECURITY = {
  MAX_REQUEST_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT_REQUESTS: 30,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
  MAX_FILES_PER_PROJECT: 100,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NO_ACTIVE_PROJECT: 'No active project selected.',
  INVALID_PROJECT_NAME: 'Project name must be a valid string.',
  PROJECT_ALREADY_EXISTS: 'A project with this name already exists.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_SYSTEM.MAX_FILE_SIZE / 1024 / 1024}MB limit.`,
  UNSUPPORTED_FILE_TYPE: 'File type is not supported for editing.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  GITHUB_AUTH_ERROR: 'GitHub authentication failed. Please check your token.',
  AI_SERVICE_ERROR: 'AI service is temporarily unavailable. Please try again.',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before making more requests.',
} as const;

// Type definitions for constants
export type Theme = typeof UI_CONFIG.THEMES[number];
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];