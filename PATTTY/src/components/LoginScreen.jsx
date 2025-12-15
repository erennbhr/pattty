import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight,
  Check, X, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth'; 
import { auth } from '../utils/firebase';

// --- LOGO IMPORT ---
import logo from '../assets/logo.png';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LoginScreen = () => {
  const { t } = useLanguage();
  const { login, register, loginWithGoogle } = useAuth();

  // --- STATE YÖNETİMİ ---
  const [isLoginView, setIsLoginView] = useState(true); 
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Verileri
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '' 
  });

  // Modallar
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  
  // Modal İçeriği Değişkeni (Kayıt sonrası mı, giriş hatası mı?)
  const [verifyModalContent, setVerifyModalContent] = useState({
      title: '',
      desc: ''
  });

  // Şifre Sıfırlama State'i
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');

  // --- EFFECT: Kayıt Sonrası Modal Kontrolü ---
  // Kayıt olup logout olduğumuzda sayfa yenilenebilir,
  // bu yüzden localStorage'dan bayrak kontrolü yapıyoruz.
  useEffect(() => {
    const pendingVerification = localStorage.getItem('pendingVerification');
    if (pendingVerification) {
        setVerifyModalContent({
            title: t('verify_email_title'),
            desc: t('msg_please_verify')
        });
        setShowVerifyModal(true);
        localStorage.removeItem('pendingVerification');
    }
  }, [t]);

  // --- HANDLERS ---

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // Giriş / Kayıt İşlemi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginView) {
        // --- GİRİŞ YAP ---
        await login(formData.email, formData.password);
        
        // KONTROL: E-posta doğrulanmış mı?
        // Not: login fonksiyonu await olduğu için şu an auth.currentUser doludur.
        const user = auth.currentUser;
        
        if (user && !user.emailVerified) {
            // Eğer doğrulanmamışsa:
            // 1. Yardımcı olmak için yeni bir doğrulama maili gönder (Hata almamak için try-catch)
            try { await sendEmailVerification(user); } catch(e) {}
            
            // 2. Kullanıcıyı at (Çıkış yap)
            await signOut(auth);

            // 3. Hata fırlat ki UI güncellensin
            throw new Error("EMAIL_NOT_VERIFIED");
        }

      } else {
        // --- KAYIT OL ---
        
        // 1. İsim Kontrolü
        if (!formData.name) throw new Error(t('err_name_required'));
        
        // 2. Şifre Eşleşme Kontrolü
        if (formData.password !== formData.passwordConfirm) {
            throw new Error(t('err_passwords_do_not_match'));
        }

        // 3. Kayıt İşlemi
        await register(formData.email, formData.password, formData.name);

        // 4. Doğrulama Maili Gönder
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }

        // 5. ZORUNLU ÇIKIŞ VE MODAL AYARI
        // Kullanıcıyı içeri almadan atıyoruz.
        // Modalın göründüğünden emin olmak için localStorage kullanıyoruz.
        localStorage.setItem('pendingVerification', 'true');
        await signOut(auth);
        
        // Sayfa state'ini login'e çek (Geri döndüğünde giriş ekranını görsün)
        setIsLoginView(true);
      }
    } catch (err) {
      console.error(err);
      let msg = t('err_general');

      if (err.message === "EMAIL_NOT_VERIFIED") {
          msg = t('err_email_not_verified') + " " + t('msg_verification_resent');
      }
      else if (err.message === t('err_passwords_do_not_match')) msg = t('err_passwords_do_not_match');
      else if (err.code === 'auth/invalid-email') msg = t('err_invalid_email');
      else if (err.code === 'auth/user-not-found') msg = t('err_user_not_found');
      else if (err.code === 'auth/wrong-password') msg = t('err_wrong_password');
      else if (err.code === 'auth/email-already-in-use') msg = t('err_email_in_use');
      else if (err.code === 'auth/weak-password') msg = t('err_weak_password');
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    await loginWithGoogle();
    // Google ile girişlerde genelde emailVerified otomatik true gelir.
    // Ancak yine de kontrol etmek isterseniz burada da benzer mantık kurabilirsiniz.
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetStatus('loading');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus('success');
      setTimeout(() => {
        setShowForgotModal(false);
        setResetStatus('idle');
        setResetEmail('');
      }, 3000);
    } catch (err) {
      setResetStatus('error');
      console.error("Şifre sıfırlama hatası:", err);
    }
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen w-full bg-white dark:bg-black flex flex-col relative overflow-hidden transition-colors duration-300 animate-in fade-in">

      {/* Arka Plan Efektleri */}
      <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 z-10 py-10">

        {/* Logo */}
        <div className="flex justify-center mb-8 animate-in zoom-in-90 duration-500">
            <img
              src={logo}
              alt={t('app_logo_alt')}
              className="w-40 h-40 object-contain drop-shadow-2xl"
            />
        </div>

        {/* Başlıklar */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
            {isLoginView ? t('login_welcome_title') : t('login_create_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {isLoginView
              ? t('login_welcome_desc')
              : t('login_create_desc')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* İsim Alanı (Sadece Kayıtta) */}
          {!isLoginView && (
            <div className="group animate-in slide-in-from-left fade-in duration-300">
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{t('form_name_label')}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t('form_name_placeholder')}
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-[#1A1D21] border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                />
              </div>
            </div>
          )}

          {/* E-posta */}
          <div className="group">
             <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{t('form_email_label')}</label>
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="ornek@pattty.com"
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-[#1A1D21] border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                />
             </div>
          </div>

          {/* Şifre */}
          <div className="group">
             <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{t('form_password_label')}</label>
             <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 bg-gray-50 dark:bg-[#1A1D21] border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
             </div>
          </div>

          {/* Şifre Tekrar (Sadece Kayıtta) */}
          {!isLoginView && (
            <div className="group animate-in slide-in-from-left fade-in duration-300 delay-100">
               <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{t('form_password_confirm_label')}</label>
               <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-[#1A1D21] border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                  />
               </div>
            </div>
          )}

          {/* Şifremi Unuttum */}
          {isLoginView && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t('login_forgot_password')}
              </button>
            </div>
          )}

          {/* Hata Mesajı */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3 animate-in shake">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLoginView ? t('btn_login') : t('btn_register')}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-black text-gray-400 font-medium">{t('login_or_continue_with')}</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full h-14 bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#23262B] text-gray-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {t('btn_google_login')}
        </button>

        {/* Toggle View */}
        <p className="mt-8 text-center text-gray-500 dark:text-gray-400">
          {isLoginView ? t('login_no_account') : t('login_have_account')}{" "}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError('');
              setFormData({ name: '', email: '', password: '', passwordConfirm: '' });
            }}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isLoginView ? t('btn_register_now') : t('btn_login_now')}
          </button>
        </p>
      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowForgotModal(false)}
          ></div>
          <div className="bg-white dark:bg-[#1A1D21] w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-white/10">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-[#23262B] rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reset_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                {t('reset_desc')}
              </p>
            </div>
            {resetStatus === 'success' ? (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl flex flex-col items-center text-center animate-in fade-in">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 mb-2">
                  <Check size={20} />
                </div>
                <h3 className="text-green-800 dark:text-green-300 font-bold">{t('reset_success_title')}</h3>
                <p className="text-green-600 dark:text-green-400 text-xs mt-1">{t('reset_success_desc')}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4">
                   <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">{t('form_email_label')}</label>
                   <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="ornek@pattty.com"
                    className="w-full h-14 px-4 bg-gray-50 dark:bg-[#23262B] border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none text-gray-900 dark:text-white font-medium transition-all"
                  />
                </div>
                {resetStatus === 'error' && (
                  <p className="text-red-500 text-sm mb-4 text-center font-medium">
                    {t('reset_error_msg')}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={resetStatus === 'loading'}
                  className="w-full h-14 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {resetStatus === 'loading' ? <Loader2 className="animate-spin" /> : t('btn_send_reset_link')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- EMAIL VERIFICATION SUCCESS MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"></div>
           
           {/* Modal */}
           <div className="bg-white dark:bg-[#1A1D21] w-full max-w-sm p-8 rounded-3xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-gray-100 dark:border-white/10">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Mail size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {verifyModalContent.title || t('verify_email_title')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                  {verifyModalContent.desc || t('verify_email_desc')}
              </p>
              
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-500/30"
              >
                {t('btn_understood')}
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default LoginScreen;