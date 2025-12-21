import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, Plus, DollarSign, ShoppingBag, 
    Stethoscope, Gift, Calendar, TrendingUp, TrendingDown,
    ArrowRight, Filter, ChevronDown, ChevronRight,
    CreditCard, Receipt, Activity, X, AlignLeft, BarChart2, PieChart, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePremium } from '../context/PremiumContext';
import { useApp } from '../context/AppContext'; 
import { generateID } from '../utils/helpers';
import PaywallModal from './PaywallModal';

// --- SABİT RENK PALETİ (iOS Style) ---
const CATEGORY_THEMES = {
    food: { color: '#FF9500', bg: 'bg-[#FF9500]', border: 'border-[#FF9500]', text: 'text-[#FF9500]', bgSoft: 'bg-[#FF9500]/20' }, 
    vet: { color: '#FF3B30', bg: 'bg-[#FF3B30]', border: 'border-[#FF3B30]', text: 'text-[#FF3B30]', bgSoft: 'bg-[#FF3B30]/20' },   
    toy: { color: '#AF52DE', bg: 'bg-[#AF52DE]', border: 'border-[#AF52DE]', text: 'text-[#AF52DE]', bgSoft: 'bg-[#AF52DE]/20' }, 
    groom: { color: '#30B0C7', bg: 'bg-[#30B0C7]', border: 'border-[#30B0C7]', text: 'text-[#30B0C7]', bgSoft: 'bg-[#30B0C7]/20' }, 
    other: { color: '#8E8E93', bg: 'bg-[#8E8E93]', border: 'border-[#8E8E93]', text: 'text-[#8E8E93]', bgSoft: 'bg-[#8E8E93]/20' }  
};

// --- MİKRO BİLEŞEN: ULTRA GLASSY DONUT CHART ---
const DonutChart = ({ data, total, t, currencySymbol, onCategoryClick }) => {
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="relative w-64 h-64 mx-auto my-8 group">
            <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>

            <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full overflow-visible relative z-10">
                <circle cx="0" cy="0" r="0.925" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.15" />
                <circle cx="0" cy="0" r="1.02" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.01" />
                <circle cx="0" cy="0" r="0.83" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.01" />

                {data.map((slice, index) => {
                    if (slice.value === 0) return null;
                    
                    const start = cumulativePercent;
                    const percent = slice.value / total;
                    cumulativePercent += percent;
                    
                    if (percent === 1) {
                        return (
                            <circle 
                                key={index} 
                                cx="0" cy="0" r="0.925" 
                                fill="none" 
                                stroke={slice.color} 
                                strokeWidth="0.15" 
                                strokeLinecap="round"
                                className="cursor-pointer hover:stroke-width-[0.18] transition-all duration-300"
                                onClick={() => onCategoryClick(slice.key)}
                            />
                        );
                    }

                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const r = 0.925;
                    const sx = Math.cos(2 * Math.PI * start) * r;
                    const sy = Math.sin(2 * Math.PI * start) * r;
                    const ex = Math.cos(2 * Math.PI * cumulativePercent) * r;
                    const ey = Math.sin(2 * Math.PI * cumulativePercent) * r;

                    const pathData = [
                        `M ${sx} ${sy}`,
                        `A ${r} ${r} 0 ${largeArcFlag} 1 ${ex} ${ey}`
                    ].join(' ');

                    return (
                        <path 
                            key={index} 
                            d={pathData} 
                            fill="none"
                            stroke={slice.color} 
                            strokeWidth="0.15"
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out hover:stroke-width-[0.18] cursor-pointer opacity-90 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                            onClick={() => onCategoryClick(slice.key)}
                        />
                    );
                })}
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <div className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center shadow-2xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{t('exp_total')}</span>
                    <span className="text-2xl font-black text-white tracking-tight">{total > 0 ? `${currencySymbol}${total.toFixed(0)}` : "0"}</span>
                </div>
            </div>
        </div>
    );
};

// --- MİKRO BİLEŞEN: KARŞILAŞTIRMA BARI ---
const ComparisonBar = ({ label, current, previous, currencySymbol, color, t }) => {
    const maxVal = Math.max(current, previous, 1);
    const wCurrent = (current / maxVal) * 100;
    const wPrev = (previous / maxVal) * 100;
    const diff = current - previous;
    const isUp = diff > 0;

    return (
        <div className="mb-5 group">
            <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{label}</span>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-bold text-white block">{currencySymbol}{current.toFixed(0)}</span>
                        {previous > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 border border-white/5 ${isUp ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                {isUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                                {Math.abs(((diff / previous) * 100)).toFixed(0)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden w-full border border-white/5">
                <div 
                    className="absolute top-0 left-0 h-full bg-white/10 z-0 transition-all duration-700 rounded-full" 
                    style={{ width: `${wPrev}%` }} 
                />
                <div 
                    className="absolute top-0 left-0 h-full rounded-full z-10 transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    style={{ width: `${wCurrent}%`, backgroundColor: color }} 
                />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-gray-500 font-medium">
                <span>{t('exp_prev_month')}: {currencySymbol}{previous.toFixed(0)}</span>
            </div>
        </div>
    );
};

const ExpenseTracker = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { isPremium } = usePremium();
    const { currency } = useApp();
    const { notifyIfEnabled } = useApp(); // Bildirim için
    
    // --- STATE ---
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('pattty_expenses');
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [viewMode, setViewMode] = useState('overview'); 
    
    // Kategori Detay Modal State
    const [selectedCategory, setSelectedCategory] = useState(null);

    const [newExp, setNewExp] = useState({ 
        title: '', 
        amount: '', 
        category: 'food', 
        customCategory: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    // Validasyon State
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        localStorage.setItem('pattty_expenses', JSON.stringify(expenses));
    }, [expenses]);

    // Tarih Hesaplamaları
    const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    const prevDate = new Date(selectedDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Filtrelenmiş Veriler
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(currentMonthKey)).sort((a,b) => new Date(b.date) - new Date(a.date));
    }, [expenses, currentMonthKey]);

    const prevExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(prevMonthKey));
    }, [expenses, prevMonthKey]);

    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const prevTotalAmount = prevExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const getCategoryData = (dataList) => {
        const catMap = {};
        dataList.forEach(e => {
            const cat = e.category;
            if (!catMap[cat]) catMap[cat] = 0;
            catMap[cat] += e.amount;
        });
        return catMap;
    };

    const currentCatData = useMemo(() => getCategoryData(filteredExpenses), [filteredExpenses]);
    const prevCatData = useMemo(() => getCategoryData(prevExpenses), [prevExpenses]);

    const chartData = Object.keys(currentCatData).map(key => ({
        key,
        value: currentCatData[key],
        color: CATEGORY_THEMES[key]?.color || CATEGORY_THEMES.other.color,
        label: t(`exp_cat_${key}`)
    })).sort((a,b) => b.value - a.value);

    // Kategoriye Tıklandığında Açılacak Liste
    const categoryExpenses = useMemo(() => {
        if (!selectedCategory) return [];
        return filteredExpenses.filter(e => e.category === selectedCategory);
    }, [filteredExpenses, selectedCategory]);

    // Fonksiyonlar
    const handleAdd = () => {
        const errors = {};
        
        if (!newExp.amount || parseFloat(newExp.amount) <= 0) {
            errors.amount = true;
        }
        
        if (newExp.category !== 'other' && !newExp.title.trim()) {
            errors.title = true;
        }

        if (newExp.category === 'other' && !newExp.customCategory.trim()) {
            errors.customCategory = true;
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            // Titreşim veya uyarı eklenebilir
            return;
        }
        
        const finalTitle = newExp.category === 'other' && newExp.customCategory 
            ? newExp.customCategory 
            : newExp.title || t(`exp_cat_${newExp.category}`);

        const entry = { 
            id: generateID(), 
            ...newExp, 
            title: finalTitle,
            amount: parseFloat(newExp.amount) 
        };

        setExpenses(prev => [entry, ...prev]);
        setNewExp({ title: '', amount: '', category: 'food', customCategory: '', date: new Date().toISOString().split('T')[0], note: '' });
        setShowForm(false);
        setFormErrors({});
    };

    const changeMonth = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const currencySymbol = (0).toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
    const monthName = selectedDate.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

    // Custom Back Handler
    const handleHeaderBack = () => {
        if (viewMode === 'compare') {
            setViewMode('overview');
        } else {
            onBack();
        }
    };

    return (
        <div className="h-full flex flex-col bg-black animate-in slide-in-from-right duration-300">
            
            {/* Header: Tam Glassmorphism */}
            <div className="px-4 py-3 pt-safe-top bg-white/5 backdrop-blur-xl border-b border-white/5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
                <button onClick={handleHeaderBack} className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-all text-gray-300 active:scale-90 border border-white/5">
                    <ChevronLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{viewMode === 'compare' ? t('exp_comparison_title') : t('exp_header_title')}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:text-white text-gray-500 transition-colors"><ChevronLeft size={16}/></button>
                        <span className="text-sm font-bold text-white min-w-[100px] text-center">{monthName}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:text-white text-gray-500 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
                <button 
                    onClick={() => setViewMode(prev => prev === 'overview' ? 'compare' : 'overview')}
                    className={`p-2.5 rounded-full transition-all active:scale-90 border border-white/5 ${viewMode === 'compare' ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                >
                    {viewMode === 'overview' ? <BarChart2 size={20} /> : <PieChart size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24 custom-scrollbar">
                
                <div className="p-4">
                    <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/10">
                        
                        {!isPremium && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-bounce">
                                    <Lock size={32} className="text-white"/>
                                </div>
                                <h3 className="font-bold text-xl text-white mb-2">{t('exp_premium_chart_title')}</h3>
                                <p className="text-xs text-gray-400 mb-6 max-w-[200px]">{t('exp_premium_desc')}</p>
                                <button 
                                    onClick={() => setShowPaywall(true)} 
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform"
                                >
                                    {t('acc_btn_upgrade')}
                                </button>
                            </div>
                        )}

                        {/* --- VIEW MODE: OVERVIEW (DONUT) --- */}
                        {viewMode === 'overview' && (
                            <div className={`transition-all duration-500 ${!isPremium ? 'opacity-20 blur-sm' : ''}`}>
                                {totalAmount > 0 ? (
                                    <>
                                        <DonutChart 
                                            data={chartData} 
                                            total={totalAmount} 
                                            t={t} 
                                            currencySymbol={currencySymbol} 
                                            onCategoryClick={setSelectedCategory} 
                                        />
                                        
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            {chartData.map((cat, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => setSelectedCategory(cat.key)}
                                                    className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{backgroundColor: cat.color, color: cat.color}}/>
                                                        <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">{cat.label}</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-white tabular-nums">{currencySymbol}{cat.value.toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-3 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                                        <div className="p-4 bg-white/5 rounded-full border border-white/5">
                                            <Receipt size={32} className="opacity-50"/>
                                        </div>
                                        <span className="text-sm font-medium">{t('exp_no_data')}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- COMPARE MODE --- */}
                        {viewMode === 'compare' && (
                            <div className={`transition-all duration-500 ${!isPremium ? 'opacity-20 blur-sm' : ''}`}>
                                <div className="space-y-2">
                                    <ComparisonBar 
                                        label={t('exp_total_spend')}
                                        current={totalAmount}
                                        previous={prevTotalAmount}
                                        currencySymbol={currencySymbol}
                                        color="#6366f1"
                                        t={t}
                                    />
                                    <div className="h-px bg-white/10 my-6" />
                                    {['food', 'vet', 'toy', 'groom', 'other'].map(catKey => {
                                        const currentVal = currentCatData[catKey] || 0;
                                        const prevVal = prevCatData[catKey] || 0;
                                        if (currentVal === 0 && prevVal === 0) return null;

                                        return (
                                            <ComparisonBar 
                                                key={catKey}
                                                label={t(`exp_cat_${catKey}`)}
                                                current={currentVal}
                                                previous={prevVal}
                                                currencySymbol={currencySymbol}
                                                color={CATEGORY_THEMES[catKey].color}
                                                t={t}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- HARCAMA LİSTESİ --- */}
                {viewMode === 'overview' && (
                    <div className="px-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h3 className="font-bold text-white text-lg">{t('exp_recent_activity')}</h3>
                        </div>

                        <div className="space-y-3">
                            {filteredExpenses.map((exp) => {
                                const icons = { food: ShoppingBag, vet: Stethoscope, toy: Gift, groom: Activity, other: CreditCard };
                                const Icon = icons[exp.category] || CreditCard;
                                const theme = CATEGORY_THEMES[exp.category] || CATEGORY_THEMES.other;
                                const isExpanded = expandedId === exp.id;

                                return (
                                    <div 
                                        key={exp.id} 
                                        onClick={() => toggleExpand(exp.id)}
                                        className={`group flex flex-col p-4 rounded-[1.5rem] border transition-all cursor-pointer backdrop-blur-lg
                                            ${isExpanded 
                                                ? `bg-white/10 border-[${theme.color}] shadow-[0_0_20px_rgba(0,0,0,0.5)]` 
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 active:scale-[0.99]'}`}
                                        style={isExpanded ? { borderColor: theme.color } : {}}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 ${theme.bgSoft}`}>
                                                    <Icon size={20} style={{ color: theme.color }} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-white mb-0.5">{exp.title}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <Calendar size={10} /> {exp.date}
                                                        {exp.note && !isExpanded && (
                                                            <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                                                                <AlignLeft size={8}/>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-white tabular-nums block">-{currencySymbol}{exp.amount.toFixed(2)}</span>
                                                {isExpanded ? <ChevronDown size={14} className="text-gray-500 ml-auto mt-1"/> : <ChevronRight size={14} className="text-gray-500 ml-auto mt-1"/>}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-4 pt-3 border-t border-white/5 animate-in slide-in-from-top-2 fade-in">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{t('exp_note_label')}</p>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    {exp.note || <span className="italic text-gray-500 opacity-70">{t('exp_no_note')}</span>}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {filteredExpenses.length === 0 && (
                                <div className="text-center py-10 bg-white/5 rounded-[2rem] border border-dashed border-white/10 backdrop-blur-md">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/5">
                                        <Receipt size={24} className="text-gray-500"/>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">{t('exp_empty_month')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- FLOAT ADD BUTTON (Mor & Glow) --- */}
            {viewMode === 'overview' && (
                <div className="absolute bottom-24 right-6 z-40">
                    <button 
                        onClick={() => setShowForm(true)}
                        className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-110 active:scale-90 transition-all hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.6)]"
                    >
                        <Plus size={28} />
                    </button>
                </div>
            )}

            {/* --- KATEGORİ DETAY MODALI --- */}
            {selectedCategory && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 pt-safe-top flex items-center justify-between border-b border-white/5 bg-white/5">
                        <button 
                            onClick={() => setSelectedCategory(null)} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/5"
                        >
                            <ChevronDown size={20} />
                        </button>
                        <h2 className="font-bold text-lg text-white">{t(`exp_cat_${selectedCategory}`)}</h2>
                        <div className="w-10" />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="space-y-3">
                            {categoryExpenses.map(exp => (
                                <div key={exp.id} className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{exp.title}</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">{exp.date}</p>
                                    </div>
                                    <span className="font-black text-white">-{currencySymbol}{exp.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            {categoryExpenses.length === 0 && (
                                <p className="text-center text-gray-500 mt-10">{t('exp_no_data')}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- ADD EXPENSE MODAL --- */}
            {showForm && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 pt-safe-top flex items-center justify-between border-b border-white/5 bg-white/5">
                        <button 
                            onClick={() => setShowForm(false)} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-500 transition-colors text-white border border-white/5"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="font-bold text-lg text-white">{t('exp_add_title')}</h2>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 px-6 pt-8 overflow-y-auto">
                        <div className="mb-10 text-center">
                            <label className={`text-xs font-bold uppercase tracking-widest mb-2 block transition-colors ${formErrors.amount ? 'text-red-500' : 'text-gray-500'}`}>
                                {formErrors.amount ? t('err_amount_required') : t('exp_amount_label')}
                            </label>
                            <div className="flex items-center justify-center text-6xl font-black text-white relative">
                                <span className="text-4xl text-gray-500 mr-2">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    autoFocus
                                    value={newExp.amount} 
                                    onChange={e => setNewExp({...newExp, amount: Math.max(0, parseFloat(e.target.value) || '')})} 
                                    placeholder="0"
                                    className={`bg-transparent outline-none w-48 text-center placeholder-white/10 transition-colors duration-300 ${formErrors.amount ? 'text-red-400 placeholder-red-400/50' : ''}`}
                                    style={!formErrors.amount ? { color: CATEGORY_THEMES[newExp.category]?.color } : {}}
                                />
                                {formErrors.amount && <AlertCircle size={24} className="text-red-500 absolute -right-8" />}
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">{t('exp_category_label')}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['food', 'vet', 'toy', 'groom', 'other'].map(cat => {
                                    const isActive = newExp.category === cat;
                                    const theme = CATEGORY_THEMES[cat];
                                    
                                    return (
                                        <button 
                                            key={cat}
                                            onClick={() => setNewExp({...newExp, category: cat})}
                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 ${isActive ? 'scale-105 shadow-xl' : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10'}`}
                                            style={isActive ? { 
                                                borderColor: theme.color, 
                                                backgroundColor: `${theme.color}20`, 
                                                color: theme.color,
                                                boxShadow: `0 0 20px ${theme.color}40`
                                            } : {}}
                                        >
                                            {cat === 'food' && <ShoppingBag size={28} />}
                                            {cat === 'vet' && <Stethoscope size={28} />}
                                            {cat === 'toy' && <Gift size={28} />}
                                            {cat === 'groom' && <Activity size={28} />}
                                            {cat === 'other' && <CreditCard size={28} />}
                                            <span className="text-[10px] font-bold uppercase mt-1">{t(`exp_cat_${cat}`)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {newExp.category === 'other' && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${formErrors.customCategory ? 'text-red-500' : 'text-gray-500'}`}>
                                    {t('exp_custom_label')}
                                </label>
                                <input 
                                    type="text" 
                                    value={newExp.customCategory} 
                                    onChange={e => setNewExp({...newExp, customCategory: e.target.value})}
                                    placeholder={t('exp_custom_placeholder')}
                                    className={`w-full p-5 bg-white/5 rounded-2xl text-white font-bold border outline-none focus:border-white/30 transition-colors text-lg ${formErrors.customCategory ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'}`}
                                />
                            </div>
                        )}

                        {newExp.category !== 'other' && (
                            <div className="mb-6">
                                <label className={`text-xs font-bold uppercase tracking-widest mb-2 block ${formErrors.title ? 'text-red-500' : 'text-gray-500'}`}>
                                    {t('exp_title_label')}
                                </label>
                                <input 
                                    type="text" 
                                    value={newExp.title} 
                                    onChange={e => setNewExp({...newExp, title: e.target.value})}
                                    placeholder={t('exp_title_placeholder')}
                                    className={`w-full p-5 bg-white/5 rounded-2xl text-white font-bold border outline-none focus:border-white/30 transition-colors text-lg ${formErrors.title ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'}`}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('exp_date_label')}</label>
                                <input 
                                    type="date" 
                                    value={newExp.date} 
                                    onChange={e => setNewExp({...newExp, date: e.target.value})}
                                    className="w-full p-4 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none h-[58px]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{t('exp_note_label')}</label>
                                <input 
                                    type="text" 
                                    value={newExp.note} 
                                    onChange={e => setNewExp({...newExp, note: e.target.value})}
                                    placeholder={t('exp_note_placeholder')}
                                    className="w-full p-4 bg-white/5 rounded-2xl text-white font-bold border border-white/10 outline-none h-[58px]"
                                />
                            </div>
                        </div>

                        <div className="h-24"></div>
                    </div>

                    <div className="p-6 bg-[#111417] border-t border-white/5 absolute bottom-0 w-full backdrop-blur-xl">
                        <button 
                            onClick={handleAdd}
                            className="w-full py-4 text-black rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: CATEGORY_THEMES[newExp.category].color }}
                        >
                            {t('exp_add_confirm')} <ArrowRight size={24} />
                        </button>
                    </div>
                </div>
            )}

            {showPaywall && <PaywallModal feature="expense_charts" onClose={() => setShowPaywall(false)} />}
        </div>
    );
};

export default ExpenseTracker;