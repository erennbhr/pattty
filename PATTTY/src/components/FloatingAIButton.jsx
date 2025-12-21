import React from 'react';
import { Sparkles } from 'lucide-react';

const FloatingAIButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        w-16 h-16
        rounded-3xl
        bg-white/15
        backdrop-blur-2xl
        ring-1 ring-white/30
        shadow-[0_0_30px_rgba(168,85,247,0.6)]
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:bg-white/20
        active:scale-95
      "
    >
      <Sparkles size={28} className="text-violet-400" />
    </button>
  );
};

export default FloatingAIButton;
