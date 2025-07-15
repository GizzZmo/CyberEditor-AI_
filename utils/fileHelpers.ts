export const isTextFileByPath = (path: string): boolean => {
    const textExtensionsAndNames = [
        // Common extensions
        '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss', '.py', '.rb',
        '.java', '.c', '.cpp', '.h', '.cs', '.go', '.php', '.rs', '.swift',
        '.xml', '.yml', '.yaml', '.toml',
        // Files often without extensions or with specific names
        'dockerfile', 'license', 'readme', 'changelog', 'contributing', 'code_of_conduct',
        // Dotfiles and config files
        '.env', '.gitignore', '.gitattributes', '.gitmodules', '.npmrc', '.yarnrc', '.pnpmrc',
        '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc', '.nvmrc', '.tool-versions',
        '.prettierignore', '.npmignore', '.dockerignore', '.gitkeep', '.browserslistrc',
        // Common config file names (with or without extensions handled by generic extension logic)
        'caddyfile', 'makefile', 'jest.config', 'webpack.config', 'tailwind.config', 'vite.config',
        'next.config', 'tsconfig', 'jsconfig', 'vite-env.d.ts', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
    ];

    const lowerPath = path.toLowerCase();
    const pathParts = lowerPath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    return textExtensionsAndNames.some(entry => {
        if (entry.startsWith('.')) {
            // Check for file extensions
            return lowerPath.endsWith(entry);
        } else {
            // Check for exact file names (case-insensitive for comparison)
            return fileName === entry;
        }
    });
};

export const isTextFileByPathAndMime = (path: string, fileType: string): boolean => {
    const lowerPath = path.toLowerCase();

    // Prioritize MIME type if it's a known text type
    if (fileType.startsWith('text/') || 
        fileType === 'application/json' ||
        fileType === 'application/javascript' || 
        fileType === 'application/typescript' ||
        fileType === 'application/xml') {
        return true;
    }

    // Fallback to path-based checking if MIME type is not conclusive or not provided
    return isTextFileByPath(lowerPath);
};
