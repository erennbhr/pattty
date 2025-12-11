import React, { useState, useEffect, useRef } from 'react';
import { Bot, Trash2, ArrowRight, Plus, Loader, Camera, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { fetchWithRetry, geminiApiKey as apiKey, generateID } from '../utils/helpers';

// Markdown Renderer
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
    const { pets, setPets, reminders, setReminders } = useApp(); 
    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    
    const [attachment, setAttachment] = useState(null); 
    const fileInputRef = useRef(null);

    const messagesEndRef = useRef(null);

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
    
    const getFormattedPetData = () => {
        if (pets.length === 0) return "Kullanıcının henüz eklenmiş hayvanı yok.";
        return pets.map(p => 
            `- İsim: ${p.name}, Tür: ${p.type}, Irk: ${p.breed}, Cinsiyet: ${p.gender}, Kilo: ${p.weight || 'Yok'} kg`
        ).join('\n');
    };

    const getFormattedMemory = () => {
        if (aiMemory.length === 0) return "Henüz geçmiş not yok.";
        return aiMemory.slice(-10).join('\n');
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            setAttachment({
                data: base64Data,
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

    // --- GELİŞTİRİLMİŞ SYSTEM PROMPT ---
    const systemInstruction = `
      SYSTEM PROMPT — Pattty Veteriner Asistanı (GELİŞMİŞ MOD)
      
      === MEVCUT HAYVANLAR ===
      ${getFormattedPetData()}
      
      === HAFIZA ===
      ${getFormattedMemory()}

      === GÖREVLERİN ===
      1. Kullanıcı hayvan eklemek istediğinde **HEMEN EKLEME**. Önce şu detayları sor: Türü, Cinsiyeti, Rengi, Kilosu ve Yaşı (veya doğum tarihi).
      2. Kullanıcı tüm bilgileri verirse JSON üret.
      3. **ÖNEMLİ:** Hayvan eklendikten sonra (add_pet başarılı olunca), kullanıcıya mutlaka şunu sor: **"Yeni dostunuz [Hayvan Adı] için aşı takvimini de oluşturmamı ister misiniz?"**

      === GİZLİ EYLEMLER (JSON) ===
      Sadece net bilgi varsa bu JSON'ları döndür:

      1. HAYVAN EKLEME (Detaylı):
      { "tool": "add_pet", "args": { "name": "...", "type": "cat|dog|bird...", "breed": "...", "gender": "female|male", "color": "#hex", "weight": 0.0 (sayı), "birthDate": "YYYY-MM-DD" } }
      (Not: Eğer kullanıcı yaş söylerse (örn: 2 yaşında), bugünün tarihinden (${new Date().toISOString().split('T')[0]}) hesaplayarak tahmini birthDate gir.)

      2. HAYVAN SİLME: { "tool": "remove_pet", "args": { "name": "..." } }
      3. AŞI İŞLEME: { "tool": "add_vaccine", "args": { "petName": "...", "vaccineName": "...", "date": "YYYY-MM-DD" } }
      4. HATIRLATICI: { "tool": "add_reminder", "args": { "title": "...", "date": "YYYY-MM-DD", "time": "HH:MM", "type": "...", "petName": "..." } }
      5. KİLO GÜNCELLEME: { "tool": "add_weight", "args": { "petName": "...", "weight": 0.0 } }
      6. NOT ALMA: { "tool": "add_note", "args": { "petName": "...", "note": "..." } }

      Kurallar:
      - Bugünün tarihi: ${new Date().toISOString().split('T')[0]}
      - Cevaplarında JSON dışında bir şey yazma (eğer işlem yapıyorsan).
      - Sohbet ederken JSON kullanma.
    `;

    // --- ACTION HANDLER ---
    const handleAction = (rawJson) => {
        try {
            let cleanJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }

            const cmd = JSON.parse(cleanJson);
            if (!cmd.tool) return false;

            // 1. Hayvan Ekleme (GÜNCELLENDİ)
            if (cmd.tool === 'add_pet') {
                if (!cmd.args.name || !cmd.args.type) return `⚠️ ${t('err_ai_missing_info')}`;
                
                const newPet = {
                    id: generateID(),
                    name: cmd.args.name,
                    type: cmd.args.type,
                    breed: cmd.args.breed || 'Melez',
                    gender: cmd.args.gender || 'female',
                    color: cmd.args.color || '#9ca3af',
                    // Yeni Alanlar:
                    weight: cmd.args.weight || 0,
                    birthDate: cmd.args.birthDate || new Date().toISOString().split('T')[0],
                    vaccines: [], 
                    weights: cmd.args.weight ? [{date: new Date().toISOString().split('T')[0], weight: cmd.args.weight}] : [],
                    notes: []
                };
                
                setPets(prev => [...prev, newPet]);
                
                // Başarılı mesajı + Yönlendirme sorusu
                return `🎉 **${newPet.name}** ailene eklendi! \n\nOnun sağlığı için aşı takvimini veya parazit aşılarını şimdi planlamamı ister misin?`;
            }
            
            if (cmd.tool === 'remove_pet') {
                const targetName = cmd.args.name.toLowerCase();
                const pet = pets.find(p => p.name.toLowerCase() === targetName);
                if (pet) { setPets(prev => prev.filter(p => p.id !== pet.id)); return `${t('ai_action_remove')} **${pet.name}**`; }
                return `Bulunamadı: **${cmd.args.name}**`;
            }
            if (cmd.tool === 'add_vaccine') {
                const targetName = cmd.args.petName.toLowerCase();
                const pet = pets.find(p => p.name.toLowerCase() === targetName);
                if (pet) {
                    const vac = { id: generateID(), name: cmd.args.vaccineName, date: cmd.args.date || new Date().toISOString().split('T')[0], dose: 1, done: false };
                    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...p.vaccines, vac] } : p));
                    return `${t('ai_action_vaccine')} **${pet.name}** - ${vac.name}`;
                }
                return `Bulunamadı: **${cmd.args.petName}**`;
            }
            if (cmd.tool === 'add_reminder') {
                let pId = '';
                if (cmd.args.petName) { const p = pets.find(pet => pet.name.toLowerCase() === cmd.args.petName.toLowerCase()); if (p) pId = p.id; }
                const newReminder = { id: generateID(), title: cmd.args.title, date: cmd.args.date || new Date().toISOString().split('T')[0], time: cmd.args.time || "09:00", type: cmd.args.type || "other", petId: pId, completed: false };
                setReminders(prev => [...prev, newReminder]);
                return `📅 Takvime eklendi: **${newReminder.title}** (${newReminder.date})`;
            }
            if (cmd.tool === 'add_weight') {
                const targetName = cmd.args.petName.toLowerCase();
                const pet = pets.find(p => p.name.toLowerCase() === targetName);
                if (pet) {
                    const wEntry = { date: new Date().toISOString().split('T')[0], weight: parseFloat(cmd.args.weight) };
                    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, weights: [...(p.weights || []), wEntry], weight: wEntry.weight } : p));
                    return `⚖️ Kilo güncellendi: **${pet.name}** -> **${wEntry.weight} kg**.`;
                }
                return `Bulunamadı: **${cmd.args.petName}**`;
            }
            if (cmd.tool === 'add_note') {
                const targetName = cmd.args.petName.toLowerCase();
                const pet = pets.find(p => p.name.toLowerCase() === targetName);
                if (pet) {
                    const newNote = { id: generateID(), text: cmd.args.note, date: new Date().toLocaleDateString() };
                    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, notes: [newNote, ...(p.notes || [])] } : p));
                    return `📝 Not alındı: **${pet.name}**`;
                }
                return `Bulunamadı: **${cmd.args.petName}**`;
            }
            return false;
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return false; 
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !attachment) return;
        
        const userText = input.trim();
        const msgPayload = { role: 'user', text: userText };
        if (attachment) {
            msgPayload.image = attachment.preview; 
        }

        const newMessages = [...messages, msgPayload];
        setMessages(newMessages);
        setInput('');
        setLoading(true);
        
        const currentAttachment = attachment;
        clearAttachment();

        const newMemory = [...aiMemory, `Kullanıcı sordu: "${userText}" ${currentAttachment ? '[Görsel Gönderildi]' : ''}`];
        setAiMemory(newMemory);

        try {
            const userPart = [];
            if (userText) userPart.push({ text: userText });
            if (currentAttachment) {
                userPart.push({
                    inlineData: {
                        mimeType: currentAttachment.mime,
                        data: currentAttachment.data
                    }
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

            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Hata";
            
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const potentialJson = jsonMatch[0];
                const actionResult = handleAction(potentialJson);
                
                if (actionResult) {
                    aiText = actionResult;
                }
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
            setMessages(prev => [...prev, { role: 'model', text: "⚠️ " + t('ai_error_api') }]);
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