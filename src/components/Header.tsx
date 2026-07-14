import { Zap, HelpCircle, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentDateStr: string;
  isDark: boolean;
  onToggleDark: () => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export default function Header({ 
  currentDateStr, 
  isDark, 
  onToggleDark,
  deferredPrompt,
  onInstallClick
}: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors duration-150 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-display font-medium text-xs text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block">WattWise Platform</span>
            <h1 className="text-lg font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight -mt-0.5">
              Electricity Consumption Tracker
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <button
              onClick={onInstallClick}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all uppercase tracking-wider shrink-0 cursor-pointer shadow-sm"
              title="Install PWA Application"
            >
              <span>Install App</span>
            </button>
          )}

          <div id="current-time-badge" className="text-right hidden sm:block mr-2">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-widest">System Date</span>
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 border border-slate-200 dark:border-slate-800">
              {currentDateStr}
            </span>
          </div>

          <button
            id="info-toggle-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-700 transition-all duration-150 cursor-pointer"
            title="How it works"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>How it calculates?</span>
          </button>

          <button
            id="theme-toggle-btn"
            onClick={onToggleDark}
            className="flex items-center justify-center p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-250 dark:border-slate-700 transition-all duration-150 cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-slate-750 dark:text-slate-300 text-xs leading-relaxed grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-xs font-mono">01</span>
                  Set baseline anchor
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Input your last official electricity bill's issue date and starting meter reading (kWh). This anchors your ongoing tracking.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-xs font-mono">02</span>
                  Log meter read
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Whenever you check your meter, log the date and current kWh reading. The difference yields your total units consumed.
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-xs font-mono">03</span>
                  Daily Credit quota
                </span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  The government provides <strong>10 kWh units free per day</strong>. If your cumulative usage is below 10 &times; (Days Elapsed), you have saved energy units!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
