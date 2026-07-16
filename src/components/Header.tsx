import { Zap, HelpCircle, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentDateStr: string;
  onOpenSettings: () => void;
  isSyncActive?: boolean;
}

export default function Header({ 
  currentDateStr, 
  onOpenSettings,
  isSyncActive
}: HeaderProps) {
  const [showHelp, setShowHelp] = useState(false);

  // "H" toggles the instruction panel, matching the hint badge next to the button.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "h") {
        setShowHelp((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] sticky top-0 z-40 transition-colors duration-150 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center transition-colors">
            <Zap className="w-4.5 h-4.5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-[10px] text-neutral-400 dark:text-neutral-500 tracking-wider uppercase block">
                WattWise Platform
              </span>
              <span className="text-[9px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono font-bold tracking-tight rounded-sm">
                v{__APP_VERSION__}
              </span>
            </div>
            
            <h1 className="text-base font-display font-extrabold text-neutral-900 dark:text-white uppercase tracking-tight -mt-0.5">
              Electricity Consumption Tracker
            </h1>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-3">
          
          {/* Operational Status indicator dot */}
          <div className="h-8 flex items-center gap-2 px-2.5 bg-neutral-50 dark:bg-[#121316] border border-neutral-200 dark:border-neutral-850 rounded-lg text-[9px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSyncActive ? "bg-emerald-400" : "bg-amber-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isSyncActive ? "bg-emerald-500" : "bg-amber-500"
              }`}></span>
            </span>
            <span>{isSyncActive ? "CLOUD SYNC" : "LOCAL LEDGER"}</span>
          </div>

          <div id="current-time-badge" className="text-right hidden md:block">
            <span className="h-8 flex items-center px-2.5 text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-[#121316] border border-neutral-200 dark:border-neutral-850 rounded-lg">
              {currentDateStr}
            </span>
          </div>

          <button
            id="info-toggle-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="h-8 flex items-center gap-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-[#121316] border border-neutral-200 dark:border-neutral-850 rounded-lg transition-all cursor-pointer"
            title="Show instruction details"
          >
            <HelpCircle className="w-4 h-4 text-neutral-550 dark:text-neutral-455" />
            <span>How it calculates?</span>
            <span className="text-[9px] opacity-40 ml-1 font-mono border border-neutral-300 dark:border-neutral-700 px-1 py-0.5 rounded-sm">H</span>
          </button>

          <button
            id="settings-toggle-btn"
            onClick={onOpenSettings}
            className="relative h-8 w-8 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-50 dark:bg-[#121316] border border-neutral-200 dark:border-neutral-850 rounded-lg transition-all cursor-pointer"
            title="Open Application Settings"
          >
            <Settings className="w-4.5 h-4.5" />
            {isSyncActive && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-neutral-50 dark:bg-[#0c0c0e] border-b border-neutral-200 dark:border-neutral-800"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-neutral-750 dark:text-neutral-300 text-xs leading-relaxed grid md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-[#121316] p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xs">
                <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-mono font-bold">01</span>
                  Set baseline anchor
                </span>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                  Input your last official electricity bill's issue date and starting meter reading (kWh). This anchors your ongoing tracking.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121316] p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xs">
                <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-mono font-bold">02</span>
                  Log meter read
                </span>
                <p className="text-neutral-500 dark:text-slate-400 leading-relaxed font-sans">
                  Whenever you check your meter, log the date and current kWh reading. The difference yields your total units consumed.
                </p>
              </div>

              <div className="bg-white dark:bg-[#121316] p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xs">
                <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-mono font-bold">03</span>
                  Daily Credit quota
                </span>
                <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
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
