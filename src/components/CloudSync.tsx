import { useState, useEffect } from "react";
import { 
  Cloud, 
  CloudOff, 
  Copy, 
  Check, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2,
  Database
} from "lucide-react";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";
import { checkSyncSession, saveSyncSession, SyncSessionData } from "../lib/firebase";

interface CloudSyncProps {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles: ArchivedCycle[];
  onSyncStateLoaded: (bill: BillDetails, readings: MeterReading[], archivedCycles: ArchivedCycle[], syncKey: string) => void;
  activeSyncKey: string | null;
  onDisconnect: () => void;
}

export default function CloudSync({ 
  bill, 
  readings, 
  archivedCycles,
  onSyncStateLoaded, 
  activeSyncKey, 
  onDisconnect 
}: CloudSyncProps) {
  const [syncKeyInput, setSyncKeyInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // For conflict resolution
  const [pendingSessionData, setPendingSessionData] = useState<SyncSessionData | null>(null);
  const [pendingSyncKey, setPendingSyncKey] = useState<string | null>(null);

  // Copy sync key helper
  const handleCopy = async () => {
    if (!activeSyncKey) return;
    try {
      await navigator.clipboard.writeText(activeSyncKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Generate a friendly, secure human-readable key: WATT-XXXX-XXXX
  const generateSyncKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing 1, l, 0, O
    const genPart = (len: number) => {
      let result = "";
      for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    return `WATT-${genPart(4)}-${genPart(4)}`;
  };

  // Connect & Sync action
  const handleConnect = async (keyToUse?: string) => {
    setError(null);
    const key = (keyToUse || syncKeyInput).trim().toUpperCase();
    if (!key) {
      setError("Please enter a valid Sync Key.");
      return;
    }
    if (key.length < 6) {
      setError("Sync Key must be at least 6 characters long.");
      return;
    }

    setIsConnecting(true);
    try {
      const existingData = await checkSyncSession(key);

      if (existingData) {
        // We found existing cloud data! Compare with local state to see if there is a conflict.
        const localReadingsJson = JSON.stringify(readings);
        const cloudReadingsJson = JSON.stringify(existingData.readings);
        const localBillJson = JSON.stringify(bill);
        const cloudBillJson = JSON.stringify(existingData.bill);
        const localArchivedJson = JSON.stringify(archivedCycles);
        const cloudArchivedJson = JSON.stringify(existingData.archivedCycles || []);

        if (localReadingsJson === cloudReadingsJson && 
            localBillJson === cloudBillJson && 
            localArchivedJson === cloudArchivedJson) {
          // No actual difference, proceed with immediate link
          onSyncStateLoaded(bill, readings, archivedCycles, key);
          setSyncKeyInput("");
        } else {
          // Open conflict resolution dialogue
          setPendingSessionData(existingData);
          setPendingSyncKey(key);
        }
      } else {
        // Document does not exist in Cloud yet. Initialize it with our local state.
        await saveSyncSession(key, bill, readings, archivedCycles);
        onSyncStateLoaded(bill, readings, archivedCycles, key);
        setSyncKeyInput("");
      }
    } catch (err: any) {
      console.error("Sync connection error:", err);
      setError(err.message || "Failed to connect to cloud database.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateNewSync = async () => {
    const key = generateSyncKey();
    await handleConnect(key);
  };

  // Conflict Resolution Choices
  const handleResolveConflict = async (choice: "use-cloud" | "use-local" | "merge") => {
    if (!pendingSessionData || !pendingSyncKey) return;

    try {
      setIsConnecting(true);
      if (choice === "use-cloud") {
        // Overwrite local with cloud
        onSyncStateLoaded(
          pendingSessionData.bill, 
          pendingSessionData.readings, 
          pendingSessionData.archivedCycles || [], 
          pendingSyncKey
        );
      } else if (choice === "use-local") {
        // Overwrite cloud with local
        await saveSyncSession(pendingSyncKey, bill, readings, archivedCycles);
        onSyncStateLoaded(bill, readings, archivedCycles, pendingSyncKey);
      } else if (choice === "merge") {
        // Merge datasets
        // 1. Readings: Merge by unique attributes or combine and deduplicate by date
        const readingsMap = new Map<string, MeterReading>();
        
        // Add cloud readings first
        pendingSessionData.readings.forEach(r => {
          readingsMap.set(r.date, r);
        });
        // Add local readings (local overrides cloud on same date if there is one)
        readings.forEach(r => {
          readingsMap.set(r.date, r);
        });

        // Convert back to sorted list
        const mergedReadings = Array.from(readingsMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // 2. Bill Anchor: Take the one with the latest anchor date
        const cloudBillDate = new Date(pendingSessionData.bill.lastBillDate).getTime();
        const localBillDate = new Date(bill.lastBillDate).getTime();
        const mergedBill = cloudBillDate >= localBillDate ? pendingSessionData.bill : bill;

        // 3. Archived cycles merge: Combine and deduplicate by cycle ID
        const cyclesMap = new Map<string, ArchivedCycle>();
        (pendingSessionData.archivedCycles || []).forEach(c => {
          cyclesMap.set(c.id, c);
        });
        archivedCycles.forEach(c => {
          cyclesMap.set(c.id, c);
        });
        const mergedCycles = Array.from(cyclesMap.values()).sort((a, b) => b.archivedAt - a.archivedAt);

        // Save merged output back to cloud
        await saveSyncSession(pendingSyncKey, mergedBill, mergedReadings, mergedCycles);
        onSyncStateLoaded(mergedBill, mergedReadings, mergedCycles, pendingSyncKey);
      }

      // Clear pending
      setPendingSessionData(null);
      setPendingSyncKey(null);
      setSyncKeyInput("");
    } catch (err: any) {
      console.error("Conflict resolution failed:", err);
      setError("Failed to resolve conflict.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold uppercase tracking-wider text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          {activeSyncKey ? <Cloud className="w-4 h-4 text-emerald-500 animate-pulse" /> : <CloudOff className="w-4 h-4 text-slate-400" />}
          Multi-Device Cloud Sync
        </h3>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="About cloud sync"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1.5 leading-relaxed">
          <p>
            <strong>How it works:</strong> No email or passwords required! Enter or generate a secret 12-character Sync Key.
          </p>
          <p>
            Any other device (phone, laptop, tablet) that enters the <strong>same key</strong> will automatically stay perfectly in sync in real-time.
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 font-medium">
            Your data is stored securely in an isolated document. Only someone with your exact Sync Key can access it.
          </p>
        </div>
      )}

      {activeSyncKey ? (
        /* Connected Status View */
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-widest">
                Cloud Sync Connected
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 break-all">
                {activeSyncKey}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="copy-sync-key-btn"
                onClick={handleCopy}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                title="Copy Sync Key"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic leading-snug">
            Connected! Any changes you make will instantly save and sync across all devices loaded with this key.
          </p>

          <button
            id="disconnect-sync-btn"
            onClick={onDisconnect}
            className="w-full text-center py-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors border border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-800 bg-transparent cursor-pointer"
          >
            Disconnect Cloud Sync (Go Offline)
          </button>
        </div>
      ) : (
        /* Offline Config View */
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-450 dark:text-slate-550">
              Connect Existing Sync Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="sync-key-input"
                  type="text"
                  value={syncKeyInput}
                  onChange={(e) => setSyncKeyInput(e.target.value)}
                  placeholder="e.g. WATT-ABCD-EFGH"
                  className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 font-mono transition-colors uppercase"
                />
              </div>
              <button
                id="connect-sync-btn"
                onClick={() => handleConnect()}
                disabled={isConnecting}
                className="bg-indigo-650 hover:bg-indigo-750 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 shadow-sm disabled:opacity-50"
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Link"}
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <button
            id="generate-sync-key-btn"
            onClick={handleCreateNewSync}
            disabled={isConnecting}
            className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 py-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Database className="w-4 h-4 text-indigo-500" />
            Generate New Sync Key
          </button>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-450 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Conflict Resolution Dialogue */}
      {pendingSessionData && pendingSyncKey && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
              <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Data Conflict Detected
              </h4>
            </div>

            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              The Cloud document for <strong className="font-mono text-indigo-600 dark:text-indigo-400">{pendingSyncKey}</strong> contains existing entries. Your local device also has entries. How would you like to handle this?
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">On Cloud</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 block">{pendingSessionData.readings.length} readings</span>
                <span className="text-[10px] text-slate-400 font-mono">Last update: {new Date(pendingSessionData.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">On This Device</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 block">{readings.length} readings</span>
                <span className="text-[10px] text-slate-400">Anchor: {bill.lastBillDate}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleResolveConflict("merge")}
                className="w-full text-left p-3 border border-slate-200 dark:border-slate-800 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 hover:border-indigo-200 transition-colors cursor-pointer group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>1. Merge Datasets (Recommended)</span>
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold px-1.5 py-0.5">DEDUPLICATE</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Combine both sets of readings. If there is a date duplicate, local entry wins.
                </p>
              </button>

              <button
                onClick={() => handleResolveConflict("use-cloud")}
                className="w-full text-left p-3 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-250 transition-colors cursor-pointer group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>2. Load Cloud Data</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Replace local readings entirely with the cloud database contents.
                </p>
              </button>

              <button
                onClick={() => handleResolveConflict("use-local")}
                className="w-full text-left p-3 border border-slate-200 dark:border-slate-800 hover:bg-amber-50/45 dark:hover:bg-amber-950/20 hover:border-amber-250 transition-colors cursor-pointer group"
              >
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>3. Overwrite Cloud with Local</span>
                  <AlertCircle className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Wipe out the cloud document data and replace it with this device's current logs.
                </p>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setPendingSessionData(null);
                  setPendingSyncKey(null);
                }}
                className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-2 px-4 transition-all cursor-pointer"
              >
                Cancel Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
