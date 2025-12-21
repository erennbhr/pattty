import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight,
  Check, X, Loader2, AlertCircle
} from 'lucide-react';
import { sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth'; 
import { auth } from '../utils/firebase';

// --- LOGO IMPORT ---
import logo from '../assets/logo.png';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// --- GÜÇLENDİRİLMİŞ NEFES ALAN IŞIKLAR (CSS) ---
const AmbientLights = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
            @keyframes breathe {
                0%, 100% { transform: translate(0px, 0px) scale(1); opacity: 0.4; }
                33% { transform: translate(30px, -50px) scale(1.2); opacity: 0.6; }
                66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.4; }
            }
            .animate-breathe {
                animation: breathe 10s infinite ease-in-out;
            }
            .delay-0 { animation-delay: 0s; }
            .delay-2000 { animation-delay: 2s; }
            .delay-4000 { animation-delay: 4s; }
        `}</style>

        {/* Mor Işık (Sol Üst) */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] animate-breathe delay-0 opacity-40"></div>
        
        {/* Turuncu Işık (Sağ Alt) */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-orange-600 rounded-full blur-[100px] animate-breathe delay-2000 opacity-40"></div>
        
        {/* Yeşil Işık (Orta) */}
        <div className="absolute top-[30%] left-[30%] w-[350px] h-[350px] bg-green-600 rounded-full blur-[90px] animate-breathe delay-4000 opacity-30"></div>
    </div>
);

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
  
  // Modal İçeriği Değişkeni
  const [verifyModalContent, setVerifyModalContent] = useState({
      title: '',
      desc: ''
  });

  // Şifre Sıfırlama State'i
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState('idle');

  // --- EFFECT: Kayıt Sonrası Modal Kontrolü ---
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLoginView) {
        // --- GİRİŞ YAP ---
        await login(formData.email, formData.password);
        
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            try { await sendEmailVerification(user); } catch(e) {}
            await signOut(auth);
            throw new Error("EMAIL_NOT_VERIFIED");
        }

      } else {
        // --- KAYIT OL ---
        if (!formData.name) throw new Error(t('err_name_required'));
        if (formData.password !== formData.passwordConfirm) {
            throw new Error(t('err_passwords_do_not_match'));
        }

        await register(formData.email, formData.password, formData.name);

        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }

        localStorage.setItem('pendingVerification', 'true');
        await signOut(auth);
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
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">

      {/* Arka Plan Efektleri (Nefes Alan Işıklar) */}
      <AmbientLights />

      {/* Ana İçerik Kartı (Glassmorphism) */}
      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo ve Başlık */}
        <div className="text-center mb-10">
            <div className="inline-flex justify-center mb-6 p-6 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-purple-500/20">
                <img
                  src={logo}
                  alt={t('app_logo_alt')}
                  className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2 drop-shadow-lg">
                {isLoginView ? t('login_welcome_title') : t('login_create_title')}
            </h1>
            <p className="text-gray-300 text-sm font-medium tracking-wide opacity-80">
                {isLoginView ? t('login_welcome_desc') : t('login_create_desc')}
            </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            
            {/* Kart İçi Hafif Yansıma */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">

            {/* İsim Alanı (Sadece Kayıtta) */}
            {!isLoginView && (
                <div className="group/input animate-in slide-in-from-left fade-in duration-300">
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">{t('form_name_label')}</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-white transition-colors">
                            <User size={20} />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={t('form_name_placeholder')}
                            className="w-full h-14 pl-12 pr-4 bg-black/30 border border-white/10 focus:border-white/30 focus:bg-black/50 rounded-2xl outline-none text-white font-medium transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>
            )}

            {/* E-posta */}
            <div className="group/input">
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">{t('form_email_label')}</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-white transition-colors">
                        <Mail size={20} />
                    </div>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="ornek@pattty.com"
                        className="w-full h-14 pl-12 pr-4 bg-black/30 border border-white/10 focus:border-white/30 focus:bg-black/50 rounded-2xl outline-none text-white font-medium transition-all placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Şifre */}
            <div className="group/input">
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">{t('form_password_label')}</label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-white transition-colors">
                        <Lock size={20} />
                    </div>
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full h-14 pl-12 pr-12 bg-black/30 border border-white/10 focus:border-white/30 focus:bg-black/50 rounded-2xl outline-none text-white font-medium transition-all placeholder:text-gray-600"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            {/* Şifre Tekrar (Sadece Kayıtta) */}
            {!isLoginView && (
                <div className="group/input animate-in slide-in-from-left fade-in duration-300 delay-100">
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">{t('form_password_confirm_label')}</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-white transition-colors">
                            <Lock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="passwordConfirm"
                            value={formData.passwordConfirm}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            className="w-full h-14 pl-12 pr-4 bg-black/30 border border-white/10 focus:border-white/30 focus:bg-black/50 rounded-2xl outline-none text-white font-medium transition-all placeholder:text-gray-600"
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
                        className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
                    >
                        {t('login_forgot_password')}
                    </button>
                </div>
            )}

            {/* Hata Mesajı */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake">
                    <AlertCircle className="text-red-400 shrink-0" size={20} />
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                </div>
            )}

            {/* Buton */}
            <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-white text-black hover:bg-gray-200 active:scale-[0.98] rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
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
                    <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                    <span className="px-4 bg-[#0a0a0a] text-gray-500 font-bold rounded-full border border-white/5">{t('login_or_continue_with')}</span>
                </div>
            </div>

            {/* Google Login */}
            <button
                onClick={handleGoogleLogin}
                className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t('btn_google_login')}
            </button>
        </div>

        {/* Toggle View */}
        <div className="mt-8 text-center relative z-10">
             <p className="text-gray-400 text-sm">
                {isLoginView ? t('login_no_account') : t('login_have_account')}{" "}
                <button
                onClick={() => {
                    setIsLoginView(!isLoginView);
                    setError('');
                    setFormData({ name: '', email: '', password: '', passwordConfirm: '' });
                }}
                className="font-bold text-white hover:underline ml-1"
                >
                {isLoginView ? t('btn_register_now') : t('btn_login_now')}
                </button>
            </p>
        </div>

      </div>

      {/* --- FORGOT PASSWORD MODAL --- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in"
            onClick={() => setShowForgotModal(false)}
          ></div>
          <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('reset_title')}</h2>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                {t('reset_desc')}
              </p>
            </div>
            {resetStatus === 'success' ? (
              <div className="bg-green-500/20 p-4 rounded-2xl flex flex-col items-center text-center animate-in fade-in border border-green-500/20">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mb-2">
                  <Check size={24} />
                </div>
                <h3 className="text-green-400 font-bold">{t('reset_success_title')}</h3>
                <p className="text-green-300/80 text-xs mt-1">{t('reset_success_desc')}</p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="mb-4 group/reset">
                   <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1 uppercase tracking-wider">{t('form_email_label')}</label>
                   <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="ornek@pattty.com"
                    className="w-full h-14 px-4 bg-black/40 border border-white/10 focus:border-white/30 rounded-2xl outline-none text-white font-medium transition-all"
                  />
                </div>
                {resetStatus === 'error' && (
                  <p className="text-red-400 text-sm mb-4 text-center font-medium">
                    {t('reset_error_msg')}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={resetStatus === 'loading'}
                  className="w-full h-14 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
           <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in"></div>
           
           <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-sm p-8 rounded-[2.5rem] relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                 <Mail size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                  {verifyModalContent.title || t('verify_email_title')}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  {verifyModalContent.desc || t('verify_email_desc')}
              </p>
              
              <button
                onClick={() => setShowVerifyModal(false)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
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