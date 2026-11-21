import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE = 'https://api.elevenlabs.io';
const PORT = process.env.PORT || 3001;

if (!ELEVENLABS_API_KEY) {
  console.warn('WARNING: ELEVENLABS_API_KEY not set. Live transcription/TTS will fail.');
}

// Ensure upload directories exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// Serve uploaded audio files
app.use('/api/uploads/audio', express.static(AUDIO_DIR));

// Multer config for audio uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AUDIO_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/aac'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported audio format'));
  },
});

// ============================================================================
// IN-MEMORY DATA STORES (demo; replace with database in production)
// ============================================================================

let patients = [
  {
    id: 'p1',
    name: 'Rohan Kapoor',
    initials: 'RK',
    age: 34,
    gender: 'Male',
    language: 'Hindi',
    phone: '+91 98765 43210',
    email: 'rohan.kapoor@example.com',
    allergies: ['Penicillin'],
    medicalHistory: ['Hypertension'],
    preferredLanguage: 'Hindi',
    dateOfBirth: '1992-03-15',
    emergencyContact: '+91 98765 43211',
    createdAt: '2026-10-20',
    lastVisit: '12 September 2024',
  },
  {
    id: 'p2',
    name: 'Priya Menon',
    initials: 'PM',
    age: 29,
    gender: 'Female',
    language: 'Malayalam',
    phone: '+91 91234 56789',
    email: 'priya.menon@example.com',
    allergies: [],
    medicalHistory: ['Asthma'],
    preferredLanguage: 'Malayalam',
    dateOfBirth: '1997-07-22',
    emergencyContact: '+91 91234 56790',
    createdAt: '2026-10-21',
    lastVisit: '05 August 2024',
  },
  {
    id: 'p3',
    name: 'Arjun Kumar',
    initials: 'AK',
    age: 41,
    gender: 'Male',
    language: 'Tamil',
    phone: '+91 99887 76655',
    email: 'arjun.kumar@example.com',
    allergies: ['Sulfa drugs'],
    medicalHistory: ['Diabetes type 2'],
    preferredLanguage: 'Tamil',
    dateOfBirth: '1985-11-08',
    emergencyContact: '+91 99887 76656',
    createdAt: '2026-10-20',
    lastVisit: '22 July 2024',
  },
  {
    id: 'p4',
    name: 'Sneha Patil',
    initials: 'SP',
    age: 38,
    gender: 'Female',
    language: 'Marathi',
    phone: '+91 98223 34455',
    email: 'sneha.patil@example.com',
    allergies: [],
    medicalHistory: [],
    preferredLanguage: 'Marathi',
    dateOfBirth: '1988-04-30',
    emergencyContact: '+91 98223 34456',
    createdAt: '2026-10-20',
    lastVisit: '14 June 2024',
  },
  {
    id: 'p5',
    name: 'Meera Shah',
    initials: 'MS',
    age: 34,
    gender: 'Female',
    language: 'Hindi',
    phone: '+91 97654 32109',
    email: 'meera.shah@example.com',
    allergies: ['None reported'],
    medicalHistory: ['Migraine'],
    preferredLanguage: 'Hindi',
    dateOfBirth: '1992-08-14',
    emergencyContact: '+91 97654 32110',
    createdAt: '2026-11-20',
    lastVisit: '01 November 2024',
  },
];

let consultations = [
  {
    id: 'c1',
    patientId: 'p1',
    patientName: 'Rohan Kapoor',
    patientLanguage: 'Hindi',
    type: 'Follow-up consultation',
    date: '21 Nov',
    status: 'Completed',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    transcript: null,
    clinicalNotes: null,
    audioUrl: null,
  },
  {
    id: 'c2',
    patientId: 'p2',
    patientName: 'Priya Menon',
    patientLanguage: 'Malayalam',
    type: 'General consultation',
    date: '21 Nov',
    status: 'Completed',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    transcript: null,
    clinicalNotes: null,
    audioUrl: null,
  },
  {
    id: 'c3',
    patientId: 'p3',
    patientName: 'Arjun Kumar',
    patientLanguage: 'Tamil',
    type: 'General consultation',
    date: '20 Nov',
    status: 'In review',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    transcript: null,
    clinicalNotes: null,
    audioUrl: null,
  },
  {
    id: 'c4',
    patientId: 'p4',
    patientName: 'Sneha Patil',
    patientLanguage: 'Marathi',
    type: 'Follow-up consultation',
    date: '20 Nov',
    status: 'Completed',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    transcript: null,
    clinicalNotes: null,
    audioUrl: null,
  },
];

let prescriptions = [
  {
    id: 'rx1',
    patientId: 'p1',
    patientName: 'Rohan Kapoor',
    doctorId: 'd1',
    doctorName: 'Dr. Ananya Sharma',
    date: '21 Nov 2026',
    status: 'Issued',
    qrToken: 'vaanirx_rx_demo_1',
    audioUrl: null,
    items: [
      {
        id: 'rx1-i1',
        medicineName: 'Paracetamol',
        strength: '500 mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '3 days',
        timing: 'After meals',
        instructions: 'Take after food with water. Avoid alcohol.',
      },
    ],
    approvedAt: '21 Nov 2026',
    approvedBy: 'Dr. Ananya Sharma',
  },
];

let audioFiles = [];

let nextPatientId = patients.length + 1;
let nextConsultationId = consultations.length + 1;
let nextPrescriptionId = prescriptions.length + 1;

// ============================================================================
// PATIENT ENDPOINTS
// ============================================================================

app.get('/api/patients', (_req, res) => {
  res.json(patients.map((p) => ({ ...p })));
});

app.get('/api/patients/:id', (req, res) => {
  const p = patients.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Patient not found' });
  res.json({ ...p });
});

app.post('/api/patients', (req, res) => {
  const { name, age, gender, language, phone, email, dateOfBirth, allergies, medicalHistory, preferredLanguage, emergencyContact } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const patient = {
    id: 'p' + nextPatientId++,
    name,
    initials: name.split(' ').map(function(n) { return n[0]; }).join(''),
    age: Number(age) || 0,
    gender: gender || 'Male',
    language: language || 'English',
    phone: phone || '',
    email: email || '',
    allergies: Array.isArray(allergies) ? allergies : [],
    medicalHistory: Array.isArray(medicalHistory) ? medicalHistory : [],
    preferredLanguage: preferredLanguage || language || 'English',
    dateOfBirth: dateOfBirth || '',
    emergencyContact: emergencyContact || '',
    createdAt: new Date().toISOString().slice(0, 10),
    lastVisit: '',
  };
  patients.push(patient);
  res.status(201).json(patient);
});

app.patch('/api/patients/:id', (req, res) => {
  const idx = patients.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Patient not found' });
  patients[idx] = Object.assign({}, patients[idx], req.body, { id: req.params.id });
  res.json(patients[idx]);
});

// ============================================================================
// CONSULTATION ENDPOINTS
// ============================================================================

app.get('/api/consultations', (_req, res) => {
  res.json(consultations.map((c) => ({ ...c })));
});

app.get('/api/consultations/patient/:patientId', (req, res) => {
  const patientConsultations = consultations.filter(function(c) { return c.patientId === req.params.patientId; });
  res.json(patientConsultations.map(function(c) { return { ...c }; }));
});

app.get('/api/consultations/:id', (req, res) => {
  const c = consultations.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Consultation not found' });
  res.json({ ...c });
});

app.post('/api/consultations', (req, res) => {
  const { patientId, patientName, patientLanguage, type, doctorId, doctorName, transcript, clinicalNotes, audioUrl } = req.body;
  if (!patientId || !patientName) {
    return res.status(400).json({ error: 'patientId and patientName are required' });
  }

  const consultation = {
    id: 'c' + nextConsultationId++,
    patientId,
    patientName,
    patientLanguage: patientLanguage || 'English',
    type: type || 'General consultation',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    status: 'Completed',
    doctorId: doctorId || 'd1',
    doctorName: doctorName || 'Dr. Ananya Sharma',
    transcript: transcript || null,
    clinicalNotes: clinicalNotes || null,
    audioUrl: audioUrl || null,
  };
  consultations.push(consultation);
  res.status(201).json(consultation);
});

app.put('/api/consultations/:id', (req, res) => {
  const idx = consultations.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Consultation not found' });
  consultations[idx] = Object.assign({}, consultations[idx], req.body, { id: req.params.id });
  res.json(consultations[idx]);
});

// ============================================================================
// PRESCRIPTION ENDPOINTS
// ============================================================================

app.get('/api/prescriptions', (_req, res) => {
  res.json(prescriptions.map(function(p) { return { ...p }; }));
});

app.get('/api/prescriptions/patient/:patientId', (req, res) => {
  const patientPrescriptions = prescriptions.filter(function(p) { return p.patientId === req.params.patientId; });
  res.json(patientPrescriptions.map(function(p) { return { ...p }; }));
});

app.get('/api/prescriptions/:id', (req, res) => {
  const p = prescriptions.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Prescription not found' });
  res.json({ ...p });
});

app.get('/api/prescriptions/qr/:token', (req, res) => {
  const p = prescriptions.find((x) => x.qrToken === req.params.token);
  if (!p) return res.status(404).json({ error: 'Invalid or expired QR token' });
  res.json({ ...p });
});

app.post('/api/prescriptions', (req, res) => {
  const { patientId, patientName, doctorId, doctorName, items } = req.body;
  if (!patientId || !patientName || !doctorId || !doctorName || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'patientId, patientName, doctorId, doctorName, and items are required' });
  }

  const qrToken = 'vaanirx_rx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  const prescription = {
    id: 'rx' + nextPrescriptionId++,
    patientId,
    patientName,
    doctorId,
    doctorName,
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'Issued',
    qrToken,
    audioUrl: null,
    items: items.map(function(item, index) {
      return {
        id: 'item-' + Date.now() + '-' + index,
        medicineName: item.medicineName || '',
        strength: item.strength || '',
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        duration: item.duration || '',
        timing: item.timing || '',
        instructions: item.instructions || '',
      };
    }),
    approvedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    approvedBy: doctorName,
  };
  prescriptions.push(prescription);
  res.status(201).json(prescription);
});

