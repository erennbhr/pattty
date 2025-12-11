import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Play, Pause, Music } from 'lucide-react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toJpeg } from 'html-to-image';
import musicFile from '../assets/monthly_memory_bg.mp3'; 

const MemoryPlayer = ({ photos, monthName, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const audioRef = useRef(new Audio(musicFile));
    const storyRef = useRef(null); 

    const DURATION_PER_SLIDE = 4000; 

    useEffect(() => {
        const audio = audioRef.current;
        audio.loop = true;
        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, []);

    useEffect(() => {
        let interval;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Otomatik oynatma engellendi."));
            
            interval = setInterval(() => {
                setCurrentIndex(prev => {
                    if (prev === photos.length - 1) {
                        setIsPlaying(false);
                        audioRef.current.pause();
                        return prev;
                    }
                    return prev + 1;
                });
            }, DURATION_PER_SLIDE);
        } else {
            audioRef.current.pause();
        }
        return () => clearInterval(interval);
    }, [isPlaying, photos.length]);

    useEffect(() => {
        if(isPlaying) {
            const step = 100 / (DURATION_PER_SLIDE / 100);
            const timer = setInterval(() => {
                setProgress(p => (p >= 100 ? 0 : p + step));
            }, 100);
            return () => clearInterval(timer);
        } else {
            setProgress(0);
        }
    }, [isPlaying, currentIndex]);

    // --- DÜZELTİLEN PAYLAŞIM FONKSİYONU ---
    const handleShare = async () => {
        if (!storyRef.current) return;
        setIsPlaying(false); 

        try {
            // 1. HTML'i Resme Çevir
            const dataUrl = await toJpeg(storyRef.current, { quality: 0.95 });
            const fileName = `pattty_story_${new Date().getTime()}.jpeg`;
            
            // 2. Dosyayı Cache'e Yaz
            await Filesystem.writeFile({
                path: fileName,
                data: dataUrl.split(',')[1],
                directory: Directory.Cache
            });

            // 3. Dosyanın Tam Yolunu Al
            const uriResult = await Filesystem.getUri({
                path: fileName,
                directory: Directory.Cache
            });

            // 4. Paylaş (files dizisi kullanarak)
            await Share.share({
                title: `Pattty - ${monthName} Anıları`,
                text: `${monthName} ayından harika anılar! 🐾 #PatttyApp`,
                files: [uriResult.uri], // BURASI DÜZELTİLDİ: url yerine files dizisi kullanıldı
            });

        } catch (e) {
            console.error("Paylaşım hatası", e);
        }
    };

    const currentPhoto = photos[currentIndex];

    if (!currentPhoto) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            
            {/* Görünmez Paylaşım Şablonu */}
            <div ref={storyRef} className="fixed top-0 left-0 -z-50 w-[1080px] h-[1920px] bg-black flex flex-col items-center justify-center pointer-events-none">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-10"/>
                 <img src={currentPhoto?.webviewPath} className="w-full h-full object-cover" alt="Memory" />
                 <div className="absolute bottom-20 left-10 z-20">
                     <h1 className="text-8xl font-bold text-white font-serif">{monthName}</h1>
                     <p className="text-4xl text-gray-300 mt-4 font-sans">Pattty ile Anılar</p>
                 </div>
                 <div className="absolute top-20 right-20 bg-white/20 p-4 rounded-full backdrop-blur-xl">
                    <Music size={60} className="text-white"/>
                 </div>
            </div>

            {/* Üst Bar */}
            <div className="absolute top-0 w-full p-4 z-20 flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent pb-12">
                <div className="flex gap-1 h-1 w-full">
                    {photos.map((_, i) => (
                        <div key={i} className="h-full flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                                className={`h-full bg-white transition-all duration-100 ease-linear ${i === currentIndex ? 'w-full' : i < currentIndex ? 'w-full' : 'w-0'}`}
                                style={{ width: i === currentIndex ? `${progress}%` : undefined }}
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center"><Music size={14} className="text-white animate-pulse"/></div>
                        <span className="text-white text-sm font-bold shadow-sm">{monthName} Anıları</span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white backdrop-blur"><X size={20}/></button>
                </div>
            </div>

            {/* Ana Resim */}
            <div className="w-full h-full relative overflow-hidden bg-gray-900">
                <img 
                    key={currentIndex} 
                    src={currentPhoto?.webviewPath} 
                    className={`w-full h-full object-cover transition-transform duration-[4000ms] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
                    alt="Memory"
                />
            </div>

            {/* Alt Kontroller */}
            <div className="absolute bottom-12 w-full px-8 flex justify-between items-center z-20">
                <div className="text-white">
                    <p className="text-xs opacity-70 mb-1">{currentPhoto?.date}</p>
                    <h2 className="text-2xl font-bold font-serif tracking-wide">Pattty</h2>
                </div>

                <div className="flex gap-4">
                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-lg active:scale-95 transition-transform">
                        {isPlaying ? <Pause size={24} fill="black"/> : <Play size={24} fill="black" className="ml-1"/>}
                    </button>
                    <button onClick={handleShare} className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 active:scale-95 transition-transform">
                        <Share2 size={24}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemoryPlayer;