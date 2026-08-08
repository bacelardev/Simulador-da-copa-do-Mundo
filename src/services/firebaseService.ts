import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively sanitizes objects to remove `undefined` values, which are unsupported by Firestore setDoc/updateDoc.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // Preserve Firestore FieldValue objects (like serverTimestamp()) or Timestamps
  if (
    (obj as any).constructor?.name === 'FieldValue' ||
    typeof (obj as any).toMillis === 'function' ||
    (obj as any)._methodName
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, any>)[key];
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean as T;
}

export interface SavedTournament {
  id: string;
  name: string;
  updatedAt: string;
  currentRound: string;
  state: any;
}

export interface SavedMatchHistory {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  phase: string;
  date: string;
  penalties?: string;
  winnerCode?: string;
}

export interface TeamConfig {
  teamCode: string;
  tacticalFormation?: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Tournament Progress Operations
// -------------------------------------------------------------

export async function saveTournamentProgress(id: string, name: string, state: any): Promise<void> {
  const path = `saved_tournaments/${id}`;
  try {
    const docRef = doc(db, 'saved_tournaments', id);
    const sanitizedState = sanitizeForFirestore(state);
    const payload = sanitizeForFirestore({
      id,
      name,
      updatedAt: new Date().toISOString(),
      currentRound: state?.currentRound || 'groups',
      state: sanitizedState,
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Error saving tournament progress to Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeSavedTournaments(onUpdate: (tournaments: SavedTournament[]) => void): () => void {
  const path = 'saved_tournaments';
  try {
    const q = query(collection(db, 'saved_tournaments'));
    return onSnapshot(q, (snapshot) => {
      const tournaments: SavedTournament[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        tournaments.push({
          id: doc.id,
          name: data.name || 'Copa do Mundo Simulada',
          updatedAt: data.updatedAt || new Date().toISOString(),
          currentRound: data.currentRound || 'groups',
          state: data.state
        });
      });
      onUpdate(tournaments);
    }, (error) => {
      console.error('Error listening to saved tournaments:', error);
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    console.error('Failed to subscribe to saved tournaments:', error);
    return () => {};
  }
}

export async function deleteSavedTournament(id: string): Promise<void> {
  const path = `saved_tournaments/${id}`;
  try {
    const docRef = doc(db, 'saved_tournaments', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting tournament from Firebase:', error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Match Histories Operations
// -------------------------------------------------------------

export async function saveMatchResult(matchData: {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  phase: string;
  penalties?: string;
  winnerCode?: string;
}): Promise<void> {
  const id = `${matchData.homeTeam}_vs_${matchData.awayTeam}_${Date.now()}`;
  const path = `match_histories/${id}`;
  try {
    const docRef = doc(db, 'match_histories', id);
    const payload = sanitizeForFirestore({
      id,
      ...matchData,
      date: new Date().toISOString(),
      timestamp: serverTimestamp()
    });
    await setDoc(docRef, payload);
  } catch (error) {
    console.error('Error saving match result to Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeMatchHistories(onUpdate: (matches: SavedMatchHistory[]) => void): () => void {
  const path = 'match_histories';
  try {
    const q = query(collection(db, 'match_histories'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const matches: SavedMatchHistory[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        matches.push({
          id: doc.id,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          phase: data.phase,
          date: data.date || new Date().toISOString(),
          penalties: data.penalties,
          winnerCode: data.winnerCode
        });
      });
      onUpdate(matches);
    }, (error) => {
      console.error('Error listening to match histories:', error);
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    console.error('Failed to subscribe to match histories:', error);
    return () => {};
  }
}

// -------------------------------------------------------------
// Team Configurations
// -------------------------------------------------------------

export async function saveTeamConfig(teamCode: string, formation: string): Promise<void> {
  const path = `team_configs/${teamCode}`;
  try {
    const docRef = doc(db, 'team_configs', teamCode);
    const payload = sanitizeForFirestore({
      teamCode,
      tacticalFormation: formation,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Error saving team config to Firebase:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeTeamConfigs(onUpdate: (configs: Record<string, TeamConfig>) => void): () => void {
  const path = 'team_configs';
  try {
    const q = query(collection(db, 'team_configs'));
    return onSnapshot(q, (snapshot) => {
      const configs: Record<string, TeamConfig> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        configs[doc.id] = {
          teamCode: doc.id,
          tacticalFormation: data.tacticalFormation,
          updatedAt: data.updatedAt
        };
      });
      onUpdate(configs);
    }, (error) => {
      console.error('Error listening to team configs:', error);
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    console.error('Failed to subscribe to team configs:', error);
    return () => {};
  }
}

