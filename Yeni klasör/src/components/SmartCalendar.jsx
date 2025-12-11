import React, { useState } from 'react';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Syringe,
  Stethoscope,
  Pill,
  Sparkles,
  Gamepad2,
  Star,
  Trash2,
  Repeat,
  Camera,
  Play,
  PawPrint,
  Smile,
  Zap,
  Moon,
  Thermometer,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { useGallery } from '../context/PhotoGalleryContext';
import { generateID } from '../utils/helpers';
import MemoryPlayer from './MemoryPlayer';

const SmartCalendar = () => {
  const { t, language } = useLanguage();
  const showNotification = useNotification();

  const { reminders, setReminders, pets, moodHistory } = useApp();
  const { takePhoto, getPhotoByDate, getPhotosByMonth, loadDemoPhotos } = useGallery();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showNoPetsWarning, setShowNoPetsWarning] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'vaccine',
    petId: '',
    time: '09:00',
    frequency: 'once',
    note: '',
  });

  // --- Mood ikonları (Dashboard ile uyumlu) ---
  const MOOD_ICONS = {
    happy: { icon: Smile, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/50' },
    energetic: { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
    sleepy: { icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
    sick: { icon: Thermometer, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50' },
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  // Pazartesi başlangıçlı haftaya göre ayarlama
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Sadece TR ve EN için lokal isimler
  const monthNames = {
    tr: [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  };

  const dayNames = {
    tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  };

  // DİL FALLBACK: TR / EN dışındaki tüm diller EN'e düşsün (crash engellemek için)
  const uiLang = monthNames[language] ? language : 'en';

  const FREQUENCY_OPTIONS = [
    { value: 'once', label: language === 'tr' ? 'Tek Seferlik' : 'Once' },
    { value: 'daily', label: language === 'tr' ? 'Günlük (30 Gün)' : 'Daily (30 Days)' },
    { value: 'weekly', label: language === 'tr' ? 'Haftalık (1 Yıl)' : 'Weekly (1 Year)' },
    { value: 'monthly', label: language === 'tr' ? 'Aylık (1 Yıl)' : 'Monthly (1 Year)' },
    { value: 'yearly', label: language === 'tr' ? 'Yıllık (5 Yıl)' : 'Yearly (5 Years)' },
  ];

  const EVENT_TYPES = {
    vaccine: { icon: Syringe, color: 'bg-blue-500', label: t('ev_vaccine') },
    vet: { icon: Stethoscope, color: 'bg-red-500', label: t('ev_vet') },
    med: { icon: Pill, color: 'bg-green-500', label: t('ev_med') },
    groom: { icon: Sparkles, color: 'bg-purple-500', label: t('ev_groom') },
    play: { icon: Gamepad2, color: 'bg-yellow-500', label: t('ev_play') },
    other: { icon: Star, color: 'bg-gray-500', label: t('ev_other') },
  };

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;

  const handleOpenAddModal = () => {
    if (pets.length === 0) {
      setShowNoPetsWarning(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleCameraClick = async () => {
    const dateStr = formatDateKey(selectedDate);
    const success = await takePhoto(dateStr);
    if (success) {
      showNotification(
        language === 'tr' ? 'Anı kaydedildi! 📸' : 'Memory saved! 📸',
        'success'
      );
    }
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.petId) {
      showNotification(t('err_missing_fields'), 'error');
      return;
    }

    const eventsToCreate = [];
    let loopDate = new Date(selectedDate);
    let iterations = 1;

    switch (newEvent.frequency) {
      case 'daily':
        iterations = 30;
        break;
      case 'weekly':
        iterations = 52;
        break;
      case 'monthly':
        iterations = 12;
        break;
      case 'quarterly':
        iterations = 4;
        break;
      case 'yearly':
        iterations = 5;
        break;
      default:
        iterations = 1;
        break;
    }

    for (let i = 0; i < iterations; i++) {
      const eventDate = new Date(loopDate);
      eventsToCreate.push({
        id: generateID(),
        date: formatDateKey(eventDate),
        title: newEvent.title,
        type: newEvent.type,
        petId: newEvent.petId,
        time: newEvent.time,
        note: newEvent.note,
        completed: false,
      });

      if (newEvent.frequency === 'daily') loopDate.setDate(loopDate.getDate() + 1);
      else if (newEvent.frequency === 'weekly') loopDate.setDate(loopDate.getDate() + 7);
      else if (newEvent.frequency === 'monthly') loopDate.setMonth(loopDate.getMonth() + 1);
      else if (newEvent.frequency === 'quarterly') loopDate.setMonth(loopDate.getMonth() + 3);
      else if (newEvent.frequency === 'yearly')
        loopDate.setFullYear(loopDate.getFullYear() + 1);
    }

    setReminders([...reminders, ...eventsToCreate]);
    setShowAddModal(false);
    setNewEvent({
      title: '',
      type: 'vaccine',
      petId: '',
      time: '09:00',
      frequency: 'once',
      note: '',
    });

    showNotification(`${t('ai_action_add')} ${newEvent.title}`, 'success');
  };

  const selectedDateEvents = reminders.filter(
    (r) => r.date === formatDateKey(selectedDate)
  );
  const currentDayPhoto = getPhotoByDate(formatDateKey(selectedDate));

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 pb-32">
      {/* Başlık + Yeni Ekle */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold dark:text-white">{t('cal_title')}</h2>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all hover:bg-indigo-700"
        >
          <Plus size={18} /> <span>{t('add_new')}</span>
        </button>
      </div>

      {/* Takvim */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
              )
            }
            className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-full dark:text-white"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="font-bold text-lg dark:text-white">
            {monthNames[uiLang][currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>

          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
              )
            }
            className="p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-full dark:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Gün başlıkları */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames[uiLang].map((d) => (
            <span
              key={d}
              className="text-xs font-bold text-gray-400 uppercase"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Günler */}
        <div className="grid grid-cols-7 gap-1">
          {Array(adjustedFirstDay)
            .fill(null)
            .map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

          {Array(daysInMonth)
            .fill(null)
            .map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              );
              const dateKey = formatDateKey(dateObj);
              const isSelected = formatDateKey(selectedDate) === dateKey;
              const hasEvent = reminders.some((r) => r.date === dateKey);
              const dayPhoto = getPhotoByDate(dateKey);

              // Mood verisi
              let MoodIconComponent = null;
              let moodStyle = {};

              if (moodHistory[dateKey] && pets.length > 0) {
                const firstPetMood = moodHistory[dateKey][pets[0].id];
                if (firstPetMood && MOOD_ICONS[firstPetMood]) {
                  MoodIconComponent = MOOD_ICONS[firstPetMood].icon;
                  moodStyle = MOOD_ICONS[firstPetMood];
                }
              }

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateObj)}
                  className={`
                    relative h-10 w-10 mx-auto flex items-center justify-center rounded-xl text-sm font-bold transition-all overflow-hidden
                    ${
                      isSelected
                        ? 'ring-2 ring-indigo-600 z-10'
                        : 'hover:bg-gray-100 dark:hover:bg-neutral-800 dark:text-gray-300'
                    }
                  `}
                >
                  {dayPhoto ? (
                    <img
                      src={dayPhoto.webviewPath}
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                      alt="day-memory"
                    />
                  ) : null}

                  {MoodIconComponent && (
                    <div
                      className={`absolute top-0.5 left-0.5 p-0.5 rounded-full z-20 backdrop-blur-sm shadow-sm ${moodStyle.bg} ${
                        !dayPhoto ? 'bg-opacity-100' : 'bg-opacity-90'
                      }`}
                    >
                      <MoodIconComponent
                        size={10}
                        className={moodStyle.color}
                        strokeWidth={3}
                      />
                    </div>
                  )}

                  <span
                    className={`relative z-10 ${
                      dayPhoto ? 'text-white drop-shadow-md text-shadow' : ''
                    }`}
                  >
                    {day}
                  </span>

                  {hasEvent && !dayPhoto && (
                    <div
                      className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-indigo-600' : 'bg-indigo-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Seçili Gün Detayları */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">
            {selectedDate.toLocaleDateString(
              language === 'tr' ? 'tr-TR' : 'en-US',
              {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
              }
            )}
          </h3>

          <button
            onClick={handleCameraClick}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
          >
            <Camera size={20} />
          </button>
        </div>

        {currentDayPhoto && (
          <div className="w-full h-48 rounded-2xl overflow-hidden shadow-md relative group animate-in zoom-in">
            <img
              src={currentDayPhoto.webviewPath}
              className="w-full h-full object-cover"
              alt="Selected Day Memory"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-xs font-bold">
                {language === 'tr' ? 'Günün Anısı' : 'Memory of the Day'}
              </p>
            </div>
          </div>
        )}

        {selectedDateEvents.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">{t('cal_no_events')}</p>
          </div>
        ) : (
          selectedDateEvents.map((event) => {
            const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.other;
            const TypeIcon = typeConfig.icon;
            const colorClass = typeConfig.color; // örn bg-blue-500
            const colorName = colorClass.split('-')[1]; // 'blue'
            const petName =
              pets.find((p) => String(p.id) === String(event.petId))?.name ||
              (language === 'tr' ? 'Genel' : 'General');

            return (
              <div
                key={event.id}
                className="group p-4 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-800 flex items-center gap-4"
              >
                <div
                  className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 text-${colorName}-500`}
                >
                  <TypeIcon size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {event.title}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-neutral-800 rounded-md text-gray-500 font-bold">
                      {event.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium line-clamp-2">
                    {petName} •{' '}
                    {event.type === 'other'
                      ? event.note
                      : t(
                          event.type === 'vaccine'
                            ? 'ev_vaccine'
                            : 'ev_' + event.type
                        )}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReminders(reminders.filter((r) => r.id !== event.id));
                    showNotification(t('ai_action_remove'), 'success');
                  }}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Ay Anıları Butonu */}
      <div className="mt-6">
        <button
          onClick={() => setShowMemory(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
        >
          <Play size={20} fill="white" />{' '}
          {monthNames[uiLang][currentDate.getMonth()]}{' '}
          {language === 'tr' ? 'Anılarını İzle' : 'Memories'}
        </button>

        <div className="mt-4 flex justify-center">
          <button
            onClick={loadDemoPhotos}
            className="text-xs text-gray-400 underline hover:text-indigo-500"
          >
            {language === 'tr'
              ? '[Demo: Rastgele Anı Yükle]'
              : '[Demo: Load Random Memories]'}
          </button>
        </div>
      </div>

      {/* Memory Player */}
      {showMemory && (
        <MemoryPlayer
          photos={getPhotosByMonth(
            currentDate.getMonth(),
            currentDate.getFullYear()
          )}
          monthName={monthNames[uiLang][currentDate.getMonth()]}
          onClose={() => setShowMemory(false)}
        />
      )}

      {/* Hiç pet yoksa uyarı */}
      {showNoPetsWarning && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl border border-gray-100 dark:border-neutral-800">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <PawPrint size={32} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'tr' ? 'Önce Dost Ekle!' : 'Add a Pet First!'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {t('no_pets_desc')}
            </p>
            <button
              onClick={() => setShowNoPetsWarning(false)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors"
            >
              {language === 'tr' ? 'Tamam' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Etkinlik Ekle Modalı */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-6 space-y-4 relative z-10 animate-in slide-in-from-bottom">
            <h3 className="font-bold text-lg dark:text-white">
              {t('cal_add_event')}
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold transition-all border-transparent"
                placeholder={t('name_placeholder')}
              />

              <div className="flex gap-3">
                <select
                  value={newEvent.petId}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, petId: e.target.value })
                  }
                  className={`flex-1 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold transition-all ${
                    pets.length === 0
                      ? 'border-red-500 text-red-500'
                      : 'border-transparent'
                  }`}
                >
                  <option value="">{t('select')}</option>
                  {pets.length === 0 ? (
                    <option value="" disabled>
                      ⚠️ {language === 'tr' ? 'Önce Dost Ekle!' : 'Add a Pet First!'}
                    </option>
                  ) : (
                    pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                </select>

                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, time: e.target.value })
                  }
                  className="w-24 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold transition-all border-transparent"
                />
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Repeat size={18} />
                </div>
                <select
                  value={newEvent.frequency}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, frequency: e.target.value })
                  }
                  className="w-full p-4 pl-12 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold transition-all border-transparent appearance-none"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
                  size={18}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Object.keys(EVENT_TYPES).map((type) => {
                  const isActive = newEvent.type === type;
                  const TIcon = EVENT_TYPES[type].icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setNewEvent({ ...newEvent, type })}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                          : 'border-gray-100 dark:border-neutral-800 text-gray-400'
                      }`}
                    >
                      <TIcon size={20} className="mb-1" />
                      <span className="text-[10px] font-bold">
                        {EVENT_TYPES[type].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddEvent}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 active:scale-95 transition-transform"
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCalendar;
