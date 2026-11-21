import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Asset } from '@/components/Asset';
import { DEMO_MODE } from '@/lib/config';
import { api, createTranscriptionSession, generateTts } from '@/lib/api';
import { LANGUAGES, type Patient } from '@/lib/demoData';
import { extractClinicalInfo, formatExtractionForNotes } from '@/lib/clinicalExtraction';

const A = '/assets';

type Overlay =
  | null
  | { kind: 'metric'; title: string; value: string; description: string }
  | { kind: 'register' };

const metrics = [
  {
    title: 'Total Patients',
    value: '1,284',
    change: '+12.8%',
    note: 'vs. last month',
    icon: '83f40.svg',
    description: 'Your patient directory grew by 146 patients in the last 30 days.',
  },
  {
    title: 'Today’s Consultations',
    value: '24',
    change: '+6',
    note: 'vs. yesterday',
    icon: 'a8ebd.svg',
    description: '18 consultations are complete and 6 remain on today’s schedule.',
  },
  {
    title: 'Prescriptions Generated',
    value: '186',
    change: '+18.2%',
    note: 'this month',
    icon: '2b341.svg',
    description: 'Three prescriptions are waiting for your review and approval.',
  },
  {
    title: 'Time Saved',
    value: '42.5 hrs',
    change: '+8.4 hrs',
    note: 'this month',
    icon: '06327.svg',
    description: 'Estimated time saved through transcription and assisted documentation.',
  },
];

const patients = [
  ['RK', 'Rohan Kapoor', 'Follow-up consultation', 'Hindi', '21 Nov', 'Completed'],
  ['PM', 'Priya Menon', 'General consultation', 'Malayalam', '21 Nov', 'Completed'],
  ['AK', 'Arjun Kumar', 'General consultation', 'Tamil', '20 Nov', 'In review'],
  ['SP', 'Sneha Patil', 'Follow-up consultation', 'Marathi', '20 Nov', 'Completed'],
];

