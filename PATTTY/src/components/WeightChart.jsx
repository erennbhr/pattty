import React, { useState } from 'react';
import { Activity, Calendar, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';

const WeightChart = ({ pet, setPets }) => {
    const { t } = useLanguage();
    const { weightUnit } = useApp();
    const showNotification = useNotification();
    
    const [valMajor, setValMajor] = useState('');
    const [valMinor, setValMinor] = useState('');
    
    const weights = pet.weights || [];
    
    const addWeight = () => {
        const major = parseFloat(valMajor || 0);
        const minor = parseFloat(valMinor || 0);
        
        if (major < 0 || minor < 0) { 
            showNotification(t('err_neg_val'), 'error'); 
            return; 
        }
        
        let finalKg = 0;
        if (weightUnit === 'kg') {
            finalKg = major + (minor / 1000);
        } else {
            const totalLbs = major + (minor / 16);
            finalKg = totalLbs / 2.20462;
        }

        // --- YENİ KONTROLLER ---
        if (finalKg <= 0) {
            showNotification(t('err_weight_zero'), 'error');
            return;
        }

        // Basit bir genel üst sınır (200kg) - Detaylı tür kontrolü için pet.type'a bakılabilir ama burası hızlı giriş.
        // Kullanıcı 200 kg sınırını aşarsa hata verelim.
        if (finalKg > 200) {
             showNotification(t('err_weight_limit').replace('{limit}', '200'), 'error');
             return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        if (weights.some(w => w.date === today)) { 
            showNotification(t('weight_exists_error'), 'error'); 
            return; 
        }
        
        const entry = { date: today, weight: parseFloat(finalKg.toFixed(3)) };
        
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: [...(p.weights || []), entry], weight: entry.weight } : p));
        setValMajor(''); setValMinor('');
    };

    const deleteWeight = (index) => {
        const newWeights = [...weights];
        newWeights.splice(index, 1);
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: newWeights, weight: newWeights.length > 0 ? newWeights[newWeights.length-1].weight : p.weight } : p));
    }

    const displayWeights = weights.map(w => ({ 
        ...w, 
        val: weightUnit === 'kg' ? w.weight : w.weight * 2.20462 
    }));
    
    const vals = displayWeights.map(w => w.val);
    const maxW = vals.length ? Math.max(...vals) + 1 : 10;
    const minW = vals.length ? Math.min(...vals) : 0;
    
    const points = displayWeights.map((w, i) => `${(i / (displayWeights.length - 1 || 1)) * 300},${100 - ((w.val - minW) / (maxW - minW)) * 100}`).join(' ');

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Activity size={18}/> {t('weight_title')}</h3>
                <span className="text-xs font-bold bg-gray-100 dark:bg-neutral-800 dark:text-white px-3 py-1.5 rounded-lg">
                    {weightUnit === 'kg' ? t('lbl_kg') : t('lbl_lbs')}
                </span>
            </div>
     
            <div className="h-40 bg-gradient-to-b from-indigo-50/50 to-white dark:from-neutral-800 dark:to-neutral-900 rounded-2xl p-4 flex items-end relative overflow-hidden border border-indigo-100 dark:border-neutral-800">
                <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <path d={`${points ? `M${points.split(' ')[0]} L${points.replace(/ /g, ' L')} L300,100 L0,100 Z` : ''}`} fill="url(#chartGrad)" />
                    <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    {displayWeights.map((w,i) => {
                         const x = (i / (displayWeights.length - 1 || 1)) * 300; 
                         const y = 100 - ((w.val - minW) / (maxW - minW)) * 100;
                         return <circle key={i} cx={x} cy={y} r="4" fill="#6366f1" className="hover:r-6 transition-all cursor-pointer"/>
                    })}
                </svg>
            </div>
        
            <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <input type="number" min="0" placeholder="0" value={valMajor} onChange={e=>setValMajor(e.target.value)} className="w-full p-3 rounded-xl border-none bg-gray-100 dark:bg-neutral-800 text-center dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                        <span className="absolute right-2 top-3 text-[10px] font-bold text-gray-400 pointer-events-none">{weightUnit==='kg' ? t('lbl_kg') : t('lbl_lbs')}</span>
                    </div>
                    <div className="relative flex-1">
                        <input type="number" min="0" placeholder="0" value={valMinor} onChange={e=>setValMinor(e.target.value)} className="w-full p-3 rounded-xl border-none bg-gray-100 dark:bg-neutral-800 text-center dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                        <span className="absolute right-2 top-3 text-[10px] font-bold text-gray-400 pointer-events-none">{weightUnit==='kg' ? t('lbl_gr') : t('lbl_oz')}</span>
                    </div>
                </div>
                <button onClick={addWeight} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold flex-shrink-0 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"><Plus size={20}/></button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {displayWeights.slice().reverse().map((w, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-50 dark:border-neutral-700 shadow-sm">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Calendar size={12}/> {w.date}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold dark:text-white text-sm bg-gray-50 dark:bg-neutral-700 px-2 py-1 rounded">
                                {w.val.toFixed(2)} {weightUnit === 'kg' ? t('lbl_kg') : t('lbl_lbs')}
                            </span>
                            <button onClick={()=>deleteWeight(displayWeights.length - 1 - i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeightChart;