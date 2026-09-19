'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotif = { id, message, type, duration };

    setNotifications((prev) => [...prev, newNotif]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const toast = {
    success: (msg) => addNotification(msg, 'success'),
    error: (msg) => addNotification(msg, 'error'),
    info: (msg) => addNotification(msg, 'info'),
    warning: (msg) => addNotification(msg, 'warning'),
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-zinc-100" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-zinc-100" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-zinc-100" />;
      default:
        return <Info className="w-5 h-5 text-zinc-100" />;
    }
  };

  const getAccent = (type) => {
    switch (type) {
      case 'error':
        return 'border-l-[#ef4444]';
      case 'warning':
        return 'border-l-[#f59e0b]';
      default:
        return 'border-l-white/20';
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, toast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2.5rem)] pointer-events-none">
        <AnimatePresence mode="sync">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.94, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.88, x: 30, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', stiffness: 480, damping: 34 }}
              className={`pointer-events-auto relative overflow-hidden bg-[#0e0e12]/98 backdrop-blur-xl border border-white/8 border-l-2 ${getAccent(notif.type)} rounded-xl shadow-2xl shadow-black/80 flex items-center gap-3 px-4 py-3.5`}
            >
              <div className="shrink-0 flex items-center justify-center">{getIcon(notif.type)}</div>
              <p className="flex-1 min-w-0 text-xs text-zinc-200 leading-relaxed break-words font-medium">
                {notif.message}
              </p>
              <button
                type="button"
                onClick={() => removeNotification(notif.id)}
                className="shrink-0 p-1 text-zinc-500 hover:text-zinc-200 hover:bg-white/8 rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
