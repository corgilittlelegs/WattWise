import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered successfully');
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // When needRefresh changes, reset dismissal states
  useEffect(() => {
    if (needRefresh) {
      setIsDismissed(false);
      setIsClosing(false);
    }
  }, [needRefresh]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDismissed(true);
      setIsClosing(false);
      setNeedRefresh(false);
    }, 250); // matches duration of slide-down animation
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[100] pointer-events-none print:hidden">
      <div 
        className={`pointer-events-auto w-full bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3 ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="relative flex shrink-0 items-center justify-center bg-neutral-50 dark:bg-[#18181b] p-2.5 rounded-lg text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
              <RefreshCw className="w-5 h-5 animate-spin [animation-duration:8s]" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-500"></span>
              </span>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-1 font-display uppercase tracking-wide">
                <span>Update Available</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </h4>
              <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed font-sans">
                A newer version of Wattwise is available with recent fixes and updates.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-150 dark:border-neutral-850">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-[9px] uppercase tracking-widest font-bold text-neutral-500 dark:text-neutral-350 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 font-mono"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black rounded-lg text-[9px] uppercase tracking-widest font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Update Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