const languages = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Marathi'];
const wave = [5, 9, 6, 16, 25, 12, 21, 33, 20, 11, 27, 36, 18, 30, 21, 9, 18, 28, 12, 33, 20, 14, 23, 8, 17, 29, 12, 7, 17, 23, 10, 6, 11, 6, 3];

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="close-button" onClick={onClick} aria-label="Close">
      ×
    </button>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('English');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [demoPatients, setDemoPatients] = useState<Patient[]>([]);

  useEffect(() => {
    api.getPatients().then(setDemoPatients);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  if (consultationOpen && selectedPatient) {
    return (
      <ConsultationScreen
        patientId={selectedPatient}
        language={language}
        setLanguage={setLanguage}
        onBack={() => {
          setConsultationOpen(false);
          setSelectedPatient(null);
        }}
      />
    );
  }

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> DOCTOR WORKSPACE</div>
            <h1>Welcome back, Doctor</h1>
            <p>A little less paperwork. A lot more patient care.</p>
          </div>
          <div className="welcome-actions">
            <button className="secondary-action register" onClick={() => setOverlay({ kind: 'register' })}>
              <span>＋</span> Register Patient
            </button>
            <button className="primary-action" onClick={() => setConsultationOpen(true)}>
              <span>＋</span> Start New Consultation
            </button>
          </div>
        </div>

        <div className="metrics">
          {metrics.map((metric) => (
            <button
              key={metric.title}
              className="metric-card"
              onClick={() => setOverlay({ kind: 'metric', ...metric })}
            >
              <span className="metric-title">{metric.title}</span>
              <span className="metric-icon"><Asset name={metric.icon} /></span>
              <strong>{metric.value}</strong>
              <span className="metric-foot"><b>{metric.change}</b> {metric.note}</span>
              <span className="card-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="consultation-grid">
          <section className="card recent">
            <div className="card-heading">
              <div><h2>Recent Consultations</h2><p>Your latest patient conversations</p></div>
              <button onClick={() => navigate('/doctor/consultations')}>View all</button>
            </div>
            <div className="table">
              <div className="table-head"><span>Patient</span><span>Language</span><span>Date</span><span>Status</span></div>
              {demoPatients.length ? demoPatients.map((p) => (
                <button className="table-row" key={p.id} onClick={() => setSelectedPatient(p.id)}>
                  <span className="patient"><i>{p.initials}</i><span><strong>{p.name}</strong><small>{p.language}</small></span></span>
                  <span>{p.language}</span><span>{p.lastVisit || p.createdAt}</span>
                  <span><em className={p.medicalHistory.length ? 'review' : ''}>Completed</em></span>
                </button>
              )) : patients.map(([initials, name, type, patientLanguage, date, status]) => (
                <button className="table-row" key={name} onClick={() => showToast(`${name}'s consultation opened`)}>
                  <span className="patient"><i>{initials}</i><span><strong>{name}</strong><small>{type}</small></span></span>
                  <span>{patientLanguage}</span><span>{date}</span>
                  <span><em className={status === 'In review' ? 'review' : ''}>{status}</em></span>
                </button>
              ))}
            </div>
          </section>

          <button className="live-card" onClick={() => setConsultationOpen(true)} aria-label="Open live consultation">
            <div className="live-heading"><h2>Live Consultation</h2><span><i /> REC</span></div>
            <p>Listening. Understanding. Caring.</p>
            <div className="live-patient">
              <span className="dark-avatar">MS</span>
              <span><strong>Meera Shah</strong><small>Hindi ↔ {language}</small></span>
              <time>04:32</time>
            </div>
            <div className="waveform">
              {wave.map((height, index) => <i key={index} style={{ height }} />)}
            </div>
            <div className="transcribing"><i /> Vaani AI is transcribing live</div>
            <blockquote>“I have had a headache since yesterday.”</blockquote>
            <div className="live-footer"><span><Asset name="2b5c8.svg" /> Private & encrypted</span><strong>Open session →</strong></div>
          </button>
        </div>

        <div className="analytics-grid">
          <section className="card weekly">
            <div className="chart-heading">
              <div><h2>Weekly consultations</h2><strong>148</strong><span>↗ 18.4%</span><small>vs. last week</small></div>
              <button>This week⌄</button>
            </div>
            <div className="chart">
              <span className="axis a40">40</span><span className="axis a20">20</span><span className="axis a0">0</span>
              <div className="gridline g1" /><div className="gridline g2" /><div className="gridline g3" />
              <Asset name="a3865.svg" className="chart-area" />
              <Asset name="ed80e.svg" className="chart-line" />
              <div className="day-labels">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
            </div>
          </section>
          <section className="card language-card">
            <h2>Language distribution</h2>
            <p>Every patient. Their own language.</p>
            <div className="language-body">
              <div className="donut"><span><b>08</b><small>languages</small></span></div>
              <div className="legend">
                {[['Hindi', '42%'], ['English', '28%'], ['Tamil', '18%'], ['Other', '12%']].map(([name, percent], index) => (
                  <div key={name}><i className={`c${index}`} /><span>{name}</span><strong>{percent}</strong></div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="quick-actions">
          <span>Quick actions</span>
          <button onClick={() => setConsultationOpen(true)}><Asset name="e70ef.svg" /> Start New Consultation</button>
          <button className="register-quick" onClick={() => setOverlay({ kind: 'register' })}><Asset name="5c937.svg" /> Register New Patient</button>
          <button onClick={() => navigate('/doctor/prescriptions')}> <Asset name="b59b4.svg" /> View Prescriptions <b>3</b></button>
          <small>{DEMO_MODE ? 'Demo mode active' : 'Live mode'}<Asset name="0f139.svg" /></small>
        </div>
      </section>

      {overlay && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOverlay(null)}>
          {overlay.kind === 'register' ? (
            <RegisterModal onClose={() => setOverlay(null)} onSuccess={() => { setOverlay(null); showToast('Patient registered successfully'); api.getPatients().then(setDemoPatients); }} />
          ) : (
            <MetricDetailModal overlay={overlay} onClose={() => setOverlay(null)} onView={() => { setOverlay(null); showToast(`${overlay.title} details opened`); }} />
          )}
        </div>
      )}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !phone || !dob) {
      setError('Please fill all required fields');
      return;
    }
    register('patient', { name, phone, dob, language });
    onSuccess();
  };

  return (
    <form className="modal registration" onSubmit={handleSubmit}>
      <CloseButton onClick={onClose} />
      <div className="modal-icon"><Asset name="45d6d.svg" /></div>
      <h2>Register a new patient</h2>
      <p>Add the essentials now. Clinical details can be completed during consultation.</p>
      <div className="form-grid">
        <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Patient’s full name" /></label>
        <label>Mobile number<input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
        <label>Date of birth<input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></label>
        <label>Preferred language<select value={language} onChange={(e) => setLanguage(e.target.value)}>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      {error && <p className="auth-error">{error}</p>}
      <div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Register Patient</button></div>
    </form>
  );
}

function MetricDetailModal({ overlay, onClose, onView }: { overlay: any; onClose: () => void; onView: () => void }) {
  return (
    <div className="modal metric-detail">
      <CloseButton onClick={onClose} />
      <span className="detail-label">{overlay.title}</span>
      <strong>{overlay.value}</strong>
      <p>{overlay.description}</p>
      {overlay.title === 'Prescriptions Generated' && (
        <div className="approval-notice"><Asset name="2b341.svg" /><span><strong>3 awaiting approval</strong><small>Review pending prescriptions before they are sent.</small></span></div>
      )}
      <button className="primary-action" onClick={onView}>View full details</button>
    </div>
  );
}

function ConsultationScreen({
  patientId,
  language,
  setLanguage,
  onBack,
}: {
  patientId: string;
  language: string;
  setLanguage: (value: string) => void;
  onBack: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; translation: string; language: string; isFinal: boolean }>>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('Chief complaint:\n\nSeverity:\n\nAssessment:\n\nPlan:\n');
  const [latestExtraction, setLatestExtraction] = useState<ReturnType<typeof extractClinicalInfo> | null>(null);
  const [session, setSession] = useState<ReturnType<typeof createTranscriptionSession> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const patient = {
    name: 'Meera Shah',
    initials: 'MS',
    age: 34,
    gender: 'Female' as const,
    language: 'Hindi' as const,
    lastVisit: '12 September 2024',
    allergies: ['None reported'],
    medicalHistory: ['Migraine'],
  };

  const addLine = (speaker: string, text: string, translation: string, lang: string, isFinal: boolean) => {
    setTranscript((prev) => {
      const next = [...prev];
      if (isFinal && next.length > 0 && next[next.length - 1].speaker === speaker && !next[next.length - 1].isFinal) {
        next[next.length - 1] = { speaker, text, translation, language: lang, isFinal: true };
      } else {
        next.push({ speaker, text, translation, language: lang, isFinal });
      }
      return next;
    });
    if (isFinal && speaker === 'patient') {
      const extraction = extractClinicalInfo(text);
      setLatestExtraction(extraction);
      setClinicalNotes((prev) => prev + '\n\n-- AI Extraction --\n' + formatExtractionForNotes(extraction));
    }
  };

  const startRecording = async () => {
    setError('');
    setConnectionStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      const transcription = createTranscriptionSession({
        language,
        onEvent: (event) => {
          if (event.type === 'connected') {
            setConnectionStatus('connected');
            setRecording(true);
            mediaRecorderRef.current?.start(250);
          } else if (event.type === 'transcript') {
            addLine(event.speaker || 'patient', event.transcript || '', event.translation || '', event.language || language, event.isFinal || false);
          } else if (event.type === 'error') {
            setConnectionStatus('error');
            setError(event.message || 'Transcription error');
          } else if (event.type === 'closed') {
            setConnectionStatus('idle');
            setRecording(false);
          }
        },
      });
      setSession(transcription);
      transcription.start();

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
        if (session && session.send) session.send(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        audioChunksRef.current = [];
      };
    } catch (err) {
      setConnectionStatus('error');
      setError('Microphone access denied or unavailable');
    }
  };

  const stopRecording = () => {
    if (session) {
      session.stop();
      setSession(null);
    }
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setConnectionStatus('idle');
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (session && language) {
      session.start();
    }
  }, [language, session]);

  return (
    <div className="consultation-page">
      <header>
        <button className="back-button" onClick={onBack}>←</button>
        <div className="brand mini"><span><i /><i /><i /><i /></span><strong>VaaniRx</strong></div>
        <div className="consult-title"><span className="live-dot" /><span><strong>Live consultation</strong><small>{patient.name} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></span></div>
        <label className="language-select">
          <span>Consultation language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languages.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="doctor-indicator"><span className="avatar">AS</span><span><strong>Dr. Ananya Sharma</strong><small>DOCTOR</small></span></div>
        <div className="conn-status">
          <span className={`conn-dot ${connectionStatus}`} />
          <span className="conn-label">{connectionStatus === 'connected' ? 'Live transcription' : connectionStatus === 'error' ? 'Connection error' : connectionStatus === 'connecting' ? 'Connecting…' : 'Idle'}</span>
        </div>
      </header>
      <main>
        <section className="patient-panel">
          <div className="panel-label">PATIENT</div>
          <div className="patient-hero"><span className="patient-avatar">{patient.initials}</span><div><h1>{patient.name}</h1><p>{patient.age} years · {patient.gender}</p><span>{patient.language} ↔ {language}</span></div></div>
          <div className="patient-facts"><div><span>Chief concern</span><strong>Headache since yesterday</strong></div><div><span>Last visit</span><strong>{patient.lastVisit}</strong></div><div><span>Known allergies</span><strong>{patient.allergies[0]}</strong></div></div>
          <button onClick={() => navigate(`/doctor/patients/${patientId}`)}>Open patient record ↗</button>
        </section>
        <section className="transcript-panel">
          <div className="transcript-head"><div><span className="live-dot" /><span><h2>Live transcript</h2><p>Vaani AI is listening and translating</p></span></div><span className="secure"><Asset name="2b5c8.svg" /> Private & encrypted</span></div>
          <div className="big-wave">
            {recording ? [...wave, ...wave.slice(5, 28)].map((h, i) => <i key={i} style={{ height: h * 1.25 }} />) : wave.map((h, i) => <i key={i} style={{ height: h }} />)}
          </div>
          {error && <div className="transcript-error">{error}</div>}
          <div className="transcript">
            {transcript.length === 0 && !recording && !error && (
              <div style={{ color: '#728292', fontSize: '9px', textAlign: 'center', padding: '40px' }}>Start consultation to begin live transcription.</div>
            )}
            {transcript.map((line, idx) => {
              const isDoctor = line.speaker === 'doctor' || line.speaker === 'AS';
              return (
                <div key={idx} className={`patient-line ${isDoctor ? 'doctor-line' : ''} ${line.isFinal ? '' : 'active'}`}>
                  <span>{isDoctor ? 'AS' : 'MS'}</span>
                  <p>
                    <b>{isDoctor ? `You · ${language}` : `${patient.name} · ${line.language}`}</b>{line.text}
                    <small>{line.translation}</small>
                  </p>
                </div>
              );
            })}
          </div>
          <div className="consult-controls">
            <button
              className={`consult-btn ${recording ? 'recording' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={connectionStatus === 'error'}
            >
              {recording ? '■ Stop transcription' : '▶ Start transcription'}
            </button>
            <button onClick={onBack}>End consultation</button>
          </div>
        </section>
        <aside className="notes-panel">
          <div className="panel-label">DOCTOR NOTES</div>
          <h2>Clinical notes</h2>
          <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} />
          {latestExtraction && (
            <div className="ai-suggestion" style={{ borderColor: '#0d9488', background: '#eaf5f3' }}>
              <strong>AI Clinical Extraction</strong>
              <p>{latestExtraction.symptom} · {latestExtraction.duration || 'Duration not stated'} · {latestExtraction.severity || 'Severity not stated'}</p>
              <p style={{ fontSize: '8px', color: '#728292', marginTop: 4 }}>{latestExtraction.originalExpression ? `Original: "${latestExtraction.originalExpression}"` : ''}</p>
              <button onClick={() => setClinicalNotes((prev) => prev + '\n\n' + formatExtractionForNotes(latestExtraction))}>Add to notes</button>
              {latestExtraction.requiresDoctorReview && (
                <span style={{ color: '#c65348', fontSize: '8px', display: 'block', marginTop: 4 }}>⚠ Requires doctor review — not a confirmed diagnosis</span>
              )}
            </div>
          )}
          <div className="ai-suggestion">
            <strong>Vaani AI suggestion</strong>
            <p>Consider asking about nausea, visual changes, and history of migraines.</p>
            <button onClick={() => setClinicalNotes((prev) => prev + '\n- Ask about nausea, visual changes, migraine history')}>Add to questions</button>
          </div>
          <div style={{ marginTop: 10, color: '#728292', fontSize: '8px' }}>
            AI suggestions are not diagnoses. Review and confirm before finalizing.
          </div>
          <button className="save-notes" onClick={() => { setToast('Clinical notes saved'); setTimeout(() => setToast(''), 2600); }}>Save notes</button>
        </aside>
      </main>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}
