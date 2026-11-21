import { DEMO_MODE } from '@/lib/config';
import {
  type Consultation,
  type ClinicalNote,
  type Prescription,
  type Patient,
  DEMO_PATIENTS,
  DEMO_CONSULTATIONS,
  DEMO_PRESCRIPTIONS,
  getDemoPatient,
  getDemoPrescription,
  getPrescriptionByQrToken,
} from '@/lib/demoData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let patients: Patient[] = [...DEMO_PATIENTS];
let consultations: Consultation[] = [...DEMO_CONSULTATIONS];
let prescriptions: Prescription[] = [...DEMO_PRESCRIPTIONS];
let notes: Record<string, ClinicalNote> = {};

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

async function request(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  return resp.json();
}

// Local in-memory fallback (demo mode, no backend)
export const api = {
  async getPatients() {
    if (API_BASE) return request('/patients');
    await delay();
    return [...patients];
  },
  async getPatient(id: string) {
    if (API_BASE) return request(`/patients/${id}`);
    await delay();
    const p = getDemoPatient(id);
    if (!p) throw new Error('Patient not found');
    return { ...p };
  },
  async addPatient(data: Omit<Patient, 'id' | 'createdAt'>) {
    if (API_BASE) return request('/patients', { method: 'POST', body: JSON.stringify(data) });
    await delay();
    const patient: Patient = {
      ...data,
      id: `p${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    patients.push(patient);
    return patient;
  },
  async updatePatient(id: string, data: Partial<Patient>) {
    if (API_BASE) return request(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    await delay();
    const idx = patients.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Patient not found');
    patients[idx] = { ...patients[idx], ...data };
    return patients[idx];
  },
  async getConsultations() {
    if (API_BASE) return request('/consultations');
    await delay();
    return [...consultations];
  },
  async getConsultation(id: string) {
    if (API_BASE) return request(`/consultations/${id}`);
    await delay();
    const c = consultations.find((x) => x.id === id);
    if (!c) throw new Error('Consultation not found');
    return { ...c };
  },
  async saveConsultation(data: Partial<Consultation> & { id?: string }) {
    if (API_BASE) {
      const method = data.id ? 'PUT' : 'POST';
      return request(`/consultations${data.id ? `/${data.id}` : ''}`, { method, body: JSON.stringify(data) });
    }
    await delay();
    if (data.id) {
      const idx = consultations.findIndex((c) => c.id === data.id);
      if (idx === -1) throw new Error('Consultation not found');
      consultations[idx] = { ...consultations[idx], ...data };
      return consultations[idx];
    }
    const consultation: Consultation = {
      id: `c${Date.now()}`,
      patientId: '',
      patientName: '',
      patientLanguage: 'English',
      type: 'General consultation',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      status: 'In review',
      ...data,
    };
    consultations.push(consultation);
    return consultation;
  },
  async getPrescriptions() {
    if (API_BASE) return request('/prescriptions');
    await delay();
    return [...prescriptions];
  },

  // Patient-specific: get prescriptions for a specific patient
  async getPatientPrescriptions(patientId: string) {
    if (API_BASE) return request(`/prescriptions/patient/${patientId}`);
    await delay();
    return DEMO_PRESCRIPTIONS.filter((p) => p.patientId === patientId);
  },

  // Patient-specific: get consultations for a specific patient
  async getPatientConsultations(patientId: string) {
    if (API_BASE) return request(`/consultations/patient/${patientId}`);
    await delay();
    return DEMO_CONSULTATIONS.filter((c) => c.patientId === patientId);
  },

  async getPrescription(id: string) {
    if (API_BASE) return request(`/prescriptions/${id}`);
    await delay();
    const p = getDemoPrescription(id);
    if (!p) throw new Error('Prescription not found');
    return { ...p };
  },

  async getPrescriptionByQrToken(token: string) {
    if (API_BASE) return request(`/prescriptions/qr/${token}`);
    await delay();
    const p = getPrescriptionByQrToken(token);
    if (!p) throw new Error('Invalid or expired QR token');
    return { ...p };
  },

  async issuePrescription(data: Omit<Prescription, 'id' | 'date' | 'status' | 'qrToken'>) {
    if (API_BASE) return request('/prescriptions', { method: 'POST', body: JSON.stringify(data) });
    await delay();
    const prescription: Prescription = {
      ...data,
      id: `rx${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Issued',
      qrToken: `vaanirx_rx_${Date.now()}`,
    };
    prescriptions.push(prescription);
    return prescription;
  },

  // Audio upload
  async uploadAudio(file: File) {
    if (API_BASE) {
      const formData = new FormData();
      formData.append('audio', file);
      const resp = await fetch(`${API_BASE}/audio/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) throw new Error('Audio upload failed');
      return resp.json();
    }
    await delay();
    return { id: `audio-${Date.now()}`, url: '/assets/audio/demo-prescription-1.mp3', demo: true };
  },

  async getAudio(id: string) {
    if (API_BASE) return request(`/audio/${id}`);
    await delay();
    return { id, url: '/assets/audio/demo-prescription-1.mp3', demo: true };
  },
  async saveClinicalNote(consultationId: string, note: Partial<ClinicalNote>) {
    if (API_BASE) return request(`/consultations/${consultationId}/notes`, { method: 'POST', body: JSON.stringify(note) });
    await delay();
    notes[consultationId] = {
      id: `note-${consultationId}`,
      consultationId,
      requiresDoctorReview: true,
      notes: '',
      status: 'Draft',
      ...note,
    };
    return notes[consultationId];
  },
  async getClinicalNote(consultationId: string) {
    if (API_BASE) return request(`/consultations/${consultationId}/notes`);
    await delay();
    return notes[consultationId] || null;
  },

  async patch(path: string, body: any) {
    if (API_BASE) {
      const resp = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('Patch failed');
      return resp.json();
    }
    await delay();
    return { success: true, demo: true };
  },
};

// Real-time transcription via WebSocket to backend (proxies ElevenLabs Scribe)
export interface TranscriptEvent {
  type: 'connected' | 'transcript' | 'error' | 'closed';
  transcript?: string;
  translation?: string;
  language?: string;
  speaker?: string;
  isFinal?: boolean;
  message?: string;
  demo?: boolean;
}

export function createTranscriptionSession(options: { language?: string; onEvent: (event: TranscriptEvent) => void }) {
  const { onEvent, language } = options;

  if (DEMO_MODE && !API_BASE) {
    // Demo mode: simulate a transcript after a short delay
    let simulated = false;
    const timer = setTimeout(() => {
      if (!simulated) {
        simulated = true;
        onEvent({
          type: 'transcript',
          transcript: "Mujhe kal se sar dard ho raha hai.",
          translation: "I have had a headache since yesterday.",
          language: 'Hindi',
          speaker: 'patient',
          isFinal: false,
          demo: true,
        });
      }
    }, 1500);

    return {
      send: (_chunk: ArrayBuffer | Blob) => {
        // ignore audio in demo
      },
      start: () => {
        onEvent({ type: 'connected', message: 'Demo transcription session started', demo: true });
      },
      stop: () => {
        clearTimeout(timer);
        onEvent({ type: 'closed' });
      },
      close: () => {
        clearTimeout(timer);
      },
    };
  }

  // Live mode: connect to backend WebSocket
  const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/ws/scribe`;
  const ws = new WebSocket(wsUrl);

  let started = false;

  ws.onopen = () => {
    started = true;
    onEvent({ type: 'connected', message: 'Transcription session started' });
    // Send configuration
    ws.send(JSON.stringify({
      model_id: 'scribe_v1',
      language_code: language || 'en',
      diarize: true,
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string);
      onEvent(data);
    } catch {
      onEvent({ type: 'transcript', transcript: event.data as string });
    }
  };

  ws.onerror = () => {
    onEvent({ type: 'error', message: 'Transcription connection error' });
  };

  ws.onclose = () => {
    onEvent({ type: 'closed' });
  };

  return {
    send: (chunk: ArrayBuffer | Blob) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    },
    start: () => {
      if (!started && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          model_id: 'scribe_v1',
          language_code: language || 'en',
          diarize: true,
        }));
      }
    },
    stop: () => {
      ws.close();
    },
    close: () => {
      ws.close();
    },
  };
}

// TTS via backend (keeps API key server-side)
export async function generateTts(text: string, options: { language?: string; voiceId?: string }) {
  if (DEMO_MODE && !API_BASE) {
    await delay(600);
    return { audioUrl: '/assets/audio/demo-prescription-1.mp3', demo: true };
  }
  const resp = await fetch(`${API_BASE}/elevenlabs/tts`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      language_code: options.language,
      voice_id: options.voiceId,
    }),
  });
  if (!resp.ok) throw new Error('TTS generation failed');
  const blob = await resp.blob();
  return { audioUrl: URL.createObjectURL(blob), demo: false };
}

export { DEMO_MODE };
