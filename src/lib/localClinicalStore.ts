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

const ACCOUNTS_KEY = "medvision_local_accounts_v1";
const ACTIVE_USER_KEY = "medvision_active_local_user_v1";
const PATIENTS_KEY = "medvision_local_patients_v1";
const ANALYSES_KEY = "medvision_local_analyses_v1";
const AUDIT_KEY = "medvision_local_audit_v1";

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

export function ensureSeedClinicalData(userId: string): void {
  let userPatients = getLocalPatients(userId);
  if (userPatients.length === 0) {
    const p1 = addLocalPatient({
      created_by: userId,
      patient_name: "Kwame Boateng",
      gender: "Male",
      age: 58,
      notes: "Persistent cough, referred for axial chest CT nodule evaluation.",
    });
    const p2 = addLocalPatient({
      created_by: userId,
      patient_name: "Ama Osei",
      gender: "Female",
      age: 34,
      notes: "Acute febrile respiratory presentation, routine PA chest radiograph.",
    });
    const p3 = addLocalPatient({
      created_by: userId,
      patient_name: "Kofi Mensah",
      gender: "Male",
      age: 63,
      notes: "Annual thoracic oncology follow-up study.",
    });
    userPatients = [p1, p2, p3];
  }

  const userAnalyses = getLocalAnalyses(userId);
  if (userAnalyses.length === 0 && userPatients.length >= 2) {
    const now = Date.now();
    const allAnalyses = safeRead<LocalAnalysis[]>(ANALYSES_KEY, []);
    const seeded: LocalAnalysis[] = [
      {
        id: deterministicId(`${userId}-seed-ct-1`),
        user_id: userId,
        patient_id: userPatients[0]?.id ?? null,
        image_path: "local/ct_axial_slice_014.png",
        original_filename: "ct_axial_slice_014.png",
        modality: "ct",
        prediction: "Adenocarcinoma",
        confidence: 92.4,
        findings: JSON.stringify({
          modality: "ct",
          class_probabilities: {
            Adenocarcinoma: 92.4,
            "Large Cell Carcinoma": 4.1,
            Normal: 1.7,
            "Squamous Cell Carcinoma": 1.8,
          },
          notes: "Subpleural right upper lobe nodular opacity noted.",
        }),
        model_used: "Chest CT Oncology Classifier",
        created_at: new Date(now - 1000 * 60 * 45).toISOString(),
      },
      {
        id: deterministicId(`${userId}-seed-xray-1`),
        user_id: userId,
        patient_id: userPatients[1]?.id ?? null,
        image_path: "local/cxr_pa_study_204.png",
        original_filename: "cxr_pa_study_204.png",
        modality: "xray",
        prediction: "Bacterial",
        confidence: 94.8,
        findings: JSON.stringify({
          modality: "xray",
          class_probabilities: {
            Bacterial: 94.8,
            Normal: 1.9,
            Viral: 3.3,
          },
          notes: "Focal right lower lobe airspace consolidation.",
        }),
        model_used: "Chest X-Ray Pneumonia Classifier",
        created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: deterministicId(`${userId}-seed-ct-2`),
        user_id: userId,
        patient_id: userPatients[2]?.id ?? userPatients[0]?.id ?? null,
        image_path: "local/ct_thorax_screening_089.png",
        original_filename: "ct_thorax_screening_089.png",
        modality: "ct",
        prediction: "Normal",
        confidence: 97.6,
        findings: JSON.stringify({
          modality: "ct",
          class_probabilities: {
            Adenocarcinoma: 0.9,
            "Large Cell Carcinoma": 0.7,
            Normal: 97.6,
            "Squamous Cell Carcinoma": 0.8,
          },
          notes: "Unremarkable bilateral lung parenchyma.",
        }),
        model_used: "Chest CT Oncology Classifier",
        created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      },
      {
        id: deterministicId(`${userId}-seed-xray-2`),
        user_id: userId,
        patient_id: userPatients[1]?.id ?? null,
        image_path: "local/cxr_followup_112.png",
        original_filename: "cxr_followup_112.png",
        modality: "xray",
        prediction: "Normal",
        confidence: 96.2,
        findings: JSON.stringify({
          modality: "xray",
          class_probabilities: {
            Bacterial: 1.8,
            Normal: 96.2,
            Viral: 2.0,
          },
          notes: "Interval resolution of consolidation, clear costophrenic angles.",
        }),
        model_used: "Chest X-Ray Pneumonia Classifier",
        created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
      },
    ];
    safeWrite(ANALYSES_KEY, [...seeded, ...allAnalyses]);

    const allLogs = safeRead<LocalAuditLog[]>(AUDIT_KEY, []);
    if (allLogs.filter((l) => l.user_id === userId).length === 0) {
      safeWrite(AUDIT_KEY, [
        {
          id: deterministicId(`${userId}-log-1`),
          user_id: userId,
          action: "analyze_scan",
          details: { modality: "ct", prediction: "Adenocarcinoma", confidence: 92.4, filename: "ct_axial_slice_014.png" },
          created_at: new Date(now - 1000 * 60 * 45).toISOString(),
        },
        {
          id: deterministicId(`${userId}-log-2`),
          user_id: userId,
          action: "analyze_scan",
          details: { modality: "xray", prediction: "Bacterial", confidence: 94.8, filename: "cxr_pa_study_204.png" },
          created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
        },
        {
          id: deterministicId(`${userId}-log-3`),
          user_id: userId,
          action: "create_patient",
          details: { name: "Kwame Boateng" },
          created_at: new Date(now - 1000 * 60 * 60 * 28).toISOString(),
        },
        ...allLogs,
      ]);
    }
  }
}

