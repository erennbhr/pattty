import React, { useState, useEffect, useRef } from 'react';
import { Bot, Trash2, ArrowRight, Loader, Camera, X, Lock, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext'; 
import { fetchWithRetry, geminiApiKey as apiKey, generateID } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'; 

// --- MARKDOWN RENDERER ---
const MarkdownRenderer = ({ content }) => {
    if (!content) return null;
    const lines = content.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                if (!line) return <div key={i} className="h-1" />;
                if (line.trim().startsWith('- ')) {
                    return (
                        <div key={i} className="flex gap-2 ml-2">
                            <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-1.5"><div className="w-1.5 h-1.5 rounded-full bg-current"/></span>
                            <span className="flex-1 text-sm">{parseInlineStyles(line.replace('- ', ''))}</span>
                        </div>
                    );
                }
                return <p key={i} className="leading-relaxed text-sm">{parseInlineStyles(line)}</p>;
            })}
        </div>
    );
};

const parseInlineStyles = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index} className="font-bold text-indigo-700 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index} className="italic text-gray-600 dark:text-gray-300">{part.slice(1, -1)}</em>;
        return part;
    });
};

const AIAssistant = () => {
    const { t } = useLanguage();
    const showNotification = useNotification();
    const { pets, setPets, reminders, setReminders, weightUnit } = useApp(); 
    const { canUseFeature, recordMessage, recordAction, isPremium } = usePremium();
    const [showPaywall, setShowPaywall] = useState(false);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [attachment, setAttachment] = useState(null); 
    const messagesEndRef = useRef(null);

    // --- STATE YÖNETİMİ (SessionStorage) ---
    const [messages, setMessages] = useState(() => {
        const saved = sessionStorage.getItem('pattty_ai_chat');
        return saved ? JSON.parse(saved) : [{ role: 'model', text: t('ai_intro') }];
    });

    const [aiMemory, setAiMemory] = useState(() => {
        const saved = sessionStorage.getItem('pattty_ai_memory');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        sessionStorage.setItem('pattty_ai_chat', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        sessionStorage.setItem('pattty_ai_memory', JSON.stringify(aiMemory));
    }, [aiMemory]);

    useEffect(() => {
        if(messages.length === 1 && messages[0].role === 'model') {
             setMessages([{ role: 'model', text: t('ai_intro') }]);
        }
    }, [t]);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    
    // --- VERİ HAZIRLAMA ---
    const getFormattedPetData = () => {
        if (pets.length === 0) return "SİSTEM BİLGİSİ: Kullanıcının şu an kayıtlı hiç hayvanı yok.";
        return pets.map(p => {
            const rawW = p.weight || 0;
            const displayW = weightUnit === 'kg' ? rawW : rawW * 2.20462;
            const unit = weightUnit === 'kg' ? 'kg' : 'lbs';
            return `- ID: ${p.id}, İsim: ${p.name}, Tür: ${p.type}, Irk: ${p.breed}, Cinsiyet: ${p.gender}, Kilo: ${displayW.toFixed(1)} ${unit}, Doğum: ${p.birthDate}`;
        }).join('\n');
    };

    const getFormattedMemory = () => {
        if (aiMemory.length === 0) return "SİSTEM BİLGİSİ: Sohbet geçmişi boş.";
        return aiMemory.slice(-15).join('\n'); 
    };

    // --- KAMERA / GALERİ ---
    const handleCameraClick = async () => {
        const check = canUseFeature('ai_image');
        if (!check.allowed) {
            setShowPaywall(true);
            return;
        }

        try {
            const photo = await CapCamera.getPhoto({
                quality: 80,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt,
                promptLabelHeader: t('ai_title'),
                promptLabelPhoto: t('scan_gallery'),
                promptLabelPicture: t('scan_camera')
            });

            setAttachment({
                data: photo.base64String,
                mime: `image/${photo.format}`,
                preview: `data:image/${photo.format};base64,${photo.base64String}`
            });

        } catch (error) {
            if (error.message !== 'User cancelled photos app') {
                console.error("Camera Error:", error);
            }
        }
    };

    const clearAttachment = () => {
        setAttachment(null);
    };

    // --- GÜNCELLENMİŞ SİSTEM TALİMATI (FULL KNOWLEDGE BASE) ---
    const systemInstruction = `
    KİMLİK:
    Sen "Pattty", hem uzman bir Veteriner Asistanı hem de Pattty uygulamasının Kıdemli Teknik Destek Uzmanısın. Kullanıcıya hem evcil hayvan sağlığı konusunda hem de uygulamanın kullanımı konusunda %100 doğru ve detaylı bilgi vermekle yükümlüsün.

    === KULLANICI PROFİLİ ===
    Üyelik Durumu: ${isPremium ? "PREMIUM ÜYE (Sınırsız Erişim)" : "FREE ÜYE (Kısıtlı Erişim)"}
    Kayıtlı Hayvanlar:
    ${getFormattedPetData()}

    === SOHBET GEÇMİŞİ ===
    ${getFormattedMemory()}

    === UYGULAMA KULLANIM KILAVUZU (TEKNİK DESTEK VERİTABANI) ===

    === KRİTİK GÖRSEL FORMATLAMA KURALLARI (ÇOK ÖNEMLİ) ===
    1. ASLA TABLO KULLANMA: Cevaplarında asla '|' karakteri ile tablo oluşturma. Mobilde kötü görünüyor.
    2. ASLA BAŞLIK ETİKETİ KULLANMA: Cevaplarında '#' veya '##' kullanma. 
    3. BUNLAR YERİNE: Bilgileri maddeler halinde listeleyerek sun ( - işareti ile).
    4. VURGULAMA: Önemli yerleri **kalın** yapabilirsin.
    
    1. GENEL AYARLAR & HESAP YÖNETİMİ:
       - **Tema Değiştirme:** Alt menüden "Profil" (En sağdaki ikon) -> "Genel Ayarlar" -> "Koyu Tema" anahtarını kullanın.
       - **Dil Değiştirme:** Profil -> Genel Ayarlar -> Dil Ayarları (Türkçe/İngilizce vb.).
       - **Birimler (KG/LBS & Para Birimi):** Profil -> Genel Ayarlar -> Birim ve Para Birimi. Buradan ağırlık birimini (KG/LBS) ve para birimini (TL/USD/EUR) değiştirebilirsiniz.
       - **Hesap Silme:** Profil -> En aşağı inin -> Çöp kutusu ikonlu "Hesabı Sil" butonu. (Dikkat: Bu işlem geri alınamaz).
       - **Çıkış Yapma:** Profil -> En aşağıda "Çıkış Yap".
       - **Premium İptali/Yönetimi:** Profil -> En üstteki Premium Kartı -> İptal veya Yönet.

    2. EVCİL HAYVAN YÖNETİMİ:
       - **Yeni Hayvan Ekleme:** "Dostlarım" sekmesinden veya Ana Ekrandaki "+" butonundan.
         * *Kısıtlama:* Free üyeler sadece 1 hayvan ekleyebilir. 2. hayvan için Premium gerekir.
       - **Hayvan Silme:** "Dostlarım" sekmesi -> Sağ üstteki "Düzenle" (Slider ikonu) -> Hayvanın üzerindeki Kırmızı Çöp Kutusu.
       - **Bilgileri Düzenleme:** "Dostlarım" sekmesi -> "Düzenle" butonu -> Hayvanın üzerindeki Kalem ikonu.

    3. SAĞLIK & TAKİP ÖZELLİKLERİ:
       - **Aşı Takibi:** Pet profiline girin -> "Aşılar" sekmesi.
         * *Free:* Manuel aşı ekleme.
         * *Premium:* "Karne Tara" (Fotoğraf ile otomatik) ve "AI ile Öner" özellikleri açılır.
       - **Kilo Takibi:** Pet profili -> "Kilo" sekmesi. Kilo geçmişini grafik olarak görebilirsiniz.
       - **Notlar:** Pet profili -> "Notlar". Veteriner notları, alerjiler vb. için.

    4. ÖZEL ARAÇLAR (DASHBOARD):
       - **Mama Analizi (Food Scan):** Ana Sayfa -> "Mama Analizi" kartı. Mama paketinin "İçindekiler" bölümünün fotoğrafını çekin. AI içeriği analiz edip puanlar. (Sadece Premium).
       - **Veteriner Bulucu:** Ana Sayfa -> "Vet Bul" kartı. Konum izni vererek en yakın klinikleri listeleyin. (Sadece Premium).
       - **Masraf Takibi:** Ana Sayfa -> "Masraf Takibi" ($ ikonu). Harcamaları ekleyin. Premium üyeler detaylı grafikleri görür.

    5. DİJİTAL KİMLİK & KAYIP MODU:
       - Pet profiline girin -> Resmin üzerindeki "QR Kod" ikonuna tıklayın.
       - Buradan "Kayıp Modu"nu açabilirsiniz. Bu mod açıldığında QR kodu kırmızı olur ve bulan kişiye "KAYIP" uyarısı verir.

    === SIK KARŞILAŞILAN SORUNLAR VE CEVAPLARI ===
    - Soru: "İkinci kedimi ekleyemiyorum."
      Cevap: "Ücretsiz planda sadece 1 evcil hayvan hakkınız bulunuyor. Ailenizi büyütmek ve sınırsız hayvan eklemek için Premium'a geçebilirsiniz. Ayarlar menüsünden yükseltme yapabilirsiniz."
    
    - Soru: "AI cevap vermiyor veya kilitlendi."
      Cevap: "Günlük işlem veya mesaj limitinize ulaşmış olabilirsiniz. Free planda günlük 10 mesaj ve 1 işlem hakkınız var. Limitler her gece sıfırlanır. Beklemek istemiyorsanız Premium'a geçerek sınırsız erişim sağlayabilirsiniz."
    
    - Soru: "Konumumu bulamıyor."
      Cevap: "Telefonunuzun Ayarlar menüsünden Pattty uygulamasına 'Konum' izni verdiğinizden emin olun. Ayrıca GPS'inizin açık olduğundan emin olun."

    === DAVRANIŞ KURALLARI ===
    - Kullanıcı teknik bir soru sorduğunda (örn: "Nasıl yaparım?"), yukarıdaki veritabanını kullanarak **adım adım** yol göster.
    - Kullanıcı "Premium almalı mıyım?" diye sorarsa, Premium'un avantajlarını (Sınırsız pet, Mama analizi, Sınırsız AI) satıcı bir dille anlat.
    - Sağlık sorularında her zaman veteriner hekim uyarısı yap.
    - Eylem gerekiyorsa (hatırlatıcı kur, not al vb.) aşağıdaki JSON formatlarını kullan.

    === ARAÇLAR (JSON FORMATINDA YANITLA) ===
    Sadece eylem gerekiyorsa aşağıdaki JSON formatlarını kullan. Sohbet ederken normal metin kullan.
    1. [HAYVAN EKLEME]: { "tool": "add_pet", "args": { "name": "...", "type": "cat|dog...", "breed": "...", "gender": "female|male", "color": "#hex", "weight": 0.0, "birthDate": "YYYY-MM-DD" } }
    2. [AŞI İŞLEME]: { "tool": "add_vaccine", "args": { "petName": "...", "vaccineName": "...", "date": "YYYY-MM-DD" } }
    3. [HATIRLATICI]: { "tool": "add_reminder", "args": { "title": "...", "date": "YYYY-MM-DD", "time": "09:00", "type": "vaccine|med|vet", "petName": "..." } }
    4. [KİLO GİRİŞİ]: { "tool": "add_weight", "args": { "petName": "...", "weight": 0.0 } }
    5. [NOT ALMA]: { "tool": "add_note", "args": { "petName": "...", "note": "..." } }

    BUGÜNÜN TARİHİ: ${new Date().toISOString().split('T')[0]}
    `;

    const extractJsonObjects = (text) => {
        const objects = [];
        let braceCount = 0;
        let startIndex = -1;
        let inString = false;
        let escaped = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (inString) {
                if (char === '\\' && !escaped) escaped = true;
                else if (char === '"' && !escaped) inString = false;
                else escaped = false;
                continue;
            }
            if (char === '"') { inString = true; continue; }
            if (char === '{') {
                if (braceCount === 0) startIndex = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && startIndex !== -1) {
                    try {
                        const jsonStr = text.substring(startIndex, i + 1);
                        const parsed = JSON.parse(jsonStr);
                        if(parsed.tool) objects.push(parsed); 
                    } catch (e) { }
                    startIndex = -1;
                }
            }
        }
        return objects;
    };

    const handleAction = (rawText) => {
        try {
            const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            const commands = extractJsonObjects(cleanText);

            if (commands.length === 0) return false;

            const results = [];
            let successfulAction = false;

            commands.forEach(cmd => {
                if (!cmd.tool) return;

                if (cmd.tool === 'add_pet') {
                    if (!cmd.args.name || !cmd.args.type) {
                        results.push(`⚠️ Bilgiler eksik, hayvan eklenemedi.`);
                        return;
                    }
                    const exists = pets.some(p => p.name.toLowerCase() === cmd.args.name.toLowerCase());
                    if (exists) {
                        results.push(`⚠️ **${cmd.args.name}** zaten kayıtlı.`);
                        return;
                    }

                    const newPet = {
                        id: generateID(),
                        name: cmd.args.name,
                        type: cmd.args.type,
                        breed: cmd.args.breed || 'Melez',
                        gender: cmd.args.gender || 'female',
                        color: cmd.args.color || '#9ca3af',
                        weight: cmd.args.weight || 0,
                        birthDate: cmd.args.birthDate || new Date().toISOString().split('T')[0],
                        vaccines: [], weights: [], notes: []
                    };
                    if(cmd.args.weight) newPet.weights.push({date: new Date().toISOString().split('T')[0], weight: cmd.args.weight});
                    
                    setPets(prev => [...prev, newPet]);
                    results.push(`🎉 **${newPet.name}** başarıyla aileye eklendi!`);
                    successfulAction = true;
                }
                
                else if (cmd.tool === 'add_vaccine') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const vac = { id: generateID(), name: cmd.args.vaccineName, date: cmd.args.date, dose: 1, done: true };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...p.vaccines, vac] } : p));
                        results.push(`💉 Aşı işlendi: **${pet.name}** - ${vac.name}`);
                        successfulAction = true;
                    }
                }

                else if (cmd.tool === 'add_reminder') {
                    let pId = '';
                    if (cmd.args.petName) { 
                        const p = pets.find(pet => pet.name.toLowerCase() === cmd.args.petName.toLowerCase()); 
                        if (p) pId = p.id; 
                    }
                    const typeMap = { "Vaccine Reminder": "vaccine", "Parasite Treatment": "med", "Vet Appointment": "vet" };
                    const newReminder = { 
                        id: generateID(), 
                        title: cmd.args.title, 
                        date: cmd.args.date, 
                        time: cmd.args.time || "09:00", 
                        type: typeMap[cmd.args.type] || "other", 
                        petId: pId, 
                        completed: false 
                    };
                    setReminders(prev => [...prev, newReminder]);
                    results.push(`📅 Takvime eklendi: **${newReminder.title}** (${newReminder.date})`);
                    successfulAction = true;
                }

                else if (cmd.tool === 'add_weight') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const wEntry = { date: new Date().toISOString().split('T')[0], weight: parseFloat(cmd.args.weight) };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: [...(p.weights || []), wEntry], weight: wEntry.weight } : p));
                        results.push(`⚖️ Kilo güncellendi: **${pet.name}** -> ${wEntry.weight} kg`);
                        successfulAction = true;
                    }
                }

                else if (cmd.tool === 'add_note') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const newNote = { id: generateID(), text: cmd.args.note, date: new Date().toLocaleDateString() };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, notes: [newNote, ...(p.notes || [])] } : p));
                        results.push(`📝 Not alındı: **${pet.name}**`);
                        successfulAction = true;
                    }
                }
            });

            if (successfulAction) {
                recordAction();
            }

            return results.length > 0 ? results.join('\n\n') : false;

        } catch (e) {
            console.error("Action Handler Error:", e);
            return false; 
        }
    };

    const handleSend = async () => {
        const check = canUseFeature('ai_chat');
        if (!check.allowed) {
            setShowPaywall(true);
            return;
        }

        if (!input.trim() && !attachment) return;
        
        recordMessage();

        const userText = input.trim();
        const msgPayload = { role: 'user', text: userText };
        if (attachment) msgPayload.image = attachment.preview; 

        const newMessages = [...messages, msgPayload];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        
        const currentAttachment = attachment;
        clearAttachment();

        const newMemory = [...aiMemory, `Kullanıcı: "${userText}" ${currentAttachment ? '[Görsel]' : ''}`];
        setAiMemory(newMemory);

        try {
            const userPart = [];
            if (userText) userPart.push({ text: userText });
            if (currentAttachment) {
                userPart.push({
                    inlineData: { mimeType: currentAttachment.mime, data: currentAttachment.data }
                });
            }

            const historyParts = messages.slice(1).map(m => ({ 
                role: m.role === 'user' ? 'user' : 'model', 
                parts: [{ text: m.text || (m.image ? "[Görsel]" : "") }] 
            }));

            const contents = [
                { role: 'user', parts: [{ text: systemInstruction }] }, 
                ...historyParts,
                { role: 'user', parts: userPart.length > 0 ? userPart : [{text: '...'}] }
            ];
            
            const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Bağlantı hatası.";
            
            const actionResult = handleAction(aiText);
            if (actionResult) {
                aiText = actionResult;
                setAiMemory([...newMemory, `Sistem İşlemi: ${actionResult}`]);
            } else {
                setAiMemory([...newMemory, `Pattty: ${aiText}`]);
            }

            setLoading(false);
            
            let index = 0;
            const typingSpeed = 10;
            const typeWriter = setInterval(() => {
                setStreamingContent(aiText.slice(0, index + 1));
                index++;
                if (index >= aiText.length) {
                    clearInterval(typeWriter);
                    setMessages(prev => [...prev, { role: 'model', text: aiText }]);
                    setStreamingContent('');
                }
            }, typingSpeed);

        } catch (e) {
            console.error(e);
            showNotification(t('ai_error_api'), 'error');
            setMessages(prev => [...prev, { role: 'model', text: "⚠️ Bir hata oluştu." }]);
            setLoading(false);
        }
    };

    const chatCheck = canUseFeature('ai_chat');
    const isBlocked = !chatCheck.allowed;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black relative">
            <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        {isPremium ? <Sparkles size={20} className="animate-pulse"/> : <Bot size={20} />}
                    </div>
                    <div>
                        <h2 className="font-bold text-lg dark:text-white leading-tight">{t('ai_title')} {isPremium && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-1">PLUS</span>}</h2>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online</p>
                    </div>
                </div>
                <button onClick={() => { setMessages([{ role: 'model', text: t('ai_intro') }]); setAiMemory([]); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                    <Trash2 size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {messages.slice(1).map((m, i) => ( 
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative group flex flex-col gap-2 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-neutral-800 dark:text-gray-200 border border-gray-100 dark:border-neutral-700 rounded-bl-sm'}`}>
                            {m.image && <img src={m.image} alt="User upload" className="w-full h-auto rounded-lg border border-white/20" />}
                            {m.role === 'user' ? m.text : <MarkdownRenderer content={m.text} />}
                        </div>
                    </div>
                ))}
                
                {streamingContent && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-neutral-700 bg-white dark:bg-neutral-800 dark:text-gray-200 text-sm leading-relaxed">
                            <MarkdownRenderer content={streamingContent} />
                            <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                        </div>
                    </div>
                )}

                {loading && !streamingContent && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-neutral-700 flex gap-1 items-center">
                           <Loader size={16} className="animate-spin text-indigo-500"/>
                           <span className="text-xs text-gray-400 font-medium ml-2">{t('ai_typing')}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-20 left-0 right-0 p-4 bg-gray-50/90 dark:bg-black/90 backdrop-blur-md border-t border-gray-100 dark:border-neutral-800 z-30">
                
                {isBlocked && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-white dark:bg-neutral-800 p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-700 w-full max-w-xs animate-in slide-in-from-bottom">
                            <Lock size={32} className="mx-auto text-red-500 mb-2"/>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('ai_limit_reached_title')}</h3>
                            <p className="text-xs text-gray-500 mb-3">{chatCheck.msg}</p>
                            <button 
                                onClick={() => setShowPaywall(true)}
                                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30"
                            >
                                {t('ai_btn_upgrade')}
                            </button>
                        </div>
                    </div>
                )}

                {attachment && (
                    <div className="mb-2 flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 rounded-xl w-fit shadow-sm border border-gray-100 dark:border-neutral-700 animate-in slide-in-from-bottom">
                        <img src={attachment.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        <button onClick={clearAttachment} className="p-1 bg-gray-100 dark:bg-neutral-700 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="flex gap-2 items-end bg-white dark:bg-neutral-800 p-2 rounded-[1.5rem] shadow-sm border border-gray-200 dark:border-neutral-700 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                    <button onClick={handleCameraClick} disabled={isBlocked} className="p-3 text-gray-400 hover:text-indigo-500 transition-colors disabled:opacity-50">
                        <Camera size={22}/>
                    </button>

                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && !streamingContent && (e.preventDefault(), handleSend())}
                        placeholder={isBlocked ? "" : t('ai_placeholder')}
                        className="flex-1 bg-transparent px-2 py-3.5 text-sm focus:outline-none dark:text-white resize-none max-h-32 min-h-[48px]"
                        rows={1}
                        disabled={loading || streamingContent.length > 0 || isBlocked}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || (!input.trim() && !attachment) || streamingContent.length > 0 || isBlocked}
                        className="bg-indigo-600 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {showPaywall && <PaywallModal feature="ai_chat" onClose={() => setShowPaywall(false)} />}
        </div>
    );
};

export default AIAssistant;