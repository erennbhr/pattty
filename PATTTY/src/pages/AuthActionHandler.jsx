import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

const AuthActionHandler = () => {
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error

  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');

  useEffect(() => {
    const handleAction = async () => {
      // Sadece e-posta doğrulama linklerini işle
      if (!actionCode || mode !== 'verifyEmail') {
        setStatus('error');
        return;
      }

      try {
        // Firebase Auth üzerinde e-postayı doğrula
        await applyActionCode(auth, actionCode);
        setStatus('success');
        
        // 3 saniye sonra Dashboard'a yönlendir
        setTimeout(() => navigate('/app'), 3000);
      } catch (error) {
        console.error("Verification Error:", error);
        setStatus('error');
      }
    };

    handleAction();
  }, [actionCode, mode, navigate]);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-white flex flex-col items-center justify-center p-6 text-center">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 p-8 rounded-[40px] backdrop-blur-2xl shadow-2xl animate-in fade-in duration-700">
        
        {status === 'loading' && (
          <div className="space-y-6">
            <div className="relative w-16 h-16 mx-auto">
                <Loader className="animate-spin text-indigo-500 absolute inset-0" size={64} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{t('auth_processing')}</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                <CheckCircle className="text-green-500" size={48} />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">{t('auth_verified_title')}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{t('auth_verified_desc')}</p>
            </div>
            <button 
                onClick={() => navigate('/app')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
            >
              {t('auth_start_btn')}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                <XCircle className="text-red-500" size={48} />
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">{t('auth_invalid_link_title')}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{t('auth_invalid_link_desc')}</p>
            </div>
            <button 
                onClick={() => navigate('/')}
                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t('verify_logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthActionHandler;