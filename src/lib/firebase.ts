import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific databaseId provisioned for this applet
export const db = initializeFirestore(app, {}, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId);

export interface SyncSessionData {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles?: ArchivedCycle[];
  updatedAt: number;
}

// Generates a clean, readable sync code (e.g., WATT-9284-AX7K-3JQP)
export function generateSyncCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  const randomPart = (length: number): string => {
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  };
  return `WATT-${randomPart(4)}-${randomPart(4)}-${randomPart(4)}`;
}

/**
 * Checks if a sync session exists in Firestore.
 */
export async function checkSyncSession(syncKey: string): Promise<SyncSessionData | null> {
  if (!syncKey) return null;
  const docRef = doc(db, "sync_sessions", syncKey.toUpperCase().trim());
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SyncSessionData;
    }
  } catch (error) {
    console.error("Error reading sync session:", error);
  }
  return null;
}

/**
 * Checks if a sync session key exists in the database.
 */
export async function checkSyncSessionExists(syncKey: string): Promise<boolean> {
  if (!syncKey) return false;
  const docRef = doc(db, "sync_sessions", syncKey.toUpperCase().trim());
  try {
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking sync session existence:", error);
    return false;
  }
}

/**
 * Generates a sync key guaranteed not to collide with an existing session
 */
export async function generateUniqueSyncKey(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSyncCode();
    const exists = await checkSyncSessionExists(code);
    if (!exists) return code;
  }
  return generateSyncCode();
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
  if (!syncKey) return;
  const docRef = doc(db, "sync_sessions", syncKey.toUpperCase().trim());
  const data: SyncSessionData = {
    bill,
    readings,
    updatedAt: Date.now()
  };
  if (archivedCycles) {
    data.archivedCycles = archivedCycles;
  }
  try {
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error saving sync session:", error);
  }
}

/**
 * Subscribes to real-time changes of a sync session.
 */
export function subscribeToSyncSession(syncKey: string, callback: (data: SyncSessionData | null) => void) {
  if (!syncKey) return () => {};
  const docRef = doc(db, "sync_sessions", syncKey.toUpperCase().trim());
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as SyncSessionData);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error listening to sync session:", error);
  });
}
