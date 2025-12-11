import React, { useState } from 'react';
import { Activity, RefreshCw, Calendar, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';

const WeightChart = ({ pet, setPets }) => {
    const { t } = useLanguage();
    const showNotification = useNotification();
    const [kg, setKg] = useState('');
    const [gr, setGr] = useState('');
    const [unit, setUnit] = useState('kg');
    const weights = pet.weights || [];
    
    const addWeight = () => {
        const kgVal = parseFloat(kg || 0);
        const grVal = parseFloat(gr || 0);
        if (kgVal < 0 || grVal < 0) { showNotification(t('err_neg_val'), 'error'); return; }
        
        const totalKg = kgVal + (grVal / 1000);
        if (totalKg <= 0) return;
        
        const today = new Date().toISOString().split('T')[0];
        if (weights.some(w => w.date === today)) { showNotification(t('weight_exists_error'), 'error'); return; }
        
        const finalWeight = unit === 'kg' ? totalKg : totalKg * 0.453592;
        const entry = { date: today, weight: parseFloat(finalWeight.toFixed(3)) };
        
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: [...(p.weights || []), entry], weight: entry.weight } : p));
        setKg(''); setGr('');
    };

    const deleteWeight = (index) => {
        const newWeights = [...weights];
        newWeights.splice(index, 1);
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: newWeights, weight: newWeights.length > 0 ? newWeights[newWeights.length-1].weight : p.weight } : p));
    }

    const displayWeights = weights.map(w => ({ ...w, val: unit === 'kg' ? w.weight : w.weight * 2.20462 }));
    const maxW = Math.max(...displayWeights.map(w => w.val), 10) + 1;
    const minW = Math.min(...displayWeights.map(w => w.val), 0);
    // Basit SVG Path oluşturma
    const points = displayWeights.map((w, i) => `${(i / (displayWeights.length - 1 || 1)) * 300},${100 - ((w.val - minW) / (maxW - minW)) * 100}`).join(' ');

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Activity size={18}/> {t('weight_title')}</h3>
                <button onClick={()=>setUnit(unit==='kg'?'lbs':'kg')} className="text-xs font-bold bg-gray-100 dark:bg-neutral-800 dark:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-gray-200 transition-colors">
                    <RefreshCw size={12} /> {unit.toUpperCase()}
                </button>
            </div>
     
            {/* Grafik Alanı */}
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
        
            {/* Veri Girişi */}
            <div className="flex gap-2 items-center">
                <div className="flex-1 flex gap-2">
                    <input type="number" min="0" placeholder="Kg" value={kg} onChange={e=>setKg(e.target.value)} className="w-full p-3 rounded-xl border-none bg-gray-100 dark:bg-neutral-800 text-center dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                    <span className="self-center font-bold text-gray-400">.</span>
                    <input type="number" min="0" placeholder="Gr" value={gr} onChange={e=>setGr(e.target.value)} className="w-full p-3 rounded-xl border-none bg-gray-100 dark:bg-neutral-800 text-center dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"/>
                </div>
                <button onClick={addWeight} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold flex-shrink-0 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"><Plus size={20}/></button>
            </div>

            {/* Geçmiş Kayıtlar */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {displayWeights.slice().reverse().map((w, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-50 dark:border-neutral-700 shadow-sm">
                        <span className="text-gray-500 font-medium flex items-center gap-2"><Calendar size={12}/> {w.date}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-bold dark:text-white text-sm bg-gray-50 dark:bg-neutral-700 px-2 py-1 rounded">{w.val.toFixed(2)} {unit}</span>
                            <button onClick={()=>deleteWeight(displayWeights.length - 1 - i)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WeightChart;