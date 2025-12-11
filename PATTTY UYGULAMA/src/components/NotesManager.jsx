import React, { useState } from 'react';
import { StickyNote, ArrowRight, Edit2, Trash2, X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const NotesManager = ({ pet, setPets }) => {
    const { t } = useLanguage();
    const [note, setNote] = useState('');
    
    // Düzenleme durumu için state'ler
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // Yeni not ekleme
    const addNote = () => {
        if(!note.trim()) return;
        const newNote = { id: Date.now(), text: note, date: new Date().toLocaleDateString() };
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, notes: [newNote, ...(p.notes || [])] } : p));
        setNote('');
    };

    // Not silme
    const deleteNote = (noteId) => {
        setPets(prev => prev.map(p => p.id === pet.id ? { 
            ...p, 
            notes: p.notes.filter(n => n.id !== noteId) 
        } : p));
    };

    // Düzenleme modunu başlatma
    const startEditing = (n) => {
        setEditingId(n.id);
        setEditText(n.text);
    };

    // Düzenlemeyi kaydetme
    const saveEdit = (noteId) => {
        if (!editText.trim()) return;
        setPets(prev => prev.map(p => p.id === pet.id ? { 
            ...p, 
            notes: p.notes.map(n => n.id === noteId ? { ...n, text: editText } : n) 
        } : p));
        setEditingId(null);
        setEditText('');
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            {/* Yeni Not Ekleme Alanı */}
            <div className="flex gap-2 items-center bg-white dark:bg-neutral-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <div className="p-2 text-gray-400"><StickyNote size={20}/></div>
                <input 
                    value={note} 
                    onChange={e=>setNote(e.target.value)} 
                    placeholder={t('note_placeholder')} 
                    className="flex-1 bg-transparent text-sm border-none outline-none dark:text-white"
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                />
                <button onClick={addNote} className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                    <ArrowRight size={18}/>
                </button>
            </div>

            {/* Not Listesi */}
            <div className="grid grid-cols-2 gap-3">
                {(pet.notes || []).map(n => (
                    <div key={n.id} className="p-4 bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-2xl relative group transition-all hover:shadow-md">
                        
                        {editingId === n.id ? (
                            // Düzenleme Modu Görünümü
                            <div className="flex flex-col gap-2">
                                <textarea 
                                    value={editText} 
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full bg-white dark:bg-black/20 p-2 rounded-lg text-sm border-none outline-none resize-none"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-red-500 bg-white dark:bg-neutral-800 rounded-lg hover:bg-red-50"><X size={14}/></button>
                                    <button onClick={() => saveEdit(n.id)} className="p-1.5 text-green-500 bg-white dark:bg-neutral-800 rounded-lg hover:bg-green-50"><Check size={14}/></button>
                                </div>
                            </div>
                        ) : (
                            // Normal Görünüm
                            <>
                                <p className="text-sm text-gray-800 dark:text-yellow-100 font-medium leading-relaxed min-h-[3rem]">{n.text}</p>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-yellow-200/50 dark:border-yellow-900/50">
                                    <span className="text-[10px] text-yellow-600/60 font-bold">{n.date}</span>
                                    
                                    {/* Aksiyon Butonları (Hover ile görünür) */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => startEditing(n)} 
                                            className="p-1.5 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={12}/>
                                        </button>
                                        <button 
                                            onClick={() => deleteNote(n.id)} 
                                            className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                
                {(!pet.notes || pet.notes.length === 0) && (
                    <div className="col-span-2 text-center text-gray-400 text-sm py-10 flex flex-col items-center gap-2">
                        <StickyNote size={32} className="opacity-20"/> 
                        {t('note_empty')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesManager;