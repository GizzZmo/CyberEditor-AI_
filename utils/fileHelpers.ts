export const isPathTextFile = (path: string, fileType: string): boolean => {
    const textExtensions = [
        // Source code and config files often treated as text
        '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss', '.py', '.rb',
        '.java', '.c', '.cpp', '.h', '.cs', '.go', '.php', '.rs', '.swift',
        '.xml', '.yml', '.yaml', '.toml', // Markup/config files
        // Files often without extensions but are text
        'dockerfile', 'license', 'readme', 'changelog', 'contributing', 'code_of_conduct',
        '.env', '.gitignore', '.gitattributes', '.gitmodules', '.npmrc', '.yarnrc', '.pnpmrc',
        '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc', '.nvmrc', '.tool-versions',
        '.prettierignore', '.npmignore', '.dockerignore', '.gitkeep', '.browserslistrc',
        'caddyfile', 'makefile', 'jest.config', 'webpack.config', 'tailwind.config', 'vite.config',
        'next.config', 'tsconfig', 'jsconfig', 'vite-env.d.ts'
    ];

    const lowerPath = path.toLowerCase();

    // Prioritize MIME type if it's a known text type
    if (fileType.startsWith('text/') || 
        fileType === 'application/json' ||
        fileType === 'application/javascript' || 
        fileType === 'application/typescript' ||
        fileType === 'application/xml') {
        return true;
    }

    // Otherwise, check against a comprehensive list of text file names/extensions
    return textExtensions.some(ext => {
        // For extensions, check if path ends with it
        if (ext.startsWith('.')) {
            return lowerPath.endsWith(ext);
        }
        // For file names without extensions, check if full name matches
        const pathParts = lowerPath.split('/');
        const fileName = pathParts[pathParts.length - 1];
        return fileName === ext;
    });
};
