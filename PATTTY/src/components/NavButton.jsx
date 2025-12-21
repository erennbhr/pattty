import React from 'react';

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`
      relative flex flex-col items-center justify-center w-full h-full
      transition-all duration-300 ease-out
      focus:outline-none
    `}
  >
    {/* Aktif Glow Indicator */}
    <div
      className={`
        absolute -top-2 w-2 h-2 rounded-full transition-all duration-300
        ${active
          ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)] opacity-100'
          : 'opacity-0'}
      `}
    />

    {/* Glass Icon Container */}
    <div
      className={`
        relative flex items-center justify-center
        w-11 h-11 rounded-2xl
        backdrop-blur-xl
        transition-all duration-300 ease-out

        ${active
          ? `
            bg-white/60 dark:bg-white/10
            ring-1 ring-white/40 dark:ring-white/20
            shadow-[0_8px_20px_rgba(0,0,0,0.15)]
            -translate-y-1
          `
          : `
            bg-white/30 dark:bg-white/5
            ring-1 ring-white/20 dark:ring-white/10
            text-gray-400 dark:text-neutral-500
          `}
      `}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={`
          transition-colors duration-300
          ${active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-gray-400 dark:text-neutral-500'}
        `}
      />
    </div>

    {/* Label */}
    <span
      className={`
        mt-1 text-[10px] font-medium tracking-wide
        transition-all duration-300 ease-out
        ${active
          ? 'opacity-100 translate-y-0 text-indigo-600 dark:text-indigo-400'
          : 'opacity-0 translate-y-1'}
      `}
    >
      {label}
    </span>
  </button>
);

export default NavButton;
