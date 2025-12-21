import { customAlphabet } from 'nanoid';

// 🟢 FIREBASE FUNCTIONS BAĞLANTISI
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';

/* ========================================================================== */
/* 1. YAPILANDIRMA VE API ANAHTARLARI                                           */
/* ========================================================================== */

export const geminiApiKey = import.meta.env.VITE_GEMINI_KEY;
export const mapsApiKey = import.meta.env.VITE_MAPS_API_KEY;

// 🟢 AI Endpoint
export const AI_SERVER_URL =
  'https://us-central1-pattty-7adff.cloudfunctions.net/chatWithAI';

/* ========================================================================== */
/* 2. GENEL YARDIMCI FONKSİYONLAR                                               */
/* ========================================================================== */

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

    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message ||
          errorData.message ||
          errorMessage;
      } catch {
        /* ignore */
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (data?.error) {
      throw new Error(data.error.message || 'API Error');
    }
    return data;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, delay));
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
    hex = hex.split('').map(c => c + c).join('');
  }

  const result = hex.match(/.{2}/g).map(c => {
    const val = parseInt(c, 16);
    const adjusted = Math.min(255, Math.max(0, val + amount));
    return adjusted.toString(16).padStart(2, '0');
  }).join('');

  return `#${result}`;
};

// Yaş hesaplama
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
    return `${Math.floor(months / 12)} ${t('age_y')}`;
  }
  return `${months} ${t('age_m') || 'm'}`;
};

/* ========================================================================== */
/* 3. TARİH YARDIMCILARI (LOCAL TIMEZONE)                                      */
/* ========================================================================== */

export const APP_TIMEZONE = 'Europe/Istanbul';

// YYYY-MM-DD (local timezone)
export const getLocalYMD = (date = new Date(), timeZone = APP_TIMEZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

// YYYY-MM-DD + / - gün
export const addDaysYMD = (ymd, days) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const baseUtc = Date.UTC(y, m - 1, d);
  const next = new Date(baseUtc + days * 86400000);

  return `${next.getUTCFullYear()}-${String(
    next.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
};

/* ========================================================================== */
/* 4. STREAK & BADGE BACKEND SENKRON (USERS/{uid})                              */
/* ========================================================================== */

const BADGE_DEFINITIONS = [
  { id: 'weekly_7', threshold: 7 },
  { id: 'monthly_30', threshold: 30 },
  { id: 'yearly_365', threshold: 365 },
];

export const updateDailyStreakAndBadges = async (userId) => {
  if (!userId) throw new Error('userId is required');

  const db = getFirestore(app);

  const today = getLocalYMD();
  const yesterday = addDaysYMD(today, -1);

  const userRef = doc(db, 'users', userId);

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.exists() ? snap.data() : {};

    const lastCheckin = data.lastCheckinDate || null;
    const prevStreak = Number(data.streakCount || 0);
    const prevBadges = Array.isArray(data.badgesEarned)
      ? data.badgesEarned
      : [];

    let nextStreak;

    // 🔥 STREAK HESABI
    if (!lastCheckin) {
      nextStreak = 1;
    } else if (lastCheckin === today) {
      nextStreak = prevStreak;
    } else if (lastCheckin === yesterday) {
      nextStreak = prevStreak + 1;
    } else {
      nextStreak = 1;
    }

    // 🏆 BADGE HESABI
    const newlyEarned = [];
    for (const badge of BADGE_DEFINITIONS) {
      if (nextStreak >= badge.threshold && !prevBadges.includes(badge.id)) {
        newlyEarned.push(badge.id);
      }
    }

    const nextBadges = newlyEarned.length
      ? [...prevBadges, ...newlyEarned]
      : prevBadges;

    tx.set(
      userRef,
      {
        streakCount: nextStreak,
        lastCheckinDate: today,
        badgesEarned: nextBadges,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      streakCount: nextStreak,
      badgesEarned: nextBadges,
      newlyEarned,
    };
  });
};

/* ========================================================================== */
/* 5. BADGE META & PROGRESS (UI DESTEK)                                        */
/* ========================================================================== */

export const BADGES = {
  weekly_7: {
    threshold: 7,
    titleKey: 'badge_weekly_title',
    descKey: 'badge_weekly_desc',
  },
  monthly_30: {
    threshold: 30,
    titleKey: 'badge_monthly_title',
    descKey: 'badge_monthly_desc',
  },
  yearly_365: {
    threshold: 365,
    titleKey: 'badge_yearly_title',
    descKey: 'badge_yearly_desc',
  },
};

export const getNextBadgeProgress = (streak, earnedBadges = []) => {
  const pending = Object.entries(BADGES)
    .filter(([id]) => !earnedBadges.includes(id))
    .sort((a, b) => a[1].threshold - b[1].threshold);

  if (!pending.length) return null;

  const [badgeId, badge] = pending[0];
  return {
    badgeId,
    current: Math.min(streak, badge.threshold),
    target: badge.threshold,
  };
};

/* ========================================================================== */
/* 6. FILE → BASE64                                                            */
/* ========================================================================== */

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

/* ========================================================================== */
/* 7. GEMINI ANALİZ                                                            */
/* ========================================================================== */

export const analyzePetPhoto = async (file) => {
  const functions = getFunctions(app);
  const analyzeFn = httpsCallable(functions, 'analyzePetPhoto');

  const base64Image = await fileToBase64(file);
  const result = await analyzeFn({
    imageBase64: base64Image,
    mimeType: file.type,
  });

  return result.data;
};

/* ========================================================================== */
/* 8. IMAGEN GÖRSEL ÜRETİMİ                                                    */
/* ========================================================================== */

export const generateStyledPetImage = async (petData, refinementPrompt = '') => {
  const functions = getFunctions(app);
  const generateFn = httpsCallable(functions, 'generatePetAvatar');

  const result = await generateFn({
    petDetails: petData,
    refinement: refinementPrompt,
  });

  if (!result.data?.url) {
    throw new Error('Görsel oluşturulamadı.');
  }

  return result.data.url;
};

/* ========================================================================== */
/* 9. GENEL AI SOHBET                                                          */
/* ========================================================================== */

export const askAIWithImage = async (systemPrompt, imageBase64, mimeType = 'image/jpeg') => {
  const response = await fetch(AI_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: systemPrompt },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
    }),
  });

  if (!response.ok) throw new Error('AI Server Error');

  const data = await response.json();
  const cleanText = data.text.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleanText);
  } catch {
    return cleanText;
  }
};

/* ========================================================================== */
/* 10. SCAN STATUS STEPS                                                       */
/* ========================================================================== */

export const getScanStatusSteps = (t) => [
  t('scan_step_1'),
  t('scan_step_2'),
  t('scan_step_3'),
  t('scan_step_4'),
];

// ==========================================
// 5. DİL LİSTESİ
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
// 6. ÇEVİRİLER
// ==========================================

export const TRANSLATIONS = {
  tr:  {
    // --- AI SYSTEM & PROMPTS (YENİ EKLENENLER) ---
    ai_prompt_scan_vaccine: "GÖREV: Bu görsel bir evcil hayvan aşı karnesidir. Görseldeki aşı isimlerini ve tarihlerini (yapılmış veya yapılacak) analiz et. ÇIKTI FORMATI: SADECE geçerli bir JSON dizisi (array) döndür. Başka hiçbir metin yazma. JSON Örneği: [{'name': 'Karma Aşı', 'date': '2024-05-20'}, {'name': 'Kuduz', 'date': '2024-06-15'}] KURALLAR: - Tarih okunamazsa veya yoksa, bugünün tarihinden 1 ay sonrasını yaz. - Aşı isimlerini {lang} diline çevir. - Eğer aşı listesi bulunamazsa boş dizi [] döndür.",
    ai_prompt_suggest_vaccine: "GÖREV: Lisanslı bir veteriner asistanı gibi davran. Aşağıdaki evcil hayvan için EKSİK olan veya ZAMANI GELMİŞ aşı takvimini oluştur. HAYVAN: {petName}, Tür: {petType}, Yaş: {petAge}. MEVCUT AŞILAR: {existingList}. ÇIKTI FORMATI: SADECE geçerli bir JSON objesi döndür. JSON Şeması: { 'vaccines': [{'name': 'Aşı Adı', 'date': 'YYYY-MM-DD'}] } KURALLAR: - Sadece gerekli olan aşıları öner. - Tarihleri bugünden ({today}) en az 1 hafta sonraya ver. - Cevabı {lang} ver.",
    
    // AI Assistant System Instruction Keys
    ai_sys_role_title: "KİMLİK",
    ai_sys_role_desc: "Sen Pattty, uzman bir Veteriner Asistanı ve Teknik Destek Uzmanısın. Doğru ve detaylı bilgi ver.",
    ai_sys_user_profile: "KULLANICI PROFİLİ",
    ai_sys_chat_history: "SOHBET GEÇMİŞİ",
    ai_sys_guide_title: "UYGULAMA KULLANIM KILAVUZU",
    ai_sys_format_rules_title: "KRİTİK GÖRSEL FORMATLAMA KURALLARI",
    ai_sys_rule_no_table: "ASLA TABLO KULLANMA",
    ai_sys_rule_no_header: "ASLA BAŞLIK ETİKETİ KULLANMA (#)",
    ai_sys_rule_list: "Bilgileri maddeler halinde sun (- ile)",
    ai_sys_rule_bold: "Önemli yerleri **kalın** yap",
    ai_sys_cat_general: "GENEL AYARLAR & HESAP",
    ai_sys_cat_pet: "EVCİL HAYVAN YÖNETİMİ",
    ai_sys_cat_health: "SAĞLIK & TAKİP",
    ai_sys_cat_tools: "ÖZEL ARAÇLAR",
    ai_sys_cat_id: "DİJİTAL KİMLİK",
    ai_sys_faq_title: "SIK SORULAN SORULAR",
    ai_sys_behavior_title: "DAVRANIŞ KURALLARI",
    ai_sys_tools_title: "ARAÇLAR (JSON FORMATINDA YANITLA)",
    ai_sys_tools_desc: "Sadece eylem gerekiyorsa aşağıdaki JSON formatlarını kullan. Sohbet ederken normal metin kullan.",
    
    // Tool Names
    tool_pet_add: "HAYVAN EKLEME",
    tool_vac_add: "AŞI İŞLEME",
    tool_rem_add: "HATIRLATICI",
    tool_weight_add: "KİLO GİRİŞİ",
    tool_note_add: "NOT ALMA",

    // Labels for AI Context
    lbl_name: "İsim",
    lbl_type: "Tür",
    lbl_breed: "Irk",
    lbl_gender: "Cinsiyet",
    lbl_weight: "Kilo",
    lbl_birth: "Doğum",
    lbl_date_today: "BUGÜNÜN TARİHİ",
    status_label: "Üyelik Durumu",
    pets_label: "Kayıtlı Hayvanlar",
    user_label: "Kullanıcı",
    ai_label: "Pattty",
    system_action_label: "Sistem İşlemi",
    image_label: "[Görsel]",
    dot_placeholder: ".",

    // AI Action Responses & Errors
    ai_action_missing_info: "Gerekli bilgiler eksik, işlem yapılamadı.",
    ai_action_pet_exists: "{name} isimli bir dostunuz zaten kayıtlı.",
    ai_action_pet_added: "{name} başarıyla ailene eklendi!",
    ai_action_add_vaccine: "{name} için {vaccine} aşısı işlendi.",
    ai_error_pet_not_found: "{name} isminde bir evcil hayvan bulunamadı.",
    ai_action_add_reminder: "{title} hatırlatıcısı {date} tarihine eklendi.",
    ai_action_add_weight: "{name} için {weight}kg kilo bilgisi eklendi.",
    ai_action_add_note: "{name} için not alındı.",
    ai_error_server: "AI Sunucu Hatası: ",
    ai_error_no_response: "Yanıt alınamadı.",
    ai_error_connection: "Bağlantı hatası, lütfen tekrar deneyin.",
    
    // General Errors (Backend/DB)
    err_server_error: "Sunucu hatası",
    err_scan_failed: "Tarama başarısız oldu",
    err_vac_add: "Aşı eklenirken hata oluştu",
    err_vac_update: "Aşı güncellenirken hata oluştu",
    err_note_add: "Not eklenirken hata oluştu",
    err_note_delete: "Not silinirken hata oluştu",
    err_note_update: "Not güncellenirken hata oluştu",
    err_camera: "Kamera hatası",
    err_action_handler: "Eylem işleyici hatası",
    err_ai_generic: "Yapay zeka hatası",

    // Misc
    image_alt: "Gönderilen görsel",
    image_preview_alt: "Görsel önizleme",

    // Genel / Navigation
    welcome: 'Hoşgeldin',
    ai_intro: 'Merhaba! Ben Pattty.',
    nav_summary: 'Özet',
    nav_pets: 'Dostlarım',
    nav_ai: 'Asistan',
    nav_calendar: 'Takvim',
    nav_account: 'Profil',
    nav_vet: 'Vet Bul',
    page_not_found: "Sayfa Bulunamadı",
    loading: "Yükleniyor...",

    // Tabs
    tab_vaccine: 'Aşılar',
    tab_weight: 'Kilo',
    tab_notes: 'Notlar',
    tab_game: 'Oyunlar',

    step_1_title: "Fotoğraf Yükle",
    step_1_desc: "Dostunuzun net bir fotoğrafını yükleyin.",
    step_2_title: "AI Analizi",
    step_2_desc: "Fotoğraf taranıyor ve detaylar çıkarılıyor...",
    step_3_title: "Kimlik Bilgileri",
    step_3_desc: "Otomatik doldurulan bilgileri kontrol edin.",
    step_4_title: "Fiziksel Detaylar",
    step_4_desc: "Son dokunuşları yapın.",
    step_5_title: "Onay ve Oluşturma",
    step_5_desc: "AI Görseli ve Son Kontrol.",

    confirm_details_title: "Bilgilerin Doğruluğundan Emin Misiniz?",
    confirm_details_desc_free: "Ücretsiz planda, oluşturulan profil bilgileri 24 saat boyunca değiştirilemez. Lütfen tüm bilgilerin doğru olduğundan emin olun.",
    confirm_details_desc_premium: "Premium üye olarak bilgileri dilediğiniz zaman güncelleyebilirsiniz.",
    
    btn_not_suitable: "Bu Görsel Uygun Değil",
    regen_prompt_placeholder: "Örn: Gözleri daha yeşil olsun, arka plan orman olsun...",
    btn_regenerate: "Yeniden Oluştur",
    regen_remaining: "Kalan Hakkınız:",
    regen_limit_reached: "Yeniden oluşturma limitine ulaştınız.",
    ai_style_generating: "Stilize Görsel Oluşturuluyor...",

    // YENİ EKLENEN TARAMA ADIMLARI
    scan_step_1: "Yüz hatları taranıyor...",
    scan_step_2: "Tüy rengi ve yapısı analiz ediliyor...",
    scan_step_3: "Irk veritabanında eşleşme aranıyor...",
    scan_step_4: "Profil bilgileri oluşturuluyor...",
    
    ai_analyzing_btn: "Fotoğrafı Analiz Et",
    ai_analyzing_wait: "İnceleniyor...",
    ai_auto_fill_tooltip: "Bu bilgiler yüklediğiniz fotoğraf analiz edilerek otomatik doldurulmuştur. Lütfen doğruluğunu kontrol ediniz.",
    ai_scan_success: "Tarama Tamamlandı!",
    
    upload_area_title: "Fotoğrafı Buraya Sürükle",
    upload_area_desc: "veya seçmek için dokun",

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
    ai_title: 'AI Asistan',
    intro_ai_desc: 'Görsel zeka destekli veteriner asistanı. Fotoğraf atın, analiz etsin.',
    intro_calendar_title: 'Akıllı Ajanda',
    intro_calendar_desc: 'Aşılar, randevular ve tekrarlayan ilaç hatırlatıcıları.',
    intro_account_title: 'Kişiselleştirme',
    intro_account_desc: 'Ayarlarınızı ve tercihlerinizi yönetin.',
    intro_btn_next: 'Devam Et',
    intro_btn_start: 'Keşfetmeye Başla',
    intro_btn_skip: 'Turu Geç',

    form_neutered: "Kısırlaştırma Durumu",
    neutered_yes: "Kısırlaştırılmış",
    neutered_no: "Kısır Değil",

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
    cal_month_memories: 'Anılarını İzle',
    cal_day_memory: 'Günün Anısı',
    cal_load_demo_memories: '[Demo: Rastgele Anı Yükle]',
    cal_memory_saved_notif: 'Anı kaydedildi! 📸',
    cal_add_event_no_pet_warning: 'Önce Dost Ekle!',
    freq_once: 'Tek Seferlik',
    freq_daily: 'Günlük (30 Gün)',
    freq_weekly: 'Haftalık (1 Yıl)',
    freq_monthly: 'Aylık (1 Yıl)',
    freq_yearly: 'Yıllık (5 Yıl)',

    exp_no_note: "Not yok",
    err_amount_required: "Tutar Giriniz",

    // Mood
    mood_happy: 'Mutlu',
    mood_energetic: 'Enerjik',
    mood_sleepy: 'Uykulu',
    mood_sick: 'Hasta',
    how_feeling: 'bugün nasıl hissediyor?',
    logged_xp: 'Kaydedildi!',

    exp_total: "TOPLAM",
    exp_comparison_title: "Aylık Karşılaştırma",
    exp_vs_prev_month: "Geçen aya göre durum",
    exp_prev_month: "Geçen Ay",
    exp_curr_month: "Bu Ay",

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
    ok_btn: 'Tamam',
    change_photo: 'Değiştir', // EKLENDİ

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
    gender_f_label: 'Dişi',
    gender_m_label: 'Erkek',
    unit_kg: 'KG',
    hide: 'Gizle',
    phone: 'Telefon',
    address: 'Adres',

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
    set_help: 'Yardım & SSS',
    set_terms: 'Kullanım Koşulları',
    set_logout: 'Çıkış Yap',
    acc_guest: 'Misafir',
    acc_no_login: 'Giriş yapılmadı',
    login_step_title: 'Son Bir Adım!',
    login_step_desc: 'İletişim bilgilerini tamamla.',
    login_desc: 'Dostların için en iyisi.',
    email_placeholder: 'E-posta Adresi',
    password_placeholder: 'Şifre',
    login_btn: 'Giriş Yap',
    or: 'veya',
    login_with_google: 'Google ile Devam Et',
    name_required_placeholder: 'Ad Soyad *',
    email_required_placeholder: 'E-posta *',
    password_required_placeholder: 'Şifre *',
    phone_required_placeholder: 'Telefon Numarası *',
    address_optional_placeholder: 'Adres (İsteğe bağlı)',
    complete_and_start_btn: 'Tamamla ve Başla',
    register_btn: 'Hesap Oluştur',
    no_account: 'Hesabın yok mu?',
    register_link: 'Kayıt Ol',
    already_member: 'Zaten üye misin?',
    login_link: 'Giriş Yap',
    gen_general: 'Genel',
    placeholder_email_example: 'ornek@pattty.com', // EKLENDİ
    placeholder_password_dots: '••••••••', // EKLENDİ

    // Hesap — yeni eklenenler
    acc_about: 'Hakkında',
    acc_find_vet: 'Yakındaki Veterinerleri Bul',
    acc_delete_account: 'Hesabı Sil',
    acc_delete_confirm_title: 'Hesabı Sil',
    acc_delete_confirm_desc:
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
    acc_delete_confirm_yes: 'Evet, Sil',
    acc_delete_confirm_cancel: 'İptal',

    // YARDIM, GİZLİLİK, KOŞULLAR
    privacy_title: 'Gizlilik Politikası',
    privacy_content: 'Pattty olarak kişisel verilerinizi korumaya büyük önem veriyoruz. Verileriniz sadece uygulama deneyimini iyileştirmek için kullanılır ve üçüncü taraflarla paylaşılmaz. Tüm verileriniz cihazınızda veya güvenli bulut sunucularımızda şifrelenerek saklanır.',
    terms_title: 'Kullanım Koşulları',
    terms_content: 'Pattty uygulamasını kullanarak, topluluk kurallarına uymayı ve uygulamanın sağladığı sağlık önerilerinin tıbbi tavsiye yerine geçmediğini kabul etmiş olursunuz. Acil durumlarda her zaman bir veteriner hekime başvurmalısınız.',
    help_faq_title: 'Sıkça Sorulan Sorular',
    faq_q1: 'Pattty ücretli mi?',
    faq_a1: 'Pattty şu anda temel özellikleriyle tamamen ücretsizdir. İleride premium özellikler eklenebilir.',
    faq_q2: 'Verilerim güvende mi?',
    faq_a2: 'Evet, verileriniz şifrelenmiş sunucularda saklanır ve kimseyle paylaşılmaz.',
    faq_q3: 'Veteriner bulma özelliği nasıl çalışır?',
    faq_a3: 'Google Haritalar altyapısını kullanarak konumunuza en yakın veteriner kliniklerini listeleriz.',
    faq_q4: 'Birden fazla evcil hayvan ekleyebilir miyim?',
    faq_a4: 'Evet! Sınırsız sayıda evcil hayvan ekleyebilir ve her biri için ayrı profil oluşturabilirsiniz.',

    yes: "Evet",
    no: "Hayır",
    err_file_too_large: "Dosya boyutu çok büyük (Max 10MB)",
    err_analysis_failed: "Analiz başarısız, lütfen manuel devam ediniz.",
    err_custom_type_required: "Lütfen türü belirtiniz.",
    err_custom_breed_required: "Lütfen ırkı belirtiniz.",
    err_neutered_required: "Kısırlaştırma bilgisini seçiniz.",
    err_missing_pet_details: "Hayvan detayları eksik, lütfen önce analizi tamamlayın.", // EKLENDİ
    err_image_gen_failed: "Görsel oluşturulamadı, lütfen tekrar deneyin.", // EKLENDİ
    err_save_failed: "Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.", // EKLENDİ
    err_update_generic: "Güncelleme sırasında bir hata oluştu.", // EKLENDİ

    scan_alt_text: "taranıyor",
    preview_alt_text: "Önizleme",
    ai_generated_alt_text: "AI Tarafından Oluşturuldu",

    // 🟢 ✅ YENİ BİLDİRİM KATEGORİLERİ
    notif_vaccine: 'Aşı Bildirimleri',
    notif_calendar: 'Takvim ve Anımsatıcılar', // YENİ
    notif_updates: 'Genel Güncellemeler', // YENİ
    notif_ai: 'AI ve Analiz Sonuçları', // YENİ
    
    // Eski ama tutulanlar
    notif_vet: 'Veteriner Randevuları',
    notif_daily: 'Günlük Görevler',
    notif_dnd: 'Rahatsız Etme',
    notif_dnd_desc: 'Gece bildirimleri sessize al',
    status_online: "Çevrimiçi",

    // Hata & AI
    err_missing_fields: 'Lütfen zorunlu alanları doldurun.',
    ai_action_add: 'Eklendi:',
    ai_action_remove: 'Silindi:',
    ai_action_vaccine: 'Aşı İşlendi:',
    ai_typing: 'yazıyor...',
    ai_placeholder: 'Bir şeyler sor...',
    ai_image_sent: '[Görsel Gönderildi]',
    ai_image: '[Görsel]',
    ai_no_pets_data: 'Kullanıcının henüz eklenmiş hayvanı yok.',
    ai_no_memory: 'Henüz geçmiş not yok.',
    ai_online: 'Online',
    ai_pet_added_success: '🎉 **${newPet.name}** ailene eklendi! \n\nOnun sağlığı için aşı takvimini veya parazit aşılarını şimdi planlamamı ister misiniz?',
    ai_not_found: 'Bulunamadı:',
    ai_reminder_added: '📅 Takvime eklendi:',
    ai_weight_updated: '⚖️ Kilo güncellendi:',
    ai_note_added: '📝 Not alındı:',
    ai_pet_info_name: 'İsim',
    ai_pet_info_type: 'Tür',
    ai_pet_info_breed: 'Irk',
    ai_pet_info_gender: 'Cinsiyet',
    ai_pet_info_weight: 'Kilo',
    ai_pet_info_weight_none: 'Yok',
    ai_generating: 'Hazırlanıyor...',

    // Birimler & Detaylar
    age_y: 'Yıl',
    age_m: 'Ay',
    
    // Birim ayarları
    set_unit: "Birim Tercihi",
    unit_kg: "Metrik (Kg, Gr)",
    unit_lbs: "Imperial (Lbs, Oz)",
    lbl_kg: "KG",
    lbl_gr: "GR",
    lbl_lbs: "LBS",
    lbl_oz: "OZ",

    // Pet detay tab başlıkları
    game_title: 'Oyunlar',

    // Kilo
    weight_title: 'Kilo Grafiği',
    weight_exists_error: 'Bugün zaten ölçüm yapıldı.',
    err_neg_val: 'Geçersiz değer.',
    weight_add: 'Ölçüm Ekle',
    weight_input_kg: 'Kg',
    weight_input_gr: 'Gr',

    // Notlar
    note_placeholder: "Yeni bir not yazın...",
    note_empty: 'Henüz not yok.',
    note_empty_title: "Henüz Not Yok",
    note_empty_desc: "Önemli tarihleri, aşıları veya anıları buraya not alabilirsiniz.",

    // Aşı / Vaccine Manager
    vaccine_title: 'Aşı Takvimi',
    vac_ai_btn: 'AI ile Öner',
    vac_manual_btn: 'Manuel Ekle',
    vac_ai_error: 'Plan oluşturulamadı.',
    vac_date_error: 'Tarih seçmelisiniz.',
    vac_add: 'Aşı Ekle',
    vac_manage: 'Aşı Yönetimi',
    vac_next: 'Sonraki Aşı',
    vac_none: 'Henüz aşı eklenmedi.',
    vac_plan: 'Aşı Planı',
    vac_done: 'Aşı Yapıldı',
    vac_name_date_error: 'Lütfen aşı adını ve tarihini seçin.',
    vac_added_notif: 'Aşı eklendi.',
    vac_ai_suggest_title: 'AI ile aşı önerisi',
    vac_ai_pre_desc: 'AI ile aşı eklemeden önce, dostunuzun daha önceden olduğu aşıları sisteme eklemeyi unutmayınız.',
    vac_add_manually_btn: 'Aşı ekle',
    vac_continue_with_ai_btn: 'AI ile devam et',
    vac_ai_success_notif: 'Yapay zekâ ile aşı takvimi oluşturuldu.',
    vac_ai_error_generic: 'Aşı önerileri alınamadı. Lütfen tekrar deneyin.',
    vac_no_vaccines: 'Henüz aşı eklenmemiş.',
    select_vaccine: 'Aşı seçin',
    vac_add_btn: 'Yeni Aşı Ekle',
    vac_ai_result_title: 'AI asistanınız bu aşıları önerdi',
    vac_ai_no_new_suggestion: 'Yeni aşı önerisi bulunamadı.',
    vac_scan_subtitle: "Fotoğraftan Otomatik",
    vac_ai_subtitle: "Akıllı Takvim",
    lbl_vaccine_name: "Aşı Adı",
    lbl_date: "Tarih",
    vac_ai_added_count_suffix: "yeni aşı eklendi.",

    // Silme diyalogları (genel)
    del_title: 'Sil?',
    del_desc: 'Bu işlem geri alınamaz.',
    del_yes: 'Evet, Sil',

    // Oyun (mini game tab)
    game_draw: 'Berabere',
    game_win: 'Kazandın!',
    game_lose: 'Kaybettin',
    game_area_title: 'Oyun Alanı',
    game_area_desc: 'Puan topla, eğlen!',
    game_catch_title: 'Ödül Avcısı',
    game_catch_desc: 'Reflekslerini test et!',
    game_memory_title: 'Pati Hafıza',
    game_memory_desc: 'Kartları eşleştir.',
    game_rps_title: 'Taş Kağıt Makas',
    game_rps_desc: 'Şansına güven.',
    game_score: 'Skor:',
    game_your_score: 'Skorun:',
    game_time_up: 'Süre Bitti!',
    game_play_again: 'Tekrar Oyna',
    game_start: 'Başla',
    game_moves: 'Hamle:',
    game_congrats: 'Tebrikler!',
    game_moves_desc: 'hamlede bitirdin.',
    game_again: 'Tekrar',
    game_you: 'SEN',
    game_ai: 'PATTTY',
    game_make_choice: 'Seçimini Yap',
    game_vs: 'VS',
    game_you_label: 'Sen',
    game_ai_label: 'Pattty',
    game_rps_rock: 'Taş',
    game_rps_paper: 'Kağıt',
    game_rps_scissors: 'Makas',

    // Dijital Kimlik
    id_lost_on_notif: '⚠️ KAYIP MODU AKTİF! QR kodu kırmızı oldu.',
    id_lost_off_notif: 'Kayıp modu kapatıldı.',
    id_link_copied: 'Profil linki kopyalandı!',
    id_lost_mode_title: 'Kayıp Modu',
    id_lost_mode_desc_on: 'Şu an aktif! Bulanlar uyarılacak.',
    id_lost_mode_desc_off: 'Dostun kaybolursa bunu aç.',
    id_lost_searching: 'KAYIP ARANIYOR',
    id_safe: 'GÜVENDE',
    id_show_qr: 'QR GÖSTER',
    id_tap_to_flip: 'Çevirmek için dokun',
    id_link: 'Link',
    id_share: 'Paylaş',
    id_back_to_info: 'Bilgilere Dön',
    id_pair_tag_title: 'Fiziksel Tasmayı Eşle',
    id_pair_tag_desc: 'Satın aldığınız <strong>Pattty Tag</strong> paketinden çıkan kodu buraya girerek tasmayı bu profile bağlayabilirsiniz.',
    id_enter_tag_code: 'Tasma Kodunu Gir',
    id_share_story_title: 'Pattty - ${monthName} Anıları',
    id_share_story_text: '${monthName} ayından harika anılar! 🐾 #PatttyApp',
    story_player_subtitle: 'Pattty ile Anılar',
    story_player_memories: 'Anıları',

    // --- NEW: LOST REPORT MODAL ---
    lost_modal_title: "Acil Durum Bildirimi",
    lost_modal_warning_title: "YASAL UYARI",
    lost_modal_warning_text: "Bu özellik sadece gerçek kayıp vakaları içindir. Yanıltıcı, şaka amaçlı veya uygunsuz bildirimler tespit edildiğinde hesabınız kalıcı olarak kapatılacak ve cihazınız engellenecektir.",
    lost_note_label: "Ek Bilgiler & Durum",
    lost_note_placeholder: "Örn: Sol arka ayağı aksıyor, kırmızı tasması var. En son parkın girişinde görüldü...",
    lost_confirm_btn: "BİLDİRİMİ YAYINLA",
    lost_cancel_btn: "Vazgeç",
    lost_auto_info: "Otomatik Eklenecek Bilgiler:",

    // Alert Network (YENİ)
    alert_header: 'PATTTY ALERT',
    alert_near: 'yakında',
    alert_lost_suffix: 'Kayıp!',
    alert_seen_call: 'Gördüm / Ara',
    alert_navigate_btn: 'Konuma Git',
    alert_dismiss: 'Gizle',
    alert_default_msg: 'Dostum kayboldu! Lütfen görenler iletişime geçsin.',
    alert_loc_fetching: 'Konum alınıyor ve alarm oluşturuluyor...',
    alert_loc_error: 'Konum alınamadı.',
    alert_loc_none: 'Konum bilgisi yok.',
    alert_section_title: 'Çevrendeki Acil Durumlar',
    alert_current_loc: 'Şu anki konum',
    
    // Alert Kartı Detayları
    alert_detail_breed: "Irk",
    alert_detail_color: "Renk",
    alert_detail_weight: "Kilo",
    alert_detail_gender: "Cinsiyet",

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
    vet_details: 'Klinik Detayları',
    vet_no_address: 'Adres bilgisi yok',
    vet_searching: 'Aranıyor...',
    vet_nearby_clinics_title: 'Yakındaki Klinikler',
    vet_start_search_prompt: 'Konum araması yapın.',
    
    my_location: 'Konumum',
    default_vet_name: 'Veteriner Kliniği',
    new: 'Yeni',
    search_placeholder: 'Klinik ara...',
    clinics: 'KLİNİK',
    km: 'KM',
    open: 'AÇIK',
    closed: 'KAPALI',
    veterinarian: 'Veterinarian',
    address: 'ADDRESS',
    call_phone: 'Call Now',
    get_directions: 'Get Directions',
    not_specified: 'Not specified',

    // Errors
    err_loc_unsupported: 'Your device does not support location services.',
    err_loc_denied: 'Konum izni reddedildi. Ayarlardan izin verin.',
    err_maps_load: 'Google Haritalar servisleri yüklenemedi.',
    err_vet_api: 'No nearby vets found or an API error occurred.',
    err_no_results: 'Sonuç bulunamadı.',
    err_loc_denied_perm: 'Konum iznini reddettiniz. Ayarlardan izin vermeniz gerekiyor.',
    err_loc_disabled: 'Location services may be disabled. Please enable GPS.',
    err_loc_timeout: 'Location request timed out. Please try again.',
    err_loc_generic: 'An error occurred while getting location.',
    err_loc_general: 'Could not get location or load the map.',

    // Filter & Sort
    filter_title: 'Filtrele & Sırala',
    show_category: 'KATEGORİ GÖSTER',
    sort_by: 'Sıralama Ölçütü',
    sort_dist: 'Mesafe (En Yakın)',
    sort_rating: 'Puan (En Yüksek)',
    sort_name: 'İsim (A-Z)',
    type_vet: 'Veteriner',
    type_petshop: 'Pet Shop',
    apply: 'Uygula',

    // Dashboard Extras
    dash_find_places: 'Vet & Pet Shop Bul',
    dash_find_places_desc: 'Yakınındaki veteriner ve mağazaları keşfet.',
    mood_log_title: 'Ruh Hali Günlüğü',
    great_job: 'Harika İş!',

    // Food Scan
    food_scan_title: "Mama Analizi",
    food_scan_instruction_title: "İçerikleri Tara",
    food_scan_desc: "Mamanın arka yüzündeki 'İçindekiler' listesinin net bir fotoğrafını çekin.",
    scan_instruction: 'Mama paketinin "İçindekiler" bölümünün fotoğrafını çek.',
    scan_upload: 'Fotoğraf Çek / Yükle',
    scan_retake: 'Tekrar Çek',
    analyze_btn: "Analiz Et",
    analyzing: 'İçerik Analiz Ediliyor...',
    analyzing_text: "Yapay Zeka İnceliyor...",
    score_good: 'Mükemmel Seçim',
    score_avg: 'Ortalama',
    score_bad: 'Dikkatli Olun',
    scan_pros: 'Artıları',
    scan_cons: 'Eksileri / Uyarılar',
    scan_disclaimer: 'Bu analiz AI tarafından üretilmiştir, tıbbi tavsiye değildir.',
    scan_error_title: 'Analiz Yapılamadı',
    scan_error_desc: 'Görsel net değil veya bir etiket algılanamadı.',
    food_scan_error_text: "Yazılar net okunamadı. Lütfen ışıklı bir ortamda tekrar deneyin.",
    food_scan_pros: "ARTILAR",
    food_scan_cons: "EKSİLER",
    current_lang_code: 'tr',
    current_lang_name: 'Turkish',
    premium_required_alert: "Bu özellik sadece Premium üyeler içindir.",

    // Doğrulama Hataları
    err_name_format: 'İsim sadece harflerden oluşmalıdır.',
    err_name_length: 'İsim 2-25 karakter arasında olmalıdır.',
    err_birth_future: 'Doğum tarihi gelecekte olamaz.',
    err_age_limit: 'Bu tür için yaş sınırı aşıldı (Max: {limit} yıl).',
    err_weight_zero: "Kilo 0'dan büyük olmalıdır.",
    err_weight_limit: 'Bu tür için kilo sınırı aşıldı (Max: {limit} kg).',
    err_vaccine_date_invalid: 'Aşı tarihi, doğum tarihinden önce olamaz.',

    // Premium & Paywall
    prem_limit_multi_pet: "Sınırsız dost ekle!",
    prem_locked_feature: "Bu özellik Premium üyelere özel.",
    prem_msg_cooldown: "Mesaj hakkın doldu.",
    prem_action_limit: "Günlük işlem limitin doldu. Yarın tekrar gel veya Premium'a geç!",
    prem_chat_limit: "Günlük sohbet limitin doldu.",
    prem_img_limit: "Görsel analizi Premium özellik.",
    prem_upgrade_success: "🎉 Tebrikler! Pattty Premium'a geçtiniz.",
    
    // Paywall Modal
    pw_hero_title: "Pattty",
    pw_hero_desc: "Yapay zeka desteğiyle evcil dostunun sağlığını, beslenmesini ve mutluluğunu garanti altına al.",
    pw_feat_food: "Mama Analizi",
    pw_feat_vet: "Vet Bulucu",
    pw_feat_chat: "AI Asistan",
    pw_feat_multi: "Çoklu Profil",
    pw_feat_unlock: "kilidini aç!",
    
    pw_benefit_1: "Sınırsız Veteriner Asistanı",
    pw_benefit_1_sub: "7/24 soru sor, anında yanıt al. Bekleme süresi yok.",
    pw_benefit_2: "Mama & Sağlık Analizi",
    pw_benefit_2_sub: "Paket içeriğini tarat, zararlı maddeleri anında gör.",
    pw_benefit_3: "Tüm Ailen Tek Yerde",
    pw_benefit_3_sub: "Sınırsız sayıda evcil hayvan ekle ve yönet.",
    
    pw_plan_monthly: "Aylık",
    pw_plan_yearly: "Yıllık",
    pw_best_value: "%40 İNDİRİM",
    
    pw_food_compare: "Sadece bir",
    pw_food_compare_bold: "yaş mama fiyatına hayatını değiştir.",
    
    pw_cta_month: "39.99₺ ile Başla",
    pw_cta_year: "Yıllık Planı Seç (Tasarruflu)",
    
    pw_secure: "Güvenli Ödeme & İstediğin Zaman İptal",
    pw_terms: "Abonelik otomatik yenilenir. Ayarlar'dan dilediğin zaman iptal edebilirsin.",
    pw_restore: "Satın Alımı Geri Yükle",

    pw_food_title: "Mama Analizi",
    pw_food_desc: "Mamanın içeriğini saniyeler içinde analiz et ve sağlığına uygunluğunu öğren.",
    pw_vet_title: "Vet & Shop Bulucu",
    pw_vet_desc: "Acil durumlarda en yakın açık veterinerleri ve puanlarını gör.",
    pw_chat_title: "Sınırsız Asistan",
    pw_chat_desc: "Bekleme süresi olmadan, sınırsız soru sor ve fotoğraf gönder.",
    pw_multi_title: "Aileni Büyüt",
    pw_multi_desc: "Sınırsız sayıda evcil hayvan ekle ve hepsini tek yerden yönet.",
    pw_vaccine_title: "Akıllı Aşı Takvimi",
    pw_vaccine_desc: "Yapay zeka ile dostunun yaşına ve türüne özel aşı planı oluştur.",
    pw_default_title: "Premium Özellik",
    pw_default_desc: "Bu özelliğe erişmek için Pattty Premium'a geç.",
    pw_upgrade_btn: "Premium'a Geç",
    pw_cancel_info: "İstediğin zaman iptal et.",

    // Account Settings - Premium Status
    acc_stat_premium: "Premium Üye",
    acc_stat_free: "Pattty Free",
    acc_desc_premium: "Tüm özelliklere sınırsız erişimin var.",
    acc_desc_free: "Özellikleri keşfetmek için yükselt.",
    acc_btn_upgrade: "Yükselt",
    acc_btn_demo_cancel: "(Demo: İptal Et)",
    acc_app_version: "Pattty Uygulaması v1.0.0",
    acc_made_with_love: "Evcil dostlar için ❤️ ile yapıldı",

    // AI Assistant
    ai_limit_reached_title: "Günlük Limit Doldu",
    ai_btn_upgrade: "Premium'a Geç",

    // Masraf Takibi
    exp_title: "Harcamalar",
    exp_subtitle: "Aylık Bütçe Planlaması",
    exp_total_spend: "Bu Ay Toplam",
    exp_premium_chart_title: "Pro Analizler Kilitli",
    exp_form_title: "Harcama Adı",
    exp_add_btn: "Harcama Ekle",
    exp_empty: "Henüz harcama yok.",
    
    // Rapor
    btn_health_report: "Sağlık Raporu Oluştur",
    report_generated_mock: "Rapor başarıyla oluşturuldu! (Demo)",
    
    // Yeni Paywall Başlıkları (Masraf & Rapor)
    pw_report_title: "Veteriner Raporu",
    pw_report_desc: "Tüm sağlık verilerini tek tıkla profesyonel PDF raporuna dönüştür.",
    pw_expense_title: "Masraf Analizi",
    pw_expense_desc: "Harcamalarını grafiklerle takip et, bütçeni yönet.",

    // Masraf Takibi (PROFESYONEL)
    exp_header_title: "FİNANSAL DURUM",
    exp_premium_desc: "Harcamalarınızı görselleştirin ve bütçenizi profesyonelce yönetin.",
    exp_no_data: "Bu ay için henüz veri yok.",
    exp_recent_activity: "Son Hareketler",
    exp_view_all: "Tümünü Gör",
    exp_empty_month: "Bu ay harcama yapılmadı.",
    
    // Form
    exp_add_title: "Yeni Harcama",
    exp_amount_label: "TUTAR",
    exp_category_label: "KATEGORİ",
    exp_custom_label: "HARCAMA DETAYI",
    exp_custom_placeholder: "Örn: Özel bir oyuncak",
    exp_title_label: "BAŞLIK",
    exp_title_placeholder: "Örn: Market Alışverişi",
    exp_date_label: "TARİH",
    exp_note_label: "NOT (OPSİYONEL)",
    exp_note_placeholder: "Kısa not...",
    exp_add_confirm: "Harcamayı Ekle",

    // Kategoriler
    exp_cat_food: "Mama & Gıda",
    exp_cat_vet: "Veteriner",
    exp_cat_toy: "Oyuncak",
    exp_cat_groom: "Bakım & Kuaför",
    exp_cat_other: "Diğer",

    // Para Birimi Ayarları
    set_unit_and_currency: "Birim ve Para Birimi",
    unit_weight_title: "AĞIRLIK BİRİMİ",
    unit_currency_title: "PARA BİRİMİ",
    curr_try: "Türk Lirası (₺)",
    curr_usd: "Amerikan Doları ($)",
    curr_eur: "Euro (€)",
    curr_gbp: "Sterlin (£)",

    // Aşı Yöneticisi (Yeni Tasarım)
    vac_stat_risk: "Riskli Durum",
    vac_stat_ok: "Her Şey Yolunda",
    vac_stat_perfect: "Tam Koruma",
    vac_stat_empty: "Aşı Takvimi Boş",
    vac_stat_overdue_desc: "adet gecikmiş aşı var!",
    vac_stat_upcoming_desc: "adet yaklaşan aşı var.",
    vac_stat_perfect_desc: "Tüm aşılar zamanında yapıldı.",
    vac_stat_empty_desc: "Aşı ekleyerek takibi başlatın.",
    
    // Aşı Tarama
    vac_scan_btn: "Karne Tara",
    vac_scan_analyzing: "Taranıyor...",
    vac_scan_success: "Aşılar başarıyla eklendi!",
    vac_scan_error: "Tarama başarısız oldu veya aşı bulunamadı.",
    pw_scan_card_title: "Aşı Karnesi Tarama",
    pw_scan_card_desc: "Aşı karnesinin fotoğrafını çek, yapay zeka tüm aşıları saniyeler içinde takvime işlesin.",

    scan_camera: "Fotoğraf Çek",
    scan_gallery: "Galeriden Seç",

    status_updated: "Güncellendi",
    streak_days: "Gün",
    mood_log_completed: "Bugünün kaydı tamamlandı.",

    app_name: "Pattty",
    google_login_cancelled: "Google ile giriş iptal edildi.",
    auth_invalid_email: "Geçersiz e-posta adresi.",
    auth_user_not_found: "Kullanıcı bulunamadı.",
    auth_wrong_password: "Hatalı şifre.",
    auth_email_in_use: "Bu e-posta adresi zaten kullanımda.",
    auth_weak_password: "Şifre çok zayıf.",
    auth_unknown_error: "Bir hata oluştu. Lütfen tekrar deneyin.",
    mobile_only_warning: "Bu özellik sadece mobil cihazlarda çalışır.",

    account_title: "Profilim",
    guest_user: "Misafir Kullanıcı",
    settings_general: "Genel Ayarlar",
    notifications: "Bildirimler",
    privacy_security: "Güvenlik & Gizlilik",
    confirm_logout: "Çıkış yapmak istediğinize emin misiniz?",
    logout_btn: "Çıkış Yap",
    
    // Login & Forgot Password
    forgot_password_link: "Şifremi Unuttum?",
    reset_password_title: "Şifre Sıfırlama",
    reset_password_desc: "E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.",
    send_reset_link: "Sıfırlama Linki Gönder",
    enter_email_first: "Lütfen önce e-posta adresinizi girin.",
    reset_email_sent: "Sıfırlama e-postası gönderildi! Gelen kutunu kontrol et.",
    auth_too_many_requests: "Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.",

    // --- Ayarlar & Hesap ---
    // (acc_... ile başlayanlar yukarıda tanımlanmış)
    
    // --- Düzenleme Modalı ---
    edit_suffix: "Düzenle",
    // save yukarıda tanımlı
    // form_name yukarıda tanımlı
    // phone yukarıda tanımlı
    // address yukarıda tanımlı

    // --- Premium Durumu ---
    // (acc_stat_... yukarıda tanımlı)
    // acc_btn_upgrade yukarıda tanımlı
    acc_btn_demo_cancel: "Aboneliği İptal Et",

    // --- Genel Ayarlar ---
    // set_dark, set_lang vb. yukarıda tanımlı
    set_unit_and_currency: "Birim ve Para Birimi",
    set_support: "Destek & Hakkında",
    set_help: "Yardım ve SSS",
    set_privacy: "Gizlilik Politikası",
    set_terms: "Kullanım Koşulları",
    set_logout: "Çıkış Yap",
    
    // --- Birimler ---
    unit_weight_title: "AĞIRLIK BİRİMİ",
    unit_kg: "Kilogram (kg)",
    unit_lbs: "Pound (lbs)",
    
    // --- Para Birimleri ---
    unit_currency_title: "PARA BİRİMİ",
    curr_try: "Türk Lirası (₺)",
    curr_usd: "Amerikan Doları ($)",
    curr_eur: "Euro (€)",
    curr_gbp: "Sterlin (£)",
    
    // --- Diğer ---
    acc_find_vet: "En Yakın Veteriner",
    acc_app_version: "Versiyon 1.0.0",
    acc_made_with_love: "Pattty © 2025",
    
    // --- SSS (Örnek) ---
    help_faq_title: "Yardım Merkezi",
    // faq_q1...q4 yukarıda tanımlı
    
    // --- Login & Register Screen ---
    login_welcome_title: "Hoş Geldin!",
    login_welcome_desc: "Pattty dünyasına giriş yap.",
    login_create_title: "Hesap Oluştur",
    login_create_desc: "Evcil hayvanın için en iyisi.",
    
    form_name_label: "İSİM SOYİSİM",
    form_name_placeholder: "Adın Soyadın",
    form_email_label: "E-POSTA",
    form_password_label: "ŞİFRE",
    
    login_forgot_password: "Şifreni mi unuttun?",
    
    btn_login: "Giriş Yap",
    btn_register: "Kayıt Ol",
    
    login_or_continue_with: "veya şununla devam et",
    btn_google_login: "Google ile Devam Et",
    
    login_no_account: "Hesabın yok mu?",
    login_have_account: "Zaten hesabın var mı?",
    btn_register_now: "Hemen Kayıt Ol",
    btn_login_now: "Giriş Yap",

    // --- Reset Password Modal ---
    reset_title: "Şifreni Sıfırla",
    reset_desc: "Endişelenme, olabilir. Kayıtlı e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.",
    reset_success_title: "Bağlantı Gönderildi!",
    reset_success_desc: "Lütfen e-posta kutunu (ve spam klasörünü) kontrol et.",
    reset_error_msg: "Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı veya bir hata oluştu.",
    btn_send_reset_link: "Sıfırlama Linki Gönder",

    // --- Hata Mesajları ---
    err_name_required: "İsim alanı zorunludur.",
    err_general: "Bir hata oluştu.",
    err_invalid_email: "Geçersiz e-posta adresi.",
    err_user_not_found: "Kullanıcı bulunamadı.",
    err_wrong_password: "Hatalı şifre.",
    err_email_in_use: "Bu e-posta zaten kullanımda.",
    err_weak_password: "Şifre çok zayıf (en az 6 karakter).",
    err_google_login: "Google girişi başarısız veya iptal edildi.",

    app_logo_alt: "Pattty App Logosu",

    // Şifre Tekrar Alanı
    form_password_confirm_label: "ŞİFRE TEKRAR",
    
    // Hatalar & Uyarılar
    err_passwords_do_not_match: "Şifreler eşleşmiyor.",
    
    // E-posta Doğrulama Modalı
    verify_email_title: "E-postanı Doğrula",
    verify_email_desc: "Kayıt olduğun için teşekkürler! Hesabını güvene almak için e-posta adresine bir doğrulama bağlantısı gönderdik. Lütfen kutunu kontrol et.",
    btn_understood: "Anladım, Kontrol Edeceğim",

    // Email Verification Errors
    err_email_not_verified: "E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.",
    msg_verification_resent: "Doğrulama maili tekrar gönderildi.",
    msg_please_verify: "Kayıt işlemi başarılı! Ancak güvenliğiniz için giriş yapmadan önce e-posta adresinizi doğrulamanız gerekmektedir.",
    
    // Welcome Screen
    intro_welcome_title: "Pattty'e Hoş Geldin!",
    intro_welcome_desc: "Evcil dostların için tasarlanmış, yapay zeka destekli en kapsamlı bakım asistanı.",
    
    intro_home_title: "Her Şey Tek Ekranda",
    intro_home_desc: "Yaklaşan aşılar, randevular ve dostunun sağlık durumu... Hepsi ana sayfada, parmaklarının ucunda.",
    
    intro_pets_title: "Dostlarını Yönet",
    intro_pets_desc: "Birden fazla evcil hayvan ekle, profillerini oluştur ve her birinin ihtiyacını ayrı ayrı takip et.",
    
    intro_ai_title: "Pattty AI Yanında",
    intro_ai_desc: "Dostunun sağlığıyla ilgili aklına takılan her şeyi 7/24 yapay zeka asistanımıza sorabilirsin.",
    
    intro_calendar_title: "Akıllı Takvim",
    intro_calendar_desc: "Aşı takvimi, veteriner randevuları ve özel günler... Hiçbir şeyi unutmana izin vermeyiz.",
    
    intro_account_title: "Senin Dünyan",
    intro_account_desc: "Profilini kişiselleştir, ayarlarını yönet ve premium ayrıcalıklarını keşfet.",

    // --- Paywall (Dinamik Fiyatlandırma İçin Güncel) ---
    pay_title: "Pattty Premium",
    pay_subtitle: "Sınırsız Özelliklerin Kilidini Aç",
    
    pay_feat_1: "Sınırsız Evcil Hayvan Ekle",
    pay_feat_2: "Pattty AI ile 7/24 Sınırsız Sohbet",
    pay_feat_3: "Gelişmiş Sağlık ve Aşı Takibi",
    pay_feat_4: "Reklamsız Deneyim",
    
    // Paket İsimleri
    pay_plan_monthly_label: "Aylık Plan",
    pay_plan_yearly_label: "Yıllık Plan",
    
    // Etiketler
    pay_badge_best_value: "EN İYİ FİYAT",
    pay_badge_save: "SAVE 50%",
    
    // Dynamic Formats
    pay_text_per_month: "/ ay",
    pay_text_per_year: "/ yıl",
    pay_text_just_per_month: "Aylık sadece {price}",
    
    // Butonlar
    pay_btn_start: "Premium'a Geç",
    pay_btn_restore: "Satın Alımı Geri Yükle",
    pay_cancel_anytime: "İstediğin zaman iptal edebilirsin.",
    pay_terms: "Kullanım Koşulları",
    pay_privacy: "Gizlilik Politikası",
    
    // Mesajlar
    pay_processing: "İşleniyor...",
    pay_success: "İşlem Başarılı!",
    pay_restore_success: "Üyelik Geri Yüklendi",
    pay_restore_fail: "Aktif Üyelik Bulunamadı",
    
    intro_btn_skip: "ATLA",
    intro_btn_next: "İLERLE",
    intro_btn_start: "BAŞLAYALIM",

    pay_badge_popular: "EN ÇOK TERCİH EDİLEN",
    pay_badge_limited: "SINIRLI TEKLİF",
    pay_feat_compare_free: "Ücretsiz",
    pay_feat_compare_prem: "Premium",
    pay_feat_row_1: "Temel Evcil Hayvan Takibi",
    pay_feat_row_2: "Sınırsız Aşı & Sağlık Hatırlatıcı",
    pay_feat_row_3: "Yapay Zeka Veteriner (7/24)",
    pay_feat_row_4: "Gelişmiş Gıda Analizi",
    pay_review_text: "Sayesinde köpeğimin alerjisini erkenden fark ettim. Harika bir uygulama!",
    pay_review_author: "Veteriner Hekim Ece K.",

    // Landing Page Metinleri
    landing_nav_features: "Özellikler",
    landing_nav_security: "Güvenlik",
    landing_nav_download: "İndir",
    landing_btn_open: "Uygulamayı Aç",
    landing_badge: "Pattty 1.0 Yayında",
    landing_hero_title_1: "Evcil Dostunuz İçin",
    landing_hero_title_2: "Süper Bir Uygulama.",
    landing_hero_desc: "Aşı takibi, yapay zeka destekli sağlık analizi, QR tasma sistemi ve daha fazlası. Pattty, modern evcil hayvan sahipleri için tasarlandı.",
    landing_btn_appstore: "App Store'dan İndir",
    landing_btn_googleplay: "Google Play'den Al",
    landing_mockup_text: "Uygulama Ekran Görüntüsü",
    landing_feat_ai_title: "Yapay Zeka Asistan",
    landing_feat_ai_desc: "Veterinerlere gitmeden önce AI asistanımıza danışın. Belirtileri analiz eder, öneriler sunar.",
    landing_feat_qr_title: "QR Akıllı Tasma",
    landing_feat_qr_desc: "Kaybolursa endişelenmeyin. Bulan kişi QR kodu okuttuğunda size anında bildirim gelir.",
    landing_feat_health_title: "Sağlık Takibi",
    landing_feat_health_desc: "Aşılar, ilaçlar ve veteriner randevuları. Hepsini tek bir yerden yönetin, asla unutmayın.",
    landing_footer_privacy: "Gizlilik Politikası",
    landing_footer_terms: "Kullanım Koşulları",
    landing_footer_contact: "İletişim",
    landing_footer_rights: "Tüm hakları saklıdır.",

    step_1_desc: "Temel Bilgiler",
    step_2_desc: "Fotoğraf ve Stil",
    edit_pet_title: "Dostunu Düzenle",
    add_pet_title: "Yeni Dost Ekle",
    err_file_too_large: "Dosya boyutu çok büyük (Max 5MB)",
    err_image_generation: "Görsel oluşturulamadı. Lütfen tekrar deneyin.",
    confirm_no_image: "Evcil hayvanınız için özel bir görsel oluşturmadınız. Devam etmek istiyor musunuz?",
    ai_generating: "Sihirli fırçalar çalışıyor...",
    ai_generating_desc: "Bu işlem birkaç saniye sürebilir.",
    ai_generated: "Yapay Zeka",
    upload_photo_title: "Bir fotoğraf yükle",
    upload_photo_desc: "Gerçek bir fotoğraf yükleyin, biz onu sanat eserine dönüştürelim!",
    btn_generate_ai: "Stilize Görsel Oluştur",
    ai_info_text: "Yüklediğiniz fotoğraf, uygulamanın genel tasarım diline uygun, yüksek kaliteli, çizgi film/illüstrasyon tarzında benzersiz bir görsele dönüştürülecektir. En iyi sonuç için net ve aydınlık bir fotoğraf seçin.",
    btn_back: "Geri",
    btn_next: "Devam Et",
    btn_save_pet: "Kaydet ve Bitir",
    btn_update: "Güncelle",
    
    err_login_required: "Kayıt için giriş yapmalısınız.",
    pet_added_suffix: "başarıyla eklendi!",
    err_save_pet_prefix: "Hayvan kaydedilemedi: ",
    info_updated: "Bilgiler güncellendi.",
    delete_success: "Kayıt silindi.",
    delete_failed: "Silme işlemi başarısız.",

    acc_update_error: "Güncelleme sırasında bir hata oluştu.",
    acc_edit_placeholder: "{label} giriniz...",

    // --- ANALİZ MERKEZİ ---
    analysis_hub_title: "Analiz Merkezi",
    analysis_mode_food: "Yiyebilir mi?",
    analysis_mode_poop: "Dışkı Analizi",
    analysis_mode_ingredients: "Paket İçeriği",
    select_pet_label: "Hangi dostumuz için analiz yapılsın?",

    // Yemek Analizi
    btn_analyze_food: "Yemeği Analiz Et",
    analyzing_food: "Yiyecek analiz ediliyor...",
    food_safe_title: "Yiyebilir ✅",
    food_caution_title: "Dikkatli Olun ⚠️",
    food_danger_title: "Kesinlikle Yememeli ⛔",
    food_analysis_prompt: "Bu fotoğraftaki yiyeceği tanımla. Bu yiyeceğin bir {petType} ({petName}) için güvenli olup olmadığını analiz et. Çıktı JSON formatında olsun: { 'food_name': 'Yiyecek Adı', 'safety_level': 'safe' | 'caution' | 'danger', 'description': 'Kısa açıklama ve neden', 'advice': 'Kullanıcıya tavsiye' }.",

    // Dışkı Analizi
    btn_analyze_poop: "Dışkıyı Analiz Et",
    analyzing_poop: "Dışkı analiz ediliyor...",
    poop_healthy_title: "Sağlıklı Görünüyor 💚",
    poop_concern_title: "Takip Edilmeli ⚠️",
    poop_emergency_title: "Veterinere Danışın 🚨",
    poop_analysis_prompt: "Bu fotoğraftaki evcil hayvan dışkısını analiz et. Hayvan türü: {petType}. Renk, kıvam ve olası sağlık sorunlarını değerlendir. Tıbbi tavsiye olmadığını belirterek genel bir yorum yap. Çıktı JSON olsun: { 'status': 'healthy' | 'concern' | 'emergency', 'details': 'Bulgular', 'recommendation': 'Öneri' }.",
    
    beta_already_premium: "BETA SÜRÜM: Zaten tüm özellikler sizin için açık! 🎉",
    beta_no_downgrade: "Beta sürümünde Free plana geçilemez.",

    ai_assistant_title: "Pattty Asistan",
    ai_listening_label: "Çevrimiçi & Dinliyor",

    hub_empty_title: "Aileye Hoşgeldin!",
    hub_empty_desc: "Henüz hiç dostun yok. İlk dostunu ekleyerek maceraya başla.",
    add_first_pet: "İlk Dostunu Ekle",
    my_pets_title: "Dostlarım",
    hub_subtitle: "{count} dostun var",
    sort_label: "Sıralama Ölçütü",
    sort_name: "İsim (A-Z)",
    sort_age: "Yaş (Genç-Yaşlı)",
    sort_type: "Tür",

    warn_image_cache_failed: "Görsel cihaza kaydedilemedi. İnternet bağlantısıyla yine de kullanılabilir.",
    ai_generating: "Yeni bir görsel oluşturuluyor...",
    pet_added_suffix: "eklendi",
    info_updated: "Bilgiler başarıyla güncellendi",
    delete_success: "Evcil hayvan başarıyla silindi",
    err_login_required: "Devam etmek için giriş yapmanız gerekiyor",
    checkup_title: "Check-Up",
    cal_daily_mood_log: "Günlük Ruh Hali Kaydı",
    mood_log: "Ruh Hali",
    mood_happy: "Mutlu",
    mood_energetic: "Enerjik",
    mood_sleepy: "Uykulu",
    mood_sick: "Hasta",
    no_pets_warning_symbol: "⚠️",
    all_day: "Tüm Gün",
    verify_title: "E-postanı Doğrula",
    verify_desc_suffix: "adresine bir doğrulama bağlantısı gönderdik. Lütfen gelen kutunu (ve spam klasörünü) kontrol et.",
    verify_check_btn: "Doğruladım, Giriş Yap",
    verify_resend_btn: "Tekrar Gönder",
    verify_wait: "s bekle",
    verify_logout: "Farklı hesaba geç / Çıkış",
    success_verified: "Hesap doğrulandı! Yönlendiriliyorsunuz...",
    err_not_verified: "Henüz doğrulanmamış. Lütfen mailindeki bağlantıya tıkla.",
    success_email_sent: "Doğrulama maili tekrar gönderildi.",
    err_general: "Bir hata oluştu veya çok sık denediniz.",
    err_connection: "Bağlantı hatası.",
    verify_open_mail_app: "Mail Uygulamasını Aç",
    verify_open_gmail: "Gmail'i Aç",
    verify_open_outlook: "Outlook'u Aç",
    auth_processing: "Hesabın doğrulanıyor...",
    auth_verified_title: "E-posta Doğrulandı! 🎉",
    auth_verified_desc: "Uygulamaya otomatik yönlendiriliyorsun...",
    auth_start_btn: "Pattty'e Başla",
    auth_invalid_link_title: "Bağlantı Geçersiz",
    auth_invalid_link_desc: "Bu bağlantı süresi dolmuş veya daha önce kullanılmış olabilir.",
  },

  en: {
    auth_processing: "Verifying your account...",
    auth_verified_title: "Email Verified! 🎉",
    auth_verified_desc: "You are being redirected automatically...",
    auth_start_btn: "Start Pattty",
    auth_invalid_link_title: "Invalid Link",
    auth_invalid_link_desc: "This link may have expired or has already been used.",
    verify_open_mail_app: "Open Mail App",
    verify_open_gmail: "Open Gmail",
    verify_open_outlook: "Open Outlook",
    verify_title: "Verify Your Email",
    verify_desc_suffix: "we sent a verification link to this address. Please check your inbox (and spam folder).",
    verify_check_btn: "I Verified, Login",
    verify_resend_btn: "Resend Email",
    verify_wait: "s wait",
    verify_logout: "Switch account / Logout",
    success_verified: "Account verified! Redirecting...",
    err_not_verified: "Not verified yet. Please click the link in the email.",
    success_email_sent: "Verification email resent.",
    err_general: "An error occurred or you tried too often.",
    err_connection: "Connection error.",
    err_connection: "Bağlantı hatası.",
    cal_daily_mood_log: "Daily Mood Log",
    mood_log: "Mood",
    mood_happy: "Happy",
    mood_energetic: "Energetic",
    mood_sleepy: "Sleepy",
    mood_sick: "Sick",
    no_pets_warning_symbol: "⚠️",
    all_day: "All Day",
    checkup_title: "Check-Up",
    warn_image_cache_failed: "Image could not be saved locally. It will still be available online.",
    ai_generating: "Creating a new image...",
    pet_added_suffix: "has been added",
    info_updated: "Information updated successfully",
    delete_success: "Pet removed successfully",
    err_login_required: "You need to be logged in to continue",
    ai_assistant_title: "Pet Assistant AI",

    ai_listening_label: "Online & Listening",
    // --- AI SYSTEM & PROMPTS (NEW ADDITIONS) ---
    ai_prompt_scan_vaccine: "TASK: This image is a pet vaccination record. Analyze the vaccine names and dates (done or due) in the image. OUTPUT FORMAT: Return ONLY a valid JSON array. Write no other text. JSON Example: [{'name': 'Combined Vaccine', 'date': '2024-05-20'}, {'name': 'Rabies', 'date': '2024-06-15'}] RULES: - If the date is unreadable or missing, write a date 1 month from today. - Translate vaccine names to {lang}. - If no vaccine list is found, return an empty array [].",
    ai_prompt_suggest_vaccine: "TASK: Act as a licensed veterinary assistant. Create a MISSING or DUE vaccination schedule for the following pet. PET: {petName}, Type: {petType}, Age: {petAge}. EXISTING VACCINES: {existingList}. OUTPUT FORMAT: Return ONLY a valid JSON object. JSON Schema: { 'vaccines': [{'name': 'Vaccine Name', 'date': 'YYYY-MM-DD'}] } RULES: - Suggest only necessary vaccines. - Set dates at least 1 week from today ({today}). - Answer in {lang}.",

    beta_already_premium: "BETA VERSION: All features are already unlocked for you! 🎉",
    beta_no_downgrade: "Cannot downgrade to Free plan in Beta version.",

    // AI Assistant System Instruction Keys
    ai_sys_role_title: "IDENTITY",
    ai_sys_role_desc: "You are Pattty, an expert Veterinary Assistant and Technical Support Specialist. Provide accurate and detailed info.",
    ai_sys_user_profile: "USER PROFILE",
    ai_sys_chat_history: "CHAT HISTORY",
    ai_sys_guide_title: "APP USER GUIDE",
    ai_sys_format_rules_title: "CRITICAL FORMATTING RULES",
    ai_sys_rule_no_table: "NEVER USE TABLES",
    ai_sys_rule_no_header: "NEVER USE HEADING TAGS (#)",
    ai_sys_rule_list: "Present info in bullet points (with -)",
    ai_sys_rule_bold: "Make important parts **bold**",
    ai_sys_cat_general: "GENERAL SETTINGS & ACCOUNT",
    ai_sys_cat_pet: "PET MANAGEMENT",
    ai_sys_cat_health: "HEALTH & TRACKING",
    ai_sys_cat_tools: "SPECIAL TOOLS",
    ai_sys_cat_id: "DIGITAL ID",
    ai_sys_faq_title: "FAQ",
    ai_sys_behavior_title: "BEHAVIOR RULES",
    ai_sys_tools_title: "TOOLS (REPLY IN JSON FORMAT)",
    ai_sys_tools_desc: "Use the JSON formats below only if an action is required. Use normal text when chatting.",
    
    exp_total: "TOTAL",
    exp_comparison_title: "Monthly Comparison",
    exp_vs_prev_month: "Compared to last month",
    exp_prev_month: "Last Month",
    exp_curr_month: "This Month",

    // Tool Names
    tool_pet_add: "ADD PET",
    tool_vac_add: "ADD VACCINE",
    tool_rem_add: "ADD REMINDER",
    tool_weight_add: "ADD WEIGHT",
    tool_note_add: "ADD NOTE",

    // Labels for AI Context
    lbl_name: "Name",
    lbl_type: "Type",
    lbl_breed: "Breed",
    lbl_gender: "Gender",
    lbl_weight: "Weight",
    lbl_birth: "Birth",
    lbl_date_today: "TODAY'S DATE",
    status_label: "Membership Status",
    pets_label: "Registered Pets",
    user_label: "User",
    ai_label: "Pattty",
    system_action_label: "System Action",
    image_label: "[Image]",
    dot_placeholder: ".",

    // AI Action Responses & Errors
    ai_action_missing_info: "Missing required information, action aborted.",
    ai_action_pet_exists: "A pet named {name} already exists.",
    ai_action_pet_added: "{name} has been successfully added to your family!",
    ai_action_add_vaccine: "{vaccine} vaccine has been recorded for {name}.",
    ai_error_pet_not_found: "No pet found with the name {name}.",
    ai_action_add_reminder: "{title} reminder added for {date}.",
    ai_action_add_weight: "{weight}kg weight added for {name}.",
    ai_action_add_note: "Note added for {name}.",
    ai_error_server: "AI Server Error: ",
    ai_error_no_response: "No response received.",
    ai_error_connection: "Connection error, please try again.",
    
    // General Errors (Backend/DB)
    err_server_error: "Server error",
    err_scan_failed: "Scan failed",
    err_vac_add: "Error adding vaccine",
    err_vac_update: "Error updating vaccine",
    err_note_add: "Error adding note",
    err_note_delete: "Error deleting note",
    err_note_update: "Error updating note",
    err_camera: "Camera error",
    err_action_handler: "Action handler error",
    err_ai_generic: "AI generic error",

    // Misc
    image_alt: "Uploaded image",
    image_preview_alt: "Image preview",

    step_1_title: "Upload Photo",
    step_1_desc: "Upload a clear photo.",
    step_2_title: "AI Analysis",
    step_2_desc: "Scanning photo...",
    step_3_title: "Identity Details",
    step_3_desc: "Check auto-filled info.",
    step_4_title: "Physical Details",
    step_4_desc: "Final touches.",
    step_5_title: "Confirm & Create",
    step_5_desc: "AI Image & Final Check.",
    
    ai_analyzing_btn: "Analyze Photo",
    ai_analyzing_wait: "Analyzing...",
    ai_auto_fill_tooltip: "Auto-filled from photo analysis.",
    
    upload_area_title: "Drag Photo Here",
    upload_area_desc: "or tap to select",
    
    confirm_details_title: "Are you sure details are correct?",
    confirm_details_desc_free: "On the free plan, profile details cannot be changed for 24 hours. Please ensure everything is correct.",
    confirm_details_desc_premium: "As a Premium member, you can edit details anytime.",
    
    btn_not_suitable: "Image Not Suitable",
    regen_prompt_placeholder: "E.g. Make eyes greener, forest background...",
    btn_regenerate: "Regenerate",
    regen_remaining: "Remaining:",
    regen_limit_reached: "Regeneration limit reached.",
    ai_style_generating: "Generating Styled Image...",
    
    form_neutered: "Neutered Status",
    neutered_yes: "Neutered",
    neutered_no: "Not Neutered",
    
    yes: "Yes",
    no: "No",
    err_file_too_large: "File size too large (Max 10MB)",
    err_analysis_failed: "Analysis failed, please continue manually.",
    err_custom_type_required: "Please specify the type.",
    err_custom_breed_required: "Please specify the breed.",
    err_neutered_required: "Please select neutered status.",
    err_missing_pet_details: "Pet details missing, please complete analysis first.", 
    err_image_gen_failed: "Image generation failed, please try again.", 
    err_save_failed: "Save failed. Please try again.", 
    err_update_generic: "An error occurred during update.", 

    scan_alt_text: "scanning",
    preview_alt_text: "Preview",
    ai_generated_alt_text: "AI Generated",
    type_cat: 'Cat',
    type_dog: 'Dog',
    type_bird: 'Bird',
    type_rabbit: 'Rabbit',
    type_fish: 'Fish',
    type_turtle: 'Turtle',
    type_other: 'Other',
    other_types: 'More...',
    hide: 'Hide',

    // General / Navigation
    welcome: 'Welcome',
    ai_intro: "Hello! I'm Pattty.",
    nav_summary: 'Summary',
    nav_pets: 'Pets',
    nav_ai: 'Assistant',
    nav_calendar: 'Calendar',
    nav_account: 'Profile',
    nav_vet: 'Find Vet',
    page_not_found: "Page Not Found",
    loading: "Loading...",

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
    ai_title: 'AI Assistant',
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
    cal_month_memories: 'Memories',
    cal_day_memory: 'Memory of the Day',
    cal_load_demo_memories: '[Demo: Load Random Memories]',
    cal_memory_saved_notif: 'Memory saved! 📸',
    cal_add_event_no_pet_warning: 'Add a Pet First!',
    freq_once: 'Once',
    freq_daily: 'Daily (30 Days)',
    freq_weekly: 'Weekly (1 Year)',
    freq_monthly: 'Monthly (1 Year)',
    freq_yearly: 'Yearly (5 Years)',

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
    ok_btn: 'OK',
    change_photo: 'Change', 

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
    gender_f_label: 'F',
    gender_m_label: 'M',
    unit_kg: 'KG',
    hide: 'Hide',
    phone: 'Phone',
    address: 'Address',

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
    set_help: 'Help & FAQ',
    set_terms: 'Terms of Use',
    set_logout: 'Log Out',
    acc_guest: 'Guest',
    acc_no_login: 'Not logged in',
    login_step_title: 'One Last Step!',
    login_step_desc: 'Complete your contact information.',
    login_desc: 'The best for your friends.',
    email_placeholder: 'Email Address',
    password_placeholder: 'Password',
    login_btn: 'Login',
    or: 'or',
    login_with_google: 'Continue with Google',
    name_required_placeholder: 'Full Name *',
    email_required_placeholder: 'Email *',
    password_required_placeholder: 'Password *',
    phone_required_placeholder: 'Phone Number *',
    address_optional_placeholder: 'Address (Optional)',
    complete_and_start_btn: 'Complete and Start',
    register_btn: 'Create Account',
    no_account: "Don't have an account?",
    register_link: 'Sign Up',
    already_member: 'Already a member?',
    login_link: 'Login',
    gen_general: 'General',
    placeholder_email_example: 'example@pattty.com', 
    placeholder_password_dots: '••••••••', 

    // Account extras
    acc_about: 'About',
    acc_find_vet: 'Find Nearby Vets',
    acc_delete_account: 'Delete Account',
    acc_delete_confirm_title: 'Delete Account',
    acc_delete_confirm_desc:
      'Are you sure you want to delete your account? This action cannot be undone.',
    acc_delete_confirm_yes: 'Yes, Delete',
    acc_delete_confirm_cancel: 'Cancel',

    // Privacy & Help
    privacy_title: 'Privacy Policy',
    privacy_content: 'At Pattty, we take your personal data seriously. Your data is used solely to improve the app experience and is not shared with third parties. All your data is stored encrypted on your device or our secure cloud servers.',
    terms_title: 'Terms of Use',
    terms_content: 'By using Pattty, you agree to follow community guidelines and acknowledge that health suggestions provided by the app do not replace medical advice. Always consult a veterinarian in emergencies.',
    help_faq_title: 'Frequently Asked Questions',
    faq_q1: 'Is Pattty free?',
    faq_a1: 'Pattty is currently free with its core features. Premium features may be added in the future.',
    faq_q2: 'Is my data safe?',
    faq_a2: 'Yes, your data is stored on end-to-end encrypted servers and is never shared with anyone.',
    faq_q3: 'How does the find vet feature work?',
    faq_a3: 'We list the nearest veterinary clinics to your location using Google Maps infrastructure.',
    faq_q4: 'Can I add multiple pets?',
    faq_a4: 'Yes! You can add unlimited pets and create separate profiles for each.',

    // ✅ YENİ BİLDİRİM KATEGORİLERİ
    notif_vaccine: 'Vaccine Reminders',
    notif_calendar: 'Calendar & Reminders',
    notif_updates: 'General Updates',
    notif_ai: 'AI & Insights',
    
    // Eski
    notif_vet: 'Vet Appointments',
    notif_daily: 'Daily Tasks',
    notif_dnd: 'Do Not Disturb',
    notif_dnd_desc: 'Mute notifications at night',

    err_missing_fields: 'Please fill in required fields.',
    ai_action_add: 'Added:',
    ai_action_remove: 'Removed:',
    ai_action_vaccine: 'Vaccine Added:',
    ai_typing: 'typing...',
    ai_placeholder: 'Ask something...',
    ai_image_sent: '[Image Sent]',
    ai_image: '[Image]',
    ai_no_pets_data: 'User currently has no pets added.',
    ai_no_memory: 'No past notes yet.',
    ai_online: 'Online',
    ai_pet_added_success: '🎉 **${newPet.name}** has been added to your family! \n\nWould you like me to create a vaccine or parasite schedule for their health now?',
    ai_not_found: 'Not Found:',
    ai_reminder_added: '📅 Added to calendar:',
    ai_weight_updated: '⚖️ Weight updated:',
    ai_note_added: '📝 Note taken:',
    ai_pet_info_name: 'Name',
    ai_pet_info_type: 'Species',
    ai_pet_info_breed: 'Breed',
    ai_pet_info_gender: 'Gender',
    ai_pet_info_weight: 'Weight',
    ai_pet_info_weight_none: 'None',
    ai_generating: 'Generating...',

    age_y: 'y',
    age_m: 'm',
    
    set_unit: "Unit Preference",
    unit_kg: "Metric (Kg, G)",
    unit_lbs: "Imperial (Lbs, Oz)",
    lbl_kg: "KG",
    lbl_gr: "G",
    lbl_lbs: "LBS",
    lbl_oz: "OZ",

    game_title: 'Games',
    app_name: "Pattty",

    weight_title: 'Weight Chart',
    weight_exists_error: 'Entry already exists for today.',
    err_neg_val: 'Invalid value.',
    weight_add: 'Add Entry',
    weight_input_kg: 'Kg',
    weight_input_gr: 'Gr',

    note_placeholder: "Write a new note...",
    note_empty: 'No notes yet.',
    note_empty_title: "No Notes Yet",
    note_empty_desc: "You can note down important dates, vaccines, or memories here.",

    vaccine_title: 'Vaccine Schedule',
    vac_ai_btn: 'AI Suggest',
    vac_manual_btn: 'Add Manually',
    vac_ai_error: 'Could not create plan.',
    vac_date_error: 'You must select a date.',
    vac_add: 'Add Vaccine',
    vac_manage: 'Manage Vaccines',
    vac_next: 'Next Vaccine',
    vac_none: 'No vaccines added yet.',
    vac_plan: 'Vaccine Plan',
    vac_done: 'Vaccine Completed',
    vac_name_date_error: 'Please select vaccine name and date.',
    vac_added_notif: 'Vaccine added.',
    vac_ai_suggest_title: 'AI Vaccine Suggestion',
    vac_ai_pre_desc: 'Before adding AI-generated vaccines, please make sure you have entered all vaccines your pet has already received.',
    vac_add_manually_btn: 'Add manually',
    vac_continue_with_ai_btn: 'Continue with AI',
    vac_ai_success_notif: 'AI-generated vaccine schedule added.',
    vac_ai_error_generic: 'Could not fetch vaccine suggestions. Please try again.',
    vac_no_vaccines: 'No vaccines added yet.',
    select_vaccine: 'Select vaccine',
    vac_add_btn: 'Add Vaccine',
    vac_ai_result_title: 'Your AI assistant suggested these vaccines',
    vac_ai_no_new_suggestion: 'No new vaccine suggestions.',
    vac_scan_subtitle: "Auto from Photo",
    vac_ai_subtitle: "Smart Calendar",
    lbl_vaccine_name: "Vaccine Name",
    lbl_date: "Date",
    vac_ai_added_count_suffix: "new vaccines added.",

    del_title: 'Delete?',
    del_desc: 'This action cannot be undone.',
    del_yes: 'Yes, Delete',

    id_lost_on_notif: '⚠️ LOST MODE ACTIVE! QR code turned red.',
    id_lost_off_notif: 'Lost mode turned off.',
    id_link_copied: 'Profile link copied!',
    id_lost_mode_title: 'Lost Mode',
    id_lost_mode_desc_on: 'Currently active! Finders will be alerted.',
    id_lost_mode_desc_off: 'Activate this if your pet is lost.',
    id_lost_searching: 'LOST SEARCH',
    id_safe: 'SAFE',
    id_show_qr: 'SHOW QR',
    id_tap_to_flip: 'Tap to flip',
    id_link: 'Link',
    id_share: 'Share',
    id_back_to_info: 'Back to Info',
    id_pair_tag_title: 'Pair Physical Tag',
    id_pair_tag_desc: 'Enter the code from your purchased <strong>Pattty Tag</strong> package here to link the tag to this profile.',
    id_enter_tag_code: 'Enter Tag Code',
    id_share_story_title: 'Pattty - ${monthName} Memories',
    id_share_story_text: 'Great memories from ${monthName}! 🐾 #PatttyApp',
    story_player_subtitle: 'Memories with Pattty',
    story_player_memories: 'Memories',

    alert_header: 'PATTTY ALERT',
    alert_near: 'nearby',
    alert_lost_suffix: 'Lost!',
    alert_seen_call: 'Seen / Call',
    alert_navigate_btn: 'Navigate',
    alert_dismiss: 'Dismiss',
    alert_default_msg: 'My pet is lost! Please contact if seen.',
    alert_loc_fetching: 'Fetching location and creating alert...',
    alert_loc_error: 'Location could not be fetched.',
    alert_loc_none: 'No location info.',
    alert_section_title: 'Emergency Alerts Nearby',
    alert_current_loc: 'Current location',
    
    alert_detail_breed: "Breed",
    alert_detail_color: "Color",
    alert_detail_weight: "Weight",
    alert_detail_gender: "Gender",

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
    vet_details: 'Clinic Details',
    vet_no_address: 'No address info',
    vet_searching: 'Searching...',
    vet_nearby_clinics_title: 'Nearby Clinics',
    vet_start_search_prompt: 'Start a location search.',
    
    my_location: 'My Location',
    default_vet_name: 'Veterinary Clinic',
    new: 'New',
    search_placeholder: 'Search clinics...',
    clinics: 'CLINICS',
    km: 'KM',
    open: 'OPEN',
    closed: 'CLOSED',
    veterinarian: 'Veterinarian',
    address: 'ADDRESS',
    call_phone: 'Call Now',
    get_directions: 'Get Directions',
    not_specified: 'Not specified',

    err_loc_unsupported: 'Your device does not support location services.',
    err_loc_denied: 'Location permission was denied. Please enable it in settings to find nearby vets.',
    err_maps_load: 'Google Maps services could not be loaded.',
    err_vet_api: 'No nearby vets found or an API error occurred.',
    err_no_results: 'No results found.',
    err_loc_denied_perm: 'Location permission was denied. Please enable it in settings.',
    err_loc_disabled: 'Location services may be disabled. Please enable GPS.',
    err_loc_timeout: 'Location request timed out. Please try again.',
    err_loc_generic: 'An error occurred while getting location.',
    err_loc_general: 'Could not get location or load the map.',

    filter_title: 'Filter & Sort',
    show_category: 'Show Category',
    sort_by: 'Sort By',
    sort_dist: 'Distance (Nearest)',
    sort_rating: 'Rating (Highest)',
    sort_name: 'Name (A-Z)',
    type_vet: 'Veterinary',
    type_petshop: 'Pet Shop',
    apply: 'Apply',

    dash_find_places: 'Find Vet & Pet Shops',
    dash_find_places_desc: 'Explore nearby clinics and stores.',
    mood_log_title: 'Mood Log',
    great_job: 'Great Job!',

    food_scan_title: "Food Analysis",
    food_scan_instruction_title: "Scan Ingredients",
    food_scan_desc: "Take a clear photo of the 'Ingredients' list on the back of the food package.",
    scan_instruction: 'Take a photo of the "Ingredients" label.',
    scan_upload: 'Take / Upload Photo',
    scan_retake: 'Retake',
    analyze_btn: "Analyze",
    analyzing: 'Analyzing Ingredients...',
    analyzing_text: "AI is Analyzing...",
    score_good: 'Excellent Choice',
    score_avg: 'Average',
    score_bad: 'Be Careful',
    scan_pros: 'Pros',
    scan_cons: 'Cons / Warnings',
    scan_disclaimer: 'AI generated analysis, not medical advice.',
    scan_error_title: 'Analysis Failed',
    scan_error_desc: 'Image is unclear or no label detected.',
    food_scan_error_text: "Text is not readable. Please try again in better lighting.",
    food_scan_pros: "PROS",
    food_scan_cons: "CONS",
    current_lang_code: 'en',
    current_lang_name: 'English',
    premium_required_alert: "This feature is for Premium members only.",
    
    // Validation
    err_name_format: 'Name must contain only letters.',
    err_name_length: 'Name must be between 2-25 characters.',
    err_birth_future: 'Birth date cannot be in the future.',
    err_age_limit: 'Age limit exceeded for this species (Max: {limit} years).',
    err_weight_zero: 'Weight must be greater than 0.',
    err_weight_limit: 'Weight limit exceeded for this species (Max: {limit} kg).',
    err_vaccine_date_invalid: 'Vaccine date cannot be before birth date.',

    // Premium & Paywall
    prem_limit_multi_pet: "Add unlimited pets!",
    prem_locked_feature: "This feature is for Premium members.",
    prem_msg_cooldown: "Message limit reached.",
    prem_action_limit: "Daily action limit reached. Come back tomorrow or upgrade to Premium!",
    prem_chat_limit: "Daily chat limit reached.",
    prem_img_limit: "Image analysis is a Premium feature.",
    prem_upgrade_success: "🎉 Congratulations! You are now Premium.",

    // Paywall Modal (Updated)
    pw_hero_title: "Pattty",
    pw_hero_desc: "Guarantee your pet's health, nutrition, and happiness with AI support.",
    pw_feat_food: "Food Analysis",
    pw_feat_vet: "Vet Finder",
    pw_feat_chat: "AI Assistant",
    pw_feat_multi: "Multi Profile",
    pw_feat_unlock: "unlock!",
    
    pw_benefit_1: "Unlimited Veterinary Assistant",
    pw_benefit_1_sub: "Ask 24/7, get instant answers. No waiting time.",
    pw_benefit_2: "Food & Health Analysis",
    pw_benefit_2_sub: "Scan ingredients, spot harmful additives instantly.",
    pw_benefit_3: "Your Whole Family in One Place",
    pw_benefit_3_sub: "Add and manage unlimited pets.",
    
    pw_plan_monthly: "Monthly",
    pw_plan_yearly: "Yearly",
    pw_best_value: "SAVE 40%",
    
    pw_food_compare: "Change their life for the price of",
    pw_food_compare_bold: "one wet food.",
    
    pw_cta_month: "Start with 39.99₺",
    pw_cta_year: "Choose Yearly (Save Big)",
    
    pw_secure: "Secure Payment & Cancel Anytime",
    pw_terms: "Subscription auto-renews. Cancel anytime in Settings.",
    pw_restore: "Restore Purchase",

    pw_food_title: "Food Analysis",
    pw_food_desc: "Analyze food ingredients in seconds and check suitability.",
    pw_vet_title: "Vet & Shop Finder",
    pw_vet_desc: "Find nearest open vets and ratings in emergencies.",
    pw_chat_title: "Unlimited Assistant",
    pw_chat_desc: "Ask unlimited questions and send photos without waiting.",
    pw_multi_title: "Grow Your Family",
    pw_multi_desc: "Add unlimited pets and manage them all in one place.",
    pw_vaccine_title: "Smart Vaccine Schedule",
    pw_vaccine_desc: "Create AI-powered vaccine plans specific to your pet's age and type.",
    pw_default_title: "Premium Feature",
    pw_default_desc: "Upgrade to Pattty Premium to access this feature.",
    pw_upgrade_btn: "Upgrade to Premium",
    pw_cancel_info: "Cancel anytime.",

    // Expense Tracker (PROFESSIONAL)
    exp_header_title: "FINANCIAL HEALTH",
    exp_title: "Expenses",
    exp_subtitle: "Monthly Budget Planning",
    exp_total_spend: "Total This Month",
    exp_premium_chart_title: "Pro Insights Locked",
    exp_premium_desc: "Visualize your spending and manage your budget like a pro.",
    exp_no_data: "No data for this month.",
    exp_recent_activity: "Recent Activity",
    exp_view_all: "View All",
    exp_empty_month: "No expenses this month.",
    
    // Form
    exp_add_title: "New Expense",
    exp_amount_label: "AMOUNT",
    exp_category_label: "CATEGORY",
    exp_custom_label: "EXPENSE DETAIL",
    exp_custom_placeholder: "E.g. Special Toy",
    exp_title_label: "TITLE",
    exp_title_placeholder: "E.g. Grocery Shopping",
    exp_date_label: "DATE",
    exp_note_label: "NOTE (OPTIONAL)",
    exp_note_placeholder: "Short note...",
    exp_add_confirm: "Add Expense",

    // Categories
    exp_cat_food: "Food & Diet",
    exp_cat_vet: "Veterinary",
    exp_cat_toy: "Toys",
    exp_cat_groom: "Grooming",
    exp_cat_other: "Other",

    // Account Settings - Premium Status
    acc_stat_premium: "Premium Member",
    acc_stat_free: "Pattty Free",
    acc_desc_premium: "You have unlimited access to all features.",
    acc_desc_free: "Upgrade to discover features.",
    acc_btn_upgrade: "Upgrade",
    acc_btn_demo_cancel: "(Demo: Cancel)",
    acc_app_version: "Pattty App v1.0.0",
    acc_made_with_love: "Made with ❤️ for pets",

    // AI Assistant
    ai_limit_reached_title: "Daily Limit Reached",
    ai_btn_upgrade: "Upgrade to Premium",

    // Expense Tracker (Diğer tekrarlar - cleanup yapılabilir ama orijinal yapıyı koruyoruz)
    // exp_title vb. yukarıda da var
    exp_form_title: "Expense Name",
    exp_add_btn: "Add Expense",
    exp_empty: "No expenses yet.",

    hub_empty_title: "Welcome to the Family!",
    hub_empty_desc: "You don't have any pets yet. Start the adventure by adding your first friend.",
    add_first_pet: "Add First Pet",
    my_pets_title: "My Pets",
    hub_subtitle: "You have {count} pets",
    sort_label: "Sort By",
    sort_name: "Name (A-Z)",
    sort_age: "Age (Youngest First)",
    sort_type: "Type",

    exp_no_note: "No note",
    err_amount_required: "Enter Amount",
    
    // Report
    btn_health_report: "Create Health Report",
    report_generated_mock: "Report generated successfully! (Demo)",
    
    // New Paywall Titles
    pw_report_title: "Veterinary Report",
    pw_report_desc: "Convert all health data into a professional PDF report with one click.",
    pw_expense_title: "Expense Analysis",
    pw_expense_desc: "Track spending with charts, manage your budget.",

    // Currency Settings
    set_unit_and_currency: "Unit & Currency",
    unit_weight_title: "WEIGHT UNIT",
    unit_currency_title: "CURRENCY",
    curr_try: "Turkish Lira (₺)",
    curr_usd: "US Dollar ($)",
    curr_eur: "Euro (€)",
    curr_gbp: "Pound Sterling (£)",

    // Vaccine Manager (New Design)
    vac_stat_risk: "At Risk",
    vac_stat_ok: "On Track",
    vac_stat_perfect: "Fully Protected",
    vac_stat_empty: "No Schedule",
    vac_stat_overdue_desc: "vaccines overdue!",
    vac_stat_upcoming_desc: "vaccines upcoming.",
    vac_stat_perfect_desc: "All vaccines are up to date.",
    vac_stat_empty_desc: "Add vaccines to start tracking.",
    
    // Vaccine Scan
    vac_scan_btn: "Scan Card",
    vac_scan_analyzing: "Scanning...",
    vac_scan_success: "Vaccines added successfully!",
    vac_scan_error: "Scan failed or no vaccines found.",
    pw_scan_card_title: "Vaccine Card Scan",
    pw_scan_card_desc: "Take a photo of the vaccine card, and let AI automatically add all vaccines to the calendar.",

    scan_camera: "Take Photo",
    scan_gallery: "Choose from Gallery",

    err_vet_api: "Could not fetch veterinary information.",
    err_loc_general: "An error occurred with location services.",
    filter_title: "Filter & Sort",
    show_category: "SHOW CATEGORY",
    type_vet: "Veterinary",
    type_petshop: "Pet Shop",
    sort_by: "SORT BY",
    sort_dist: "Distance",
    sort_rating: "Rating",
    sort_name: "Name",
    apply: "Apply",
    search_placeholder: "Search clinic or store...",
    clinics: "RESULTS",
    km: "KM",
    open: "OPEN",
    closed: "CLOSED",
    veterinarian: "Veterinarian",
    default_vet_name: "Unnamed Clinic",
    my_location: "My Location",

    mood_log_title: "Mood Log",
    status_updated: "Updated",
    streak_days: "Days",
    great_job: "Great Job!",
    mood_log_completed: "Today's log completed.",

    freq_once: "Once",
    freq_daily: "Daily",
    freq_weekly: "Weekly",
    freq_monthly: "Monthly",
    freq_yearly: "Yearly",
    ev_vaccine: "Vaccine",
    ev_vet: "Vet Visit",
    ev_med: "Medicine",
    ev_groom: "Grooming",
    ev_play: "Playtime",
    ev_other: "Other",
    cal_memory_saved_notif: "Memory saved successfully!",
    cal_day_memory: "Memory of the Day",
    cal_month_memories: "Watch Memories",
    cal_load_demo_memories: "Load Demo Memories",
    cal_add_event_no_pet_warning: "Add a pet first!",

    auth_invalid_email: "Invalid email address.",
    auth_user_not_found: "User not found.",
    auth_wrong_password: "Incorrect password.",
    auth_email_in_use: "This email is already in use.",
    auth_weak_password: "Password is too weak. Use at least 6 characters.",
    auth_unknown_error: "An unknown error occurred.",
    mobile_only_warning: "This feature works only on mobile devices.",

    // EN (English)
    account_title: "My Profile",
    guest_user: "Guest User",
    settings_general: "General Settings",
    notifications: "Notifications",
    privacy_security: "Privacy & Security",
    confirm_logout: "Are you sure you want to log out?",
    logout_btn: "Log Out",

    forgot_password_link: "Forgot Password?",
    reset_password_title: "Reset Password",
    reset_password_desc: "Enter your email, we'll send you a reset link.",
    send_reset_link: "Send Reset Link",
    enter_email_first: "Please enter your email address first.",
    reset_email_sent: "Reset email sent! Check your inbox.",
    auth_too_many_requests: "Too many attempts. Please try again later.",
    app_name: "Pattty",

    // --- Account & Settings ---
    acc_title: "My Account",
    acc_my_account: "My Profile",
    acc_settings: "General Settings",
    acc_guest: "Guest User",
    acc_no_login: "Not logged in",
    acc_delete_account: "Delete Account",
    acc_delete_confirm_title: "Are you sure?",
    acc_delete_confirm_desc: "This action cannot be undone. All your data, pet profiles, and records will be permanently deleted.",
    acc_delete_confirm_cancel: "Cancel",
    acc_delete_confirm_yes: "Yes, Delete",

    // --- Edit Modal ---
    edit_suffix: "Edit",
    save: "Save",
    form_name: "Full Name",
    phone: "Phone",
    address: "Address",

    // --- Premium Status ---
    acc_stat_premium: "Premium Member",
    acc_stat_free: "Free Plan",
    acc_desc_premium: "Unlimited access to all features.",
    acc_desc_free: "Upgrade for more features.",
    acc_btn_upgrade: "Upgrade to Premium",
    acc_btn_demo_cancel: "Cancel Subscription",

    // --- General Settings ---
    set_dark: "Dark Mode",
    set_lang: "Language",
    set_notif: "Notifications",
    set_unit_and_currency: "Units & Currency",
    set_support: "Support & About",
    set_help: "Help & FAQ",
    set_privacy: "Privacy Policy",
    set_terms: "Terms of Use",
    set_logout: "Log Out",

    // --- Units ---
    unit_weight_title: "WEIGHT UNIT",
    unit_kg: "Kilogram (kg)",
    unit_lbs: "Pound (lbs)",

    // --- Currencies ---
    unit_currency_title: "CURRENCY",
    curr_try: "Turkish Lira (₺)",
    curr_usd: "US Dollar ($)",
    curr_eur: "Euro (€)",
    curr_gbp: "Pound Sterling (£)",

    // --- Notifications ---
    notif_vaccine: "Vaccine Reminders",
    notif_vet: "Vet Appointments",

    // --- Other ---
    acc_find_vet: "Find Nearby Vet",
    acc_app_version: "Version 1.0.0",
    acc_made_with_love: "Pattty © 2025",

    // --- FAQ (Example) ---
    help_faq_title: "Help Center",
    faq_q1: "What does Premium include?",
    faq_a1: "It includes unlimited pets, AI assistant access, and advanced health tracking features.",
    faq_q2: "Is my data safe?",
    faq_a2: "Yes, all your data is stored on end-to-end encrypted servers.",
    faq_q3: "How do I cancel my subscription?",
    faq_a3: "You can cancel anytime via the subscription management in settings.",
    faq_q4: "Can I book vet appointments?",
    faq_a4: "Currently, you can only track appointments and view nearby vets.",

    // --- Privacy & Terms Titles ---
    privacy_title: "Privacy Policy",
    privacy_content: "Protecting user data is our priority...\n(Long text here)",
    terms_title: "Terms of Use",
    terms_content: "By using this app, you agree to the following terms...\n(Long text here)",

    // --- Login & Register Screen ---
    login_welcome_title: "Welcome Back!",
    login_welcome_desc: "Login to Pattty world.",
    login_create_title: "Create Account",
    login_create_desc: "The best for your pet.",
    
    form_name_label: "FULL NAME",
    form_name_placeholder: "Your Name",
    form_email_label: "EMAIL",
    form_password_label: "PASSWORD",
    
    login_forgot_password: "Forgot Password?",
    
    btn_login: "Log In",
    btn_register: "Sign Up",
    
    login_or_continue_with: "or continue with",
    btn_google_login: "Continue with Google",
    
    login_no_account: "Don't have an account?",
    login_have_account: "Already have an account?",
    btn_register_now: "Register Now",
    btn_login_now: "Log In",

    // --- Reset Password Modal ---
    reset_title: "Reset Password",
    reset_desc: "Don't worry, it happens. Enter your email and we'll send you a reset link.",
    reset_success_title: "Link Sent!",
    reset_success_desc: "Please check your email (and spam folder).",
    reset_error_msg: "User not found with this email or an error occurred.",
    btn_send_reset_link: "Send Reset Link",

    // --- Error Messages ---
    err_name_required: "Name field is required.",
    err_general: "An error occurred.",
    err_invalid_email: "Invalid email address.",
    err_user_not_found: "User not found.",
    err_wrong_password: "Incorrect password.",
    err_email_in_use: "Email already in use.",
    err_weak_password: "Password is too weak (min 6 chars).",
    err_google_login: "Google login failed or cancelled.",

    app_logo_alt: "Pattty App Logo",

    // Welcome Screen
    intro_welcome_title: "Welcome to Pattty!",
    intro_welcome_desc: "The most comprehensive AI-powered care assistant designed for your furry friends.",
    
    intro_home_title: "Everything in One Place",
    intro_home_desc: "Upcoming vaccines, appointments, and your pet's health status... All on the home screen, at your fingertips.",
    
    intro_pets_title: "Manage Your Pets",
    intro_pets_desc: "Add multiple pets, create profiles, and track each one's needs individually.",
    
    intro_ai_title: "Pattty AI is Here",
    intro_ai_desc: "You can ask our AI assistant anything about your pet's health 24/7.",
    
    intro_calendar_title: "Smart Calendar",
    intro_calendar_desc: "Vaccine schedules, vet appointments, and special days... We won't let you forget anything.",
    
    intro_account_title: "Your World",
    intro_account_desc: "Personalize your profile, manage settings, and explore premium privileges.",
    
    intro_btn_skip: "SKIP",
    intro_btn_next: "NEXT",
    intro_btn_start: "LET'S START",

    // Password Confirm Field
    form_password_confirm_label: "CONFIRM PASSWORD",
    
    // Errors & Warnings
    err_passwords_do_not_match: "Passwords do not match.",
    
    // Email Verification Modal
    verify_email_title: "Verify Your Email",
    verify_email_desc: "Thanks for signing up! We sent a verification link to your email to secure your account. Please check your inbox.",
    btn_understood: "Understood, I'll Check",

    // Email Verification Errors
    err_email_not_verified: "Your email address is not verified yet. Please check your inbox.",
    msg_verification_resent: "Verification email resent.",
    msg_please_verify: "Registration successful! However, for your safety, you must verify your email address before logging in.",

    // --- Paywall (Dynamic Pricing Update) ---
    pay_title: "Pattty Premium",
    pay_subtitle: "Unlock Unlimited Features",
    
    pay_feat_1: "Add Unlimited Pets",
    pay_feat_2: "Unlimited 24/7 Chat with Pattty AI",
    pay_feat_3: "Advanced Health & Vaccine Tracking",
    pay_feat_4: "Ad-Free Experience",
    
    // Plan Names
    pay_plan_monthly_label: "Monthly Plan",
    pay_plan_yearly_label: "Yearly Plan",
    
    // Badges
    pay_badge_best_value: "BEST VALUE",
    pay_badge_save: "SAVE 50%",
    
    // Dynamic Formats
    pay_text_per_month: "/ mo",
    pay_text_per_year: "/ yr",
    pay_text_just_per_month: "Just {price}/mo",
    
    // Buttons
    pay_btn_start: "Get Premium",
    pay_btn_restore: "Restore Purchase",
    pay_cancel_anytime: "Cancel anytime.",
    pay_terms: "Terms of Use",
    pay_privacy: "Privacy Policy",
    
    // Messages
    pay_processing: "Processing...",
    pay_success: "Success!",
    pay_restore_success: "Subscription Restored",
    pay_restore_fail: "No Active Subscription Found",

    // --- PAYWALL / PREMIUM SCREEN (Updated) ---
    pay_title: "Pattty Premium",
    pay_subtitle: "Unlock Unlimited Features",
    
    // Badges & Labels
    pay_badge_save: "SAVE 50%",
    pay_badge_popular: "MOST POPULAR",
    pay_badge_limited: "LIMITED OFFER",
    
    // Comparison Table Headers
    pay_feat_compare_free: "Free",
    pay_feat_compare_prem: "Premium",
    
    // Comparison Rows
    pay_feat_row_1: "Basic Pet Tracking",
    pay_feat_row_2: "Unlimited Vaccine & Health Reminders",
    pay_feat_row_3: "AI Vet Assistant (24/7)",
    pay_feat_row_4: "Advanced Food Analysis & Scan",
    
    // Social Proof (Review)
    pay_review_text: "Thanks to this app, I caught my dog's allergy early. Amazing tool!",
    pay_review_author: "Vet Dr. Emily K.",
    
    // Plan Names
    pay_plan_monthly_label: "Monthly Plan",
    pay_plan_yearly_label: "Yearly Plan",
    
    // Price Texts
    pay_text_per_month: "/ mo",
    pay_text_per_year: "/ yr",
    pay_text_just_per_month: "Just {price}/mo",
    
    // Buttons & Footer
    pay_btn_start: "Get Premium",
    pay_btn_restore: "Restore Purchase",
    pay_secure: "Secured Payment & Cancel Anytime",
    pay_terms: "Terms of Use",
    pay_privacy: "Privacy Policy",
    
    // Status Messages
    pay_error_title: "Transaction Failed",
    pay_restore_success: "Subscription restored successfully.",
    pay_restore_fail: "No active subscription found.",
    status_online: "Online",

    // Landing Page Texts
    landing_nav_features: "Features",
    landing_nav_security: "Security",
    landing_nav_download: "Download",
    landing_btn_open: "Open App",
    landing_badge: "Pattty 1.0 is Live",
    landing_hero_title_1: "Super App For",
    landing_hero_title_2: "Your Best Friend.",
    landing_hero_desc: "Vaccine tracking, AI-powered health analysis, QR tag system, and more. Pattty is designed for modern pet owners.",
    landing_btn_appstore: "Download on App Store",
    landing_btn_googleplay: "Get it on Google Play",
    landing_mockup_text: "App Screenshot Placeholder",
    landing_feat_ai_title: "AI Assistant",
    landing_feat_ai_desc: "Consult our AI assistant before visiting the vet. It analyzes symptoms and offers suggestions.",
    landing_feat_qr_title: "Smart QR Tag",
    landing_feat_qr_desc: "Don't worry if they get lost. Get instant notifications when someone scans their QR code.",
    landing_feat_health_title: "Health Tracking",
    landing_feat_health_desc: "Vaccines, medications, and vet appointments. Manage everything in one place, never forget.",
    landing_footer_privacy: "Privacy Policy",
    landing_footer_terms: "Terms of Use",
    landing_footer_contact: "Contact",
    landing_footer_rights: "All rights reserved.",

    step_1_desc: "Basic Information",
    step_2_desc: "Photo & Style",
    edit_pet_title: "Edit Pet",
    add_pet_title: "Add New Pet",
    err_file_too_large: "File size too large (Max 5MB)",
    err_image_generation: "Could not generate image. Please try again.",
    confirm_no_image: "You haven't generated a custom image for your pet. Do you want to continue?",
    ai_generating: "Magic brushes are working...",
    ai_generating_desc: "This process may take a few seconds.",
    ai_generated: "AI Generated",
    upload_photo_title: "Upload a photo",
    upload_photo_desc: "Upload a real photo, and we'll turn it into a work of art!",
    btn_generate_ai: "Generate Styled Image",
    ai_info_text: "The photo you upload will be transformed into a unique image in a high-quality cartoon/illustration style that matches the app's design language. For best results, choose a clear and bright photo.",
    btn_back: "Back",
    btn_next: "Continue",
    btn_save_pet: "Save & Finish",
    btn_update: "Update",
    
    err_login_required: "You must log in to save.",
    pet_added_suffix: "successfully added!",
    err_save_pet_prefix: "Could not save pet: ",
    info_updated: "Information updated.",
    delete_success: "Record deleted.",
    delete_failed: "Delete failed.",

    acc_update_error: "An error occurred during update.",
    acc_edit_placeholder: "Enter {label}...",
    
    // --- ANALYSIS CENTER ---
    analysis_hub_title: "Analysis Center",
    analysis_mode_food: "Can Eat?",
    analysis_mode_poop: "Poop Analysis",
    analysis_mode_ingredients: "Pack Ingredients",
    select_pet_label: "Analyze for which pet?",

    // Food Analysis
    btn_analyze_food: "Analyze Food",
    analyzing_food: "Analyzing food...",
    food_safe_title: "Safe to Eat ✅",
    food_caution_title: "Be Careful ⚠️",
    food_danger_title: "Do Not Eat ⛔",
    food_analysis_prompt: "Identify the food in this photo. Analyze if this food is safe for a {petType} ({petName}). Output JSON: { 'food_name': 'Food Name', 'safety_level': 'safe' | 'caution' | 'danger', 'description': 'Short description and reason', 'advice': 'Advice to user' }.",

    // Poop Analysis
    btn_analyze_poop: "Analyze Poop",
    analyzing_poop: "Analyzing poop...",
    poop_healthy_title: "Looks Healthy 💚",
    poop_concern_title: "Monitor Closely ⚠️",
    poop_emergency_title: "Consult Vet 🚨",
    poop_analysis_prompt: "Analyze the pet poop in this photo. Pet type: {petType}. Assess color, consistency, and potential health issues. Provide general comment stating this is not medical advice. Output JSON: { 'status': 'healthy' | 'concern' | 'emergency', 'details': 'Findings', 'recommendation': 'Recommendation' }.",

  }
};

/* ========================================================================== */
/* 13. TÜRE GÖRE LOKAL VERİ                                                    */
/* ========================================================================== */

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
    breedName: (breedKey, type, customBreed) => {
      if (customBreed) return customBreed;
      const list = BREEDS[type]?.[l] || [];
      const otherLabel = list[list.length - 1];
      if (breedKey === otherLabel) return otherLabel;
      return breedKey || t('type_other');
    },
  };
};