app.patch('/api/prescriptions/:id', (req, res) => {
  const idx = prescriptions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Prescription not found' });
  prescriptions[idx] = Object.assign({}, prescriptions[idx], req.body, { id: req.params.id });
  res.json(prescriptions[idx]);
});

// ============================================================================
// AUDIO UPLOAD ENDPOINT
// ============================================================================

app.post('/api/audio/upload', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file provided' });

  const audioFile = {
    id: 'audio-' + Date.now(),
    originalName: req.file.originalname,
    filename: req.file.filename,
    url: '/api/uploads/audio/' + req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date().toISOString(),
  };
  audioFiles.push(audioFile);
  res.status(201).json(audioFile);
});

app.get('/api/audio/:id', (req, res) => {
  const audio = audioFiles.find(function(a) { return a.id === req.params.id; });
  if (!audio) return res.status(404).json({ error: 'Audio not found' });
  res.json(audio);
});

// ============================================================================
// HEALTH
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', demo: !ELEVENLABS_API_KEY });
});

// Proxy: Get available models
app.get('/api/elevenlabs/models', async (_req, res) => {
  try {
    const resp = await fetch(`${ELEVENLABS_BASE}/v1/models`, {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch models' });
  }
});

// Proxy: TTS (text-to-speech) using ElevenLabs Flash v2.5
app.post('/api/elevenlabs/tts', async (req, res) => {
  try {
    const { text, voiceId, modelId = 'eleven_flash_v2_5', languageCode } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const url = `${ELEVENLABS_BASE}/v1/text-to-speech/${voiceId || 'EXAVITQu4vr4xnSDxMaL'}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        language_code: languageCode,
        output_format: 'mp3_44100_128',
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const buffer = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).json({ error: 'TTS generation failed' });
  }
});

// WebSocket proxy for ElevenLabs Scribe real-time transcription
app.use((req, res, next) => {
  if (req.url === '/ws/scribe') next();
  else res.status(404).json({ error: 'Not found' });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws/scribe' });

wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
================================================================================
VaaniRx backend could not start: Port ${PORT} is already in use.

Another process is already running on port ${PORT}. This usually means:

1. The VaaniRx backend is already running (e.g. from a previous terminal session).
   You do not need to start it again. Verify with:
     curl http://localhost:${PORT}/api/health

2. A different application is using port ${PORT}. Either stop that process or
   set a different port in server/.env:
     PORT=3002

Then restart with:  cd server && npm run dev
================================================================================
`);
  } else {
    console.error('VaaniRx WebSocket server error:', err.message);
  }
  process.exit(1);
});

wss.on('connection', (clientWs, req) => {
  if (!ELEVENLABS_API_KEY) {
    clientWs.send(JSON.stringify({ error: 'ElevenLabs API key not configured on server' }));
    clientWs.close();
    return;
  }

  const scribeUrl = new URL('wss://api.elevenlabs.io/v1/scribe/stream');
  scribeUrl.searchParams.set('model_id', 'scribe_v1');
  scribeUrl.searchParams.set('diarize', 'true');

  let upstreamWs;
  try {
    upstreamWs = new WebSocket(scribeUrl.toString(), {
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });
  } catch (err) {
    clientWs.send(JSON.stringify({ error: 'Failed to connect to transcription service' }));
    clientWs.close();
    return;
  }

  upstreamWs.on('open', () => {
    clientWs.send(JSON.stringify({ type: 'connected', message: 'Transcription session started' }));
  });

  upstreamWs.on('message', (data) => {
    clientWs.send(data);
  });

  upstreamWs.on('error', (err) => {
    clientWs.send(JSON.stringify({ type: 'error', message: err.message }));
  });

  upstreamWs.on('close', () => {
    clientWs.send(JSON.stringify({ type: 'closed' }));
    clientWs.close();
  });

  clientWs.on('message', (data) => {
    if (upstreamWs.readyState === WebSocket.OPEN) {
      upstreamWs.send(data);
    }
  });

  clientWs.on('close', () => {
    if (upstreamWs && upstreamWs.readyState === WebSocket.OPEN) upstreamWs.close();
  });

  clientWs.on('error', () => {
    if (upstreamWs && upstreamWs.readyState === WebSocket.OPEN) upstreamWs.close();
  });
});

httpServer.listen(PORT, () => {
  console.log('VaaniRx server running on http://localhost:' + PORT);
  console.log('Demo mode: ' + !ELEVENLABS_API_KEY);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
================================================================================
VaaniRx server could not start: Port ${PORT} is already in use.

Another process is already running on port ${PORT}. Verify with:
  curl http://localhost:${PORT}/api/health

Or set a different port in server/.env:
  PORT=3002
================================================================================
`);
  } else {
    console.error('VaaniRx server failed to start:', err.message);
  }
  process.exit(1);
});
