import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from "firebase/auth";
import {
  initializeFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { BillDetails, MeterReading, ArchivedCycle } from "../types";
import {
  generateSyncCode,
  isValidSyncKeyFormat,
  normalizeSyncKey,
  validateSyncSessionData,
  ValidatedSyncSessionData,
} from "./sync";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore targeting the specific databaseId provisioned for this applet
export const db = initializeFirestore(app, {}, (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId);

export { generateSyncCode, isValidSyncKeyFormat };

export interface SyncSessionData {
  bill: BillDetails;
  readings: MeterReading[];
  archivedCycles: ArchivedCycle[];
  updatedAt: number;
}

// Firestore rules require request.auth != null. Every write/read below awaits
// this so a signed-out client never issues a request that gets rejected.
let authReadyPromise: Promise<User> | null = null;
function ensureAuthReady(): Promise<User> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        },
        reject
      );
      signInAnonymously(auth).catch((err) => {
        unsubscribe();
        reject(err);
      });
    });
  }
  return authReadyPromise;
}

function sessionDocRef(syncKey: string) {
  return doc(db, "sync_sessions", normalizeSyncKey(syncKey));
}

function archivesCollectionRef(syncKey: string) {
  return collection(db, "sync_sessions", normalizeSyncKey(syncKey), "archives");
}

function archiveDocRef(syncKey: string, cycleId: string) {
  return doc(db, "sync_sessions", normalizeSyncKey(syncKey), "archives", cycleId);
}

/** serverTimestamp() resolves to a Firestore Timestamp on read; normalize to epoch millis. */
function timestampToMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : Date.now();
}

/** Checks if a sync session key exists in the database. */
export async function checkSyncSessionExists(syncKey: string): Promise<boolean> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return false;
  try {
    await ensureAuthReady();
    const docSnap = await getDoc(sessionDocRef(syncKey));
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking sync session existence:", error);
    return false;
  }
}

/**
 * Generates a sync key guaranteed not to collide with an existing session.
 * Uses a CSPRNG (see lib/sync.ts) — never Math.random().
 */
export async function generateUniqueSyncKey(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSyncCode();
    const exists = await checkSyncSessionExists(code);
    if (!exists) return code;
  }
  return generateSyncCode();
}

async function fetchArchivedCycles(syncKey: string): Promise<ArchivedCycle[]> {
  const { getDocs } = await import("firebase/firestore");
  const snap = await getDocs(archivesCollectionRef(syncKey));
  const cycles: ArchivedCycle[] = [];
  snap.forEach((d) => {
    const validated = validateSyncSessionData({
      bill: d.data().bill,
      readings: d.data().readings,
      archivedCycles: [],
      updatedAt: 0,
    });
    if (validated) {
      cycles.push({
        id: d.id,
        name: typeof d.data().name === "string" ? d.data().name : "Archived Cycle",
        bill: validated.bill,
        readings: validated.readings,
        archivedAt: typeof d.data().archivedAt === "number" ? d.data().archivedAt : 0,
      });
    }
  });
  return cycles.sort((a, b) => b.archivedAt - a.archivedAt);
}

/** Checks if a sync session exists in Firestore and returns its validated contents. */
export async function checkSyncSession(syncKey: string): Promise<SyncSessionData | null> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return null;
  try {
    await ensureAuthReady();
    const [docSnap, archivedCycles] = await Promise.all([
      getDoc(sessionDocRef(syncKey)),
      fetchArchivedCycles(syncKey),
    ]);
    if (!docSnap.exists()) return null;
    const raw = docSnap.data();
    const validated = validateSyncSessionData({
      ...raw,
      updatedAt: timestampToMillis(raw.updatedAt),
      archivedCycles: [],
    });
    if (!validated) return null;
    return { ...validated, archivedCycles };
  } catch (error) {
    console.error("Error reading sync session:", error);
    return null;
  }
}

/**
 * Creates or updates the active-cycle portion of a sync session (bill +
 * readings only). Archived cycles are written separately via
 * saveArchivedCycle so a growing history never inflates this hot document.
 */
