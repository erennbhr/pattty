import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChevronLeft, Plus, DollarSign, PieChart, ShoppingBag, 
    Stethoscope, Gift, Lock, Calendar, TrendingUp, 
    ArrowRight, Filter, ChevronDown, ChevronRight,
    CreditCard, Receipt, Activity, X, AlignLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { usePremium } from '../context/PremiumContext';
import { useApp } from '../context/AppContext'; // YENİ: Currency çekmek için
import { generateID } from '../utils/helpers';
import PaywallModal from './PaywallModal';

// --- YARDIMCI: SVG DONUT CHART ---
const DonutChart = ({ data, total }) => {
    let cumulativePercent = 0;
    const { currency } = useApp(); // Para birimi sembolü için

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    // Sembolü al
    const symbol = (0).toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();

    return (
        <div className="relative w-48 h-48 mx-auto my-4">
            <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full overflow-visible">
                {data.map((slice, index) => {
                    const start = cumulativePercent;
                    const percent = slice.value / total;
                    cumulativePercent += percent;
                    
                    const [startX, startY] = getCoordinatesForPercent(start);
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    
                    const pathData = [
                        `M ${startX} ${startY}`,
                        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                        `L 0 0`,
                    ].join(' ');

                    return (
                        <path 
                            key={index} 
                            d={pathData} 
                            fill={slice.color} 
                            stroke="transparent" 
                            strokeWidth="0.02"
                            className="transition-all duration-300 hover:scale-105 origin-center"
                        />
                    );
                })}
                {/* Orta Boşluk (Donut Efekti) */}
                <circle cx="0" cy="0" r="0.75" className="fill-white dark:fill-[#1A1D21]" />
            </svg>
            {/* Ortadaki Toplam */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{total > 0 ? "TOPLAM" : ""}</span>
                <span className="text-xl font-black text-gray-900 dark:text-white">{total > 0 ? `${symbol}${total.toFixed(0)}` : ""}</span>
            </div>
        </div>
    );
};

const ExpenseTracker = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { isPremium } = usePremium();
    const { currency } = useApp(); // YENİ
    
    // --- STATE ---
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('pattty_expenses');
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    
    const [expandedId, setExpandedId] = useState(null);

    const [newExp, setNewExp] = useState({ 
        title: '', 
        amount: '', 
        category: 'food', 
        customCategory: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
    });

    useEffect(() => {
        localStorage.setItem('pattty_expenses', JSON.stringify(expenses));
    }, [expenses]);

    const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
    
    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(currentMonthKey)).sort((a,b) => new Date(b.date) - new Date(a.date));
    }, [expenses, currentMonthKey]);

    const totalAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const categoryData = useMemo(() => {
        const catMap = {};
        filteredExpenses.forEach(e => {
            const cat = e.category;
            if (!catMap[cat]) catMap[cat] = 0;
            catMap[cat] += e.amount;
        });

        const colors = {
            food: '#f97316', 
            vet: '#ef4444', 
            toy: '#a855f7', 
            groom: '#3b82f6', 
            other: '#6b7280' 
        };

        return Object.keys(catMap).map(key => ({
            key,
            value: catMap[key],
            color: colors[key] || colors.other,
            label: t(`exp_cat_${key}`)
        }));
    }, [filteredExpenses, t]);

    const handleAdd = () => {
        if (!newExp.amount || (!newExp.title && newExp.category !== 'other')) return;
        
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
    };

    const changeMonth = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setSelectedDate(newDate);
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    // Para birimine göre formatla
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency }).format(amount);
    };

    // Input sembolü
    const currencySymbol = (0).toLocaleString('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();

    const monthName = selectedDate.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right duration-300">
            
            {/* Üst Bar */}
            <div className="px-4 py-3 pt-safe-top bg-white dark:bg-[#111417] border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 z-30">
                <button onClick={onBack} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full hover:scale-105 transition-all text-gray-600 dark:text-gray-300">
                    <ChevronLeft size={22} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('exp_header_title')}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:text-indigo-500"><ChevronLeft size={16}/></button>
                        <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[100px] text-center">{monthName}</span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:text-indigo-500"><ChevronRight size={16}/></button>
                    </div>
                </div>
                <button className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-full text-gray-600 dark:text-gray-300">
                    <Filter size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
                
                {/* --- ÖZET KARTI --- */}
                <div className="p-4">
                    <div className="relative overflow-hidden bg-white dark:bg-[#1A1D21] rounded-[2rem] p-6 shadow-xl border border-gray-100 dark:border-white/5">
                        
                        {!isPremium && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6">
                                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-bounce">
                                    <Lock size={32} className="text-white"/>
                                </div>
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">{t('exp_premium_chart_title')}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-[200px]">{t('exp_premium_desc')}</p>
                                <button 
                                    onClick={() => setShowPaywall(true)} 
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform"
                                >
                                    {t('acc_btn_upgrade')}
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{t('exp_total_spend')}</p>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(totalAmount)}</h2>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                <TrendingUp size={14}/> %12
                            </div>
                        </div>

                        {/* Grafik Alanı */}
                        <div className={`transition-all duration-500 ${!isPremium ? 'opacity-20 blur-sm' : ''}`}>
                            {totalAmount > 0 ? (
                                <DonutChart data={categoryData} total={totalAmount} />
                            ) : (
                                <div className="h-48 flex items-center justify-center text-gray-400 text-xs italic">{t('exp_no_data')}</div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                {categoryData.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}/>
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{cat.label}</span>
                                        </div>
                                        <span className="text-xs font-bold">{formatCurrency(cat.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- LİSTE --- */}
                <div className="px-4">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('exp_recent_activity')}</h3>
                        <button className="text-indigo-500 text-xs font-bold hover:underline">{t('exp_view_all')}</button>
                    </div>

                    <div className="space-y-3">
                        {filteredExpenses.map((exp) => {
                            const icons = {
                                food: ShoppingBag,
                                vet: Stethoscope,
                                toy: Gift,
                                groom: Activity,
                                other: CreditCard
                            };
                            const Icon = icons[exp.category] || CreditCard;
                            const colors = {
                                food: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20',
                                vet: 'bg-red-100 text-red-600 dark:bg-red-900/20',
                                toy: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
                                groom: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
                                other: 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                            };
                            
                            const isExpanded = expandedId === exp.id;

                            return (
                                <div 
                                    key={exp.id} 
                                    onClick={() => toggleExpand(exp.id)}
                                    className={`group flex flex-col p-4 bg-white dark:bg-[#1A1D21] rounded-2xl border transition-all cursor-pointer ${isExpanded ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-gray-100 dark:border-white/5 shadow-sm active:scale-[0.99]'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors[exp.category] || colors.other}`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{exp.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Calendar size={10} /> {exp.date}
                                                    {exp.note && !isExpanded && (
                                                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded text-[10px]">
                                                            <AlignLeft size={8}/> <span>...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-black text-gray-900 dark:text-white tabular-nums block">-{currencySymbol}{exp.amount.toFixed(2)}</span>
                                            {isExpanded ? <ChevronDown size={14} className="text-gray-400 ml-auto mt-1"/> : <ChevronRight size={14} className="text-gray-400 ml-auto mt-1"/>}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 fade-in">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('exp_note_label')}</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                {exp.note || <span className="italic text-gray-400 opacity-70">Not yok</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {filteredExpenses.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-[#1A1D21] rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Receipt size={24} className="text-gray-300"/>
                                </div>
                                <p className="text-gray-400 text-sm font-medium">{t('exp_empty_month')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- FLOAT ADD BUTTON --- */}
            <div className="absolute bottom-24 right-6 z-40">
                <button 
                    onClick={() => setShowForm(true)}
                    className="w-14 h-14 bg-[#111417] dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center shadow-2xl shadow-black/20 hover:scale-110 active:scale-90 transition-all"
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* --- ADD EXPENSE MODAL --- */}
            {showForm && (
                <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="p-4 pt-safe-top flex items-center justify-between">
                        <button 
                            onClick={() => setShowForm(false)} 
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-white/10 hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="font-bold text-lg dark:text-white">{t('exp_add_title')}</h2>
                        <div className="w-10" />
                    </div>

                    <div className="flex-1 px-6 pt-4 overflow-y-auto">
                        <div className="mb-8 text-center">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('exp_amount_label')}</label>
                            <div className="flex items-center justify-center text-5xl font-black text-gray-900 dark:text-white">
                                <span className="text-3xl text-gray-400 mr-1">{currencySymbol}</span>
                                <input 
                                    type="number" 
                                    autoFocus
                                    value={newExp.amount} 
                                    onChange={e => setNewExp({...newExp, amount: e.target.value})} 
                                    placeholder="0"
                                    className="bg-transparent outline-none w-48 text-center placeholder-gray-200 dark:placeholder-white/10"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">{t('exp_category_label')}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['food', 'vet', 'toy', 'groom', 'other'].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => setNewExp({...newExp, category: cat})}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${newExp.category === cat ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-white' : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400'}`}
                                    >
                                        {cat === 'food' && <ShoppingBag size={24} />}
                                        {cat === 'vet' && <Stethoscope size={24} />}
                                        {cat === 'toy' && <Gift size={24} />}
                                        {cat === 'groom' && <Activity size={24} />}
                                        {cat === 'other' && <CreditCard size={24} />}
                                        <span className="text-[10px] font-bold uppercase">{t(`exp_cat_${cat}`)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {newExp.category === 'other' && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('exp_custom_label')}</label>
                                <input 
                                    type="text" 
                                    value={newExp.customCategory} 
                                    onChange={e => setNewExp({...newExp, customCategory: e.target.value})}
                                    placeholder={t('exp_custom_placeholder')}
                                    className="w-full p-4 bg-white dark:bg-white/5 rounded-2xl text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        )}

                        {newExp.category !== 'other' && (
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('exp_title_label')}</label>
                                <input 
                                    type="text" 
                                    value={newExp.title} 
                                    onChange={e => setNewExp({...newExp, title: e.target.value})}
                                    placeholder={t('exp_title_placeholder')}
                                    className="w-full p-4 bg-white dark:bg-white/5 rounded-2xl text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-white/10 outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('exp_date_label')}</label>
                                <input 
                                    type="date" 
                                    value={newExp.date} 
                                    onChange={e => setNewExp({...newExp, date: e.target.value})}
                                    className="w-full p-4 bg-white dark:bg-white/5 rounded-2xl text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-white/10 outline-none h-[58px]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{t('exp_note_label')}</label>
                                <input 
                                    type="text" 
                                    value={newExp.note} 
                                    onChange={e => setNewExp({...newExp, note: e.target.value})}
                                    placeholder={t('exp_note_placeholder')}
                                    className="w-full p-4 bg-white dark:bg-white/5 rounded-2xl text-gray-900 dark:text-white font-bold border border-gray-100 dark:border-white/10 outline-none h-[58px]"
                                />
                            </div>
                        </div>

                        <div className="h-20"></div>
                    </div>

                    <div className="p-6 bg-white dark:bg-[#111417] border-t border-gray-100 dark:border-white/5 absolute bottom-0 w-full">
                        <button 
                            onClick={handleAdd}
                            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            {t('exp_add_confirm')} <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {showPaywall && <PaywallModal feature="expense_charts" onClose={() => setShowPaywall(false)} />}
        </div>
    );
};

export default ExpenseTracker;