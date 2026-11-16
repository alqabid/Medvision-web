export interface LocalAccount {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: "practitioner";
  hospital: string;
  specialty?: string;
  created_at: string;
}

export interface LocalPatient {
  id: string;
  created_by: string;
  patient_name: string;
  gender: string | null;
  age: number | null;
  notes: string | null;
  created_at: string;
}

export interface LocalAnalysis {
  id: string;
  user_id: string;
  patient_id: string | null;
  image_path: string;
  original_filename: string;
  modality: "xray" | "ct";
  prediction: string;
  confidence: number;
  findings: string | null;
  model_used: string;
  created_at: string;
}

export interface LocalAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACCOUNTS_KEY = "medvision_local_accounts_v2";
const ACTIVE_USER_KEY = "medvision_active_local_user_v2";
const PATIENTS_KEY = "medvision_local_patients_v2";
const ANALYSES_KEY = "medvision_local_analyses_v2";
const AUDIT_KEY = "medvision_local_audit_v2";

// Purge any legacy v1 seeded demo data on module load
try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("medvision_local_patients_v1");
    window.localStorage.removeItem("medvision_local_analyses_v1");
    window.localStorage.removeItem("medvision_local_audit_v1");
  }
} catch {
  // ignore storage errors
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function deterministicId(seed: string): string {
  let h1 = 0xdeadbeef ^ seed.length;
  let h2 = 0x41c6ce57 ^ seed.length;
  for (let i = 0, ch; i < seed.length; i++) {
    ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}-${hex2.slice(0, 4)}-4${hex2.slice(5, 8)}-a${hex1.slice(1, 4)}-${hex1}${hex2.slice(0, 4)}`;
}

export function getLocalAccounts(): LocalAccount[] {
  return safeRead<LocalAccount[]>(ACCOUNTS_KEY, []);
}

export function upsertLocalAccount(
  account: Omit<LocalAccount, "id" | "created_at" | "role"> & { id?: string; role?: string }
): LocalAccount {
  const accounts = getLocalAccounts();
  const normalizedEmail = account.email.trim().toLowerCase();
  const existingIdx = accounts.findIndex((a) => a.email.toLowerCase() === normalizedEmail);
  const record: LocalAccount = {
    id: account.id || (existingIdx >= 0 ? accounts[existingIdx].id : deterministicId(normalizedEmail)),
    email: normalizedEmail,
    password: account.password ?? (existingIdx >= 0 ? accounts[existingIdx].password : undefined),
    full_name: account.full_name || (existingIdx >= 0 ? accounts[existingIdx].full_name : "Clinician"),
    role: "practitioner",
    hospital: account.hospital || (existingIdx >= 0 ? accounts[existingIdx].hospital : "Korle Bu Teaching Hospital"),
    specialty: account.specialty || (existingIdx >= 0 ? accounts[existingIdx].specialty : "Thoracic Radiology"),
    created_at: existingIdx >= 0 ? accounts[existingIdx].created_at : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = record;
  } else {
    accounts.push(record);
  }
  safeWrite(ACCOUNTS_KEY, accounts);
  return record;
}

export function getActiveLocalAccount(): LocalAccount | null {
  return safeRead<LocalAccount | null>(ACTIVE_USER_KEY, null);
}

export function setActiveLocalAccount(account: LocalAccount | null): void {
  if (!account) {
    localStorage.removeItem(ACTIVE_USER_KEY);
  } else {
    safeWrite(ACTIVE_USER_KEY, account);
  }
}

export function getLocalPatients(userId?: string): LocalPatient[] {
  const all = safeRead<LocalPatient[]>(PATIENTS_KEY, []);
  if (!userId) return all;
  return all.filter((p) => p.created_by === userId);
}

export function addLocalPatient(patient: Omit<LocalPatient, "id" | "created_at">): LocalPatient {
  const all = safeRead<LocalPatient[]>(PATIENTS_KEY, []);
  const created: LocalPatient = {
    ...patient,
    id: crypto.randomUUID ? crypto.randomUUID() : deterministicId(`${patient.patient_name}-${Date.now()}`),
    created_at: new Date().toISOString(),
  };
  all.unshift(created);
  safeWrite(PATIENTS_KEY, all);
  return created;
}

export function deleteLocalPatient(id: string): void {
  const all = safeRead<LocalPatient[]>(PATIENTS_KEY, []);
  safeWrite(
    PATIENTS_KEY,
    all.filter((p) => p.id !== id)
  );
}

export function getLocalAnalyses(userId?: string): LocalAnalysis[] {
  const all = safeRead<LocalAnalysis[]>(ANALYSES_KEY, []);
  if (!userId) return all;
  return all.filter((a) => a.user_id === userId);
}

export function addLocalAnalysis(analysis: Omit<LocalAnalysis, "id" | "created_at">): LocalAnalysis {
  const all = safeRead<LocalAnalysis[]>(ANALYSES_KEY, []);
  const created: LocalAnalysis = {
    ...analysis,
    id: crypto.randomUUID ? crypto.randomUUID() : deterministicId(`${analysis.original_filename}-${Date.now()}`),
    created_at: new Date().toISOString(),
  };
  all.unshift(created);
  safeWrite(ANALYSES_KEY, all);
  return created;
}

export function getLocalAuditLogs(userId?: string): LocalAuditLog[] {
  const all = safeRead<LocalAuditLog[]>(AUDIT_KEY, []);
  if (!userId) return all;
  return all.filter((l) => l.user_id === userId);
}

export function addLocalAuditLog(log: Omit<LocalAuditLog, "id" | "created_at">): LocalAuditLog {
  const all = safeRead<LocalAuditLog[]>(AUDIT_KEY, []);
  const created: LocalAuditLog = {
    ...log,
    id: crypto.randomUUID ? crypto.randomUUID() : deterministicId(`${log.action}-${Date.now()}`),
    created_at: new Date().toISOString(),
  };
  all.unshift(created);
  safeWrite(AUDIT_KEY, all);
  return created;
}
