import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ModalConfig } from '../types';

interface ModalControllerProps {
    modalConfig: ModalConfig | null;
    closeModal: () => void;
}

const ModalController: React.FC<ModalControllerProps> = ({ modalConfig, closeModal }) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (modalConfig) setInputValue(modalConfig.defaultValue || '');
    }, [modalConfig]);

    if (!modalConfig) return null;

    const { type, message, inputLabel, onConfirm, onCancel } = modalConfig;

    const handleConfirm = () => onConfirm(inputValue);
    const handleCancel = () => { if (onCancel) onCancel(); else closeModal(); };
    const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
        if (e.key === 'Escape') { handleCancel(); }
    };
    
    return (
        <div className="flex flex-col gap-4">
            <div className="text-gray-200">{message}</div>
            {type === 'prompt' && (
                <div className="flex flex-col gap-2">
                    {inputLabel && <label htmlFor="modal-input" className="text-sm text-[var(--accent-color-secondary)]">{inputLabel}</label>}
                    <input
                        id="modal-input" type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeydown} autoFocus
                        className="w-full bg-black/50 border border-white/20 rounded-md p-2 text-white focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    />
                </div>
            )}
            <div className="flex gap-4 justify-end pt-4">
                {(type === 'prompt' || type === 'confirm') && (
                    <button onClick={handleCancel} className="p-2 px-4 bg-black/30 border border-gray-500 rounded-md text-gray-300 hover:bg-gray-500/20 hover:text-white transition-colors">
                        Cancel
                    </button>
                )}
                <button onClick={handleConfirm} className="p-2 px-6 bg-black/30 border border-[var(--accent-color-secondary)] rounded-md text-[var(--accent-color-secondary)] hover:bg-[var(--accent-color-secondary)]/20 hover:text-white transition-colors">
                    {type === 'alert' ? 'OK' : 'Confirm'}
                </button>
            </div>
        </div>
    );
};

export default ModalController;
