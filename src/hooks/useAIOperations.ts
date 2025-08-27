/**
 * Custom hook for AI operations with error handling and rate limiting
 */

import { useState, useCallback } from 'react';
import { AIOperation, ProjectFile } from '../../types';
import { runAIAssistant } from '../../services/geminiService';
import { ErrorHandler, AppError } from '../utils/errorHandling';
import { validateProjectName, validateFileContent } from '../utils/validation';

export function useAIOperations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState('');

    const clearError = useCallback(() => setError(null), []);
    const clearOutput = useCallback(() => setOutput(''), []);

    const handleError = useCallback((error: unknown, context?: string) => {
        const appError = ErrorHandler.handle(error, context);
        ErrorHandler.log(appError);
        setError(appError.getUserMessage());
        return appError;
    }, []);

    const executeAIOperation = useCallback(async (
        operation: AIOperation,
        files: ProjectFile[],
        userRequest: string,
        projectName?: string
    ): Promise<string> => {
        // Input validation
        if (!userRequest.trim()) {
            throw ErrorHandler.validation('Request cannot be empty');
        }

        if (operation !== AIOperation.GENERATE && files.length === 0) {
            throw ErrorHandler.validation('No files to process');
        }

        // Validate file contents for size limits
        for (const file of files) {
            const validation = validateFileContent(file.content);
            if (!validation.valid) {
                throw ErrorHandler.validation(`File ${file.path}: ${validation.error}`);
            }
        }

        // Validate project name for generation
        if (operation === AIOperation.GENERATE && projectName) {
            const validation = validateProjectName(projectName);
            if (!validation.valid) {
                throw ErrorHandler.validation(validation.error || 'Invalid project name');
            }
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const result = await runAIAssistant(operation, files, userRequest);
            return result;
        } catch (error) {
            throw handleError(error, `AI Operation: ${operation}`);
        } finally {
            setIsLoading(false);
        }
    }, [handleError]);

    const runExplain = useCallback(async (files: ProjectFile[]): Promise<string> => {
        setOutput('> Analyzing project and generating explanation...');
        
        try {
            const result = await executeAIOperation(
                AIOperation.EXPLAIN,
                files,
                'Explain this project structure and functionality'
            );
            setOutput(result);
            return result;
        } catch (error) {
            setOutput('');
            throw error;
        }
    }, [executeAIOperation]);

    const runRefactor = useCallback(async (
        files: ProjectFile[],
        userRequest: string
    ): Promise<{ summary: string; files: ProjectFile[] }> => {
        setOutput('> Analyzing code and applying refactoring...');
        
        try {
            const result = await executeAIOperation(
                AIOperation.REFACTOR,
                files,
                userRequest
            );
            
            const parsed = JSON.parse(result);
            
            if (!parsed.files || !Array.isArray(parsed.files)) {
                throw ErrorHandler.validation('Invalid refactor response format');
            }
            
            const summary = parsed.summary || 'Refactoring completed';
            const changedFiles = parsed.files as ProjectFile[];
            
            setOutput(`> Refactoring completed.\n\n${summary}`);
            return { summary, files: changedFiles };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw ErrorHandler.aiService('Failed to parse AI response as JSON');
            }
            setOutput('');
            throw error;
        }
    }, [executeAIOperation]);

    const runDebug = useCallback(async (
        files: ProjectFile[],
        userRequest: string
    ): Promise<{ diagnosis: string; files: ProjectFile[] }> => {
        setOutput('> Analyzing code for bugs and issues...');
        
        try {
            const result = await executeAIOperation(
                AIOperation.DEBUG,
                files,
                userRequest
            );
            
            const parsed = JSON.parse(result);
            
            if (!parsed.files || !Array.isArray(parsed.files)) {
                throw ErrorHandler.validation('Invalid debug response format');
            }
            
            const diagnosis = parsed.diagnosis || 'Debugging completed';
            const changedFiles = parsed.files as ProjectFile[];
            
            setOutput(`> Debugging completed.\n\n${diagnosis}`);
            return { diagnosis, files: changedFiles };
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw ErrorHandler.aiService('Failed to parse AI response as JSON');
            }
            setOutput('');
            throw error;
        }
    }, [executeAIOperation]);

    const runGenerate = useCallback(async (
        projectName: string,
        userRequest: string
    ): Promise<ProjectFile[]> => {
        setOutput(`> Generating project: ${projectName}...`);
        
        try {
            const result = await executeAIOperation(
                AIOperation.GENERATE,
                [],
                userRequest,
                projectName
            );
            
            let files = JSON.parse(result) as ProjectFile[];
            
            if (!Array.isArray(files)) {
                throw ErrorHandler.validation('Invalid generation response format');
            }
            
            // Ensure all files have required properties
            files = files.map(file => ({
                ...file,
                isDirty: false
            }));
            
            setOutput(`> Project "${projectName}" generated successfully.\n\n${files.length} files created.`);
            return files;
        } catch (error) {
            if (error instanceof SyntaxError) {
                throw ErrorHandler.aiService('Failed to parse AI response as JSON');
            }
            setOutput('');
            throw error;
        }
    }, [executeAIOperation]);

    // Utility function to append to output
    const appendOutput = useCallback((text: string) => {
        setOutput(prev => prev + text);
    }, []);

    const setOutputText = useCallback((text: string) => {
        setOutput(text);
    }, []);

    return {
        // State
        isLoading,
        error,
        output,
        
        // Actions
        clearError,
        clearOutput,
        appendOutput,
        setOutputText,
        
        // AI Operations
        runExplain,
        runRefactor,
        runDebug,
        runGenerate,
        executeAIOperation,
    };
}