import React, { useState, useMemo, useEffect } from 'react';
import { ProjectFile } from '../types';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  isLoading: boolean;
  hasActiveProject: boolean;
  dirtyFilePaths: Set<string>;
}

interface FsNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FsNode[];
}

const buildFileTree = (files: ProjectFile[]): FsNode[] => {
    const root: FsNode = { name: 'root', path: '', type: 'directory', children: [] };

    for (const file of files) {
        const pathParts = file.path.split('/');
        let parentNode = root;

        // Ensure parent directories exist
        for (let i = 0; i < pathParts.length - 1; i++) {
            const dirName = pathParts[i];
            let dirNode = parentNode.children!.find(n => n.name === dirName && n.type === 'directory');

            if (!dirNode) {
                const dirPath = pathParts.slice(0, i + 1).join('/');
                dirNode = {
                    name: dirName,
                    path: dirPath,
                    type: 'directory',
                    children: []
                };
                parentNode.children!.push(dirNode);
            }
            parentNode = dirNode;
        }

        // Add the file node
        const fileName = pathParts[pathParts.length - 1];
        if (!parentNode.children!.some(n => n.path === file.path)) {
            parentNode.children!.push({
                name: fileName,
                path: file.path,
                type: 'file'
            });
        }
    }

    const sortNodes = (nodes: FsNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === 'directory' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'directory') return 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(node => {
            if (node.children) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(root.children!);
    return root.children!;
};

const TreeNode: React.FC<{
  node: FsNode;
  onSelectFile: (path: string) => void;
  activeFilePath: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  isLoading: boolean;
  depth: number;
  dirtyFilePaths: Set<string>;
}> = ({ node, onSelectFile, activeFilePath, expandedFolders, onToggleFolder, isLoading, depth, dirtyFilePaths }) => {
  const isExpanded = expandedFolders.has(node.path);
  const indentStyle = { paddingLeft: `${depth * 16 + 8}px` };

  if (node.type === 'directory') {
    return (
      <li>
        <button
          onClick={() => onToggleFolder(node.path)}
          disabled={isLoading}
          className="w-full text-left flex items-center gap-2 p-2 rounded-md transition-colors duration-200 text-sm truncate text-gray-300 hover:bg-[var(--accent-color-secondary)]/20 hover:text-white disabled:opacity-60"
          style={indentStyle}
          title={node.path}
        >
          {isExpanded ? <FolderOpenIcon className="w-4 h-4 flex-shrink-0" /> : <FolderIcon className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <ul className="space-y-1">
            {node.children.map(childNode => (
              <TreeNode
                key={childNode.path}
                node={childNode}
                onSelectFile={onSelectFile}
                activeFilePath={activeFilePath}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                isLoading={isLoading}
                depth={depth + 1}
                dirtyFilePaths={dirtyFilePaths}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  const isDirty = dirtyFilePaths.has(node.path);
  return (
    <li>
      <button
        onClick={() => onSelectFile(node.path)}
        disabled={isLoading}
        className={`w-full text-left flex items-center gap-2 p-2 rounded-md transition-colors duration-200 text-sm truncate
          ${activeFilePath === node.path
            ? 'bg-[var(--accent-color)]/30 text-[var(--accent-color)] font-semibold'
            : 'text-gray-300 hover:bg-[var(--accent-color-secondary)]/20 hover:text-white'
          }
          disabled:cursor-not-allowed disabled:opacity-60`}
        style={indentStyle}
        title={node.path}
      >
        <FileIcon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate flex-grow">{node.name}</span>
        {isDirty && <div className="w-2 h-2 rounded-full bg-[var(--accent-color)] shadow-[0_0_6px_var(--accent-glow)] flex-shrink-0 mr-2" title="Unsaved changes"></div>}
      </button>
    </li>
  );
};


const FileExplorer: React.FC<FileExplorerProps> = ({ files, activeFilePath, onSelectFile, isLoading, hasActiveProject, dirtyFilePaths }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    const topLevelDirs = fileTree
        .filter(node => node.type === 'directory')
        .map(node => node.path);
    setExpandedFolders(new Set(topLevelDirs));
  }, [fileTree]);

  const handleToggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };
  
  return (
    <div className="h-full bg-black/30 border-2 border-[var(--accent-color-secondary)] rounded-lg p-3 flex flex-col cyber-glow-secondary">
      <h2 className="text-[var(--accent-color-secondary)] text-sm font-bold tracking-widest mb-3 px-1">// FILE_EXPLORER</h2>
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        {!hasActiveProject && (
           <div className="text-gray-500 text-center px-2 py-4 h-full flex items-center justify-center">
             <p>Select a project to see its files.</p>
           </div>
        )}
        {hasActiveProject && fileTree.length === 0 && !isLoading && (
          <div className="text-gray-500 text-center px-2 py-4">
            <p>This project is empty.</p>
            <p className="text-xs mt-2">Use the "GENERATE" action to create files.</p>
          </div>
        )}
        {hasActiveProject && fileTree.length > 0 && (
            <ul className="space-y-1">
            {fileTree.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                onSelectFile={onSelectFile}
                activeFilePath={activeFilePath}
                expandedFolders={expandedFolders}
                onToggleFolder={handleToggleFolder}
                isLoading={isLoading}
                depth={0}
                dirtyFilePaths={dirtyFilePaths}
              />
            ))}
            </ul>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;