/**
 * Generates a realistic grayscale synthetic medical radiograph or axial CT slice File
 * so clinicians can test the live FastAPI + TensorFlow inference and Grad-CAM pipeline
 * in one click without needing a local DICOM/PNG on disk.
 */
export async function generateSampleScanFile(modality: "xray" | "ct"): Promise<File> {
  const size = 224;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Pure grayscale background (R=G=B so looks_like_medical_scan passes 100%)
  ctx.fillStyle = "rgb(14, 14, 14)";
  ctx.fillRect(0, 0, size, size);

  if (modality === "xray") {
    // Thoracic ribcage silhouette
    const bodyGrad = ctx.createRadialGradient(112, 118, 20, 112, 118, 104);
    bodyGrad.addColorStop(0, "rgb(175, 175, 175)");
    bodyGrad.addColorStop(0.75, "rgb(110, 110, 110)");
    bodyGrad.addColorStop(1, "rgb(20, 20, 20)");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(112, 118, 92, 98, 0, 0, Math.PI * 2);
    ctx.fill();

    // Right and left radiolucent lung fields
    ctx.fillStyle = "rgb(42, 42, 42)";
    ctx.beginPath();
    ctx.ellipse(78, 112, 32, 62, 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(146, 112, 32, 62, -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Mediastinal & cardiac shadow
    ctx.fillStyle = "rgb(195, 195, 195)";
    ctx.beginPath();
    ctx.ellipse(115, 132, 22, 38, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Rib arcs
    ctx.strokeStyle = "rgba(210, 210, 210, 0.35)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const y = 66 + i * 18;
      ctx.beginPath();
      ctx.arc(78, y + 12, 34, Math.PI * 1.1, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(146, y + 12, 34, Math.PI * 1.15, Math.PI * 1.9);
      ctx.stroke();
    }

    // Subtle right lower lobe consolidation opacity
    const opacityGrad = ctx.createRadialGradient(76, 136, 4, 76, 136, 26);
    opacityGrad.addColorStop(0, "rgba(215, 215, 215, 0.85)");
    opacityGrad.addColorStop(1, "rgba(42, 42, 42, 0)");
    ctx.fillStyle = opacityGrad;
    ctx.beginPath();
    ctx.arc(76, 136, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Axial Chest CT slice: outer thoracic body ring
    ctx.fillStyle = "rgb(145, 145, 145)";
    ctx.beginPath();
    ctx.ellipse(112, 114, 92, 72, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subcutaneous & rib cortex ring
    ctx.strokeStyle = "rgb(225, 225, 225)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(112, 114, 82, 62, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Dark aerated lung parenchyma (left & right axial cross-section)
    ctx.fillStyle = "rgb(26, 26, 26)";
    ctx.beginPath();
    ctx.ellipse(76, 112, 36, 46, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(148, 112, 36, 46, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Vertebral body (posterior spine) and central mediastinal vessels
    ctx.fillStyle = "rgb(235, 235, 235)";
    ctx.beginPath();
    ctx.arc(112, 152, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgb(175, 175, 175)";
    ctx.beginPath();
    ctx.arc(112, 108, 18, 0, Math.PI * 2);
    ctx.fill();

    // Pulmonary vascular branching and focal parenchymal nodule
    const noduleGrad = ctx.createRadialGradient(68, 96, 2, 68, 96, 14);
    noduleGrad.addColorStop(0, "rgb(230, 230, 230)");
    noduleGrad.addColorStop(0.6, "rgb(155, 155, 155)");
    noduleGrad.addColorStop(1, "rgba(26, 26, 26, 0)");
    ctx.fillStyle = noduleGrad;
    ctx.beginPath();
    ctx.arc(68, 96, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      const filename =
        modality === "ct" ? "sample_chest_ct_axial.png" : "sample_chest_xray_pa.png";
      resolve(new File([blob!], filename, { type: "image/png" }));
    }, "image/png");
  });
}
