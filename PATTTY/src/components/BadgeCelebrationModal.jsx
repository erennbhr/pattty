// src/components/BadgeCelebrationModal.jsx
import React from 'react';
import Confetti from 'react-confetti';
import { Award } from 'lucide-react';

const BADGE_MAP = {
  weekly_7: {
    title: '7 Günlük Seri!',
    desc: '7 gün üst üste mood girişi yaptın',
    color: 'from-emerald-400 to-teal-500'
  },
  monthly_30: {
    title: '30 Günlük Seri!',
    desc: 'Tam 1 ay boyunca istikrarlısın',
    color: 'from-indigo-500 to-purple-600'
  },
  yearly_365: {
    title: '365 Günlük Seri!',
    desc: 'Efsanesin. 1 yıl!',
    color: 'from-yellow-400 to-orange-500'
  }
};

const BadgeCelebrationModal = ({ badgeId, onClose }) => {
  const badge = BADGE_MAP[badgeId];
  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Confetti numberOfPieces={350} recycle={false} />

      <div className={`relative bg-gradient-to-br ${badge.color} text-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-sm text-center animate-in zoom-in`}>
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
          <Award size={40} />
        </div>

        <h2 className="text-2xl font-extrabold mb-2">{badge.title}</h2>
        <p className="text-sm opacity-90 mb-6">{badge.desc}</p>

        <button
          onClick={onClose}
          className="bg-white text-black font-bold px-6 py-3 rounded-xl w-full active:scale-95 transition"
        >
          Harika!
        </button>
      </div>
    </div>
  );
};

export default BadgeCelebrationModal;
