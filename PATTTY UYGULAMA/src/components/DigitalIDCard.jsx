// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/DigitalIDCard.jsx
import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { X, Share2, ShieldCheck, Phone, AlertTriangle, Link, MapPin, Copy, QrCode, RefreshCw } from 'lucide-react'; // QrCode ve RefreshCw eklendi
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toJpeg } from 'html-to-image';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext'; // useLanguage eklendi

const DigitalIDCard = ({ pet, ownerPhone = "+90 555 000 00 00", onClose }) => {
    const { t } = useLanguage(); // useLanguage hook'u eklendi
    const cardRef = useRef(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [lostMode, setLostMode] = useState(false); 
    const showNotification = useNotification();

    const profileUrl = `https://pattty.com/p/${pet.id}`;

    const toggleLostMode = (e) => {
        e.stopPropagation();
        setLostMode(!lostMode);
        if (!lostMode) {
            showNotification(t('id_lost_on_notif'), "error"); // Hardcode Fix
        } else {
            showNotification(t('id_lost_off_notif'), "success"); // Hardcode Fix
        }
    };

    const copyLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(profileUrl);
        showNotification(t('id_link_copied')); // Hardcode Fix
    };

    const shareCard = async (e) => {
        e.stopPropagation();
        if (!cardRef.current) return;

        try {
            const dataUrl = await toJpeg(cardRef.current, { quality: 0.95 });
            const fileName = `pattty_id_${pet.name}.jpeg`;
            
            await Filesystem.writeFile({
                path: fileName,
                data: dataUrl.split(',')[1],
                directory: Directory.Cache
            });

            const uriResult = await Filesystem.getUri({
                path: fileName,
                directory: Directory.Cache
            });

            await Share.share({
                title: `${pet.name} - ${t('id_share_story_title').replace('${monthName}', '')}`, // Kontekste uygun başlık
                text: `${t('id_share_story_text').replace('${monthName}', 'Pattty')} 🐾 #PatttyApp`, // Kontekste uygun metin
                url: profileUrl,
                files: [uriResult.uri],
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in">
            
            {/* Üst Bilgi */}
            <div className="text-white text-center mb-6 w-full max-w-sm">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold">Pattty Tag™</h2>
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
                </div>
                
                {/* Kayıp Modu Anahtarı */}
                <div 
                    onClick={toggleLostMode}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${lostMode ? 'bg-red-500/20 border-red-500 animate-pulse' : 'bg-white/5 border-white/10'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${lostMode ? 'bg-red-500' : 'bg-gray-600'}`}>
                            <AlertTriangle size={20} className="text-white"/>
                        </div>
                        <div className="text-left">
                            <p className={`font-bold text-sm ${lostMode ? 'text-red-400' : 'text-gray-300'}`}>{t('id_lost_mode_title')}</p>
                            <p className="text-[10px] text-gray-400">{lostMode ? t('id_lost_mode_desc_on') : t('id_lost_mode_desc_off')}</p>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full p-1 transition-colors ${lostMode ? 'bg-red-500' : 'bg-gray-600'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${lostMode ? 'translate-x-4' : ''}`}/>
                    </div>
                </div>
            </div>

            {/* KART ALANI (3D Flip) */}
            <div 
                className="relative w-full max-w-sm aspect-[1.586/1] cursor-pointer group perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`w-full h-full relative transition-all duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* --- ÖN YÜZ --- */}
                    <div 
                        ref={cardRef} 
                        className={`absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10 ${lostMode ? 'bg-gradient-to-br from-red-600 to-red-900' : 'bg-gradient-to-br from-indigo-600 to-purple-700'}`}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"/>
                        
                        {/* Üst Bar: Durum ve QR Butonu */}
                        <div className="flex justify-between items-start z-10">
                            {lostMode ? (
                                <div className="flex items-center gap-2 bg-white text-red-600 px-3 py-1 rounded-full animate-bounce">
                                    <AlertTriangle size={16} className="fill-red-600"/>
                                    <span className="text-xs font-bold tracking-wide">{t('id_lost_searching')}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                    <ShieldCheck size={16} className="text-green-300"/>
                                    <span className="text-xs font-bold tracking-wide">{t('id_safe')}</span>
                                </div>
                            )}
                            
                            {/* YENİ: Sağ Üst Köşe QR Butonu (Görsel İpucu) */}
                            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 pr-3 rounded-full backdrop-blur-md transition-colors border border-white/10 group">
                                <div className="bg-white text-indigo-600 p-1.5 rounded-full shadow-sm">
                                    <QrCode size={16} />
                                </div>
                                <span className="text-[10px] font-bold opacity-90 group-hover:opacity-100">{t('id_show_qr')}</span>
                            </div>
                        </div>

                        {/* Orta Bilgiler */}
                        <div className="flex gap-4 items-center z-10 mt-2">
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden border-4 border-white/20">
                                <span className={`text-4xl font-bold ${lostMode ? 'text-red-600' : 'text-indigo-600'}`}>{pet.name.charAt(0)}</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight">{pet.name}</h1>
                                <p className="opacity-80 text-sm font-medium">{pet.breed} • {pet.age}</p>
                                <div className="mt-2 flex items-center gap-1.5 text-xs bg-black/20 w-fit px-2 py-1 rounded-lg">
                                    <Phone size={12}/> {ownerPhone}
                                </div>
                            </div>
                        </div>

                        {/* Alt Bilgiler */}
                        <div className="z-10 mt-auto pt-4 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] opacity-60 uppercase tracking-wider">ID TAG</p>
                                <p className="font-mono text-sm tracking-widest">#{pet.id}</p>
                            </div>
                            {/* İpucu Yazısı */}
                            <div className="text-right flex items-center gap-1 opacity-50 text-[10px] uppercase font-bold animate-pulse">
                                <RefreshCw size={10} /> {t('id_tap_to_flip')}
                            </div>
                        </div>
                    </div>

                    {/* --- ARKA YÜZ (QR) --- */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl p-6 shadow-2xl rotate-y-180 flex flex-col items-center justify-center text-center border-4 border-gray-900">
                        {/* Domain Bilgisi */}
                        <div className="bg-gray-900 text-white px-4 py-1 rounded-full text-xs font-bold mb-4">
                            pattty.com/p/{pet.id}
                        </div>
                        
                        <div className="p-2 bg-white rounded-xl shadow-inner border border-gray-200">
                            <QRCode 
                                value={profileUrl} 
                                size={130} 
                                fgColor={lostMode ? "#dc2626" : "#000000"} 
                            />
                        </div>
                        
                        <div className="flex gap-2 mt-6 w-full">
                            <button onClick={copyLink} className="flex-1 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 flex items-center justify-center gap-1 hover:bg-gray-200">
                                <Copy size={14}/> {t('id_link')}
                            </button>
                            <button onClick={shareCard} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-indigo-700">
                                <Share2 size={14}/> {t('id_share')}
                            </button>
                        </div>
                        
                        {/* Geri Dön İpucu */}
                        <div className="mt-4 flex items-center gap-1 text-gray-400 text-[10px] font-bold uppercase cursor-pointer opacity-70">
                            <RefreshCw size={10} /> {t('id_back_to_info')}
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Fiziksel Tasma Eşleştirme */}
            <div className="mt-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl max-w-sm text-center border border-white/5">
                <div className="flex items-center justify-center gap-2 mb-2 text-indigo-300">
                    <Link size={16}/>
                    <h4 className="font-bold text-sm">{t('id_pair_tag_title')}</h4>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                    {t('id_pair_tag_desc').replace('Pattty Tag', '<strong>Pattty Tag</strong>')}
                </p>
                <button className="mt-3 w-full py-3 bg-white text-black font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors">
                    {t('id_enter_tag_code')}
                </button>
            </div>

            {/* CSS Stilleri */}
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}</style>
        </div>
    );
};

export default DigitalIDCard;