export async function saveSyncSession(
  syncKey: string,
  bill: BillDetails,
  readings: MeterReading[]
): Promise<void> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return;
  try {
    await ensureAuthReady();
    await setDoc(
      sessionDocRef(syncKey),
      { bill, readings, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving sync session:", error);
  }
}

/** Writes a single archived cycle as its own subcollection document (write-once). */
export async function saveArchivedCycle(syncKey: string, cycle: ArchivedCycle): Promise<void> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return;
  try {
    await ensureAuthReady();
    await setDoc(archiveDocRef(syncKey, cycle.id), {
      name: cycle.name,
      bill: cycle.bill,
      readings: cycle.readings,
      archivedAt: cycle.archivedAt,
    });
  } catch (error) {
    console.error("Error saving archived cycle:", error);
  }
}

export async function deleteArchivedCycleRemote(syncKey: string, cycleId: string): Promise<void> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return;
  try {
    await ensureAuthReady();
    await deleteDoc(archiveDocRef(syncKey, cycleId));
  } catch (error) {
    console.error("Error deleting archived cycle:", error);
  }
}

/** Permanently deletes a sync session and all of its archived cycles. */
export async function deleteSyncSession(syncKey: string): Promise<void> {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return;
  try {
    await ensureAuthReady();
    const { getDocs, writeBatch } = await import("firebase/firestore");
    const snap = await getDocs(archivesCollectionRef(syncKey));
    const batch = writeBatch(db);
    snap.forEach((d) => batch.delete(d.ref));
    batch.delete(sessionDocRef(syncKey));
    await batch.commit();
  } catch (error) {
    console.error("Error deleting sync session:", error);
  }
}

/**
 * Subscribes to real-time changes of a sync session's active cycle AND its
 * archived cycles, delivering a combined, validated snapshot on any change.
 */
export function subscribeToSyncSession(
  syncKey: string,
  callback: (data: SyncSessionData | null) => void
) {
  if (!syncKey || !isValidSyncKeyFormat(syncKey)) return () => {};

  let latestMain: ValidatedSyncSessionData | null = null;
  let latestArchives: ArchivedCycle[] = [];
  let mainLoaded = false;
  let archivesLoaded = false;
  let cancelled = false;

  const emit = () => {
    if (!mainLoaded || !archivesLoaded || cancelled) return;
    if (!latestMain) {
      callback(null);
      return;
    }
    callback({ ...latestMain, archivedCycles: latestArchives });
  };

  let unsubMain = () => {};
  let unsubArchives = () => {};

  ensureAuthReady()
    .then(() => {
      if (cancelled) return;
      unsubMain = onSnapshot(
        sessionDocRef(syncKey),
        (docSnap) => {
          mainLoaded = true;
          if (docSnap.exists()) {
            const raw = docSnap.data();
            latestMain = validateSyncSessionData({
              ...raw,
              updatedAt: timestampToMillis(raw.updatedAt),
              archivedCycles: [],
            });
          } else {
            latestMain = null;
          }
          emit();
        },
        (error) => {
          console.error("Error listening to sync session:", error);
          mainLoaded = true;
          emit();
        }
      );

      unsubArchives = onSnapshot(
        archivesCollectionRef(syncKey),
        (snap) => {
          const cycles: ArchivedCycle[] = [];
          snap.forEach((d) => {
            const validated = validateSyncSessionData({
              bill: d.data().bill,
              readings: d.data().readings,
              archivedCycles: [],
              updatedAt: 0,
            });
            if (validated) {
              cycles.push({
                id: d.id,
                name: typeof d.data().name === "string" ? d.data().name : "Archived Cycle",
                bill: validated.bill,
                readings: validated.readings,
                archivedAt: typeof d.data().archivedAt === "number" ? d.data().archivedAt : 0,
              });
            }
          });
          latestArchives = cycles.sort((a, b) => b.archivedAt - a.archivedAt);
          archivesLoaded = true;
          emit();
        },
        (error) => {
          console.error("Error listening to archived cycles:", error);
          archivesLoaded = true;
          emit();
        }
      );
    })
    .catch((error) => {
      console.error("Error establishing auth for sync subscription:", error);
    });

  return () => {
    cancelled = true;
    unsubMain();
    unsubArchives();
  };
}
