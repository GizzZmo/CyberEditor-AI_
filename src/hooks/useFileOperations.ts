/**
 * File operations hook with optimizations and validation
 */

import { useCallback, useMemo } from 'react';
import { ProjectFile } from '../../types';
import { saveFileToDisk } from '../../utils/fileHelpers';
import { validateFilePath, validateFileContent } from '../utils/validation';
import { ErrorHandler } from '../utils/errorHandling';
import { FILE_SYSTEM } from '../config/constants';

export function useFileOperations() {
    /**
     * Validate file before operations
     */
    const validateFile = useCallback((path: string, content: string) => {
        const pathValidation = validateFilePath(path);
        if (!pathValidation.valid) {
            throw ErrorHandler.validation(`Invalid file path: ${pathValidation.error}`);
        }

        const contentValidation = validateFileContent(content);
        if (!contentValidation.valid) {
            throw ErrorHandler.validation(`Invalid file content: ${contentValidation.error}`);
        }
    }, []);

    /**
     * Check if file is a text file based on extension
     */
    const isTextFile = useCallback((path: string): boolean => {
        const extension = path.toLowerCase().substring(path.lastIndexOf('.'));
        return FILE_SYSTEM.SUPPORTED_TEXT_EXTENSIONS.includes(extension);
    }, []);

    /**
     * Get file extension
     */
    const getFileExtension = useCallback((path: string): string => {
        const lastDotIndex = path.lastIndexOf('.');
        return lastDotIndex > 0 ? path.substring(lastDotIndex) : '';
    }, []);

    /**
     * Get file name without extension
     */
    const getFileName = useCallback((path: string): string => {
        const lastSlashIndex = path.lastIndexOf('/');
        const fileName = lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;
        const lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    }, []);

    /**
     * Get directory path from file path
     */
    const getDirectoryPath = useCallback((path: string): string => {
        const lastSlashIndex = path.lastIndexOf('/');
        return lastSlashIndex >= 0 ? path.substring(0, lastSlashIndex) : '';
    }, []);

    /**
     * Check if file path is valid and safe
     */
    const isSafeFilePath = useCallback((path: string): boolean => {
        // Prevent directory traversal
        if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
            return false;
        }

        // Check for reserved names (Windows)
        const fileName = path.split('/').pop()?.toLowerCase();
        const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
        
        if (fileName && reservedNames.includes(fileName.split('.')[0])) {
            return false;
        }

        return true;
    }, []);

    /**
     * Normalize file path
     */
    const normalizeFilePath = useCallback((path: string): string => {
        return path
            .replace(/\\/g, '/') // Convert backslashes to forward slashes
            .replace(/\/+/g, '/') // Remove duplicate slashes
            .replace(/^\//, '') // Remove leading slash
            .replace(/\/$/, ''); // Remove trailing slash
    }, []);

    /**
     * Generate unique file name if conflict exists
     */
    const generateUniqueFileName = useCallback((
        desiredPath: string,
        existingFiles: ProjectFile[]
    ): string => {
        const existingPaths = new Set(existingFiles.map(f => f.path));
        
        if (!existingPaths.has(desiredPath)) {
            return desiredPath;
        }

        const extension = getFileExtension(desiredPath);
        const baseName = getFileName(desiredPath);
        const directory = getDirectoryPath(desiredPath);
        
        let counter = 1;
        let newPath: string;
        
        do {
            const newFileName = `${baseName}_${counter}${extension}`;
            newPath = directory ? `${directory}/${newFileName}` : newFileName;
            counter++;
        } while (existingPaths.has(newPath) && counter < 1000); // Safety limit

        return newPath;
    }, [getFileExtension, getFileName, getDirectoryPath]);

    /**
     * Save multiple files to disk with progress tracking
     */
    const saveFilesToDisk = useCallback(async (
        directoryHandle: FileSystemDirectoryHandle,
        files: ProjectFile[],
        onProgress?: (current: number, total: number) => void
    ): Promise<void> => {
        if (!files.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            validateFile(file.path, file.content);
            
            try {
                await saveFileToDisk(directoryHandle, file.path, file.content);
                onProgress?.(i + 1, files.length);
            } catch (error) {
                throw ErrorHandler.handle(error, `Saving file ${file.path}`);
            }
        }
    }, [validateFile]);

    /**
     * Calculate total project size
     */
    const calculateProjectSize = useCallback((files: ProjectFile[]): number => {
        return files.reduce((total, file) => {
            return total + new Blob([file.content]).size;
        }, 0);
    }, []);

    /**
     * Get file size in human readable format
     */
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    /**
     * Group files by directory
     */
    const groupFilesByDirectory = useCallback((files: ProjectFile[]) => {
        const groups: { [directory: string]: ProjectFile[] } = {};
        
        files.forEach(file => {
            const directory = getDirectoryPath(file.path) || 'root';
            if (!groups[directory]) {
                groups[directory] = [];
            }
            groups[directory].push(file);
        });
        
        return groups;
    }, [getDirectoryPath]);

    /**
     * Search files by content or name
     */
    const searchFiles = useCallback((
        files: ProjectFile[],
        query: string,
        searchContent: boolean = true
    ): ProjectFile[] => {
        if (!query.trim()) return files;
        
        const lowercaseQuery = query.toLowerCase();
        
        return files.filter(file => {
            const pathMatch = file.path.toLowerCase().includes(lowercaseQuery);
            const contentMatch = searchContent && file.content.toLowerCase().includes(lowercaseQuery);
            return pathMatch || contentMatch;
        });
    }, []);

    /**
     * Get file statistics
     */
    const getFileStats = useCallback((files: ProjectFile[]) => {
        const stats = {
            totalFiles: files.length,
            totalSize: calculateProjectSize(files),
            dirtyFiles: files.filter(f => f.isDirty).length,
            fileTypes: {} as { [extension: string]: number },
            largestFile: null as ProjectFile | null,
            smallestFile: null as ProjectFile | null,
        };

        let maxSize = 0;
        let minSize = Infinity;

        files.forEach(file => {
            const extension = getFileExtension(file.path) || 'no extension';
            stats.fileTypes[extension] = (stats.fileTypes[extension] || 0) + 1;

            const size = new Blob([file.content]).size;
            if (size > maxSize) {
                maxSize = size;
                stats.largestFile = file;
            }
            if (size < minSize) {
                minSize = size;
                stats.smallestFile = file;
            }
        });

        return stats;
    }, [calculateProjectSize, getFileExtension]);

    return {
        // Validation
        validateFile,
        isTextFile,
        isSafeFilePath,
        
        // Path operations
        getFileExtension,
        getFileName,
        getDirectoryPath,
        normalizeFilePath,
        generateUniqueFileName,
        
        // File operations
        saveFilesToDisk,
        calculateProjectSize,
        formatFileSize,
        
        // Organization
        groupFilesByDirectory,
        searchFiles,
        getFileStats,
    };
}