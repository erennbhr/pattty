import React, { useState } from 'react';
import { PawPrint, Mail, Lock, ArrowRight, User, Phone, MapPin, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Google İkonu (SVG)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LoginScreen = () => {
  const { login, loginWithGoogle } = useAuth();
  
  // Ekran Yönetimi: 'login' | 'register' | 'complete_google'
  const [viewState, setViewState] = useState('login'); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  // --- GOOGLE GİRİŞ İŞLEMİ ---
  const handleGoogleLogin = async () => {
    // AuthContext'teki gerçek Google fonksiyonunu çağırıyoruz
    const googleUser = await loginWithGoogle();
    
    if (googleUser) {
        // Google'dan gelen verileri state'e yazıyoruz
        setFormData(prev => ({
            ...prev,
            name: googleUser.name,
            email: googleUser.email,
            password: "google_verified_token" // Şifreye gerek yok
        }));
        
        // Kullanıcıyı telefon girmesi için 2. aşamaya gönderiyoruz
        setViewState('complete_google');
    } else {
        // Hata durumunda (Kullanıcı iptal ederse vs.)
        console.log("Google girişi iptal edildi.");
    }
  };

  // --- FORM GÖNDERME ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // 1. Zorunlu Alan Kontrolleri
    if (viewState === 'login') {
        if (!formData.email) newErrors.email = true;
        if (!formData.password) newErrors.password = true;
    }

    // Kayıt veya Google Tamamlama aşamasındaysak
    if (viewState === 'register' || viewState === 'complete_google') {
        if (!formData.name) newErrors.name = true;
        
        // Register ise E-posta ve Şifre de zorunlu
        if (viewState === 'register') {
            if (!formData.email) newErrors.email = true;
            if (!formData.password) newErrors.password = true;
        }

        // KRİTİK: Telefon Numarası Zorunlu
        if (!formData.phone) newErrors.phone = true; 
        
        // Adres Opsiyonel (Hata kontrolü yok)
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    // 2. Giriş İşlemi (Context'e gönder)
    login({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address // Boş olabilir
    });
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center p-6 z-[100] overflow-y-auto">
      
      {/* Arka Plan Süsleri */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-in zoom-in duration-500">
        
        {/* Logo ve Başlık */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
            <PawPrint size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {viewState === 'complete_google' ? 'Son Bir Adım!' : 'Pattty'}
          </h1>
          <p className="text-indigo-200 text-xs mt-1 text-center">
              {viewState === 'complete_google' ? 'İletişim bilgilerini tamamla.' : 'Dostların için en iyisi.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- GÖRÜNÜM 1: E-POSTA İLE GİRİŞ --- */}
          {viewState === 'login' && (
              <>
                <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                    <div className="p-3 text-indigo-300"><Mail size={20}/></div>
                    <input 
                        type="email" 
                        placeholder="E-posta Adresi" 
                        className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.password ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                    <div className="p-3 text-indigo-300"><Lock size={20}/></div>
                    <input 
                        type="password" 
                        placeholder="Şifre" 
                        className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
                
                <button type="submit" className="w-full bg-white text-indigo-900 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    Giriş Yap <ArrowRight size={20}/>
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-gray-400">veya</span></div>
                </div>

                <button type="button" onClick={handleGoogleLogin} className="w-full bg-white/10 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-white/20 transition-all flex items-center justify-center gap-3 border border-white/10">
                    <GoogleIcon /> Google ile Devam Et
                </button>
              </>
          )}

          {/* --- GÖRÜNÜM 2 & 3: KAYIT OL veya GOOGLE TAMAMLAMA --- */}
          {(viewState === 'register' || viewState === 'complete_google') && (
              <div className="space-y-3 animate-in slide-in-from-right">
                
                {/* İsim (Google'dan geldiyse dolu gelir) */}
                <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.name ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                    <div className="p-3 text-indigo-300"><User size={20}/></div>
                    <input 
                        type="text" 
                        placeholder="Ad Soyad *" 
                        className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                {/* E-posta ve Şifre (Sadece Register modunda göster, Google modunda gizle) */}
                {viewState === 'register' && (
                    <>
                        <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.email ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                            <div className="p-3 text-indigo-300"><Mail size={20}/></div>
                            <input 
                                type="email" 
                                placeholder="E-posta *" 
                                className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.password ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                            <div className="p-3 text-indigo-300"><Lock size={20}/></div>
                            <input 
                                type="password" 
                                placeholder="Şifre *" 
                                className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </>
                )}

                {/* Telefon (ZORUNLU - Her iki durumda da) */}
                <div className={`bg-black/20 rounded-xl p-1 flex items-center border transition-colors ${errors.phone ? 'border-red-500' : 'border-white/10 focus-within:border-indigo-400'}`}>
                    <div className="p-3 text-indigo-300"><Phone size={20}/></div>
                    <input 
                        type="tel" 
                        placeholder="Telefon Numarası *" 
                        className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>

                {/* Adres (OPSİYONEL - Her iki durumda da) */}
                <div className="bg-black/20 rounded-xl p-1 flex items-center border border-white/10 focus-within:border-indigo-400 transition-colors">
                    <div className="p-3 text-indigo-300"><MapPin size={20}/></div>
                    <input 
                        type="text" 
                        placeholder="Adres (İsteğe bağlı)" 
                        className="bg-transparent w-full text-white placeholder-gray-400 outline-none text-sm"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">
                    {viewState === 'complete_google' ? 'Tamamla ve Başla' : 'Hesap Oluştur'} <Check size={20}/>
                </button>
              </div>
          )}

        </form>

        {/* Alt Linkler (Login ve Register arası geçiş) */}
        <div className="mt-6 text-center">
          {viewState === 'login' ? (
              <p className="text-gray-400 text-sm">
                Hesabın yok mu?
                <button onClick={() => setViewState('register')} className="text-white font-bold ml-2 hover:underline">Kayıt Ol</button>
              </p>
          ) : (
              <p className="text-gray-400 text-sm">
                Zaten üye misin?
                <button onClick={() => setViewState('login')} className="text-white font-bold ml-2 hover:underline">Giriş Yap</button>
              </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;