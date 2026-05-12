import React from 'react';
import { Trash2 } from 'lucide-react';

/**
 * ConfirmationModal Component.
 * A professional glassmorphism-style modal for confirming destructive actions.
 */
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-300 text-right" dir="rtl">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                    <Trash2 size={32} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">{title}</h3>
                <p className="text-lg text-gray-500 font-medium mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-500/20"
                    >
                        מחק לצמיתות
                    </button>
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all active:scale-95"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
