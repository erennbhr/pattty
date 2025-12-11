// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/GamesHub.jsx
import React, { useState, useEffect } from 'react';
import { Star, Trophy, ArrowLeft, Play, Pause, RotateCcw, Bone, Fish, Cat, Dog, Bird, Mouse, Scissors, Scroll, Square } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const GamesHub = () => {
    const { t } = useLanguage();
    const [activeGame, setActiveGame] = useState('menu'); // menu, catch, memory, rps

    // --- OYUN MENÜSÜ ---
    if (activeGame === 'menu') {
        return (
            <div className="space-y-4 animate-in slide-in-from-right">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white text-center shadow-lg mb-6">
                    <Trophy size={48} className="mx-auto mb-2 text-yellow-300 drop-shadow-md"/>
                    <h2 className="text-2xl font-bold">{t('game_area_title')}</h2>
                    <p className="opacity-90 text-sm">{t('game_area_desc')}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <GameCard 
                        title={t('game_catch_title')} 
                        desc={t('game_catch_desc')} 
                        icon={Bone} 
                        color="bg-orange-500" 
                        onClick={() => setActiveGame('catch')}
                    />
                    <GameCard 
                        title={t('game_memory_title')} 
                        desc={t('game_memory_desc')} 
                        icon={Cat} 
                        color="bg-blue-500" 
                        onClick={() => setActiveGame('memory')}
                    />
                    <GameCard 
                        title={t('game_rps_title')} 
                        desc={t('game_rps_desc')} 
                        icon={Scissors} 
                        color="bg-pink-500" 
                        onClick={() => setActiveGame('rps')}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-900 rounded-3xl overflow-hidden relative shadow-2xl border-4 border-gray-800 animate-in zoom-in-95">
            {/* Üst Bar (Geri Dön) */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={() => setActiveGame('menu')} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur transition-colors">
                    <ArrowLeft size={24}/>
                </button>
            </div>

            {/* Oyun Alanı */}
            <div className="flex-1 relative">
                {activeGame === 'catch' && <CatchGame t={t} />}
                {activeGame === 'memory' && <MemoryGame t={t} />}
                {activeGame === 'rps' && <RPSGame t={t} />}
            </div>
        </div>
    );
};

// --- YARDIMCI KART BİLEŞENİ ---
const GameCard = ({ title, desc, icon: Icon, color, onClick }) => (
    <button onClick={onClick} className="w-full bg-white dark:bg-neutral-800 p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100 dark:border-neutral-700 hover:scale-[1.02] active:scale-95 transition-all group">
        <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform`}>
            <Icon size={28} />
        </div>
        <div className="text-left">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
        </div>
        <div className="ml-auto bg-gray-50 dark:bg-neutral-700 p-2 rounded-full">
            <Play size={20} className="text-gray-400 dark:text-gray-300 ml-1"/>
        </div>
    </button>
);

// ==========================================
// OYUN 1: ÖDÜL AVCISI (REFLEX)
// ==========================================
const CatchGame = ({ t }) => {
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pos, setPos] = useState({ top: '50%', left: '50%' });
    const [targetType, setTargetType] = useState('bone'); // bone or fish

    useEffect(() => {
        let timer;
        if (isPlaying && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsPlaying(false);
        }
        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setIsPlaying(true);
        moveTarget();
    };

    const moveTarget = () => {
        setPos({ top: `${Math.random() * 80 + 10}%`, left: `${Math.random() * 80 + 10}%` });
        setTargetType(Math.random() > 0.5 ? 'bone' : 'fish');
    };

    const handleCatch = () => {
        if (!isPlaying) return;
        if(navigator.vibrate) navigator.vibrate(30);
        setScore(s => s + 10);
        moveTarget();
    };

    return (
        <div className="w-full h-full bg-gray-900 relative flex flex-col items-center justify-center text-white">
            <div className="absolute top-4 right-4 flex gap-4 font-bold text-xl font-mono">
                <span className="text-yellow-400">{t('game_score')} {score}</span>
                <span className={`${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
            </div>

            {!isPlaying ? (
                <div className="text-center space-y-4 z-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                    <h3 className="text-2xl font-bold">{timeLeft === 0 ? t('game_time_up') : t('game_catch_title')}</h3>
                    <p className="text-gray-300">{t('game_your_score')} <span className="text-yellow-400 font-bold text-xl">{score}</span></p>
                    <button onClick={startGame} className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto transition-transform active:scale-95">
                        {timeLeft === 0 ? <RotateCcw size={20}/> : <Play size={20}/>}
                        {timeLeft === 0 ? t('game_play_again') : t('game_start')}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleCatch}
                    style={{ top: pos.top, left: pos.left }}
                    className="absolute p-3 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] active:scale-90 transition-all duration-100 animate-in zoom-in"
                >
                    {targetType === 'bone' ? <Bone className="text-orange-500 fill-orange-500" size={24}/> : <Fish className="text-blue-500 fill-blue-500" size={24}/>}
                </button>
            )}
        </div>
    );
};

// ==========================================
// OYUN 2: PATİ HAFIZA (MEMORY)
// ==========================================
const MemoryGame = ({ t }) => {
    const icons = [Cat, Dog, Fish, Bird, Bone, Mouse];
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [moves, setMoves] = useState(0);

    // Oyunu Başlat
    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        // İkonları çiftle ve karıştır
        const deck = [...icons, ...icons]
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({ id: index, icon, isOpen: false }));
        setCards(deck);
        setFlipped([]);
        setSolved([]);
        setMoves(0);
    };

    const handleCardClick = (id) => {
        if (flipped.length === 2 || cards[id].isOpen || solved.includes(cards[id].icon)) return;

        const newCards = [...cards];
        newCards[id].isOpen = true;
        setCards(newCards);

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;
            
            if (cards[first].icon === cards[second].icon) {
                setSolved([...solved, cards[first].icon]);
                setFlipped([]);
            } else {
                setTimeout(() => {
                    const resetCards = [...cards];
                    resetCards[first].isOpen = false;
                    resetCards[second].isOpen = false;
                    setCards(resetCards);
                    setFlipped([]);
                }, 800);
            }
        }
    };

    const isGameOver = solved.length === icons.length;

    return (
        <div className="w-full h-full bg-indigo-900 flex flex-col items-center justify-center p-4">
            <div className="w-full flex justify-between items-center mb-4 text-white font-bold">
                <span>{t('game_moves')}: {moves}</span>
                <button onClick={initializeGame} className="p-2 bg-white/20 rounded-full"><RotateCcw size={16}/></button>
            </div>

            {isGameOver ? (
                <div className="text-center text-white animate-in zoom-in">
                    <Trophy size={64} className="mx-auto text-yellow-400 mb-4"/>
                    <h3 className="text-3xl font-bold mb-2">{t('game_congrats')}</h3>
                    <p className="mb-6 opacity-80">{moves} {t('game_moves_desc')}</p>
                    <button onClick={initializeGame} className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold">{t('game_play_again')}</button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        const isVisible = card.isOpen || solved.includes(card.icon);
                        return (
                            <button 
                                key={index} 
                                onClick={() => handleCardClick(index)}
                                className={`aspect-square rounded-xl flex items-center justify-center text-3xl transition-all duration-300 transform ${isVisible ? 'bg-white rotate-y-180' : 'bg-indigo-700'}`}
                            >
                                {isVisible ? <Icon size={32} className="text-indigo-600"/> : <Star size={20} className="text-indigo-900/40"/>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ==========================================
// OYUN 3: TAŞ KAĞIT MAKAS (RPS)
// ==========================================
const RPSGame = ({ t }) => {
    const [playerChoice, setPlayerChoice] = useState(null);
    const [aiChoice, setAiChoice] = useState(null);
    const [result, setResult] = useState(null); // win, lose, draw
    const [score, setScore] = useState({ player: 0, ai: 0 });

    const choices = [
        { id: 'rock', icon: Square, color: 'text-gray-400', label: t('game_rps_rock') },
        { id: 'paper', icon: Scroll, color: 'text-yellow-200', label: t('game_rps_paper') },
        { id: 'scissors', icon: Scissors, color: 'text-red-400', label: t('game_rps_scissors') }
    ];

    const play = (choiceId) => {
        setPlayerChoice(choiceId);
        
        // AI Random Choice
        const random = choices[Math.floor(Math.random() * choices.length)].id;
        setAiChoice(random);

        if (choiceId === random) {
            setResult('draw');
        } else if (
            (choiceId === 'rock' && random === 'scissors') ||
            (choiceId === 'paper' && random === 'rock') ||
            (choiceId === 'scissors' && random === 'paper')
        ) {
            setResult('win');
            setScore(s => ({ ...s, player: s.player + 1 }));
        } else {
            setResult('lose');
            setScore(s => ({ ...s, ai: s.ai + 1 }));
        }
    };

    const resetRound = () => {
        setPlayerChoice(null);
        setAiChoice(null);
        setResult(null);
    };

    return (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center p-6 text-white">
            {/* Skor Tablosu */}
            <div className="flex gap-8 mb-8 text-xl font-bold font-mono">
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{t('game_you')}</p>
                    <span className="text-green-400">{score.player}</span>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">{t('game_ai')}</p>
                    <span className="text-red-400">{score.ai}</span>
                </div>
            </div>

            {playerChoice ? (
                // Sonuç Ekranı
                <div className="text-center space-y-6 animate-in zoom-in">
                    <div className="flex justify-center items-center gap-6">
                         <div className="flex flex-col items-center">
                             <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2 border-4 border-green-500">
                                 {choices.find(c=>c.id===playerChoice).icon({size:32})}
                             </div>
                             <span className="text-sm">{t('game_you_label')}</span>
                         </div>
                         <div className="font-bold text-2xl">{t('game_vs')}</div>
                         <div className="flex flex-col items-center">
                             <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-2 border-4 border-red-500">
                                 {choices.find(c=>c.id===aiChoice).icon({size:32})}
                             </div>
                             <span className="text-sm">{t('game_ai_label')}</span>
                         </div>
                    </div>
                    
                    <h2 className="text-3xl font-extrabold uppercase">
                        {result === 'win' && <span className="text-green-400">{t('game_win')} 🎉</span>}
                        {result === 'lose' && <span className="text-red-400">{t('game_lose')} 😔</span>}
                        {result === 'draw' && <span className="text-gray-400">{t('game_draw')} 🤝</span>}
                    </h2>

                    <button onClick={resetRound} className="px-8 py-3 bg-white text-gray-900 rounded-full font-bold hover:scale-105 transition-transform">
                        {t('game_again')}
                    </button>
                </div>
            ) : (
                // Seçim Ekranı
                <div className="space-y-6 text-center w-full">
                    <h3 className="text-xl font-bold mb-6">{t('game_make_choice')}</h3>
                    <div className="flex justify-center gap-4">
                        {choices.map(c => (
                            <button 
                                key={c.id} 
                                onClick={() => play(c.id)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-20 h-20 bg-gray-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:-translate-y-2 transition-transform border border-gray-600 group-hover:border-white">
                                    <c.icon size={36} className={c.color} />
                                </div>
                                <span className="text-sm font-bold text-gray-400 group-hover:text-white">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamesHub;