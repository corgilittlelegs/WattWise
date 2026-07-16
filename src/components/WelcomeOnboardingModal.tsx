import React, { useState } from 'react';
import { Compass, Key, Cloud, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import DatePicker from './DatePicker';

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
    <div className="fixed inset-0 bg-[#09090b]/75 dark:bg-[#000000]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="relative bg-white dark:bg-[#121316] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-850 w-full max-w-lg overflow-hidden flex flex-col z-10">

        {/* Welcome Header */}
        <div className="bg-neutral-900 dark:bg-[#0c0c0e] text-white p-6 sm:p-8 border-b border-neutral-800 dark:border-neutral-900 relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-850 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5 fill-current" />
            </div>
            <div>
              <span className="font-display font-bold text-[10px] text-neutral-400 dark:text-neutral-500 tracking-wider uppercase block">Wattwise Platform</span>
              <h2 className="text-lg font-display font-extrabold text-white uppercase tracking-tight -mt-0.5">
                Welcome to Wattwise
              </h2>
            </div>
          </div>
          <p className="text-neutral-400 text-xs mt-3 leading-relaxed font-sans">
            Track your daily electricity consumption, monitor government free allowance credits, and optimize energy savings.
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#18181b]/40 font-mono">
          <button
            onClick={() => {
              setActiveTab('setup');
              setLinkError(null);
            }}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 text-center ${
              activeTab === 'setup'
                ? 'bg-white dark:bg-[#121316] text-neutral-900 dark:text-white border-neutral-900 dark:border-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-transparent bg-transparent'
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
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer border-b-2 text-center ${
              activeTab === 'link'
                ? 'bg-white dark:bg-[#121316] text-neutral-900 dark:text-white border-neutral-900 dark:border-white'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border-transparent bg-transparent'
            }`}
          >
            Link Existing Sync Key
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 flex-1 font-mono">
          {activeTab === 'setup' ? (
            <form onSubmit={handleSetupSubmit} className="space-y-5">
              <p className="text-xs text-neutral-500 dark:text-neutral-450 leading-relaxed font-sans">
                Start tracking by configuring your current billing cycle details. These parameters act as the anchor point for all savings benchmarks.
              </p>

              <div>
                <label
                  htmlFor="setup-start-date"
                  className="block text-[9px] font-bold uppercase tracking-widest text-neutral-405 dark:text-neutral-500 mb-1.5"
                >
                  Billing Cycle Start Date
                </label>
                <DatePicker
                  id="setup-start-date"
                  value={startDateInput}
                  onChange={(val) => {
                    setStartDateInput(val);
                    if (startDateError) setStartDateError(null);
                  }}
                  className={startDateError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''}
                />
                {startDateError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {startDateError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="setup-start-reading"
                  className="block text-[9px] font-bold uppercase tracking-widest text-neutral-405 dark:text-neutral-500 mb-1.5"
                >
                  Start Meter Reading (kWh)
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Compass className="w-4 h-4 text-neutral-400 dark:text-neutral-550" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    id="setup-start-reading"
                    required
                    placeholder="e.g. 4250"
                    className={`block w-full bg-neutral-50 dark:bg-[#18181b] border pl-9 pr-3 py-2.5 text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:bg-white dark:focus:bg-[#18181b] focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-xs rounded-lg transition-colors ${
                      readingError
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                        : 'border-neutral-205 dark:border-neutral-800'
                    }`}
                    value={readingInput}
                    onChange={(e) => {
                      setReadingInput(e.target.value);
                      if (readingError) setReadingError(null);
                    }}
                  />
                </div>
                {readingError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {readingError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Initialize Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLinkSubmit} className="space-y-5">
              <div className="p-3.5 bg-neutral-50 dark:bg-[#18181b] border border-neutral-205 dark:border-neutral-800 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 font-sans">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4.5 h-4.5 text-neutral-500 shrink-0" />
                  <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px] font-mono">Sync devices</span>
                </div>
                <p className="text-[11px] text-neutral-450 dark:text-neutral-500 leading-relaxed">
                  If you are already tracking data on a different phone or desktop, enter your secret Sync Key here to keep them automatically synchronized.
                </p>
              </div>

              <div>
                <label
                  htmlFor="setup-link-key"
                  className="block text-[9px] font-bold uppercase tracking-widest text-neutral-405 dark:text-neutral-500 mb-1.5"
                >
                  Enter Sync Key
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="w-4 h-4 text-neutral-400 dark:text-neutral-550" />
                  </div>
                  <input
                    type="text"
                    id="setup-link-key"
                    required
                    placeholder="e.g. WATT-ABCD-EFGH-2J9K"
                    className={`block w-full bg-neutral-50 dark:bg-[#18181b] border pl-9 pr-3 py-2.5 text-neutral-800 dark:text-white placeholder:text-neutral-400 focus:bg-white dark:focus:bg-[#18181b] focus:outline-hidden focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-250 focus:border-neutral-900 dark:focus:border-neutral-250 text-xs rounded-lg transition-colors uppercase ${
                      linkError
                        ? 'border-rose-500 focus:border-rose-505 focus:ring-rose-500'
                        : 'border-neutral-205 dark:border-neutral-800'
                    }`}
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value);
                      if (linkError) setLinkError(null);
                    }}
                    disabled={isLinking}
                  />
                </div>
                {linkError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {linkError}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLinking || !linkInput.trim()}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
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
          <div className="mt-6 pt-5 border-t border-neutral-150 dark:border-neutral-850 flex flex-col items-center">
            <button
              type="button"
              onClick={handleUseDefaults}
              className="text-[10px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-colors font-bold uppercase tracking-widest cursor-pointer underline decoration-dotted underline-offset-4 font-mono"
            >
              Or start with defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
