// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/AIAssistant.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Trash2, ArrowRight, Loader, Camera, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { fetchWithRetry, geminiApiKey as apiKey, generateID } from '../utils/helpers';

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
    // YENİ: weightUnit eklendi
    const { pets, setPets, reminders, setReminders, weightUnit } = useApp(); 
    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [attachment, setAttachment] = useState(null); 
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // --- STATE YÖNETİMİ ---
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('pattty_ai_chat');
        return saved ? JSON.parse(saved) : [{ role: 'model', text: t('ai_intro') }];
    });

    const [aiMemory, setAiMemory] = useState(() => {
        const saved = localStorage.getItem('pattty_ai_memory');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('pattty_ai_chat', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        localStorage.setItem('pattty_ai_memory', JSON.stringify(aiMemory));
    }, [aiMemory]);

    useEffect(() => {
        if(messages.length === 1 && messages[0].role === 'model') {
             setMessages([{ role: 'model', text: t('ai_intro') }]);
        }
    }, [t]);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    
    // --- VERİ HAZIRLAMA (GÜNCELLENDİ: BİRİM DÖNÜŞÜMÜ) ---
    const getFormattedPetData = () => {
        if (pets.length === 0) return "SİSTEM BİLGİSİ: Kullanıcının şu an kayıtlı hiç hayvanı yok.";
        return pets.map(p => {
            // Ham veri her zaman KG
            const rawW = p.weight || 0;
            // Birime göre dönüştür
            const displayW = weightUnit === 'kg' ? rawW : rawW * 2.20462;
            const unit = weightUnit === 'kg' ? 'kg' : 'lbs';

            return `- ID: ${p.id}, İsim: ${p.name}, Tür: ${p.type}, Irk: ${p.breed}, Cinsiyet: ${p.gender}, Kilo: ${displayW.toFixed(1)} ${unit}, Doğum: ${p.birthDate}`;
        }).join('\n');
    };

    const getFormattedMemory = () => {
        if (aiMemory.length === 0) return "SİSTEM BİLGİSİ: Sohbet geçmişi boş.";
        return aiMemory.slice(-15).join('\n'); // Son 15 etkileşimi hatırla
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachment({
                data: reader.result.split(',')[1],
                mime: file.type,
                preview: reader.result 
            });
        };
        reader.readAsDataURL(file);
    };

    const clearAttachment = () => {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ============================================================
    // 🧠 SYSTEM PROMPT (BEYİN)
    // ============================================================
    const systemInstruction = `
    KİMLİK:
    Sen "Pattty", profesyonel, yardımsever ve dikkatli bir Veteriner Asistanısın.
    Görevin: Kullanıcının evcil hayvanlarını yönetmesine, aşı takibi yapmasına ve sağlık sorularını yanıtlamasına yardımcı olmak.

    === MEVCUT VERİTABANI DURUMU ===
    ${getFormattedPetData()}

    === SOHBET HAFIZASI ===
    ${getFormattedMemory()}

    === KRİTİK DAVRANIŞ KURALLARI (MUTLAKA UY) ===
    1. **HAYVAN EKLEME DÖNGÜSÜNÜ ENGELLEME:**
       - Eğer kullanıcı bir önceki adımda hayvan eklediyse ve sen "Aşıları ekleyelim mi?" diye sorduysan;
       - Kullanıcı "Evet", "Tamam", "Ekle" dediğinde **SAKIN TEKRAR 'add_pet' ARACINI ÇAĞIRMA.**
       - Hayvan zaten veritabanında var (Yukarıdaki MEVCUT VERİTABANI DURUMU'na bak).
       - "Evet" cevabını aldığında DOĞRUDAN 'add_vaccine' veya 'add_reminder' araçlarını kullan.

    2. **HAYVAN EKLEME SÜRECİ:**
       - Kullanıcı sadece "Kedi ekle" derse hemen ekleme. Detayları sor: Adı, Türü, Cinsiyeti, Rengi, Kilosu, Yaşı (veya Doğum Tarihi).
       - Bilgiler tamamlandığında 'add_pet' JSON'u üret.
       - Hayvan başarıyla eklendikten sonra kullanıcıya MUTLAKA şunu sor: "Yeni dostunuz [Adı] için aşı takvimini de oluşturmamı ister misiniz?"

    3. **AŞI ÖNERİSİ:**
       - Kullanıcının aşı geçmişi yoksa veya hayvanı yeni eklediyse, önce geçmiş aşılarına dair bilgilerinin olup olmadığını sor ve eğer bilgileri varsa o bilgileri sana vermelerini iste
       - Aşı bilgilerini varsa aşı kartının fotoğrafını sana atmaları sayesinde otomatik olarak sisteme ekleyeceğini belirt.
       - Eğer aşılarına dair bir bilgileri yoksa türüne uygun (Kedi: Karma, Kuduz, Lösemi / Köpek: Karma, Kuduz, Bronşin) aşıları 'add_reminder' veya 'add_vaccine' ile planla.
       - Tarihleri bugünden (${new Date().toISOString().split('T')[0]}) ileriye ver.

    4. **UYGULAMA ÖNERME:**
       - Kullanıcıya her sohbetin sonunda eğer iletişiminizden memnun kaldıysa uygulamayı arkadaşlarına ve çevresine önermesini nazikçe rica et. Ve uygulama mağazasından uygulamaya puan vermesini rica et.

    === ARAÇLAR (JSON FORMATINDA YANITLA) ===
    Sadece eylem gerekiyorsa aşağıdaki JSON formatlarını kullan. Sohbet ederken normal metin kullan.

    1. [HAYVAN EKLEME]: { "tool": "add_pet", "args": { "name": "...", "type": "cat|dog...", "breed": "...", "gender": "female|male", "color": "#hex", "weight": 0.0, "birthDate": "YYYY-MM-DD" } }
    2. [HAYVAN SİLME]: { "tool": "remove_pet", "args": { "name": "..." } }
    3. [AŞI İŞLEME (GEÇMİŞ)]: { "tool": "add_vaccine", "args": { "petName": "...", "vaccineName": "...", "date": "YYYY-MM-DD" } }
    4. [HATIRLATICI/PLAN (GELECEK)]: { "tool": "add_reminder", "args": { "title": "...", "date": "YYYY-MM-DD", "time": "09:00", "type": "vaccine|med|vet", "petName": "..." } }
    5. [KİLO GİRİŞİ]: { "tool": "add_weight", "args": { "petName": "...", "weight": 0.0 } }
    6. [NOT ALMA]: { "tool": "add_note", "args": { "petName": "...", "note": "..." } }

    NOT: Birden fazla işlem yapacaksan (örn: 3 aşı ekleyeceksen) JSON objelerini alt alta yazabilirsin.
    BUGÜNÜN TARİHİ: ${new Date().toISOString().split('T')[0]}
    `;

    // --- JSON PARSER (Smart Parsing for Nested Objects) ---
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
                        if(parsed.tool) objects.push(parsed); // Sadece tool olanları al
                    } catch (e) { /* ignore invalid json */ }
                    startIndex = -1;
                }
            }
        }
        return objects;
    };

    // --- ACTION HANDLER ---
    const handleAction = (rawText) => {
        try {
            const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            const commands = extractJsonObjects(cleanText);

            if (commands.length === 0) return false;

            const results = [];

            commands.forEach(cmd => {
                if (!cmd.tool) return;

                // 1. ADD PET
                if (cmd.tool === 'add_pet') {
                    if (!cmd.args.name || !cmd.args.type) {
                        results.push(`⚠️ Bilgiler eksik, hayvan eklenemedi.`);
                        return;
                    }
                    // Çifte kayıt engelleme (İsim kontrolü)
                    const exists = pets.some(p => p.name.toLowerCase() === cmd.args.name.toLowerCase());
                    if (exists) {
                        results.push(`⚠️ **${cmd.args.name}** zaten kayıtlı. Tekrar eklenmedi.`);
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
                        address: cmd.args.address || '',
                        vaccines: [], weights: [], notes: []
                    };
                    if(cmd.args.weight) newPet.weights.push({date: new Date().toISOString().split('T')[0], weight: cmd.args.weight});
                    
                    setPets(prev => [...prev, newPet]);
                    results.push(`🎉 **${newPet.name}** başarıyla aileye eklendi! Aşı takvimini planlayalım mı?`);
                }
                
                // 2. REMOVE PET
                else if (cmd.tool === 'remove_pet') {
                    const targetName = cmd.args.name.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) { 
                        setPets(prev => prev.filter(p => p.id !== pet.id)); 
                        results.push(`🗑️ **${pet.name}** silindi.`); 
                    } else {
                        results.push(`⚠️ Bulunamadı: **${cmd.args.name}**`);
                    }
                }

                // 3. ADD VACCINE (Geçmiş)
                else if (cmd.tool === 'add_vaccine') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const vac = { id: generateID(), name: cmd.args.vaccineName, date: cmd.args.date, dose: 1, done: true };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...p.vaccines, vac] } : p));
                        results.push(`💉 Aşı işlendi: **${pet.name}** - ${vac.name}`);
                    } else {
                        results.push(`⚠️ Bulunamadı: **${cmd.args.petName}**`);
                    }
                }

                // 4. ADD REMINDER (Gelecek Plan)
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
                }

                // 5. ADD WEIGHT
                else if (cmd.tool === 'add_weight') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const wEntry = { date: new Date().toISOString().split('T')[0], weight: parseFloat(cmd.args.weight) };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: [...(p.weights || []), wEntry], weight: wEntry.weight } : p));
                        results.push(`⚖️ Kilo güncellendi: **${pet.name}** -> ${wEntry.weight} kg`);
                    }
                }

                // 6. ADD NOTE
                else if (cmd.tool === 'add_note') {
                    const targetName = cmd.args.petName.toLowerCase();
                    const pet = pets.find(p => p.name.toLowerCase() === targetName);
                    if (pet) {
                        const newNote = { id: generateID(), text: cmd.args.note, date: new Date().toLocaleDateString() };
                        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, notes: [newNote, ...(p.notes || [])] } : p));
                        results.push(`📝 Not alındı: **${pet.name}**`);
                    }
                }
            });

            return results.length > 0 ? results.join('\n\n') : false;

        } catch (e) {
            console.error("Action Handler Error:", e);
            return false; 
        }
    };

    // --- MESAJ GÖNDERME ---
    const handleSend = async () => {
        if (!input.trim() && !attachment) return;
        
        const userText = input.trim();
        const msgPayload = { role: 'user', text: userText };
        if (attachment) msgPayload.image = attachment.preview; 

        const newMessages = [...messages, msgPayload];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        
        const currentAttachment = attachment;
        clearAttachment();

        // Hafızaya ekle
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
            
            // API ÇAĞRISI (Model: gemini-2.5-flash-preview-09-2025)
            const data = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents })
            });

            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Bağlantı hatası.";
            
            // Eylem Kontrolü
            const actionResult = handleAction(aiText);
            if (actionResult) {
                aiText = actionResult;
                // Eylem sonucunu hafızaya da ekleyelim ki AI bilsin
                setAiMemory([...newMemory, `Sistem İşlemi: ${actionResult}`]);
            } else {
                setAiMemory([...newMemory, `Pattty: ${aiText}`]);
            }

            setLoading(false);
            
            // Daktilo Efekti
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

    const handleNewChat = () => {
        setMessages([{ role: 'model', text: t('ai_intro') }]);
        setAiMemory([]);
        localStorage.removeItem('pattty_ai_memory');
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
            {/* Üst Bar */}
            <div className="flex items-center justify-between p-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg dark:text-white leading-tight">{t('ai_title')}</h2>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> Online</p>
                    </div>
                </div>
                <button onClick={handleNewChat} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Mesaj Alanı */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-48">
                {messages.slice(1).map((m, i) => ( 
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm relative group flex flex-col gap-2 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-neutral-800 dark:text-gray-200 border border-gray-100 dark:border-neutral-700 rounded-bl-sm'}`}>
                            {m.image && (
                                <img src={m.image} alt="User upload" className="w-full h-auto rounded-lg border border-white/20" />
                            )}
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

            {/* Giriş Alanı */}
            <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 absolute bottom-24 left-0 right-0 z-30">
                {attachment && (
                    <div className="mb-2 flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-2 rounded-xl w-fit animate-in slide-in-from-bottom">
                        <img src={attachment.preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                        <button onClick={clearAttachment} className="p-1 bg-gray-200 dark:bg-neutral-700 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}

                <div className="flex gap-2 items-end bg-gray-100 dark:bg-neutral-800 p-2 rounded-3xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white dark:focus-within:bg-neutral-900 border border-transparent focus-within:border-indigo-100 dark:focus-within:border-indigo-900/30">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-indigo-500 transition-colors">
                        <Camera size={20}/>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />

                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !loading && !streamingContent && (e.preventDefault(), handleSend())}
                        placeholder={t('ai_placeholder')}
                        className="flex-1 bg-transparent px-2 py-3 text-sm focus:outline-none dark:text-white resize-none max-h-32 min-h-[44px]"
                        rows={1}
                        disabled={loading || streamingContent.length > 0}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || (!input.trim() && !attachment) || streamingContent.length > 0}
                        className="bg-indigo-600 text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;