import React, { useState } from 'react';
import { Sparkles, Cloud, AlertCircle, ArrowRight, Activity, Calendar, Zap } from 'lucide-react';

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onComplete: (lastBillDate: string, lastBillReading: number) => void;
  onLink: (syncKey: string) => Promise<{ success: boolean; error?: string }>;
}

export const WelcomeOnboardingModal: React.FC<WelcomeOnboardingModalProps> = ({
  isOpen,
  onComplete,
  onLink,
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'link'>('setup');

  // Setup tab state
  const [startDateInput, setStartDateInput] = useState<string>(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split("T")[0];
  });
  const [readingInput, setReadingInput] = useState<string>('');
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [readingError, setReadingError] = useState<string | null>(null);

  // Link tab state
  const [linkInput, setLinkInput] = useState<string>('');
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStartDateError(null);
    setReadingError(null);

    const dateVal = startDateInput.trim();
    const readingVal = readingInput.trim();

    let hasError = false;

    if (!dateVal) {
      setStartDateError('Start date is required.');
      hasError = true;
    }

    if (!readingVal) {
      setReadingError('Starting meter reading is required.');
      hasError = true;
    }
    const readingNum = parseFloat(readingVal);
    if (isNaN(readingNum) || readingNum < 0) {
      setReadingError('Please enter a valid non-negative reading value.');
      hasError = true;
    }

    if (hasError) return;

    onComplete(dateVal, readingNum);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    const targetCode = linkInput.toUpperCase().trim();
    if (!targetCode) return;

    setIsLinking(true);
    try {
      const res = await onLink(targetCode);
      if (res.success) {
        setLinkInput('');
      } else {
        setLinkError(res.error || 'Sync Key not found. Please double-check.');
      }
    } catch (err) {
      setLinkError('Failed to verify sync key. Please try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUseDefaults = () => {
    onComplete("2026-05-01", 4250);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col z-10 animate-zoom-in">
        
        {/* Welcome Header Hero Banner */}
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-650 to-indigo-800 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-15">
            <Activity className="w-56 h-56 rotate-12" />
          </div>
          <div className="absolute -left-6 -bottom-6 opacity-10">
            <Zap className="w-36 h-36" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl mb-3 border border-white/20 shadow-inner">
              <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome to Wattwise</h2>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 max-w-xs sm:max-w-md font-medium">
              Track your daily electricity consumption, monitor government free allowance credits, and optimize energy savings.
            </p>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 p-2 gap-1">
          <button
            onClick={() => {
              setActiveTab('setup');
              setLinkError(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'setup'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-100 dark:border-slate-700'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Setup New Cycle
          </button>
          <button
            onClick={() => {
              setActiveTab('link');
              setStartDateError(null);
              setReadingError(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-100 dark:border-slate-700'
                : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Link Existing Sync Key
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 flex-1">
          {activeTab === 'setup' ? (
            <form onSubmit={handleSetupSubmit} className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Start tracking by configuring your current billing cycle details. These parameters act as the anchor point for all savings benchmarks.
              </p>

              <div>
                <label
                  htmlFor="setup-start-date"
                  className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Billing Cycle Start Date
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    id="setup-start-date"
                    required
                    className={`block w-full rounded-xl bg-slate-50 dark:bg-slate-900 border pl-10 pr-4 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 text-sm outline-none transition-all font-semibold ${
                      startDateError
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    value={startDateInput}
                    onChange={(e) => {
                      setStartDateInput(e.target.value);
                      if (startDateError) setStartDateError(null);
                    }}
                  />
                </div>
                {startDateError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {startDateError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="setup-start-reading"
                  className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Start Meter Reading (kWh)
                </label>
                <input
                  type="number"
                  step="any"
                  id="setup-start-reading"
                  required
                  placeholder="e.g. 4250"
                  className={`block w-full rounded-xl bg-slate-50 dark:bg-slate-900 border px-4 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 text-sm font-mono outline-none transition-all font-semibold ${
                    readingError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  value={readingInput}
                  onChange={(e) => {
                    setReadingInput(e.target.value);
                    if (readingError) setReadingError(null);
                  }}
                />
                {readingError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {readingError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Initialize Tracker & Start</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLinkSubmit} className="space-y-5">
              <div className="flex items-start gap-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-950 rounded-2xl p-4 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                <Cloud className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Sync across multiple devices</p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    If you are already tracking data on a different phone or desktop, enter your secret Sync Key here to keep them automatically synchronized.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="setup-link-key"
                  className="block text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5"
                >
                  Enter Sync Key
                </label>
                <input
                  type="text"
                  id="setup-link-key"
                  required
                  placeholder="e.g. WATT-ABCD-EFGH"
                  className={`block w-full rounded-xl bg-slate-50 dark:bg-slate-900 border px-4 py-2.5 text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 text-sm font-mono outline-none transition-all uppercase ${
                    linkError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-750 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value);
                    if (linkError) setLinkError(null);
                  }}
                  disabled={isLinking}
                />
                {linkError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {linkError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLinking || !linkInput.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-850 dark:disabled:text-slate-600 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLinking ? (
                    <span>Verifying Sync Key...</span>
                  ) : (
                    <>
                      <span>Link Device</span>
                      <Cloud className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Fallback Option */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col items-center">
            <button
              type="button"
              onClick={handleUseDefaults}
              className="text-xs text-slate-450 dark:text-slate-550 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold cursor-pointer underline decoration-dotted underline-offset-4"
            >
              Or start with defaults (May 1, 2026 start date, 4250 kWh meter reading)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
