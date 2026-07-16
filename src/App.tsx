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
import AddReadingForm from "./components/AddReadingForm";
import SettingsDrawer from "./components/SettingsDrawer";
import InsightsDashboard from "./components/InsightsDashboard";
import ReadingsList from "./components/ReadingsList";
import { SunMedium } from "lucide-react";
import {
  subscribeToSyncSession,
  saveSyncSession,
  checkSyncSessionExists,
  saveArchivedCycle,
  deleteArchivedCycleRemote,
} from "./lib/firebase";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Lazy-loaded components for code splitting & bundle optimization
const SavingsChart = React.lazy(() => import("./components/SavingsChart"));
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

  // Settings Drawer Toggle State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

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

  // Ref to track last synchronized state to prevent loop-backs. Keyed off a
  // ref (not the bill/readings closure values) so a slow-arriving snapshot
  // always compares against the CURRENT state, not the state that existed
  // when the subscription was created.
  const lastSyncRef = useRef<{ bill: string; readings: string } | null>(null);
  const stateRef = useRef({ bill, readings });
  useEffect(() => {
    stateRef.current = { bill, readings };
  }, [bill, readings]);

  // True once the first snapshot for the current activeSyncKey has arrived.
  // Blocks the uploader below from pushing (possibly stale/demo) local state
  // over real cloud data before we've actually seen what's there.
  const hydratedRef = useRef(false);

  // Sync key listener & Firestore subscriber
  useEffect(() => {
    hydratedRef.current = false;

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
      hydratedRef.current = true;
      if (!data) return;

      const billStr = JSON.stringify(data.bill);
      const readingsStr = JSON.stringify(data.readings);

      // Compare against CURRENT state (via ref), not a stale closure.
      const currentBillStr = JSON.stringify(stateRef.current.bill);
      const currentReadingsStr = JSON.stringify(stateRef.current.readings);

      if (billStr !== currentBillStr || readingsStr !== currentReadingsStr) {
        lastSyncRef.current = { bill: billStr, readings: readingsStr };
        setBill(data.bill);
        setReadings(data.readings);
      }
      setArchivedCycles(data.archivedCycles);
    });

    return () => {
      unsubscribe();
    };
  }, [activeSyncKey]);

  // Local changes uploader effect (bill + readings only — archived cycles
  // are written individually via handleArchiveCycle/handleDeleteArchive so
  // a growing history never inflates this hot document on every edit).
  useEffect(() => {
    if (!activeSyncKey || !hydratedRef.current) return;

    const currentBillStr = JSON.stringify(bill);
    const currentReadingsStr = JSON.stringify(readings);

    // If state is identical to our last sync snapshot, skip uploading
    if (lastSyncRef.current &&
        lastSyncRef.current.bill === currentBillStr &&
        lastSyncRef.current.readings === currentReadingsStr) {
      return;
    }

    lastSyncRef.current = { bill: currentBillStr, readings: currentReadingsStr };

    const uploadData = async () => {
      try {
        await saveSyncSession(activeSyncKey, bill, readings);
      } catch (err) {
        console.error("Failed to upload local change to cloud sync:", err);
      }
    };

    const timeoutId = setTimeout(uploadData, 800);
    return () => clearTimeout(timeoutId);
  }, [bill, readings, activeSyncKey]);

  // Flush a pending debounced upload immediately if the tab is being closed
  // or backgrounded, so a last-second edit isn't silently lost.
  useEffect(() => {
    const flush = () => {
      if (!activeSyncKey || !hydratedRef.current) return;
      const { bill: currentBill, readings: currentReadings } = stateRef.current;
      const currentBillStr = JSON.stringify(currentBill);
      const currentReadingsStr = JSON.stringify(currentReadings);
      if (lastSyncRef.current &&
          lastSyncRef.current.bill === currentBillStr &&
          lastSyncRef.current.readings === currentReadingsStr) {
        return;
      }
      lastSyncRef.current = { bill: currentBillStr, readings: currentReadingsStr };
      saveSyncSession(activeSyncKey, currentBill, currentReadings).catch((err) => {
        console.error("Failed to flush cloud sync on page hide:", err);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeSyncKey]);

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
      id: crypto.randomUUID()
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
      id: crypto.randomUUID(),
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

    if (activeSyncKey) {
      saveArchivedCycle(activeSyncKey, newArchivedCycle).catch((err) => {
        console.error("Failed to sync archived cycle to cloud:", err);
      });
    }
  };

  const handleDeleteArchive = (id: string) => {
    if (window.confirm("Are you sure you want to delete this archived cycle? All of its meter readings and historical data will be lost forever.")) {
      setArchivedCycles(prev => prev.filter(c => c.id !== id));
      setSelectedCycleId("active");

      if (activeSyncKey) {
        deleteArchivedCycleRemote(activeSyncKey, id).catch((err) => {
          console.error("Failed to delete archived cycle from cloud:", err);
        });
      }
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
      <div className={`min-h-screen text-neutral-800 dark:text-neutral-100 font-sans flex flex-col antialiased selection:bg-neutral-100 dark:selection:bg-neutral-800 selection:text-neutral-900 transition-colors duration-150 ${
        isDark ? "dark bg-[#09090b]" : "bg-[#f9fafb]"
      }`}>
        {/* Visual top border */}
        <div className="h-1 w-full bg-neutral-900 dark:bg-white shrink-0" />
        
        <Header 
          currentDateStr={systemDateStr} 
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSyncActive={!!activeSyncKey}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Controls column (Small left col on desktop, span 4) */}
            <section className="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-6 print:hidden">
              
              {/* Entry form (Only active cycle is editable) */}
              {isViewingActive && (
                <AddReadingForm 
                  bill={bill} 
                  readings={readings} 
                  onAdd={handleAddReading} 
                />
              )}

              {/* Micro-insights (Quick Eco Tip remains here) */}
              <div className="bg-white dark:bg-[#121316] border border-neutral-200 dark:border-neutral-800 p-5 rounded-xl space-y-4 shadow-xs">
                <h4 className="font-display font-extrabold text-neutral-900 dark:text-white text-[10px] uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <SunMedium className="w-4 h-4 text-neutral-500" />
                  Quick Eco Tip
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                  Gov free 10 units cover lighting, basic fans, and normal computer usage. Operating thermal loads like high-power kettles (1.5 kW), water heaters, or microwave ovens for just 1 hour uses up to 2-3 times your total eco-tier average!
                </p>
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
              <Suspense fallback={<div className="h-[240px] flex items-center justify-center text-xs text-neutral-400 font-mono">Loading chart...</div>}>
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
        <footer className="py-8 mt-12 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0b0c0e] text-center text-neutral-450 dark:text-neutral-500 select-none print:hidden font-mono text-[9px] uppercase tracking-widest">
          <p className="font-bold tracking-wider">
            Daily Free Credit quota based on state general energy supply tariffs (10 units/day).
          </p>
          <p className="text-neutral-400 dark:text-neutral-600 mt-1.5">
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

        <SettingsDrawer
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDark={isDark}
          onToggleDark={() => setIsDark(!isDark)}
          deferredPrompt={deferredPrompt}
          onInstallClick={handleInstallClick}
          bill={bill}
          readings={readings}
          archivedCycles={archivedCycles}
          selectedCycleId={selectedCycleId}
          onSelectCycle={handleSelectCycle}
          onArchiveCycle={handleArchiveCycle}
          onDeleteArchive={handleDeleteArchive}
          activeSyncKey={activeSyncKey}
          onSyncStateLoaded={(loadedBill, loadedReadings, loadedArchived, syncKey) => {
            setBill(loadedBill);
            setReadings(loadedReadings);
            setArchivedCycles(loadedArchived);
            setActiveSyncKey(syncKey);
          }}
          onDisconnect={() => setActiveSyncKey(null)}
          onResetData={handleResetData}
          onClearEverything={handleClearEverything}
          onUpdateBill={handleUpdateBill}
        />

        {/* PWA Service Worker Update Alert Component */}
        <Suspense fallback={null}>
          <PWAUpdatePrompt />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
