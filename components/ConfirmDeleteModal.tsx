import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habitName: string;
  message?: string; // Optional custom message
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, habitName, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#202020] rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-[#E0E0E0] dark:border-[#333] p-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-bold text-lg text-[#37352F] dark:text-[#E0E0E0] mb-2">
            {message ? 'Remove Task?' : 'Delete Habit?'}
          </h3>
          <p className="text-sm text-[#787774] dark:text-[#999]">
            {message ? (
                <span>{message}</span>
            ) : (
                <span>
                    Are you sure you want to delete <span className="font-medium text-[#37352F] dark:text-[#E0E0E0]">"{habitName}"</span>?
                    This action cannot be undone and you will lose all progress data.
                </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-md border border-[#E0E0E0] dark:border-[#444] text-[#37352F] dark:text-[#E0E0E0] font-medium hover:bg-[#F0F0F0] dark:hover:bg-[#333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors shadow-sm"
          >
            {message ? 'Remove' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;