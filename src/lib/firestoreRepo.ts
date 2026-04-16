import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { premadePrograms } from "@/lib/workoutLogic";
import type { Account, Assignment, NewAccount, Program, SessionUser, WorkoutLog } from "@/lib/types";

const PROGRAMS = "programs";
const LOGS = "workoutLogs";
const ACCOUNTS = "accounts";

const SETTINGS_REF = doc(db, "appMeta", "settings");
const ASSIGNMENT_REF = doc(db, "appMeta", "assignment");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function accountDocId(email: string) {
  return encodeURIComponent(normalizeEmail(email));
}

function accountRef(email: string) {
  return doc(db, ACCOUNTS, accountDocId(email));
}

export async function ensureSeedData() {
  const existingPrograms = await getDocs(collection(db, PROGRAMS));
  if (!existingPrograms.empty) return;

  const templates = premadePrograms();
  for (const program of templates) {
    await setDoc(doc(db, PROGRAMS, program.id), program);
  }

  await setDoc(SETTINGS_REF, { seededAt: Date.now() }, { merge: true });
  await setDoc(
    ASSIGNMENT_REF,
    {
      programId: templates[0]?.id || null,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export function subscribePrograms(onChange: (programs: Program[]) => void) {
  const q = query(collection(db, PROGRAMS), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const programs = snapshot.docs.map((item) => item.data() as Program);
    onChange(programs);
  });
}

export function subscribeAccounts(onChange: (accounts: SessionUser[]) => void) {
  const q = query(collection(db, ACCOUNTS), orderBy("name", "asc"));
  return onSnapshot(q, (snapshot) => {
    const accounts = snapshot.docs.map((item) => {
      const data = item.data() as Account;
      return {
        role: data.role,
        email: data.email,
        name: data.name,
      } as SessionUser;
    });
    onChange(accounts);
  });
}

export async function registerAccount(input: NewAccount) {
  const email = normalizeEmail(input.email);
  const pin = input.pin.trim();
  const name = input.name.trim();

  if (!email || !pin || !name) {
    return { ok: false as const, reason: "All fields are required." };
  }

  const ref = accountRef(email);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    return { ok: false as const, reason: "An account with this email already exists." };
  }

  const account: Account = {
    role: input.role,
    email,
    name,
    pin,
    createdAt: Date.now(),
  };

  await setDoc(ref, account);

  return {
    ok: true as const,
    user: {
      role: account.role,
      email: account.email,
      name: account.name,
    } as SessionUser,
  };
}

export async function findUserByCredentials(emailInput: string, pinInput: string) {
  const email = normalizeEmail(emailInput);
  const pin = pinInput.trim();

  if (!email || !pin) {
    return null;
  }

  const snapshot = await getDoc(accountRef(email));
  if (!snapshot.exists()) {
    return null;
  }

  const account = snapshot.data() as Account;
  if (account.pin !== pin) {
    return null;
  }

  return {
    role: account.role,
    email: account.email,
    name: account.name,
  } as SessionUser;
}

export async function saveProgram(program: Program) {
  await setDoc(doc(db, PROGRAMS, program.id), {
    ...program,
    updatedAt: Date.now(),
  });
}

export async function deleteProgram(programId: string) {
  await deleteDoc(doc(db, PROGRAMS, programId));
}

export function subscribeAssignment(onChange: (assignment: Assignment) => void) {
  return onSnapshot(ASSIGNMENT_REF, (snapshot) => {
    const data = snapshot.data() as Assignment | undefined;
    onChange({
      programId: data?.programId || null,
      updatedAt: data?.updatedAt || 0,
    });
  });
}

export async function assignProgram(programId: string | null) {
  await setDoc(
    ASSIGNMENT_REF,
    {
      programId,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export function subscribeLogs(onChange: (logs: WorkoutLog[]) => void) {
  const q = query(collection(db, LOGS), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((item) => item.data() as WorkoutLog);
    onChange(logs);
  });
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `log-${Math.random().toString(16).slice(2)}`;
}

export async function addWorkoutLog(log: Omit<WorkoutLog, "id" | "createdAt">) {
  await addDoc(collection(db, LOGS), {
    ...log,
    id: createId(),
    createdAt: Date.now(),
  });
}
