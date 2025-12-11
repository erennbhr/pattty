import React from 'react';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DeleteConfirmationModal = ({ pet, onConfirm, onCancel }) => {
    const { t } = useLanguage();
    if (!pet) return null;
    
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onCancel}></div>
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-8 relative z-10 shadow-2xl animate-in zoom-in-95 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                   <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-3 dark:text-white">{t('del_title')}</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">{t('del_desc')}</p>
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">{t('cancel')}</button>
                    <button onClick={onConfirm} className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30">{t('del_yes')}</button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;