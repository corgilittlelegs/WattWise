import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyBa9uDNGZuq9jxAiNEVQi2wSThHLx2YPqo",
  authDomain: "resonant-operator-qrwfn.firebaseapp.com",
  projectId: "resonant-operator-qrwfn",
  storageBucket: "resonant-operator-qrwfn.firebasestorage.app",
  messagingSenderId: "443521680899",
  appId: "1:443521680899:web:95bd7a6a4145e5b3193036"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = initializeFirestore(app, {}, "ai-studio-electricityconsu-578edadb-c55f-437c-885a-f7b06a5b44d5");

export interface SyncSessionData {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles?: ArchivedCycle[];
  updatedAt: number;
}

/**
 * Checks if a sync session exists in Firestore.
 */
export async function checkSyncSession(syncKey: string): Promise<SyncSessionData | null> {
  const docRef = doc(db, "sync_sessions", syncKey.trim().toLowerCase());
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as SyncSessionData;
  }
  return null;
}

/**
 * Creates or updates a sync session in Firestore.
 */
export async function saveSyncSession(
  syncKey: string, 
  bill: BillDetails, 
  readings: MeterReading[],
  archivedCycles?: ArchivedCycle[]
): Promise<void> {
  const docRef = doc(db, "sync_sessions", syncKey.trim().toLowerCase());
  const data: SyncSessionData = {
    bill,
    readings,
    updatedAt: Date.now()
  };
  if (archivedCycles) {
    data.archivedCycles = archivedCycles;
  }
  await setDoc(docRef, data);
}

/**
 * Subscribes to real-time changes of a sync session.
 */
export function subscribeToSyncSession(syncKey: string, callback: (data: SyncSessionData) => void) {
  const docRef = doc(db, "sync_sessions", syncKey.trim().toLowerCase());
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as SyncSessionData);
    }
  });
}
