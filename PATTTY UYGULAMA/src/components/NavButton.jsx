import React from 'react';

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 group`}>
    {/* Aktiflik Çizgisi */}
    <div className={`absolute -top-3 w-8 h-1 rounded-b-full transition-all duration-300 ${active ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-transparent'}`}></div>
    
    {/* İkon */}
    <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'text-indigo-600 dark:text-indigo-400 -translate-y-1' : 'text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300'}`}>
        <Icon size={26} strokeWidth={active ? 2.5 : 2} /> 
    </div>
    
    {/* Etiket */}
    <span className={`text-[10px] font-medium transition-all duration-300 ${active ? 'opacity-100 translate-y-0 text-indigo-600 dark:text-indigo-400' : 'opacity-0 translate-y-2'}`}>{label}</span>
  </button>
);

export default NavButton;