# CyberEditor AI

[![CI](https://github.com/GizzZmo/CyberEditor-AI_/workflows/CI/badge.svg)](https://github.com/GizzZmo/CyberEditor-AI_/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A web-based, AI-powered integrated development environment (IDE) that allows users to create, modify, and manage code projects. It leverages Google's Gemini AI for code generation, explanation, refactoring, and debugging, and integrates with GitHub for version control. Built with React and TypeScript, featuring a distinctive cyberpunk aesthetic.

## ✨ Features

- 🤖 **AI-Powered Development**: Code generation, explanation, refactoring, and debugging with Google Gemini AI
- 📁 **Project Management**: Create, load, and manage multi-file projects
- 🗂️ **File System Integration**: Read and write files directly to your local file system
- 🔗 **GitHub Integration**: Import from and commit to GitHub repositories
- 🎨 **Modern UI**: Cyberpunk-themed interface with dark mode
- ⚡ **Fast Development**: Built with Vite for lightning-fast development and builds

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/GizzZmo/CyberEditor-AI_.git
   cd CyberEditor-AI_
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:5173`

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Overview

### Purpose

CyberEditor AI transforms your browser into a powerful development environment by combining the capabilities of a modern IDE with cutting-edge AI assistance. Whether you're a beginner learning to code or an experienced developer looking to accelerate your workflow, CyberEditor AI acts as your intelligent coding companion.

**Core AI Operations:**
- 🏗️ **Generate**: Create complete multi-file projects from natural language descriptions
- 📖 **Explain**: Get detailed explanations of code architecture and functionality  
- 🔧 **Refactor**: Improve code quality, performance, and maintainability
- 🐛 **Debug**: Identify and fix issues with intelligent suggestions

**IDE Features:**
- 📁 File and project management with intuitive navigation
- ✏️ Code editing with syntax highlighting
- 💾 Local file system integration (read/write directly to your disk)
- 🔗 Seamless GitHub integration for version control
- 🎨 Cyberpunk-themed interface with customizable themes

### 🏗️ Architecture

The project follows a client-side, single-page application (SPA) architecture, primarily built with React and TypeScript.

1.  **Frontend (Client-Side React Application):**
    *   **Core Logic (`App.tsx`):** Manages the application's global state (active project, files, output, loading status, settings, modals) using React hooks. It orchestrates interactions between different UI components and services.
    *   **Component-Based UI:** The user interface is composed of modular React components (e.g., `Header`, `Editor`, `ActionPanel`, `FileExplorer`, `ProjectExplorer`, `OutputDisplay`, `SettingsPanel`, `Modal`). This promotes reusability and maintainability.
    *   **Styling:** Uses Tailwind CSS (via CDN) for utility-first styling, augmented with custom CSS for cyberpunk-themed visual effects (glows, scanlines, noise) and theme switching.
    *   **Persistence:** Uses `localStorage` to save user settings and in-memory projects, allowing state to persist across browser sessions.
    *   **Local File System Access:** Utilizes the experimental File System Access API (`window.showDirectoryPicker`) to allow users to open local folders and save files directly to their disk.
    *   **Module Bundler:** Vite is used for development server and production builds, providing fast refresh and optimized output.

2.  **AI Integration (External Service):**
    *   **Gemini API (`services/geminiService.ts`):** All AI-related functionalities are handled by calling the Google Gemini API. The `geminiService` prepares prompts, sends requests to the `gemini-2.5-flash` model, and processes the AI's JSON or markdown responses. It dynamically configures the Gemini API requests based on the selected AI operation (explain, refactor, debug, generate).
    *   **API Key Management:** The Gemini API key is loaded from an environment variable (`GEMINI_API_KEY`) and exposed to the client-side via Vite's `define` option during compilation.

3.  **Version Control Integration (External Service):**
    *   **GitHub API (`services/githubService.ts`):** Facilitates integration with GitHub. Users can import projects from GitHub repositories and commit changes back. This service handles token verification, fetching repository contents, and creating new commits (blobs, trees, commits, and updating references).
    *   **Personal Access Token (PAT):** Relies on a GitHub Personal Access Token (PAT) with `repo` scope for authentication, which users configure in the settings.

4.  **Data Models (`types.ts`):**
    *   Defines TypeScript interfaces for various data structures used throughout the application, such as `ProjectFile`, `AIOperation` (enum), `EditorSettings`, `GithubUser`, and different `ProjectSourceInfo` types (memory, local, GitHub). This ensures type safety and clarity.

In summary, the architecture is a client-heavy web application that intelligently communicates with external AI and version control APIs to provide a rich code editing and AI interaction experience directly in the browser.

---

## File-by-File Breakdown

### `.gitignore`
*   **Role:** Specifies intentionally untracked files that Git should ignore. This is crucial for keeping the repository clean, preventing sensitive information (like API keys in `.env.local` or build artifacts) from being committed, and allowing local development dependencies (`node_modules`) to be managed separately.
*   **Contents:** Includes common ignores for Node.js projects (logs, `node_modules`, build outputs like `dist`), editor-specific directories (`.vscode`, `.idea`), and temporary/OS files (`.DS_Store`). It explicitly ignores `*.local` for local environment variables.

### `App.tsx`
*   **Role:** This is the main application component, serving as the root of the React component tree. It manages the global state of the application, orchestrates data flow between components, handles user interactions, and integrates with the backend services (Gemini and GitHub).
*   **Key Responsibilities:**
    *   **State Management:** Uses `useState` for application-wide state, including `projects` (all loaded projects), `activeProjectName`, `activeFilePath`, `output`, `isLoading`, `error`, `isSandboxed` (for File System Access API), `activeView` (explorer/settings), `settings`, and `modalConfig`.
    *   **Data Persistence:** Uses `useEffect` hooks to load initial projects and settings from `localStorage` and save them on changes.
    *   **File System Access API:** Declares global types for `Window` and `FileSystem*Handle` to enable browser-based local file system interactions (`showDirectoryPicker`, `getFile`, `createWritable`).
    *   **Project and File Operations:** Contains functions for `handleNewProject`, `handleDeleteProject`, `handleOpenFolder` (local file system), `handleImportFromGithub`, and `handleSaveActiveFile`.
    *   **AI Integration:** The `handleRunAI` function is central, calling `geminiService.runAIAssistant` with the appropriate operation and project context, then updating the UI with results or errors. It handles parsing AI responses and conditionally saving changes.
    *   **GitHub Integration:** Implements `handleCommitToGithub` which uses `githubService` to push changes to a remote repository.
    *   **Modal Management:** Manages the display and behavior of a generic `Modal` component for user prompts, confirmations, and alerts.
    *   **UI Layout:** Renders the main structure of the IDE, including the header, activity bar, project/file explorers, action panel, editor, and output display.
*   **Dependencies:** Imports React hooks, various types from `./types`, services from `./services/geminiService` and `./services/githubService`, UI components from `./components`, and file utility from `./utils/fileHelpers`.

### `LICENSE`
*   **Role:** Contains the MIT License, granting permissive rights for use, modification, and distribution of the software. It specifies the conditions under which the software is provided (e.g., "as is", without warranty).

### `README.md`
*   **Role:** Provides basic information about the project, including how to run it locally, prerequisites (Node.js), and setup instructions (installing dependencies, setting Gemini API key, running the dev server).

### `components/ActionPanel.tsx`
*   **Role:** Renders a row of buttons that trigger the primary AI operations (EXPLAIN, REFACTOR, DEBUG, GENERATE) and file actions (SAVE, COMMIT).
*   **Functionality:** Each button calls the `onRunAI`, `onSave`, or `onCommit` prop with the relevant `AIOperation` or action, disabling itself when `isLoading` or specific conditions are met (e.g., no dirty files for save/commit).
*   **Dependencies:** Imports `AIOperation` enum from `../types` and various SVG icon components from `./icons`.

### `components/ActivityBar.tsx`
*   **Role:** Provides navigation between the "Explorer" view (for projects and files) and the "Settings" view.
*   **Functionality:** Displays two buttons, each with an icon. Clicking a button changes the `activeView` state in `App.tsx` (via `onSetActiveView` prop), which then conditionally renders `ProjectExplorer`/`FileExplorer` or `SettingsPanel`.
*   **Dependencies:** Imports `FilesIcon` and `SettingsIcon`.

### `components/Editor.tsx`
*   **Role:** The main code editing area where users can view and modify file content.
*   **Functionality:** A simple `textarea` that displays the `value` prop and calls `onChange` when its content is updated. It's disabled when an AI operation is in progress or no file is active. Includes a placeholder text that adapts to the current state.
*   **Styling:** Custom CSS for scrollbar and cyberpunk glow.

### `components/FileExplorer.tsx`
*   **Role:** Displays the active project's files and directories in a tree-like structure.
*   **Functionality:**
    *   `buildFileTree`: A utility function that takes a flat list of `ProjectFile` objects and converts it into a nested `FsNode` (file system node) structure, grouping files by their directories.
    *   `TreeNode`: A recursive React component used to render each file or folder in the tree. It handles folder expansion/collapse and file selection.
    *   Indicates "dirty" files (those with unsaved changes) with a small colored circle.
    *   Disables interactions when `isLoading`.
*   **Dependencies:** Imports `ProjectFile` from `../types` and various folder/file icons.

### `components/Header.tsx`
*   **Role:** Displays the application's title and a small tagline.
*   **Styling:** Applies cyberpunk-themed text styling with glow effects.

### `components/Icons/*.tsx`
*   **Role:** These files are individual React functional components that render SVG icons (e.g., `BugIcon`, `CodeIcon`, `FilesIcon`, `GithubIcon`, `SaveIcon`, `SettingsIcon`, `TrashIcon`, etc.).
*   **Functionality:** They simply render an SVG element, making it easy to embed consistent icons throughout the application and style them using CSS props like `className`.

### `components/Modal.tsx`
*   **Role:** A generic modal dialog component used for displaying prompts, confirmations, or alerts to the user.
*   **Functionality:**
    *   Takes `isOpen`, `onClose`, `title`, and `children` props.
    *   Renders an overlay that darkens the background and a central dialog box.
    *   Includes a title bar with a close button.
    *   Uses CSS animations for fade-in and slide-in effects.
*   **Dependencies:** Imports `CloseIcon`.

### `components/OutputDisplay.tsx`
*   **Role:** Displays the output from AI operations, loading indicators, and error messages.
*   **Functionality:**
    *   Shows a `LoadingIndicator` with a spinning animation when `isLoading` is true.
    *   Displays `error` messages prominently in red.
    *   Renders the `output` string (typically AI responses in markdown or raw text) in a pre-formatted code block.
*   **Styling:** Includes a custom scrollbar and cyberpunk glow.

### `components/ProjectExplorer.tsx`
*   **Role:** Allows users to manage and switch between different projects.
*   **Functionality:**
    *   Lists all available project names.
    *   Highlights the `activeProjectName`.
    *   Provides buttons for `onNewProject`, `onOpenFolder` (local file system), `onImportFromGithub`, and `onDeleteProject`.
    *   The "Open Folder" button has special logic to prompt the user to open in a new tab if the app is detected to be running in a sandboxed environment (e.g., an iframe), as the File System Access API might be restricted.
    *   Delete button appears on hover for existing projects.
*   **Dependencies:** Imports various folder, link, and GitHub icons.

### `components/SettingsPanel.tsx`
*   **Role:** Provides a UI for users to configure application settings, specifically the theme and GitHub integration.
*   **Functionality:**
    *   **Theme Selection:** Allows choosing between "Cyber Cyan," "Hacker Green," and "Synth Magenta" themes, dynamically updating CSS variables in `index.html`.
    *   **GitHub Token Input:** Enables users to enter and save their GitHub Personal Access Token.
    *   **Token Verification:** Offers a "Verify Token" button that uses `githubService.verifyToken` to check token validity, scope (`repo`), and fetch associated user information (name, email) for commit authorship. Displays status and messages for verification.
*   **Persistence:** Changes are saved via the `onSettingsChange` prop, which updates `App.tsx`'s state and subsequently `localStorage`.
*   **Dependencies:** Imports `EditorSettings`, `AccentTheme` from `../types`, and `verifyToken` from `../services/githubService`.

### `index.html`
*   **Role:** The main HTML file for the single-page application. It's the entry point that the browser loads.
*   **Contents:**
    *   Sets up basic HTML structure, metadata, and a link to `favicon.svg`.
    *   Includes Tailwind CSS via CDN for rapid styling.
    *   Links to Google Fonts for `Fira Code`.
    *   Defines dynamic CSS variables (`--accent-color`, `--accent-glow`, etc.) within a `<style>` block to support theme switching based on `body` class.
    *   Includes CSS for visual effects like `scanlines` and `noise` to achieve the cyberpunk aesthetic.
    *   Sets up an `importmap` for `react`, `react-dom`, and `@google/genai` to allow direct import in the browser without a full build step during development (though Vite typically handles this anyway).
    *   Contains the root `div` (`id="root"`) where the React application is mounted.
    *   Imports the main React application script (`index.tsx`) as a module.

### `index.tsx`
*   **Role:** The TypeScript entry point for the React application.
*   **Functionality:** It imports the main `App` component and renders it into the `root` DOM element using `ReactDOM.createRoot`. Uses `React.StrictMode` for development-time checks.

### `metadata.json`
*   **Role:** This file likely contains metadata about the project, possibly used for deployment on a platform like Google AI Studio.
*   **Contents:** Includes `name`, `description`, `requestFramePermissions` (empty in this case), and a `prompt` (also empty).

### `package.json`
*   **Role:** The standard Node.js manifest file. It defines project metadata, scripts, and dependencies.
*   **Contents:**
    *   `name`, `version`, `private`, `type` (module).
    *   `scripts`: Defines commands for `dev` (start Vite development server), `build` (build for production), and `preview` (serve production build locally).
    *   `dependencies`: Lists runtime dependencies for the application (e.g., `react`, `react-dom`, `@google/genai`).
    *   `devDependencies`: Lists development-only dependencies (e.g., `typescript`, `vite`, `@types/node`).

### `services/geminiService.ts`
*   **Role:** Encapsulates all logic for interacting with the Google Gemini AI API.
*   **Functionality:**
    *   Initializes the `GoogleGenAI` client using an API key from `process.env.API_KEY` (injected by Vite).
    *   `formatProjectForPrompt`: Helper function to convert the `ProjectFile[]` array into a structured string format suitable for AI prompts (e.g., `// FILE: path\ncontent\n// END OF FILE`).
    *   `getOperationConfig`: Dynamically constructs the Gemini API request configuration (model, system instruction, user prompt, response MIME type, and response schema) based on the `AIOperation` (EXPLAIN, REFACTOR, DEBUG, GENERATE). It's crucial for instructing the AI how to behave and format its output (especially for JSON responses).
    *   `runAIAssistant`: The main function to send requests to the Gemini API and return the AI's text response. Includes error handling for API communication.
*   **Dependencies:** Imports `GoogleGenAI` and `Type` from `@google/genai`, and `AIOperation`, `ProjectFile` from `../types`.

### `services/githubService.ts`
*   **Role:** Handles all interactions with the GitHub REST API.
*   **Functionality:**
    *   `b64_to_utf8` and `utf8_to_b64`: Utility functions for robust Base64 encoding/decoding of UTF-8 strings, necessary for handling GitHub API content blobs.
    *   `githubFetch`: A wrapper around `fetch` that adds GitHub authentication headers and handles API error responses.
    *   `isTextFile`: A helper to determine if a file path suggests it's a text-based file that should be fetched and displayed.
    *   `verifyToken`: Checks the validity of a GitHub Personal Access Token, verifies it has the required `repo` scope, and fetches the user's name and primary verified email.
    *   `getRepoContents`: Fetches a GitHub repository's file structure and content (for text files only), returning a list of `ProjectFile` objects and the latest commit SHA and branch.
    *   `commitFiles`: Implements the GitHub API flow for committing changes:
        1.  Gets the base tree SHA from the latest commit.
        2.  Creates new "blob" objects for each changed file content.
        3.  Creates a new "tree" object referencing the blobs.
        4.  Creates a new "commit" object referencing the new tree and the parent commit.
        5.  Updates the branch reference to point to the new commit.
*   **Dependencies:** Imports `ProjectFile`, `GithubUser` from `../types`.

### `tsconfig.json`
*   **Role:** TypeScript compiler configuration file. It specifies compiler options for the project, such as target JavaScript version, module resolution, JSX support, and strictness checks.
*   **Key Options:**
    *   `target`: `ES2020` for modern JS features.
    *   `jsx`: `react-jsx` for React 17+ JSX transform.
    *   `moduleResolution`: `bundler` for compatibility with Vite.
    *   `noEmit`: Prevents TypeScript from emitting JavaScript files, as Vite handles the transpilation.
    *   `strict`: Enables all strict type-checking options.
    *   `paths`: Configures path aliases (e.g., `@/*` maps to the project root `.` ).

### `types.ts`
*   **Role:** Defines TypeScript interfaces and enums used across the application. This file centralizes type definitions for consistency and type safety.
*   **Contents:**
    *   `AIOperation` enum: Lists the different AI functions (EXPLAIN, REFACTOR, DEBUG, GENERATE).
    *   `ProjectFile` interface: Describes a single file within a project, including its `path`, `content`, and `isDirty` status.
    *   `Projects` type: A dictionary mapping project names to arrays of `ProjectFile`s.
    *   `AccentTheme` type: Union type for available color themes.
    *   `GithubUser` interface: Defines shape for GitHub user info (name, email) for commit authorship.
    *   `EditorSettings` interface: Stores user-configurable settings like theme and GitHub token/user.
    *   `ProjectSourceInfo` union type: Describes where a project originates from (local file system, GitHub, or in-memory). This is crucial for determining how to save changes.

### `vite.config.ts`
*   **Role:** Configuration file for Vite, the build tool.
*   **Functionality:**
    *   `define`: Injects environment variables (specifically `GEMINI_API_KEY`) from the `.env.local` file (loaded using `loadEnv`) into the client-side bundle. This makes `process.env.API_KEY` available in client-side code.
    *   `resolve.alias`: Configures path aliases, allowing imports like `@/components/Header` instead of relative paths.

### `utils/fileHelpers.ts`
*   **Role:** Provides utility functions related to file handling.
*   **Functionality:**
    *   `isPathTextFile`: Determines if a given file `path` and `fileType` (MIME type) are likely to contain human-readable text content. This is used when importing files from the local file system or GitHub to avoid processing binary files. It has a comprehensive list of common text file extensions and checks MIME types.

---

## 🚀 Deployment

CyberEditor AI is a client-side application that can be deployed to any static hosting service.

### Deploy to Vercel

1. Fork this repository
2. Connect your GitHub account to [Vercel](https://vercel.com)
3. Import your forked repository
4. Add your `GEMINI_API_KEY` as an environment variable
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FGizzZmo%2FCyberEditor-AI_)

### Deploy to Netlify

1. Fork this repository
2. Connect your GitHub account to [Netlify](https://netlify.com)
3. Choose your forked repository
4. Set build command to `npm run build` and publish directory to `dist`
5. Add `GEMINI_API_KEY` to environment variables
6. Deploy!

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains all static files
# Upload the contents to your hosting service
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines below.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/CyberEditor-AI_.git`
3. Create a branch: `git checkout -b feature/amazing-feature`
4. Install dependencies: `npm install`
5. Set up your `.env.local` file with your Gemini API key
6. Start development: `npm run dev`

### Code Quality

- Run type checking: `npm run type-check`
- Build the project: `npm run build`
- Follow existing code style and patterns
- Test your changes thoroughly

### Submitting Changes

1. Commit your changes: `git commit -m 'Add amazing feature'`
2. Push to your branch: `git push origin feature/amazing-feature`
3. Open a Pull Request

### Reporting Issues

If you find a bug or have a feature request, please open an issue with:
- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Powered by [Google Gemini AI](https://deepmind.google/technologies/gemini/)
- Bundled with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

**Happy Coding! 🎉**
