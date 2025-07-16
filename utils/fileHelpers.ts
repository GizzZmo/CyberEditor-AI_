export const isTextFileByPath = (path: string): boolean => {
    const textExtensionsAndNames = [
        '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.html', '.css', '.scss', '.py', '.rb',
        '.java', '.c', '.cpp', '.h', '.cs', '.go', '.php', '.rs', '.swift',
        '.xml', '.yml', '.yaml', '.toml',
        'dockerfile', 'license', 'readme', 'changelog', 'contributing', 'code_of_conduct',
        '.env', '.gitignore', '.gitattributes', '.gitmodules', '.npmrc', '.yarnrc', '.pnpmrc',
        '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc', '.nvmrc', '.tool-versions',
        '.prettierignore', '.npmignore', '.dockerignore', '.gitkeep', '.browserslistrc',
        'caddyfile', 'makefile', 'jest.config', 'webpack.config', 'tailwind.config', 'vite.config',
        'next.config', 'tsconfig', 'jsconfig', 'vite-env.d.ts', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
    ];

    const lowerPath = path.toLowerCase();
    const pathParts = lowerPath.split('/');
    const fileName = pathParts[pathParts.length - 1];

    return textExtensionsAndNames.some(entry => {
        if (entry.startsWith('.')) {
            return lowerPath.endsWith(entry);
        } else {
            return fileName === entry;
        }
    });
};

export const isTextFileByPathAndMime = (path: string, fileType: string): boolean => {
    const lowerPath = path.toLowerCase();

    if (fileType.startsWith('text/') || 
        fileType === 'application/json' ||
        fileType === 'application/javascript' || 
        fileType === 'application/typescript' ||
        fileType === 'application/xml') {
        return true;
    }

    return isTextFileByPath(lowerPath);
};

export const saveFileToDisk = async (dirHandle: FileSystemDirectoryHandle, path: string, content: string): Promise<void> => {
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
