import React, { useState } from 'react';
import { StickyNote, ArrowRight, Edit2, Trash2, X, Check, Plus, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const NotesManager = ({ pet, setPets }) => {
    const { t } = useLanguage();
    const [note, setNote] = useState('');
    
    // Düzenleme durumu için state'ler
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // Notlar için rastgele renk seçimi (Görsel zenginlik)
    const getNoteStyle = (id) => {
        const styles = [
            { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-100 dark:border-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-100', icon: 'text-yellow-600' },
            { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-100 dark:border-pink-900/30', text: 'text-pink-800 dark:text-pink-100', icon: 'text-pink-600' },
            { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30', text: 'text-blue-800 dark:text-blue-100', icon: 'text-blue-600' },
            { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-900/30', text: 'text-purple-800 dark:text-purple-100', icon: 'text-purple-600' },
            { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-100 dark:border-green-900/30', text: 'text-green-800 dark:text-green-100', icon: 'text-green-600' },
        ];
        // ID'ye göre tutarlı renk seçimi
        return styles[id % styles.length];
    };

    // Yeni not ekleme
    const addNote = () => {
        if(!note.trim()) return;
        // ID olarak timestamp kullanıyoruz, bu sayede renk seçiminde de kullanabiliriz
        const id = Date.now();
        const newNote = { id: id, text: note, date: new Date().toLocaleDateString() };
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
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-safe-bottom">
            
            {/* 1. Milyar Dolarlık Input Alanı */}
            <div className="relative group z-20">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative flex gap-3 items-center bg-white dark:bg-[#1A1D21] p-3 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                    <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl text-indigo-500 dark:text-indigo-400">
                        <StickyNote size={22} strokeWidth={1.5}/>
                    </div>
                    <input 
                        value={note} 
                        onChange={e=>setNote(e.target.value)} 
                        placeholder={t('note_placeholder')} 
                        className="flex-1 bg-transparent text-sm font-medium border-none outline-none dark:text-white placeholder-gray-400"
                        onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    />
                    <button 
                        onClick={addNote} 
                        disabled={!note.trim()}
                        className="bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        {note.trim() ? <ArrowRight size={20}/> : <Plus size={20}/>}
                    </button>
                </div>
            </div>

            {/* 2. Masonry Tarzı Not Listesi */}
            <div className="columns-2 gap-4 space-y-4">
                {(pet.notes || []).map(n => {
                    const style = getNoteStyle(n.id);
                    return (
                        <div key={n.id} className={`break-inside-avoid p-4 rounded-[1.2rem] border relative group transition-all hover:-translate-y-1 hover:shadow-lg duration-300 ${style.bg} ${style.border}`}>
                            
                            {editingId === n.id ? (
                                // Düzenleme Modu
                                <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                                    <textarea 
                                        value={editText} 
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full bg-white/50 dark:bg-black/20 p-3 rounded-xl text-sm border-none outline-none resize-none font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                                        rows={4}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingId(null)} className="p-2 text-red-500 bg-white/80 dark:bg-black/40 rounded-xl hover:bg-red-50 shadow-sm transition-colors"><X size={16}/></button>
                                        <button onClick={() => saveEdit(n.id)} className="p-2 text-green-600 bg-white/80 dark:bg-black/40 rounded-xl hover:bg-green-50 shadow-sm transition-colors"><Check size={16}/></button>
                                    </div>
                                </div>
                            ) : (
                                // Normal Görünüm
                                <>
                                    <p className={`text-sm font-medium leading-relaxed mb-3 whitespace-pre-wrap ${style.text}`}>{n.text}</p>
                                    
                                    <div className={`flex justify-between items-center pt-3 border-t border-black/5 dark:border-white/5`}>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Calendar size={10} />
                                            <span className="text-[10px] font-bold tracking-wide">{n.date}</span>
                                        </div>
                                        
                                        {/* Aksiyon Butonları */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                            <button 
                                                onClick={() => startEditing(n)} 
                                                className="p-1.5 bg-white/60 dark:bg-black/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white hover:text-indigo-600 shadow-sm backdrop-blur-sm transition-all"
                                            >
                                                <Edit2 size={12}/>
                                            </button>
                                            <button 
                                                onClick={() => deleteNote(n.id)} 
                                                className="p-1.5 bg-white/60 dark:bg-black/20 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-white hover:text-red-500 shadow-sm backdrop-blur-sm transition-all"
                                            >
                                                <Trash2 size={12}/>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 3. Boş Durum (Empty State) */}
            {(!pet.notes || pet.notes.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping opacity-20"></div>
                        <StickyNote size={36} className="text-gray-300 dark:text-gray-600"/>
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-bold text-base mb-1">{t('note_empty_title')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs max-w-[200px] leading-relaxed">{t('note_empty_desc')}</p>
                </div>
            )}
        </div>
    );
};

export default NotesManager;