
import React from 'react';
import { CloseIcon } from './icons/CloseIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const Modal: React.FC<React.PropsWithChildren<ModalProps>> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in-fast"
      onClick={onClose}
    >
      <div 
        className="bg-[#0d0221] border-2 border-[var(--accent-color)] rounded-lg p-6 cyber-glow w-full max-w-lg m-4 flex flex-col gap-4 animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-[var(--accent-color)]/20 pb-3">
          <h2 className="text-xl font-bold text-[var(--accent-color)] tracking-widest">{`// ${title}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="pt-2">{children}</div>
      </div>
      <style>{`
        @keyframes fade-in-fast {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-fast {
          animation: fade-in-fast 0.2s ease-out forwards;
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
