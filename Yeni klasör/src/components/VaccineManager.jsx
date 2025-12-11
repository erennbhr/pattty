import React, { useState } from 'react';
import { Syringe, Check, Calendar, Plus, Sparkles, Loader, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { getLocalizedData, fetchWithRetry, geminiApiKey as apiKey, generateID } from '../utils/helpers';

const VaccineManager = ({ pet, setPets, onGoToVetLocator }) => {
  const { t, language } = useLanguage();
  const showNotification = useNotification();

  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newVaccine, setNewVaccine] = useState({ name: '', date: '' });

  const [showAiPreModal, setShowAiPreModal] = useState(false);
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [aiSuggestedVaccines, setAiSuggestedVaccines] = useState([]);

  const vaccines = pet.vaccines || [];
  const localizedData = getLocalizedData(language || 'tr', t);
  const commonVaccines = localizedData.vaccines(pet.type) || [];

  // Yeni aşı ekleme (manuel)
  const handleAdd = () => {
    if (!newVaccine.name || !newVaccine.date) {
      showNotification(
        language === 'tr'
          ? 'Lütfen aşı adını ve tarihini seçin.'
          : 'Please select vaccine name and date.',
        'error'
      );
      return;
    }

    const v = {
      id: generateID(),
      name: newVaccine.name,
      date: newVaccine.date,
      done: false,
    };

    setPets(prev =>
      prev.map(p =>
        p.id === pet.id
          ? { ...p, vaccines: [...(p.vaccines || []), v] }
          : p
      )
    );

    setNewVaccine({ name: '', date: '' });
    setShowForm(false);

    showNotification(
      language === 'tr' ? 'Aşı eklendi.' : 'Vaccine added.',
      'success'
    );
  };

  // Aşıyı done/undone yapma
  const toggleDone = (vid) => {
    setPets(prev =>
      prev.map(p =>
        p.id === pet.id
          ? {
              ...p,
              vaccines: (p.vaccines || []).map(v =>
                v.id === vid ? { ...v, done: !v.done } : v
              ),
            }
          : p
      )
    );
  };

  // AI öncesi uyarı modalı → buton
  const handleAiButtonClick = () => {
    setShowAiPreModal(true);
  };

  // ⭐ AI'dan aşı önerisi alma
  const handleAiSuggest = async () => {
    setAiLoading(true);
    setShowAiPreModal(false); // ön modalı kapat

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const existingList = vaccines.length
        ? vaccines.map(v => `${v.name} (${v.date})`).join(', ')
        : (language === 'tr' ? 'Yok' : 'None');

      const prompt =
        `You are a licensed veterinary clinical assistant specialized in creating accurate, medically-correct vaccination schedules for pets.\n` +
        `Your task is to create a scientifically accurate and safe VACCINE SCHEDULE for the pet described below.\n\n` +
        `-----------------------------------------\n` +
        `PET INFORMATION\n` +
        `-----------------------------------------\n` +
        `Name: ${pet.name}\n` +
        `Species: ${pet.type}\n` +
        `Existing Vaccines: ${existingList}\n` +
        `Current Date: TODAY (use real future dates)\n\n` +
        `-----------------------------------------\n` +
        `CRITICAL RULES (DO NOT IGNORE)\n` +
        `-----------------------------------------\n` +
        `1. NEVER output a past date.\n` +
        `   All vaccine dates MUST be in the future.\n` +
        `   If unsure, schedule at least +10 days from today.\n\n` +
        `2. ONLY propose medically correct vaccines for the species:\n` +
        `   - DOG → DHPPi (core), Rabies, Parvo, Bordetella, Leptospirosis\n` +
        `   - CAT → FVRCP (core), FeLV (if indoor-outdoor), Rabies\n` +
        `   - RABBIT → Myxomatosis, RHD1, RHD2\n` +
        `   - BIRD → Polyomavirus, PBFD (if applicable)\n` +
        `   - If species is unknown, return an empty list.\n\n` +
        `3. DO NOT repeat vaccines that the pet already has.\n` +
        `4. DO NOT output text outside JSON. No explanations, no markdown.\n\n` +
        `5. Booster rules:\n` +
        `   - DOG: DHPPi annual, Rabies annual, Parvo annual\n` +
        `   - CAT: FVRCP annual, Rabies annual, FeLV annual\n` +
        `   - RABBIT: RHD annual, Myxomatosis annual\n` +
        `   - BIRD: Polyoma annual\n\n` +
        `6. Dates MUST be in ISO format YYYY-MM-DD.\n\n` +
        `-----------------------------------------\n` +
        `OUTPUT FORMAT (MANDATORY)\n` +
        `-----------------------------------------\n` +
        `{\n` +
        `  "vaccines": [\n` +
        `    { "name": "Vaccine Name", "date": "YYYY-MM-DD" }\n` +
        `  ]\n` +
        `}\n\n` +
        `DO NOT OUTPUT ANYTHING OUTSIDE THIS JSON.\n` +
        `BEGIN NOW.\n`;

      const data = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      });

      let aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!aiText) throw new Error('EMPTY_RESPONSE');

      // Kod bloklarını temizle
      let clean = aiText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }

      let parsed;
      try {
        parsed = JSON.parse(clean);
      } catch (e) {
        console.error('VaccineManager JSON parse error:', e, clean);
        throw new Error('JSON_PARSE_ERROR');
      }

      const aiVaccines = Array.isArray(parsed.vaccines)
        ? parsed.vaccines
        : [];

      let mapped = aiVaccines
        .filter(v => v && v.name && v.date)
        .map(v => ({
          id: generateID(),
          name: v.name,
          date: v.date,
          done: false,
        }));

      // Geçmiş tarihleri otomatik düzelt (bugün +10 gün)
      const today = new Date();
      mapped.forEach(v => {
        const d = new Date(v.date);
        if (isNaN(d.getTime()) || d < today) {
          const fixed = new Date();
          fixed.setDate(fixed.getDate() + 10);
          v.date = fixed.toISOString().split('T')[0];
        }
      });

      if (!mapped.length) {
        throw new Error('NO_VALID_VACCINES');
      }

      // Bu AI çağrısında gelen aşıları ayrı state'e de yaz
      setAiSuggestedVaccines(mapped);

      // Aşıları pet'in listesine ekle
      setPets(prev =>
        prev.map(p =>
          p.id === pet.id
            ? { ...p, vaccines: [...(p.vaccines || []), ...mapped] }
            : p
        )
      );

      showNotification(
        language === 'tr'
          ? 'Yapay zekâ ile aşı takvimi oluşturuldu.'
          : 'AI-generated vaccine schedule added.',
        'success'
      );

      // Sonuç modalını aç
      setShowAiResultModal(true);
    } catch (err) {
      console.error('VaccineManager AI error:', err);

      const msg =
        language === 'tr'
          ? 'Aşı önerileri alınamadı. Lütfen tekrar deneyin.'
          : 'Could not fetch vaccine suggestions. Please try again.';

      showNotification(msg, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const sortedVaccines = [...vaccines].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // VetLocator'a yönlendirme
  const handleGoToVets = () => {
    setShowAiResultModal(false);
    setAiSuggestedVaccines([]);
    if (onGoToVetLocator) {
      onGoToVetLocator();
    } else if (typeof window !== 'undefined' && typeof window.openVetLocator === 'function') {
      window.openVetLocator();
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
      {/* Başlık + AI butonu */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-gray-700 dark:text-gray-100 flex items-center gap-2">
          <Syringe size={18} />
          {t('vaccine_title')}
        </h3>

        <button
          onClick={handleAiButtonClick}
          disabled={aiLoading}
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-200 hover:bg-indigo-100 disabled:opacity-60"
        >
          {aiLoading ? (
            <>
              <Loader size={14} className="animate-spin" />
              {language === 'tr' ? 'Hazırlanıyor...' : 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {language === 'tr' ? 'AI ile Öner' : 'AI Suggest'}
            </>
          )}
        </button>
      </div>

      {/* Aşı listesi */}
      <div className="space-y-2">
        {sortedVaccines.length === 0 && (
          <div className="text-gray-400 text-sm flex flex-col items-center gap-2 py-6">
            <Syringe size={32} className="opacity-20" />
            <span>
              {language === 'tr'
                ? 'Henüz aşı eklenmemiş.'
                : 'No vaccines added yet.'}
            </span>
          </div>
        )}

        {sortedVaccines.map(v => (
          <div
            key={v.id}
            className="flex items-center justify-between px-3 py-2 rounded-2xl border bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleDone(v.id)}
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-white text-[10px] ${
                  v.done
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-300 dark:bg-neutral-900 dark:border-gray-600'
                }`}
              >
                {v.done && <Check size={14} />}
              </button>
              <div>
                <h4
                  className={`text-sm font-bold ${
                    v.done
                      ? 'text-gray-400 line-through'
                      : 'text-gray-800 dark:text-gray-100'
                  }`}
                >
                  {v.name}
                </h4>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={10} />
                  {v.date}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Yeni Aşı Formu (manuel) */}
      {showForm ? (
        <div className="space-y-3 bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700 animate-in slide-in-from-bottom">
          <select
            value={newVaccine.name}
            onChange={e =>
              setNewVaccine(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">
              {language === 'tr' ? 'Aşı seçin' : 'Select vaccine'}
            </option>
            {commonVaccines.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={newVaccine.date}
            onChange={e =>
              setNewVaccine(prev => ({ ...prev, date: e.target.value }))
            }
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setNewVaccine({ name: '', date: '' });
              }}
              className="flex-1 p-3 text-sm bg-gray-100 dark:bg-neutral-900 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200"
            >
              {t('cancel')}
            </button>

            <button
              onClick={handleAdd}
              className="flex-1 p-3 text-sm bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
            >
              {t('save')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-2xl bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-100 border border-dashed border-gray-300 dark:border-neutral-700 hover:bg-gray-100"
        >
          <Plus size={16} />
          {language === 'tr' ? 'Yeni Aşı Ekle' : 'Add Vaccine'}
        </button>
      )}

      {/* 🟣 AI ÖNCESİ UYARI MODALI */}
      {showAiPreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-5 relative">
            <button
              onClick={() => setShowAiPreModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold mb-3 text-gray-800 dark:text-gray-100">
              {language === 'tr'
                ? 'AI ile aşı önerisi'
                : 'AI Vaccine Suggestion'}
            </h2>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              {language === 'tr'
                ? 'AI ile aşı eklemeden önce, dostunuzun daha önceden olduğu aşıları sisteme eklemeyi unutmayınız.'
                : 'Before adding AI-generated vaccines, please make sure you have entered all vaccines your pet has already received.'}
            </p>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setShowAiPreModal(false);
                  setShowForm(true);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200"
              >
                {language === 'tr' ? 'Aşı ekle' : 'Add manually'}
              </button>
              <button
                onClick={handleAiSuggest}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {language === 'tr' ? 'AI ile devam et' : 'Continue with AI'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 AI SONUÇ MODALI */}
      {showAiResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-5 relative">
            <button
              onClick={() => setShowAiResultModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>

            <h2 className="text-base font-bold mb-3 text-gray-800 dark:text-gray-100">
              {language === 'tr'
                ? 'AI asistanınız bu aşıları önerdi'
                : 'Your AI assistant suggested these vaccines'}
            </h2>

            {aiSuggestedVaccines.length > 0 ? (
              <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
                {aiSuggestedVaccines.map(v => (
                  <div
                    key={v.id}
                    className="px-3 py-2 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {v.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {v.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">
                {language === 'tr'
                  ? 'Yeni aşı önerisi bulunamadı.'
                  : 'No new vaccine suggestions.'}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setShowAiResultModal(false);
                  setAiSuggestedVaccines([]);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200"
              >
                {language === 'tr' ? 'Tamam' : 'OK'}
              </button>

              <button
                onClick={handleGoToVets}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {language === 'tr'
                  ? 'Yakındaki veterinerleri bul'
                  : 'Find nearby vets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaccineManager;
