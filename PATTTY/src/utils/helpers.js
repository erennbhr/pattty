// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/utils/helpers.js

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
  
  // 3 haneli hex kodlarını 6 haneye çevir (örn: #fff -> #ffffff)
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  // Renk hesaplama
  const result = hex.match(/.{2}/g).map(c => {
    const val = parseInt(c, 16);
    const adjusted = Math.min(255, Math.max(0, val + amount));
    return adjusted.toString(16).padStart(2, '0');
  }).join('');

  return '#' + result;
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
    ai_title: 'AI Asistan',
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
    ok_btn: 'Tamam',

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

    // Bildirim ayarları
    notif_vaccine: 'Aşı Hatırlatıcıları',
    notif_vet: 'Veteriner Randevuları',
    notif_daily: 'Günlük Görevler',
    notif_dnd: 'Rahatsız Etme',
    notif_dnd_desc: 'Gece bildirimleri sessize al',

    // Hata & AI
    err_missing_fields: 'Lütfen zorunlu alanları doldurun.',
    ai_action_add: 'Eklendi:',
    ai_action_remove: 'Silindi:',
    ai_action_vaccine: 'Aşı İşlendi:',
    err_ai_missing_info: 'Bilgiler eksik.',
    ai_error_api: 'Bağlantı hatası.',
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

    // Pet detay tab başlıkları
    tab_notes: 'Notlar',
    game_title: 'Oyunlar',

    // Kilo
    weight_title: 'Kilo Grafiği',
    weight_exists_error: 'Bugün zaten ölçüm yapıldı.',
    err_neg_val: 'Geçersiz değer.',
    weight_add: 'Ölçüm Ekle',
    weight_input_kg: 'Kg',
    weight_input_gr: 'Gr',

    // Notlar
    note_placeholder: 'Bir not al...',
    note_empty: 'Henüz not yok.',

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

    // Vet Locator & Detay (GÜNCELLENDİ)
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
    
    // YENİ EKLENENLER: VetLocator.jsx & VetDetails.jsx İçin
    my_location: 'Konumum',
    default_vet_name: 'Veteriner Kliniği',
    new: 'Yeni',
    search_placeholder: 'Klinik ara...',
    clinics: 'KLİNİK',
    km: 'KM',
    open: 'AÇIK',
    closed: 'KAPALI',
    veterinarian: 'Veteriner',
    address: 'ADRES',
    call_phone: 'Telefonla Ara',
    get_directions: 'Yol Tarifi Al',
    not_specified: 'Belirtilmemiş',

    // Hata mesajları (Vet)
    err_loc_unsupported: 'Cihazınız konum servislerini desteklemiyor.',
    err_loc_denied: 'Konum izni reddedildi. Ayarlardan izin verin.',
    err_maps_load: 'Google Haritalar servisleri yüklenemedi.',
    err_vet_api: 'Yakınlarda veteriner bulunamadı veya API hatası oluştu.',
    err_no_results: 'Sonuç bulunamadı.',
    err_loc_denied_perm: 'Konum iznini reddettiniz. Ayarlardan izin vermeniz gerekiyor.',
    err_loc_disabled: 'Konum servisleri kapalı olabilir. Lütfen GPS\'i açın.',
    err_loc_timeout: 'Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin.',
    err_loc_generic: 'Konum alınırken bir hata oluştu.',
    err_loc_general: 'Konum alınamadı veya harita yüklenemedi.',


    // Filtre & Sıralama
    filter_title: 'Filtrele & Sırala',
    show_category: 'Kategori Göster',
    sort_by: 'Sıralama Ölçütü',
    sort_dist: 'Mesafe (En Yakın)',
    sort_rating: 'Puan (En Yüksek)',
    sort_name: 'İsim (A-Z)',
    type_vet: 'Veteriner',
    type_petshop: 'Pet Shop',
    apply: 'Uygula',

    // Dashboard Ekstralar
    dash_find_places: 'Vet & Pet Shop Bul',
    dash_find_places_desc: 'Yakınındaki veteriner ve mağazaları keşfet.',
    mood_log_title: 'Ruh Hali Günlüğü',
    great_job: 'Harika İş!',

    // Food Scan
    food_scan_title: 'Mama Analizi',
    scan_instruction: 'Mama paketinin "İçindekiler" bölümünün fotoğrafını çek.',
    scan_upload: 'Fotoğraf Çek / Yükle',
    scan_retake: 'Tekrar Çek',
    analyzing: 'İçerik Analiz Ediliyor...',
    score_good: 'Mükemmel Seçim',
    score_avg: 'Ortalama',
    score_bad: 'Dikkatli Olun',
    scan_pros: 'Artıları',
    scan_cons: 'Eksileri / Uyarılar',
    scan_disclaimer: 'Bu analiz AI tarafından üretilmiştir, tıbbi tavsiye değildir.',
    scan_error_title: 'Analiz Yapılamadı',
    scan_error_desc: 'Görsel net değil veya bir etiket algılanamadı.',
    current_lang_code: 'tr',
    current_lang_name: 'Turkish',

    // YENİ EKLENEN DOĞRULAMA MESAJLARI
    err_name_format: 'İsim sadece harflerden oluşmalıdır.',
    err_name_length: 'İsim 2-25 karakter arasında olmalıdır.',
    err_birth_future: 'Doğum tarihi gelecekte olamaz.',
    err_age_limit: 'Bu tür için yaş sınırı aşıldı (Max: {limit} yıl).',
    err_weight_zero: "Kilo 0'dan büyük olmalıdır.",
    err_weight_limit: 'Bu tür için kilo sınırı aşıldı (Max: {limit} kg).',
    err_vaccine_date_invalid: 'Aşı tarihi, doğum tarihinden önce olamaz.',

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
    faq_a2: 'Yes, your data is stored on encrypted servers and is never shared with anyone.',
    faq_q3: 'How does the find vet feature work?',
    faq_a3: 'We list the nearest veterinary clinics to your location using Google Maps infrastructure.',
    faq_q4: 'Can I add multiple pets?',
    faq_a4: 'Yes! You can add unlimited pets and create separate profiles for each.',

    // Notification settings
    notif_vaccine: 'Vaccine Reminders',
    notif_vet: 'Vet Appointments',
    notif_daily: 'Daily Tasks',
    notif_dnd: 'Do Not Disturb',
    notif_dnd_desc: 'Mute notifications at night',

    // Errors & AI
    err_missing_fields: 'Please fill in required fields.',
    ai_action_add: 'Added:',
    ai_action_remove: 'Removed:',
    ai_action_vaccine: 'Vaccine Added:',
    err_ai_missing_info: 'Missing information.',
    ai_error_api: 'Connection error.',
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
    weight_input_kg: 'Kg',
    weight_input_gr: 'Gr',

    // Notes
    note_placeholder: 'Add a note...',
    note_empty: 'No notes yet.',

    // Vaccine / Vaccine Manager
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

    // Delete dialogs (generic)
    del_title: 'Delete?',
    del_desc: 'This action cannot be undone.',
    del_yes: 'Yes, Delete',

    // Game
    game_draw: 'Draw',
    game_win: 'You Win!',
    game_lose: 'You Lose',
    game_area_title: 'Game Zone',
    game_area_desc: 'Collect points, have fun!',
    game_catch_title: 'Prize Hunter',
    game_catch_desc: 'Test your reflexes!',
    game_memory_title: 'Paw Memory',
    game_memory_desc: 'Match the cards.',
    game_rps_title: 'Rock Paper Scissors',
    game_rps_desc: 'Trust your luck.',
    game_score: 'Score:',
    game_your_score: 'Your Score:',
    game_time_up: 'Time Up!',
    game_play_again: 'Play Again',
    game_start: 'Start',
    game_moves: 'Moves:',
    game_congrats: 'Congrats!',
    game_moves_desc: 'moves to finish.',
    game_again: 'Again',
    game_you: 'YOU',
    game_ai: 'PATTTY',
    game_make_choice: 'Make Your Choice',
    game_vs: 'VS',
    game_you_label: 'You',
    game_ai_label: 'Pattty',
    game_rps_rock: 'Rock',
    game_rps_paper: 'Paper',
    game_rps_scissors: 'Scissors',

    // Digital ID
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

    // Vet Locator & Detail (UPDATED)
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
    
    // NEW ADDITIONS
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

    // Errors
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

    // Filter & Sort
    filter_title: 'Filter & Sort',
    show_category: 'Show Category',
    sort_by: 'Sort By',
    sort_dist: 'Distance (Nearest)',
    sort_rating: 'Rating (Highest)',
    sort_name: 'Name (A-Z)',
    type_vet: 'Veterinary',
    type_petshop: 'Pet Shop',
    apply: 'Apply',

    // Dashboard Extras
    dash_find_places: 'Find Vet & Pet Shops',
    dash_find_places_desc: 'Explore nearby clinics and stores.',
    mood_log_title: 'Mood Log',
    great_job: 'Great Job!',

    // Food Scan
    food_scan_title: 'Food Analysis',
    scan_instruction: 'Take a photo of the "Ingredients" label.',
    scan_upload: 'Take / Upload Photo',
    scan_retake: 'Retake',
    analyzing: 'Analyzing Ingredients...',
    score_good: 'Excellent Choice',
    score_avg: 'Average',
    score_bad: 'Be Careful',
    scan_pros: 'Pros',
    scan_cons: 'Cons / Warnings',
    scan_disclaimer: 'AI generated analysis, not medical advice.',
    scan_error_title: 'Analysis Failed',
    scan_error_desc: 'Image is unclear or no label detected.',
    current_lang_code: 'en',
    current_lang_name: 'English',

    // NEW VALIDATION MESSAGES
    err_name_format: 'Name must contain only letters.',
    err_name_length: 'Name must be between 2-25 characters.',
    err_birth_future: 'Birth date cannot be in the future.',
    err_age_limit: 'Age limit exceeded for this species (Max: {limit} years).',
    err_weight_zero: 'Weight must be greater than 0.',
    err_weight_limit: 'Weight limit exceeded for this species (Max: {limit} kg).',
    err_vaccine_date_invalid: 'Vaccine date cannot be before birth date.',

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