import { customAlphabet } from 'nanoid';

// ==========================================
// 1. YAPILANDIRMA VE API ANAHTARLARI
// ==========================================

export const geminiApiKey = import.meta.env.VITE_GEMINI_KEY;
export const mapsApiKey = import.meta.env.VITE_MAPS_API_KEY;

// ==========================================
// 2. YARDIMCI FONKSİYONLAR
// ==========================================

// ID OLUŞTURUCU
const nanoid = customAlphabet(
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  8
);

export const generateID = () => nanoid();

// API İSTEKÇİSİ (retry destekli)
export const fetchWithRetry = async (url, options, retries = 5, delay = 1000) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'API Error');
    }
    return data;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
};

// Renk ayarlama
export const adjustColor = (color, amount) => {
  if (!color) return '#000000';
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return (
    '#' +
    hex.replace(/../g, (c) => {
      const val = parseInt(c, 16);
      if (isNaN(val)) return '00';
      return (
        '0' +
        Math.min(255, Math.max(0, val + amount))
          .toString(16)
          .substr(-2)
      );
    })
  );
};

// Yaş Hesaplama
export const calculateAge = (birthDate, t) => {
  if (!birthDate) return '-';
  const today = new Date();
  const birth = new Date(birthDate);
  if (birth > today) return '-';

  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  if (months < 0) months = 0;

  if (months >= 12) {
    return `${Math.floor(months / 12)} ${t('age_y') || 'y'}`;
  }
  return `${months} ${t('age_m') || 'm'}`;
};

// ==========================================
// 3. DİL LİSTESİ
// ==========================================

export const LANGUAGES = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ja: '日本語 (Japanese)',
};

// ==========================================
// 4. ÇEVİRİLER
//    – Buraya eklediğimiz tüm key’ler t('key') ile kullanılabilir
// ==========================================

export const TRANSLATIONS = {
  tr: {
    // Genel / Navigation
    welcome: 'Hoşgeldin',
    ai_intro: 'Merhaba! Ben Pattty.',
    nav_summary: 'Özet',
    nav_pets: 'Dostlarım',
    nav_ai: 'Asistan',
    nav_calendar: 'Takvim',
    nav_account: 'Profil',
    nav_vet: 'Vet Bul',

    // Tabs
    tab_vaccine: 'Aşılar',
    tab_weight: 'Kilo',
    tab_notes: 'Notlar',
    tab_game: 'Oyunlar',

    // Intro
    intro_welcome_title: "Pattty'ye Hoşgeldin",
    intro_welcome_desc: 'Evcil dostlarınız için yeni nesil sağlık ve yaşam asistanı.',
    intro_home_title: 'Kontrol Paneli',
    intro_home_desc:
      'Dostunuzun günlük ruh halini, sağlık özetini ve aktivite serisini tek bakışta görün.',
    intro_pets_title: 'Dijital Kimlik',
    intro_pets_desc:
      'Tüm dostlarınızın detaylı profilleri, aşı karneleri ve gelişim grafikleri elinizin altında.',
    intro_ai_title: 'Pattty AI',
    intro_ai_desc: 'Görsel zeka destekli veteriner asistanı. Fotoğraf atın, analiz etsin.',
    intro_calendar_title: 'Akıllı Ajanda',
    intro_calendar_desc: 'Aşılar, randevular ve tekrarlayan ilaç hatırlatıcıları.',
    intro_account_title: 'Kişiselleştirme',
    intro_account_desc: 'Ayarlarınızı ve tercihlerinizi yönetin.',
    intro_btn_next: 'Devam Et',
    intro_btn_start: 'Keşfetmeye Başla',
    intro_btn_skip: 'Turu Geç',

    // Event / Kategori etiketleri
    ev_vaccine: 'Aşı',
    ev_vet: 'Veteriner',
    ev_med: 'İlaç',
    ev_groom: 'Bakım',
    ev_play: 'Oyun',
    ev_other: 'Diğer',

    // Takvim
    cal_title: 'Takvim & Hatırlatıcı',
    add_new: 'Yeni Ekle',
    cal_no_events: 'Planlanmış etkinlik yok.',
    cal_add_event: 'Etkinlik Ekle',

    // Mood
    mood_happy: 'Mutlu',
    mood_energetic: 'Enerjik',
    mood_sleepy: 'Uykulu',
    mood_sick: 'Hasta',
    how_feeling: 'bugün nasıl hissediyor?',
    logged_xp: 'Kaydedildi!',

    // Pets
    my_pets_title: 'Dostlarım',
    no_pets_title: 'Merhaba!',
    no_pets_desc: 'Henüz hiç dostun yok. Takibe başlamak için ekle.',
    add_first_pet: 'İlk Dostunu Ekle',

    // Genel buton & form
    save: 'Kaydet',
    cancel: 'Vazgeç',
    update: 'Güncelle',
    delete: 'Sil',
    edit: 'Düzenle',
    back: 'Geri',
    done: 'Bitti',
    select: 'Seçiniz',
    name_placeholder: 'İsim giriniz',

    // Form alanları
    form_type: 'Tür',
    form_name: 'İsim',
    form_breed: 'Irk',
    form_gender: 'Cinsiyet',
    form_color: 'Renk',
    form_birth: 'Doğum Tarihi',
    form_weight: 'Kilo',
    form_grow: 'Aileni Büyüt',
    form_custom_type: 'Tür Giriniz',
    custom_type_placeholder: 'Örn: Hamster',
    other_types: 'Diğer...',

    // Türler
    type_cat: 'Kedi',
    type_dog: 'Köpek',
    type_bird: 'Kuş',
    type_rabbit: 'Tavşan',
    type_fish: 'Balık',
    type_turtle: 'Kaplumbağa',
    type_other: 'Diğer',

    // Ayarlar / Hesap
    set_lang: 'Dil Ayarları',
    set_dark: 'Koyu Tema',
    set_notif: 'Bildirimler',
    set_privacy: 'Gizlilik',
    acc_title: 'Hesabım',
    acc_my_account: 'Profilim',
    acc_settings: 'Genel Ayarlar',
    set_support: 'Destek',
    set_help: 'Yardım',
    set_terms: 'Kullanım Koşulları',
    set_logout: 'Çıkış Yap',

    // Hesap — yeni eklenenler
    acc_about: 'Hakkında',
    acc_find_vet: 'Yakındaki Veterinerleri Bul',
    acc_delete_account: 'Hesabı Sil',
    acc_delete_confirm_title: 'Hesabı Sil',
    acc_delete_confirm_desc:
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
    acc_delete_confirm_yes: 'Evet, Sil',
    acc_delete_confirm_cancel: 'İptal',

    // Bildirim ayarları
    notif_vaccine: 'Aşı Hatırlatıcıları',
    notif_vet: 'Veteriner Randevuları',
    notif_daily: 'Günlük Görevler',
    notif_dnd: 'Rahatsız Etme',
    notif_dnd_desc: 'Gece bildirimleri sessize al',
    gen_general: 'Genel',

    // Hata & AI
    err_missing_fields: 'Lütfen zorunlu alanları doldurun.',
    ai_action_add: 'Eklendi:',
    ai_action_remove: 'Silindi:',
    ai_action_vaccine: 'Aşı İşlendi:',
    err_ai_missing_info: 'Bilgiler eksik.',
    ai_error_api: 'Bağlantı hatası.',
    ai_typing: 'yazıyor...',
    ai_placeholder: 'Bir şeyler sor...',

    // Birimler & Detaylar
    age_y: 'Yıl',
    age_m: 'Ay',

    // Pet detay tab başlıkları
    tab_notes: 'Notlar',
    game_title: 'Oyunlar',

    // Kilo
    weight_title: 'Kilo Grafiği',
    weight_exists_error: 'Bugün zaten ölçüm yapıldı.',
    err_neg_val: 'Geçersiz değer.',
    weight_add: 'Ölçüm Ekle',

    // Notlar
    note_placeholder: 'Bir not al...',
    note_empty: 'Henüz not yok.',

    // Aşı / Vaccine Manager
    vaccine_title: 'Aşı Takvimi',
    vac_ai_btn: 'AI ile Planla',
    vac_manual_btn: 'Manuel Ekle',
    vac_ai_error: 'Plan oluşturulamadı.',
    vac_date_error: 'Tarih seçmelisiniz.',
    vac_add: 'Aşı Ekle',
    vac_manage: 'Aşı Yönetimi',
    vac_next: 'Sonraki Aşı',
    vac_none: 'Henüz aşı eklenmedi.',
    vac_plan: 'Aşı Planı',
    vac_done: 'Aşı Yapıldı',

    // Silme diyalogları (genel)
    del_title: 'Sil?',
    del_desc: 'Bu işlem geri alınamaz.',
    del_yes: 'Evet, Sil',

    // Oyun (mini game tab)
    game_draw: 'Berabere',
    game_win: 'Kazandın!',
    game_lose: 'Kaybettin',

    // Vet Locator & Detay
    vet_find_loc: 'Yakınımdaki veterinerleri bul',
    vet_locating: 'Konum aranıyor...',
    vet_open: 'Açık',
    vet_closed: 'Kapalı',
    vet_distance: 'Mesafe',
    vet_rating: 'Puan',
    vet_hours: 'Çalışma Saatleri',
    vet_no_hours: 'Çalışma saatleri bilgisi bulunmuyor.',
    vet_navigate: 'Haritada Aç',
    vet_call: 'Kliniği Ara',
  },

  // ================== ENGLISH ==================
  en: {
    // General / Navigation
    welcome: 'Welcome',
    ai_intro: "Hello! I'm Pattty.",
    nav_summary: 'Summary',
    nav_pets: 'Pets',
    nav_ai: 'Assistant',
    nav_calendar: 'Calendar',
    nav_account: 'Profile',
    nav_vet: 'Find Vet',

    // Tabs
    tab_vaccine: 'Vaccines',
    tab_weight: 'Weight',
    tab_notes: 'Notes',
    tab_game: 'Games',

    // Intro
    intro_welcome_title: 'Welcome to Pattty',
    intro_welcome_desc: 'Next-gen health and life assistant for your pets.',
    intro_home_title: 'Dashboard',
    intro_home_desc:
      'View your pet’s daily mood, health summary, and streak in one glance.',
    intro_pets_title: 'Digital ID',
    intro_pets_desc:
      'Detailed profiles, vaccine cards and growth charts for all your pets.',
    intro_ai_title: 'Pattty AI',
    intro_ai_desc: 'Visual vet assistant. Send a photo, get insights.',
    intro_calendar_title: 'Smart Agenda',
    intro_calendar_desc: 'Vaccines, appointments and recurring medications.',
    intro_account_title: 'Personalization',
    intro_account_desc: 'Manage your preferences and settings.',
    intro_btn_next: 'Continue',
    intro_btn_start: 'Start Exploring',
    intro_btn_skip: 'Skip Tour',

    // Event / category
    ev_vaccine: 'Vaccine',
    ev_vet: 'Vet',
    ev_med: 'Meds',
    ev_groom: 'Grooming',
    ev_play: 'Play',
    ev_other: 'Other',

    // Calendar
    cal_title: 'Calendar & Reminders',
    add_new: 'Add New',
    cal_no_events: 'No scheduled events.',
    cal_add_event: 'Add Event',

    // Mood
    mood_happy: 'Happy',
    mood_energetic: 'Energetic',
    mood_sleepy: 'Sleepy',
    mood_sick: 'Sick',
    how_feeling: 'how is feeling today?',
    logged_xp: 'Logged!',

    // Pets
    my_pets_title: 'My Pets',
    no_pets_title: 'Hello!',
    no_pets_desc: 'No pets yet. Start tracking by adding one.',
    add_first_pet: 'Add First Pet',

    // General form & buttons
    save: 'Save',
    cancel: 'Cancel',
    update: 'Update',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    done: 'Done',
    select: 'Select',
    name_placeholder: 'Enter name',

    // Form fields
    form_type: 'Pet Type',
    form_name: 'Name',
    form_breed: 'Breed',
    form_gender: 'Gender',
    form_color: 'Color',
    form_birth: 'Birth Date',
    form_weight: 'Weight',
    form_grow: 'Add New Pet',
    form_custom_type: 'Type',
    custom_type_placeholder: 'E.g. Hamster',
    other_types: 'More...',

    // Types
    type_cat: 'Cat',
    type_dog: 'Dog',
    type_bird: 'Bird',
    type_rabbit: 'Rabbit',
    type_fish: 'Fish',
    type_turtle: 'Turtle',
    type_other: 'Other',

    // Settings / Account
    set_lang: 'Language Settings',
    set_dark: 'Dark Theme',
    set_notif: 'Notifications',
    set_privacy: 'Privacy',
    acc_title: 'Account',
    acc_my_account: 'My Profile',
    acc_settings: 'General Settings',
    set_support: 'Support',
    set_help: 'Help',
    set_terms: 'Terms of Use',
    set_logout: 'Log Out',

    // Account extras
    acc_about: 'About',
    acc_find_vet: 'Find Nearby Vets',
    acc_delete_account: 'Delete Account',
    acc_delete_confirm_title: 'Delete Account',
    acc_delete_confirm_desc:
      'Are you sure you want to delete your account? This action cannot be undone.',
    acc_delete_confirm_yes: 'Yes, Delete',
    acc_delete_confirm_cancel: 'Cancel',

    // Notification settings
    notif_vaccine: 'Vaccine Reminders',
    notif_vet: 'Vet Appointments',
    notif_daily: 'Daily Tasks',
    notif_dnd: 'Do Not Disturb',
    notif_dnd_desc: 'Mute notifications at night',
    gen_general: 'General',

    // Errors & AI
    err_missing_fields: 'Please fill in required fields.',
    ai_action_add: 'Added:',
    ai_action_remove: 'Removed:',
    ai_action_vaccine: 'Vaccine Added:',
    err_ai_missing_info: 'Missing information.',
    ai_error_api: 'Connection error.',
    ai_typing: 'typing...',
    ai_placeholder: 'Ask something...',

    // Units & details
    age_y: 'y',
    age_m: 'm',

    // Tabs / titles
    game_title: 'Games',

    // Weight
    weight_title: 'Weight Chart',
    weight_exists_error: 'Entry already exists for today.',
    err_neg_val: 'Invalid value.',
    weight_add: 'Add Entry',

    // Notes
    note_placeholder: 'Add a note...',
    note_empty: 'No notes yet.',

    // Vaccine / Vaccine Manager
    vaccine_title: 'Vaccine Schedule',
    vac_ai_btn: 'Plan with AI',
    vac_manual_btn: 'Add Manually',
    vac_ai_error: 'Could not create plan.',
    vac_date_error: 'You must select a date.',
    vac_add: 'Add Vaccine',
    vac_manage: 'Manage Vaccines',
    vac_next: 'Next Vaccine',
    vac_none: 'No vaccines added yet.',
    vac_plan: 'Vaccine Plan',
    vac_done: 'Vaccine Completed',

    // Delete dialogs (generic)
    del_title: 'Delete?',
    del_desc: 'This action cannot be undone.',
    del_yes: 'Yes, Delete',

    // Game
    game_draw: 'Draw',
    game_win: 'You Win!',
    game_lose: 'You Lose',

    // Vet Locator & Detail
    vet_find_loc: 'Find vets near me',
    vet_locating: 'Searching location...',
    vet_open: 'Open',
    vet_closed: 'Closed',
    vet_distance: 'Distance',
    vet_rating: 'Rating',
    vet_hours: 'Opening Hours',
    vet_no_hours: 'No opening hours information.',
    vet_navigate: 'Open in Maps',
    vet_call: 'Call Clinic',
  },
};

// ==========================================
// 5. Tür bazlı lokal veri
// ==========================================

export const getLocalizedData = (lang, t) => {
  const l = TRANSLATIONS[lang] ? lang : 'en';

  const BREEDS = {
    cat: {
      tr: ['Tekir', 'British', 'Scottish', 'Siyam', 'Persian', 'Van', 'Diğer'],
      en: ['Tabby', 'British', 'Scottish', 'Siamese', 'Persian', 'Van', 'Other'],
    },
    dog: {
      tr: ['Golden', 'Terrier', 'Bulldog', 'Poodle', 'Kangal', 'Alman Kurdu', 'Diğer'],
      en: ['Golden', 'Terrier', 'Bulldog', 'Poodle', 'Kangal', 'Shepherd', 'Other'],
    },
    bird: {
      tr: ['Muhabbet Kuşu', 'Papağan', 'Kanarya', 'Diğer'],
      en: ['Parakeet', 'Parrot', 'Canary', 'Other'],
    },
    rabbit: {
      tr: ['Hollanda Lop', 'Aslanbaş', 'Diğer'],
      en: ['Holland Lop', 'Lionhead', 'Other'],
    },
    fish: {
      tr: ['Japon Balığı', 'Beta', 'Diğer'],
      en: ['Goldfish', 'Betta', 'Other'],
    },
    turtle: {
      tr: ['Su Kaplumbağası', 'Diğer'],
      en: ['Water Turtle', 'Other'],
    },
    other: {
      tr: ['Diğer'],
      en: ['Other'],
    },
  };

  const VACCINES = {
    cat: {
      tr: ['Karma', 'Kuduz', 'Lösemi', 'FIV', 'İç Parazit'],
      en: ['FVRCP', 'Rabies', 'FeLV', 'FIV', 'Deworming'],
    },
    dog: {
      tr: ['Karma', 'Kuduz', 'Bronşin', 'Corona', 'İç Parazit'],
      en: ['DHPP', 'Rabies', 'Bordetella', 'Corona', 'Deworming'],
    },
    other: {
      tr: ['Genel Muayene'],
      en: ['Checkup'],
    },
  };

  return {
    breeds: (type) => (BREEDS[type]?.[l] || BREEDS.other[l] || []),
    vaccines: (type) => (VACCINES[type]?.[l] || VACCINES.other[l] || []),
  };
};
