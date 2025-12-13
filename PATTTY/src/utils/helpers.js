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
    return `${Math.floor(months / 12)} ${t('age_y')}`;
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
    page_not_found: "Sayfa Bulunamadı",

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
    
    // Birim ayarları
    set_unit: "Birim Tercihi",
    unit_kg: "Metrik (Kg, Gr)",
    unit_lbs: "Imperial (Lbs, Oz)",
    lbl_kg: "KG",
    lbl_gr: "GR",
    lbl_lbs: "LBS",
    lbl_oz: "OZ",

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
    note_placeholder: "Yeni bir not yazın...",
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
    lost_modal_title: "Emergency Alert",
    lost_modal_warning_title: "LEGAL WARNING",
    lost_modal_warning_text: "This feature is for real emergencies only. Misleading, prank, or inappropriate alerts will result in a permanent account ban and device block.",
    lost_note_label: "Additional Info & Status",
    lost_note_placeholder: "E.g. Limping on left back leg, has red collar. Last seen near park entrance...",
    lost_confirm_btn: "BROADCAST ALERT",
    lost_cancel_btn: "Cancel",
    lost_auto_info: "Auto-included Info:",

    alert_detail_breed: "Breed",
    alert_detail_color: "Color",
    alert_detail_weight: "Weight",
    alert_detail_gender: "Gender",

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

    lost_modal_title: "Acil Durum Bildirimi",
    lost_modal_warning_title: "YASAL UYARI",
    lost_modal_warning_text: "Bu özellik sadece gerçek kayıp vakaları içindir. Yanıltıcı, şaka amaçlı veya uygunsuz bildirimler tespit edildiğinde hesabınız kalıcı olarak kapatılacak ve cihazınız engellenecektir.",
    lost_note_label: "Ek Bilgiler & Durum",
    lost_note_placeholder: "Örn: Sol arka ayağı aksıyor, kırmızı tasması var. En son parkın girişinde görüldü...",
    lost_confirm_btn: "BİLDİRİMİ YAYINLA",
    lost_cancel_btn: "Vazgeç",
    lost_auto_info: "Otomatik Eklenecek Bilgiler:",
    
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
    veterinarian: 'Veteriner',
    address: 'ADRES',
    call_phone: 'Telefonla Ara',
    get_directions: 'Yol Tarifi Al',
    not_specified: 'Belirtilmemiş',

    // Hata mesajları
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
    food_scan_title: "Mama Analizi",
    food_scan_instruction_title: "İçerikleri Tara",
    food_scan_desc: "Mamanın arka yüzündeki 'İçindekiler' listesinin net bir fotoğrafını çekin.",
    analyze_btn: "Analiz Et",
    analyzing_text: "Yapay Zeka İnceliyor...",
    food_scan_error_text: "Yazılar net okunamadı. Lütfen ışıklı bir ortamda tekrar deneyin.",
    food_scan_pros: "ARTILAR",
    food_scan_cons: "EKSİLER",
    premium_required_alert: "Bu özellik sadece Premium üyeler içindir.", // Daha önce eklenmiş olabilir

    // Doğrulama Hataları
    err_name_format: 'İsim sadece harflerden oluşmalıdır.',
    err_name_length: 'İsim 2-25 karakter arasında olmalıdır.',
    err_birth_future: 'Doğum tarihi gelecekte olamaz.',
    err_age_limit: 'Bu tür için yaş sınırı aşıldı (Max: {limit} yıl).',
    err_weight_zero: "Kilo 0'dan büyük olmalıdır.",
    err_weight_limit: 'Bu tür için kilo sınırı aşıldı (Max: {limit} kg).',
    err_vaccine_date_invalid: 'Aşı tarihi, doğum tarihinden önce olamaz.',

    // Premium & Paywall (EKSİK OLAN VİRGÜL HATASI GİDERİLDİ)
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
    exp_title: "Masraf Takibi",
    exp_subtitle: "Harcamalarını kontrol et",
    exp_total_spend: "Toplam Harcama",
    exp_premium_chart_title: "Detaylı Analizler",
    exp_form_title: "Harcama Adı",
    exp_add_btn: "Harcama Ekle",
    exp_empty: "Henüz harcama yok.",
    exp_cat_food: "Mama",
    exp_cat_vet: "Veteriner",
    exp_cat_toy: "Oyuncak",
    exp_cat_other: "Diğer",
    
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
    exp_title: "Harcamalar",
    exp_subtitle: "Aylık Bütçe Planlaması",
    exp_total_spend: "Bu Ay Toplam",
    exp_premium_chart_title: "Pro Analizler Kilitli",
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

    err_vet_api: "Veteriner bilgileri alınamadı.",
    err_loc_general: "Konum servislerinde bir hata oluştu.",
    filter_title: "Filtrele ve Sırala",
    show_category: "KATEGORİ GÖSTER",
    type_vet: "Veteriner",
    type_petshop: "Pet Shop",
    sort_by: "SIRALAMA",
    sort_dist: "Mesafe",
    sort_rating: "Puan",
    sort_name: "İsim",
    pply: "Uygula",
    search_placeholder: "Klinik veya mağaza ara...",
    clinics: "SONUÇ",
    km: "KM",
    open: "AÇIK",
    closed: "KAPALI",
    veterinarian: "Veteriner",
    default_vet_name: "İsimsiz Klinik",
    my_location: "Konumum",

    mood_log_title: "Ruh Hali Günlüğü",
    status_updated: "Güncellendi",
    streak_days: "Gün",
    great_job: "Harika İş!",
    mood_log_completed: "Bugünün kaydı tamamlandı.",

    freq_once: "Bir Kez",
    freq_daily: "Günlük",
    freq_weekly: "Haftalık",
    freq_monthly: "Aylık",
    freq_yearly: "Yıllık",
    ev_vaccine: "Aşı",
    ev_vet: "Veteriner",
    ev_med: "İlaç",
    ev_groom: "Bakım",
    ev_play: "Oyun",
    ev_other: "Diğer",
    cal_memory_saved_notif: "Anı başarıyla kaydedildi!",
    cal_day_memory: "Günün Anısı",
    cal_month_memories: "Anılarını İzle",
    cal_load_demo_memories: "Demo Anıları Yükle",
    cal_add_event_no_pet_warning: "Önce evcil hayvan ekleyin!",
    
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
    page_not_found: "Page Not Found",

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
    
    // Unit settings
    set_unit: "Unit Preference",
    unit_kg: "Metric (Kg, G)",
    unit_lbs: "Imperial (Lbs, Oz)",
    lbl_kg: "KG",
    lbl_gr: "G",
    lbl_lbs: "LBS",
    lbl_oz: "OZ",

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
    note_placeholder: "Write a new note...",
    note_empty_title: "No Notes Yet",
    note_empty_desc: "You can note down important dates, vaccines, or memories here.",

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
    vac_scan_subtitle: "Auto from Photo",
    vac_ai_subtitle: "Smart Calendar",
    lbl_vaccine_name: "Vaccine Name",
    lbl_date: "Date",
    vac_ai_added_count_suffix: "new vaccines added.",

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

    // Alert Network (NEW)
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
    food_scan_title: "Food Analysis",
    food_scan_instruction_title: "Scan Ingredients",
    food_scan_desc: "Take a clear photo of the 'Ingredients' list on the back of the food package.",
    analyze_btn: "Analyze",
    analyzing_text: "AI is Analyzing...",
    food_scan_error_text: "Text is not readable. Please try again in better lighting.",
    food_scan_pros: "PROS",
    food_scan_cons: "CONS",
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

    // Expense Tracker
    exp_title: "Expense Tracker",
    exp_subtitle: "Control your budget",
    exp_total_spend: "Total Spend",
    exp_premium_chart_title: "Detailed Insights",
    exp_form_title: "Expense Name",
    exp_add_btn: "Add Expense",
    exp_empty: "No expenses yet.",
    exp_cat_food: "Food",
    exp_cat_vet: "Vet",
    exp_cat_toy: "Toys",
    exp_cat_other: "Other",
    
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
    curr_gbp: "Pound (£)",

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