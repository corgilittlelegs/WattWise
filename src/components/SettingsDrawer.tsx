import React, { Suspense } from "react";
import { X, Sun, Moon, RotateCcw, Download } from "lucide-react";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";
import CycleManager from "./CycleManager";
import CloudSync from "./CloudSync";
import BillConfig from "./BillConfig";

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  
  // PWA props
  deferredPrompt?: any;
  onInstallClick?: () => void;

  // Cycle manager props
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles: ArchivedCycle[];
  selectedCycleId: string;
  onSelectCycle: (id: string) => void;
  onArchiveCycle: (name: string, newStartDate: string, newStartReading: number) => void;
  onDeleteArchive: (id: string) => void;

  // Cloud sync props
  activeSyncKey: string | null;
  onSyncStateLoaded: (
    bill: BillDetails,
    readings: MeterReading[],
    archivedCycles: ArchivedCycle[],
    syncKey: string
  ) => void;
  onDisconnect: () => void;

  // Global actions
  onResetData: () => void;
  onClearEverything: () => void;
  onUpdateBill: (updatedBill: BillDetails) => void;
}

export default function SettingsDrawer({
  isOpen,
  onClose,
  isDark,
  onToggleDark,
  deferredPrompt,
  onInstallClick,
  bill,
  readings,
  archivedCycles,
  selectedCycleId,
  onSelectCycle,
  onArchiveCycle,
  onDeleteArchive,
  activeSyncKey,
  onSyncStateLoaded,
  onDisconnect,
  onResetData,
  onClearEverything,
  onUpdateBill,
}: SettingsDrawerProps) {
  
  // Determine active cycle status for reference displays
  const isViewingActive = selectedCycleId === "active";
  const selectedArchivedCycle = !isViewingActive 
    ? archivedCycles.find(c => c.id === selectedCycleId) 
    : null;
  const currentBill = selectedArchivedCycle ? selectedArchivedCycle.bill : bill;
  const currentReadings = selectedArchivedCycle ? selectedArchivedCycle.readings : readings;
  
  // Filter active cycle logs for clearing option visibility
  const hasActiveLogs = selectedCycleId === "active" && readings.length > 0;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden flex justify-end transition-all duration-300 ${
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[#09090b]/60 dark:bg-[#000000]/80 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer Container Panel */}
      <div
        className={`relative w-full sm:w-[420px] h-full bg-[#f9fafb] dark:bg-[#0c0c0e] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-neutral-900 dark:bg-[#0c0c0e] text-white p-5 flex items-center justify-between border-b border-neutral-800 dark:border-neutral-900">
          <h2 className="text-xs font-display font-extrabold uppercase tracking-widest">
            Application Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-850 dark:hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Settings Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section 1: Appearance (Theme Selector) */}
          <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-3.5 shadow-xs">
            <h3 className="font-display font-bold uppercase tracking-wider text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
              Appearance Theme
            </h3>
            <button
              onClick={onToggleDark}
              className="w-full flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black py-2.5 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-xs font-mono"
            >
              <span className="flex items-center gap-2">
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Section 1.5: PWA Install (Only shows if PWA is installable) */}
          {deferredPrompt && (
            <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-3 shadow-xs">
              <h3 className="font-display font-bold uppercase tracking-wider text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
                PWA Application
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                Install Wattwise directly to your home screen for high performance and offline-capable electricity tracking.
              </p>
              <button
                onClick={onInstallClick}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer shadow-sm shadow-emerald-600/5 font-mono"
                title="Install PWA Application"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Application</span>
              </button>
            </div>
          )}

          {/* Section 1.8: Last Bill Reference (Editable in active cycle, readonly in archive) */}
          {isViewingActive ? (
            <BillConfig 
              bill={bill} 
              onChange={onUpdateBill} 
            />
          ) : (
            <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-3 shadow-xs font-mono">
              <h4 className="font-display font-bold text-neutral-400 dark:text-neutral-500 text-[9px] uppercase tracking-widest">
                Archived Configuration
              </h4>
              <div className="text-xs space-y-2 text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-1.5">
                  <span>Cycle Start Date:</span>
                  <strong className="text-neutral-800 dark:text-neutral-250">
                    {new Date(currentBill.lastBillDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </strong>
                </div>
                <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-1.5">
                  <span>Start Meter Index:</span>
                  <strong className="text-neutral-800 dark:text-neutral-250 font-mono">
                    {currentBill.lastBillReading.toLocaleString()} kWh
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Recorded Logs:</span>
                  <strong className="text-neutral-800 dark:text-neutral-250">
                    {currentReadings.length} checkpoints
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Billing Cycles Manager */}
          <CycleManager
            bill={bill}
            readings={readings}
            archivedCycles={archivedCycles}
            selectedCycleId={selectedCycleId}
            onSelectCycle={onSelectCycle}
            onArchiveCycle={onArchiveCycle}
            onDeleteArchive={onDeleteArchive}
          />

          {/* Section 3: Cloud Synchronization */}
          <Suspense
            fallback={
              <div className="p-6 bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-400 font-mono shadow-xs">
                Loading sync setup...
              </div>
            }
          >
            <CloudSync
              bill={bill}
              readings={readings}
              archivedCycles={archivedCycles}
              activeSyncKey={activeSyncKey}
              onSyncStateLoaded={onSyncStateLoaded}
              onDisconnect={onDisconnect}
            />
          </Suspense>

          {/* Section 4: Data Management & Reset Action */}
          <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4 shadow-xs">
            <h3 className="font-display font-bold uppercase tracking-wider text-[9px] text-rose-500 font-mono">
              Danger Zone (Data Management)
            </h3>
            <p className="text-[11px] text-neutral-400 leading-snug">
              Modify the stored local state of your dashboard. Resets revert to dummy data for demonstration.
            </p>
            <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-850 flex flex-col gap-2.5">
              <button
                id="reset-demo-btn"
                onClick={onResetData}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#18181b] dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-850 text-neutral-600 dark:text-neutral-300 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer font-mono"
                title="Reset to default mock values"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Demo Data</span>
              </button>

              {hasActiveLogs && (
                <button
                  id="clear-all-btn"
                  onClick={onClearEverything}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-50/50 hover:bg-rose-100/50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer font-mono"
                >
                  <span>Clear Active Ledger Logs</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
