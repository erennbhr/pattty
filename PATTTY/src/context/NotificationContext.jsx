import React, { createContext, useState, useContext } from 'react';
import { Check, AlertCircle } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {notification && (
        <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top fade-in duration-300 w-[90%] max-w-sm pointer-events-none">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10 ${notification.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-gray-900/90 text-white'}`}>
            <span className={`p-1 rounded-full ${notification.type === 'error' ? 'bg-white/20' : 'bg-green-500'}`}>
                {notification.type === 'error' ? <AlertCircle size={14}/> : <Check size={14}/>}
            </span>
            <span className="font-medium text-sm shadow-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);