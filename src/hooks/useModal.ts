/**
 * Custom hook for modal management
 */

import { useState, useCallback } from 'react';
import { ModalConfig } from '../../types';

export function useModal() {
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

    const closeModal = useCallback(() => setModalConfig(null), []);

    const showAlert = useCallback((title: string, message: React.ReactNode) => {
        setModalConfig({
            type: 'alert',
            title,
            message,
            onConfirm: closeModal,
        });
    }, [closeModal]);

    const showError = useCallback((title: string, message: string) => {
        setModalConfig({
            type: 'alert',
            title,
            message: <span className="text-red-400">{message}</span>,
            onConfirm: closeModal,
        });
    }, [closeModal]);

    const showConfirm = useCallback((
        title: string, 
        message: React.ReactNode,
        onConfirm: () => void,
        onCancel?: () => void
    ) => {
        setModalConfig({
            type: 'confirm',
            title,
            message,
            onConfirm: (value) => {
                onConfirm();
                closeModal();
            },
            onCancel: onCancel || closeModal,
        });
    }, [closeModal]);

    const showPrompt = useCallback((
        title: string,
        message: React.ReactNode,
        onConfirm: (value: string) => void,
        options?: {
            inputLabel?: string;
            defaultValue?: string;
            onCancel?: () => void;
        }
    ) => {
        setModalConfig({
            type: 'prompt',
            title,
            message,
            inputLabel: options?.inputLabel,
            defaultValue: options?.defaultValue,
            onConfirm: (value) => {
                if (value !== undefined) {
                    onConfirm(value);
                }
                closeModal();
            },
            onCancel: options?.onCancel || closeModal,
        });
    }, [closeModal]);

    const showCommitDialog = useCallback((
        onCommit: (message: string) => void,
        onCancel?: () => void
    ) => {
        showPrompt(
            'Commit Changes',
            'Enter a commit message for your changes:',
            onCommit,
            {
                inputLabel: 'Commit Message',
                defaultValue: 'Update files',
                onCancel,
            }
        );
    }, [showPrompt]);

    const showProjectNameDialog = useCallback((
        onConfirm: (name: string) => void,
        onCancel?: () => void,
        title: string = 'Create New Project'
    ) => {
        showPrompt(
            title,
            'Enter a name for the new project:',
            onConfirm,
            {
                inputLabel: 'Project Name',
                onCancel,
            }
        );
    }, [showPrompt]);

    const showFileNameDialog = useCallback((
        onConfirm: (name: string) => void,
        onCancel?: () => void
    ) => {
        showPrompt(
            'Add New File',
            'Enter the file path (e.g., src/component.tsx):',
            onConfirm,
            {
                inputLabel: 'File Path',
                onCancel,
            }
        );
    }, [showPrompt]);

    const showRepositoryDialog = useCallback((
        onConfirm: (url: string) => void,
        onCancel?: () => void
    ) => {
        showPrompt(
            'Import from GitHub',
            'Enter the GitHub repository URL:',
            onConfirm,
            {
                inputLabel: 'Repository URL',
                defaultValue: 'https://github.com/username/repository',
                onCancel,
            }
        );
    }, [showPrompt]);

    return {
        modalConfig,
        closeModal,
        showAlert,
        showError,
        showConfirm,
        showPrompt,
        showCommitDialog,
        showProjectNameDialog,
        showFileNameDialog,
        showRepositoryDialog,
        setModalConfig,
    };
}