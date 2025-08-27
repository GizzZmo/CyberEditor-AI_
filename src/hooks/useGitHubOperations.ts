/**
 * GitHub operations hook with error handling and validation
 */

import { useState, useCallback } from 'react';
import { ProjectFile, GithubUser } from '../../types';
import * as githubService from '../../services/githubService';
import { ErrorHandler } from '../utils/errorHandling';
import { validateGitHubUrl, validateGitHubToken } from '../utils/validation';

export function useGitHubOperations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    const handleError = useCallback((error: unknown, context?: string) => {
        const appError = ErrorHandler.handle(error, context);
        ErrorHandler.log(appError);
        setError(appError.getUserMessage());
        return appError;
    }, []);

    /**
     * Verify GitHub token
     */
    const verifyToken = useCallback(async (token: string): Promise<{
        success: boolean;
        message: string;
        user?: GithubUser;
    }> => {
        // Basic validation first
        const validation = validateGitHubToken(token);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.error || 'Invalid token format'
            };
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await githubService.verifyToken(token);
            return result;
        } catch (error) {
            const appError = handleError(error, 'GitHub Token Verification');
            return {
                success: false,
                message: appError.getUserMessage()
            };
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    /**
     * Import repository from GitHub
     */
    const importRepository = useCallback(async (
        repositoryUrl: string,
        token: string
    ): Promise<{
        files: ProjectFile[];
        latestCommitSha: string;
        branch: string;
        owner: string;
        repo: string;
    } | null> => {
        // Validate URL format
        const urlValidation = validateGitHubUrl(repositoryUrl);
        if (!urlValidation.valid) {
            throw ErrorHandler.validation(urlValidation.error || 'Invalid repository URL');
        }

        if (!urlValidation.owner || !urlValidation.repo) {
            throw ErrorHandler.validation('Could not parse repository owner and name');
        }

        // Validate token
        const tokenValidation = validateGitHubToken(token);
        if (!tokenValidation.valid) {
            throw ErrorHandler.validation(tokenValidation.error || 'Invalid token');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await githubService.getRepoContents(
                urlValidation.owner,
                urlValidation.repo,
                token
            );

            return {
                ...result,
                owner: urlValidation.owner,
                repo: urlValidation.repo,
            };
        } catch (error) {
            handleError(error, 'GitHub Repository Import');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    /**
     * Commit files to GitHub repository
     */
    const commitFiles = useCallback(async (
        owner: string,
        repo: string,
        branch: string,
        baseCommitSha: string,
        files: ProjectFile[],
        commitMessage: string,
        token: string,
        author: GithubUser
    ): Promise<string | null> => {
        // Validation
        if (!owner || !repo || !branch || !baseCommitSha) {
            throw ErrorHandler.validation('Repository information is incomplete');
        }

        if (!files || files.length === 0) {
            throw ErrorHandler.validation('No files to commit');
        }

        if (!commitMessage.trim()) {
            throw ErrorHandler.validation('Commit message is required');
        }

        if (!author || !author.name || !author.email) {
            throw ErrorHandler.validation('Author information is required');
        }

        const tokenValidation = validateGitHubToken(token);
        if (!tokenValidation.valid) {
            throw ErrorHandler.validation(tokenValidation.error || 'Invalid token');
        }

        // Filter out files that are too large
        const validFiles = files.filter(file => {
            const size = new Blob([file.content]).size;
            if (size > 1024 * 1024) { // 1MB limit for GitHub
                console.warn(`Skipping file ${file.path} - too large (${Math.round(size / 1024)}KB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            throw ErrorHandler.validation('No valid files to commit (all files may be too large)');
        }

        setIsLoading(true);
        setError(null);

        try {
            const newCommitSha = await githubService.commitFiles(
                owner,
                repo,
                branch,
                baseCommitSha,
                validFiles,
                commitMessage.trim(),
                token,
                author
            );

            return newCommitSha;
        } catch (error) {
            handleError(error, 'GitHub Commit');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    /**
     * Parse GitHub URL to get owner and repo
     */
    const parseRepositoryUrl = useCallback((url: string) => {
        const validation = validateGitHubUrl(url);
        if (!validation.valid) {
            return null;
        }
        return {
            owner: validation.owner!,
            repo: validation.repo!
        };
    }, []);

    /**
     * Check if repository is accessible
     */
    const checkRepositoryAccess = useCallback(async (
        owner: string,
        repo: string,
        token: string
    ): Promise<boolean> => {
        try {
            setIsLoading(true);
            await githubService.getRepoContents(owner, repo, token);
            return true;
        } catch (error) {
            handleError(error, 'Repository Access Check');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    /**
     * Validate commit message
     */
    const validateCommitMessage = useCallback((message: string): {
        valid: boolean;
        error?: string;
    } => {
        if (!message || typeof message !== 'string') {
            return { valid: false, error: 'Commit message is required' };
        }

        const trimmed = message.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: 'Commit message cannot be empty' };
        }

        if (trimmed.length > 72) {
            return { valid: false, error: 'Commit message should be 72 characters or less' };
        }

        return { valid: true };
    }, []);

    /**
     * Generate default commit message based on changes
     */
    const generateCommitMessage = useCallback((files: ProjectFile[]): string => {
        if (files.length === 0) {
            return 'Update files';
        }

        if (files.length === 1) {
            return `Update ${files[0].path}`;
        }

        if (files.length <= 3) {
            return `Update ${files.map(f => f.path).join(', ')}`;
        }

        return `Update ${files.length} files`;
    }, []);

    return {
        // State
        isLoading,
        error,
        
        // Actions
        clearError,
        
        // GitHub operations
        verifyToken,
        importRepository,
        commitFiles,
        parseRepositoryUrl,
        checkRepositoryAccess,
        
        // Utilities
        validateCommitMessage,
        generateCommitMessage,
    };
}