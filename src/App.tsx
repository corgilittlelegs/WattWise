/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense } from "react";
import { 
  BillDetails, 
  MeterReading, 
  ArchivedCycle,
  INITIAL_BILL_DETAILS, 
  INITIAL_METER_READINGS 
} from "./types";
import Header from "./components/Header";
import BillConfig from "./components/BillConfig";
import AddReadingForm from "./components/AddReadingForm";
import CycleManager from "./components/CycleManager";
import InsightsDashboard from "./components/InsightsDashboard";
import ReadingsList from "./components/ReadingsList";
import { RotateCcw, SunMedium } from "lucide-react";
import { subscribeToSyncSession, saveSyncSession, checkSyncSessionExists } from "./lib/firebase";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy-loaded components for code splitting & bundle optimization
const SavingsChart = React.lazy(() => import("./components/SavingsChart"));
const CloudSync = React.lazy(() => import("./components/CloudSync"));
const WelcomeOnboardingModal = React.lazy(() =>
  import("./components/WelcomeOnboardingModal").then(module => ({ default: module.WelcomeOnboardingModal }))
);
const PWAUpdatePrompt = React.lazy(() =>
  import("./components/PWAUpdatePrompt").then(module => ({ default: module.PWAUpdatePrompt }))
);

export default function App() {
  // Load dark mode preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("wattwise_theme");
      if (saved) return saved === "dark";
      return false;
    } catch {
      return false;
    }
  });

  // Load from local storage or fall back to mock constants
  const [bill, setBill] = useState<BillDetails>(() => {
    try {
      const saved = localStorage.getItem("electricity_bill_anchor");
      return saved ? JSON.parse(saved) : INITIAL_BILL_DETAILS;
    } catch {
      return INITIAL_BILL_DETAILS;
    }
  });

  const [readings, setReadings] = useState<MeterReading[]>(() => {
    try {
      const saved = localStorage.getItem("electricity_meter_readings");
      return saved ? JSON.parse(saved) : INITIAL_METER_READINGS;
    } catch {
      return INITIAL_METER_READINGS;
    }
  });

  const [archivedCycles, setArchivedCycles] = useState<ArchivedCycle[]>(() => {
    try {
      const saved = localStorage.getItem("electricity_archived_cycles");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedCycleId, setSelectedCycleId] = useState<string>("active");

  // Onboarding workflow state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const hasAnchor = !!localStorage.getItem("electricity_bill_anchor");
      const hasSyncKey = !!localStorage.getItem("wattwise_sync_key");
      return !hasAnchor && !hasSyncKey;
    } catch {
      return true;
    }
  });

  // PWA Install Prompt Hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Theme observer
  useEffect(() => {
    try {
      localStorage.setItem("wattwise_theme", isDark ? "dark" : "light");
    } catch (e) {
      console.error("Local storage theme sync error:", e);
    }
  }, [isDark]);

  // System Date Indicator for UI
  const systemDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Cloud Sync state
  const [activeSyncKey, setActiveSyncKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem("wattwise_sync_key") || null;
    } catch {
      return null;
    }
  });

  // Ref to track last synchronized state to prevent loop-backs
  const lastSyncRef = useRef<{ bill: string; readings: string; archivedCycles: string } | null>(null);

  // Sync key listener & Firestore subscriber
  useEffect(() => {
    if (!activeSyncKey) {
      try {
        localStorage.removeItem("wattwise_sync_key");
      } catch {}
      return;
    }

    try {
      localStorage.setItem("wattwise_sync_key", activeSyncKey);
    } catch {}

    const unsubscribe = subscribeToSyncSession(activeSyncKey, (data) => {
      if (!data) return;
      const billStr = JSON.stringify(data.bill);
      const readingsStr = JSON.stringify(data.readings);
      const archivedStr = JSON.stringify(data.archivedCycles || []);

      // Check if incoming cloud data is different from what we already have
      const currentBillStr = JSON.stringify(bill);
      const currentReadingsStr = JSON.stringify(readings);
      const currentArchivedStr = JSON.stringify(archivedCycles);

      if (billStr !== currentBillStr || readingsStr !== currentReadingsStr || archivedStr !== currentArchivedStr) {
        lastSyncRef.current = { bill: billStr, readings: readingsStr, archivedCycles: archivedStr };
        setBill(data.bill);
        setReadings(data.readings);
        setArchivedCycles(data.archivedCycles || []);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeSyncKey]);

  // Local changes uploader effect
  useEffect(() => {
    if (!activeSyncKey) return;

    const currentBillStr = JSON.stringify(bill);
    const currentReadingsStr = JSON.stringify(readings);
    const currentArchivedStr = JSON.stringify(archivedCycles);

    // If state is identical to our last sync snapshot, skip uploading
    if (lastSyncRef.current && 
        lastSyncRef.current.bill === currentBillStr && 
        lastSyncRef.current.readings === currentReadingsStr &&
        lastSyncRef.current.archivedCycles === currentArchivedStr) {
      return;
    }

    // This is a local change, upload it (debounced)
    lastSyncRef.current = { bill: currentBillStr, readings: currentReadingsStr, archivedCycles: currentArchivedStr };

    const uploadData = async () => {
      try {
        await saveSyncSession(activeSyncKey, bill, readings, archivedCycles);
      } catch (err) {
        console.error("Failed to upload local change to cloud sync:", err);
      }
    };

    const timeoutId = setTimeout(uploadData, 800);
    return () => clearTimeout(timeoutId);
  }, [bill, readings, archivedCycles, activeSyncKey]);

  // Persist state updates to localstorage
  useEffect(() => {
    try {
      localStorage.setItem("electricity_bill_anchor", JSON.stringify(bill));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [bill]);

  useEffect(() => {
    try {
      localStorage.setItem("electricity_meter_readings", JSON.stringify(readings));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [readings]);

  useEffect(() => {
    try {
      localStorage.setItem("electricity_archived_cycles", JSON.stringify(archivedCycles));
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, [archivedCycles]);

  // Handlers
  const handleUpdateBill = (updatedBill: BillDetails) => {
    setBill(updatedBill);
  };

  const handleAddReading = (newReading: Omit<MeterReading, "id">) => {
    const readingItem: MeterReading = {
      ...newReading,
      id: `reading-${Date.now()}`
    };
    setReadings(prev => [...prev, readingItem]);
  };

  const handleDeleteReading = (id: string) => {
    setReadings(prev => prev.filter(r => r.id !== id));
  };

  const handleSelectCycle = (id: string) => {
    setSelectedCycleId(id);
  };

  const handleArchiveCycle = (name: string, newStartDate: string, newStartReading: number) => {
    const newArchivedCycle: ArchivedCycle = {
      id: `cycle-${Date.now()}`,
      name,
      bill,
      readings,
      archivedAt: Date.now()
    };
    setArchivedCycles(prev => [newArchivedCycle, ...prev]);
    setBill({
      lastBillDate: newStartDate,
      lastBillReading: newStartReading
    });
    setReadings([]);
    setSelectedCycleId("active");
  };

  const handleDeleteArchive = (id: string) => {
    if (window.confirm("Are you sure you want to delete this archived cycle? All of its meter readings and historical data will be lost forever.")) {
      setArchivedCycles(prev => prev.filter(c => c.id !== id));
      setSelectedCycleId("active");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to revert all data back to the default demo values? Any local customizations and archived cycles will be lost.")) {
      setBill(INITIAL_BILL_DETAILS);
      setReadings(INITIAL_METER_READINGS);
      setArchivedCycles([]);
      setSelectedCycleId("active");
    }
  };

  const handleClearEverything = () => {
    if (window.confirm("Are you sure you want to clear ALL logged data points? This will empty out your checkpoints ledger.")) {
      setReadings([]);
    }
  };

  // Onboarding actions
  const handleCompleteOnboarding = (startDate: string, startReading: number) => {
    const initialBill = {
      lastBillDate: startDate,
      lastBillReading: startReading
    };
    setBill(initialBill);
    setReadings([]);
    setArchivedCycles([]);
    setShowOnboarding(false);

    try {
      localStorage.setItem("electricity_bill_anchor", JSON.stringify(initialBill));
      localStorage.setItem("electricity_meter_readings", JSON.stringify([]));
      localStorage.setItem("electricity_archived_cycles", JSON.stringify([]));
    } catch (e) {
      console.error("Local storage onboarding error:", e);
    }
  };

  const handleLinkOnboarding = async (linkedSyncKey: string): Promise<{ success: boolean; error?: string }> => {
    if (linkedSyncKey === activeSyncKey) {
      return { success: false, error: "Already connected to this Sync Key!" };
    }
    try {
      const exists = await checkSyncSessionExists(linkedSyncKey);
      if (exists) {
        setActiveSyncKey(linkedSyncKey);
        setShowOnboarding(false);
        return { success: true };
      } else {
        return { success: false, error: "Sync Key not found. Please double-check." };
      }
    } catch (err) {
      return { success: false, error: "Failed to verify Sync Key. Please try again." };
    }
  };

  // Determine which bill details and readings to display based on active selection
  const isViewingActive = selectedCycleId === "active";
  const selectedArchivedCycle = !isViewingActive 
    ? archivedCycles.find(c => c.id === selectedCycleId) 
    : null;

  const currentBill = selectedArchivedCycle ? selectedArchivedCycle.bill : bill;
  const currentReadings = selectedArchivedCycle ? selectedArchivedCycle.readings : readings;

  return (
    <ErrorBoundary>
      <div className={`min-h-screen text-slate-800 dark:text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-805 transition-colors duration-150 ${
        isDark ? "dark bg-slate-950" : "bg-slate-50"
      }`}>
        {/* Visual top border */}
        <div className="h-1.5 w-full bg-indigo-600 dark:bg-indigo-500 shrink-0" />
        
        {/* Header Viewport */}
        <Header 
          currentDateStr={systemDateStr} 
          isDark={isDark} 
          onToggleDark={() => setIsDark(!isDark)} 
          deferredPrompt={deferredPrompt}
          onInstallClick={handleInstallClick}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Controls column (Small left col on desktop, span 4) */}
            <section className="lg:col-span-4 space-y-6 print:hidden">
              
              {/* Cycle Manager */}
              <CycleManager 
                bill={bill}
                readings={readings}
                archivedCycles={archivedCycles}
                selectedCycleId={selectedCycleId}
                onSelectCycle={handleSelectCycle}
                onArchiveCycle={handleArchiveCycle}
                onDeleteArchive={handleDeleteArchive}
              />

              {/* Bill Anchor Config & Entry form (Only active cycle is editable) */}
              {isViewingActive ? (
                <>
                  <BillConfig 
                    bill={bill} 
                    onChange={handleUpdateBill} 
                  />

                  <AddReadingForm 
                    bill={bill} 
                    readings={readings} 
                    onAdd={handleAddReading} 
                  />
                </>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h4 className="font-display font-bold text-slate-450 dark:text-slate-550 text-[10px] uppercase tracking-widest">
                    Archived Configuration
                  </h4>
                  <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>Cycle Start Date:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{new Date(currentBill.lastBillDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>Start Meter Index:</span>
                      <strong className="text-slate-850 dark:text-slate-200 font-mono">{currentBill.lastBillReading.toLocaleString()} kWh</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Recorded Logs:</span>
                      <strong className="text-slate-850 dark:text-slate-200">{currentReadings.length} checkpoints</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Cloud Sync Settings */}
              <Suspense fallback={<div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">Loading sync setup...</div>}>
                <CloudSync 
                  bill={bill}
                  readings={readings}
                  archivedCycles={archivedCycles}
                  activeSyncKey={activeSyncKey}
                  onSyncStateLoaded={(loadedBill, loadedReadings, loadedArchived, syncKey) => {
                    setBill(loadedBill);
                    setReadings(loadedReadings);
                    setArchivedCycles(loadedArchived);
                    setActiveSyncKey(syncKey);
                  }}
                  onDisconnect={() => {
                    setActiveSyncKey(null);
                  }}
                />
              </Suspense>

              {/* Micro-insights and management action block */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <h4 className="font-display font-bold text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                  <SunMedium className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Quick Eco Tip
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Gov free 10 units cover lighting, basic fans, and normal computer usage. Operating thermal loads like high-power kettles (1.5 kW), water heaters, or microwave ovens for just 1 hour uses up to 2-3 times your total eco-tier average!
                </p>
                
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 justify-between">
                  <button
                    id="reset-demo-btn"
                    onClick={handleResetData}
                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    title="Reset to default mock values"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Demo</span>
                  </button>
                  
                  {isViewingActive && readings.length > 0 && (
                    <button
                      id="clear-all-btn"
                      onClick={handleClearEverything}
                      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-rose-505 dark:text-rose-455 hover:text-rose-700 dark:hover:text-rose-405 transition-colors cursor-pointer"
                    >
                      <span>Clear Logs</span>
                    </button>
                  )}
                </div>
              </div>

            </section>

            {/* Visualization & logs column (Large right col, span 8) */}
            <section className="lg:col-span-8 space-y-6">
              
              {/* Top Stats Dashboard Summary */}
              <InsightsDashboard 
                bill={currentBill} 
                readings={currentReadings} 
              />

              {/* Custom SVG trajectory chart */}
              <Suspense fallback={<div className="h-[240px] flex items-center justify-center text-xs text-slate-400">Loading chart...</div>}>
                <SavingsChart 
                  bill={currentBill} 
                  readings={currentReadings} 
                  isDark={isDark}
                />
              </Suspense>

              {/* Physical Entries Log List */}
              <ReadingsList 
                bill={currentBill} 
                readings={currentReadings} 
                onDelete={isViewingActive ? handleDeleteReading : undefined} 
              />

            </section>
          </div>
        </main>

        {/* Subtle humble footer matching strict branding rules */}
        <footer className="py-8 mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-slate-400 dark:text-slate-500 select-none print:hidden">
          <p className="text-xs font-medium uppercase tracking-wide">
            Daily Free Credit quota based on state general energy supply tariffs (10 units/day).
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-mono">
            All calculations are client-side only &bull; Data saved locally.
          </p>
        </footer>

        {/* Welcome Onboarding Modal Overlay */}
        <Suspense fallback={null}>
          <WelcomeOnboardingModal 
            isOpen={showOnboarding}
            onComplete={handleCompleteOnboarding}
            onLink={handleLinkOnboarding}
          />
        </Suspense>

        {/* PWA Service Worker Update Alert Component */}
        <Suspense fallback={null}>
          <PWAUpdatePrompt />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
