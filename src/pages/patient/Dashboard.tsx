import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api, DEMO_MODE, generateTts } from '@/lib/api';
import { Asset } from '@/components/Asset';
import { translate, LANGUAGES, type SupportedLanguage } from '@/lib/translations';

const QR_SCANNER_AVAILABLE = true;

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTimeOfDay(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return dateStr;
  }
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<SupportedLanguage>('Hindi');
  const [patient, setPatient] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<any>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // QR scanner
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualQrToken, setManualQrToken] = useState('');

  // Voice recording
  const [showRecorder, setShowRecorder] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const t = (key: string, replacements?: Record<string, string>) => translate(key, language, replacements);

  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [p, rx, cons] = await Promise.all([
        api.getPatient(user.id).catch(() => null),
        api.getPatientPrescriptions(user.id).catch(() => []),
        api.getPatientConsultations(user.id).catch(() => []),
      ]);
      setPatient(p || null);
      setPrescriptions(rx || []);
      setConsultations(cons || []);
      if (rx && rx.length > 0) setCurrentPrescription(rx[0]);
    } catch (err) {
      console.error('Failed to load patient data:', err);
    }
  };

  const playPrescriptionAudio = async (prescription: any) => {
    if (audioRef) {
      audioRef.pause();
      audioRef.src = '';
      setAudioRef(null);
    }
    setAudioPlaying(prescription.id);
    setAudioCurrentTime(0);
    setAudioDuration(0);

    try {
      const item = prescription.items?.[0];
      const instructions = item?.instructions || `Take ${item?.medicineName || 'medicine'} as directed.`;
      const audioLang = prescription.patientLanguage || language;

      let result: any = null;
      if (prescription.audioUrl) {
        result = { audioUrl: prescription.audioUrl, demo: false };
      } else {
        result = await generateTts(instructions, { language: audioLang });
      }

      const audio = new Audio(result.audioUrl);
      setAudioRef(audio);
      audio.onloadedmetadata = () => setAudioDuration(audio.duration);
      audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
      audio.onended = () => setAudioPlaying(null);
      audio.volume = volume;
      audio.playbackRate = playbackRate;
      await audio.play();
    } catch (err) {
      console.error('Audio playback failed:', err);
      setAudioPlaying(null);
    }
  };

  const stopAudio = () => {
    if (audioRef) {
      audioRef.pause();
      audioRef.src = '';
      setAudioRef(null);
    }
    setAudioPlaying(null);
    setAudioCurrentTime(0);
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // QR Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setScanning(true);
    } catch (err) {
      setCameraError('Unable to access camera. Please use manual entry instead.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setScanning(false);
  };

  const switchCamera = async () => {
    if (!cameraStream) return;
    cameraStream.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
    } catch (err) {
      setCameraError('Unable to switch camera.');
    }
  };

  const handleQrScan = async (decodedText: string) => {
    setScanning(false);
    stopCamera();
    try {
      const prescription = await api.getPrescriptionByQrToken(decodedText);
      setCurrentPrescription(prescription);
      setShowCurrent(true);
    } catch (err) {
      setCameraError('Invalid or expired QR token.');
      setScanning(true);
    }
  };

  const verifyManualQr = async () => {
    if (!manualQrToken.trim()) return;
    try {
      const prescription = await api.getPrescriptionByQrToken(manualQrToken.trim());
      setCurrentPrescription(prescription);
      setShowCurrent(true);
      setManualQrToken('');
    } catch (err) {
      setCameraError('Invalid or expired QR token.');
    }
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      setRecording(true);
      setPaused(false);
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        try {
          const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
          const result = await api.uploadAudio(file);
          console.log('Recording uploaded:', result);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      };

      mediaRecorderRef.current.start(1000);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setCameraError('Microphone access denied.');
      console.error('Microphone error:', err);
    }
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (paused) {
      mediaRecorderRef.current.resume();
      setPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setPaused(true);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setPaused(false);
  };

  const deleteRecording = () => {
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
  };

  const playRecording = () => {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    audio.play();
  };

  const saveRecording = async () => {
    if (!recordedAudioUrl) return;
    try {
      if (currentPrescription) {
        await api.patch(`/prescriptions/${currentPrescription.id}`, { audioUrl: recordedAudioUrl });
        setCurrentPrescription({ ...currentPrescription, audioUrl: recordedAudioUrl });
      }
    } catch (err) {
      console.error('Save recording failed:', err);
    }
  };

  // Mark medicine as taken
  const markTaken = (itemId: string) => {
    setPrescriptions((prev) =>
      prev.map((p) => ({
        ...p,
        items: p.items?.map((item: any) =>
          item.id === itemId ? { ...item, taken: true } : item
        ),
      }))
    );
  };

  if (!user) return null;

  const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="patient-shell">
      <header className="patient-header">
        <div className="patient-brand">
          <strong>{t('appName')}</strong>
          <small>{t('patientPortal')}</small>
        </div>
        <div className="patient-actions">
          <label className="patient-lang-label">{t('language')}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="patient-lang-select"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button className="patient-logout" onClick={() => logout()}>
            {t('signOut')}
          </button>
        </div>
      </header>

      <section className="patient-content">
        {/* Welcome Section */}
        <div className="patient-welcome">
          <div>
            <div className="patient-eyebrow">{t('welcome')}</div>
            <h1>{t('welcomeBack', { name: patient?.name || user?.name || 'Patient' })}</h1>
            <p>{t('greeting')}</p>
            <div className="patient-date">{currentDate}</div>
          </div>
          <div className="patient-welcome-actions">
            <button className="patient-btn primary" onClick={() => setShowQrScanner(true)}>
              {t('scanQr')}
            </button>
            <button className="patient-btn secondary" onClick={() => setShowRecorder(true)}>
              {t('recordVoiceNote')}
            </button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showQrScanner && (
          <div className="patient-modal-backdrop" onClick={() => setShowQrScanner(false)}>
            <div className="patient-modal qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
              <button className="patient-modal-close" onClick={() => setShowQrScanner(false)}>
                ✕
              </button>
              <h2>{t('scanQr')}</h2>
              <p>{t('scanQrDescription')}</p>

              {cameraError && (
                <div className="patient-camera-error">{cameraError}</div>
              )}

              {cameraStream && scanning ? (
                <div className="patient-camera-preview">
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      if (el) el.srcObject = cameraStream;
                    }}
                  />
                  <div className="patient-camera-controls">
                    <button onClick={switchCamera} title="Switch Camera">
                      🔄
                    </button>
                  </div>
                </div>
              ) : (
                <div className="patient-camera-unavailable">
                  <p>{t('cameraUnavailable')}</p>
                  <button className="patient-btn primary" onClick={startCamera}>
                    {t('cameraPermission')}
                  </button>
                </div>
              )}

              <div className="patient-manual-entry">
                <h3>{t('manualEntry')}</h3>
                <div className="patient-input-group">
                  <input
                    type="text"
                    placeholder={t('qrTokenPlaceholder')}
                    value={manualQrToken}
                    onChange={(e) => setManualQrToken(e.target.value)}
                  />
                  <button className="patient-btn primary" onClick={verifyManualQr}>
                    {t('verifyQr')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Recorder Modal */}
        {showRecorder && (
          <div className="patient-modal-backdrop" onClick={() => setShowRecorder(false)}>
            <div className="patient-modal voice-recorder-modal" onClick={(e) => e.stopPropagation()}>
              <button className="patient-modal-close" onClick={() => setShowRecorder(false)}>
                ✕
              </button>
              <h2>{t('voiceRecording')}</h2>

              <div className="patient-recorder-controls">
                {!recording && (
                  <button className="patient-recorder-btn record" onClick={startRecording}>
                    {t('startRecording')}
                  </button>
                )}
                {recording && !paused && (
                  <>
                    <button className="patient-recorder-btn pause" onClick={pauseResumeRecording}>
                      {t('pauseRecording')}
                    </button>
                    <button className="patient-recorder-btn stop" onClick={stopRecording}>
                      {t('stopRecording')}
                    </button>
                  </>
                )}
                {recording && paused && (
                  <button className="patient-recorder-btn resume" onClick={pauseResumeRecording}>
                    {t('resumeRecording')}
                  </button>
                )}
              </div>

              {recording && (
                <div className="patient-recording-status">
                  <span className="patient-recording-dot"></span>
                  <span>{t('recordingInProgress')}</span>
                  <span className="patient-recording-time">{formatDuration(recordingTime)}</span>
                </div>
              )}

              {!recording && recordedAudioUrl && (
                <div className="patient-recording-result">
                  <p>{t('recordingReady')}</p>
                  <div className="patient-recording-actions">
                    <button className="patient-btn secondary" onClick={playRecording}>
                      {t('playRecording')}
                    </button>
                    <button className="patient-btn secondary" onClick={saveRecording}>
                      {t('saveRecording')}
                    </button>
                    <button className="patient-btn secondary" onClick={deleteRecording}>
                      {t('deleteRecording')}
                    </button>
                    <button className="patient-btn secondary" onClick={() => setShowRecorder(false)}>
                      {t('reRecord')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="patient-grid">
          {/* Profile Card */}
          <div className="patient-card profile-card">
            <h2>{t('profile')}</h2>
            {patient ? (
              <>
                <div className="patient-profile">
                  <div className="patient-avatar">{patient.initials || '?'}</div>
                  <div className="patient-info">
                    <div><strong>{patient.name}</strong></div>
                    <div className="patient-role">Patient · {patient.preferredLanguage || language}</div>
                  </div>
                </div>
                <div className="patient-profile-details">
                <div className="detail-row">
                  <span className="detail-label">{t('age')}</span>
                  <span className="detail-value">{patient.age}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('gender')}</span>
                  <span className="detail-value">{patient.gender}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('dateOfBirth')}</span>
                  <span className="detail-value">{patient.dateOfBirth || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('phone')}</span>
                  <span className="detail-value">{patient.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('email')}</span>
                  <span className="detail-value">{patient.email || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('allergies')}</span>
                  <span className="detail-value">{patient.allergies?.length ? patient.allergies.join(', ') : t('noAllergies')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('medicalHistory')}</span>
                  <span className="detail-value">{patient.medicalHistory?.length ? patient.medicalHistory.join(', ') : t('noMedicalHistory')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('emergencyContact')}</span>
                  <span className="detail-value">{patient.emergencyContact || '—'}</span>
                </div>
              </div>
              <button className="patient-btn secondary" style={{ marginTop: 12 }} onClick={() => {}}>
                {t('editProfile')}
              </button>
              </>
            ) : (
              <p style={{ color: '#728292', fontSize: '9px', textAlign: 'center', padding: '20px' }}>Loading profile&hellip;</p>
            )}
          </div>

          {/* Current Prescriptions Card */}
          <div className="patient-card prescriptions-card">
            <div className="card-header">
              <h2>{t('currentPrescriptions')}</h2>
              <button className="patient-btn small" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? t('previousPrescriptions') : t('currentPrescriptions')}
              </button>
            </div>
            {prescriptions.length === 0 ? (
              <p style={{ color: '#728292', fontSize: '9px', textAlign: 'center', padding: '20px' }}>{t('noCurrentPrescriptions')}</p>
            ) : (
              prescriptions.map((rx) => (
                <div key={rx.id} className="prescription-item">
                  <div className="prescription-info">
                    <div>
                      <strong>{rx.items?.[0]?.medicineName || t('medicineName')}</strong>
                      <p className="prescription-meta">
                        {rx.items?.[0]?.dosage} · {rx.items?.[0]?.frequency} · {rx.items?.[0]?.duration}
                      </p>
                      <p className="prescription-doctor">{rx.doctorName} · {rx.date}</p>
                    </div>
                    <div className="prescription-actions">
                      <button
                        className="patient-btn audio-btn"
                        onClick={() => playPrescriptionAudio(rx)}
                        disabled={!rx.audioUrl && !rx.items?.[0]?.instructions}
                      >
                        {audioPlaying === rx.id ? t('stopAudio') : t('playAudio')}
                      </button>
                      <button className="patient-btn small" onClick={() => {}}>
                        {t('download')}
                      </button>
                    </div>
                  </div>
                  <div className="prescription-detail">
                    <div><span>{t('instructions')}</span> <span>{rx.items?.[0]?.instructions || '—'}</span></div>
                    <div><span>{t('timing')}</span> <span>{rx.items?.[0]?.timing || '—'}</span></div>
                    <div><span>{t('strength')}</span> <span>{rx.items?.[0]?.strength || '—'}</span></div>
                    <div><span>{t('languageLabel')}</span> <span>{rx.patientLanguage || language}</span></div>
                    {rx.audioUrl && <div><span>Audio</span> <span>Available</span></div>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Medicine Schedule Card */}
          <div className="patient-card schedule-card">
            <h2>{t('medicineSchedule')}</h2>
            <div className="schedule-grid">
              {[
                { time: '08:00 AM', label: t('morning'), note: t('afterMeals') },
                { time: '02:00 PM', label: t('afternoon'), note: t('afterMeals') },
                { time: '08:00 PM', label: t('evening'), note: t('afterMeals') },
              ].map((slot) => {
                const item = prescriptions.find((p) => p.items?.[0]?.timing?.toLowerCase().includes(slot.label.toLowerCase()));
                const taken = item?.items?.[0]?.taken;
                return (
                  <div key={slot.time} className="schedule-item">
                    <span className="schedule-time">{slot.time}</span>
                    <div className="schedule-info">
                      <strong>{item?.items?.[0]?.medicineName || '—'}</strong>
                      <span className="schedule-note">{slot.note}</span>
                    </div>
                    <button
                      className={`patient-btn taken-btn ${taken ? 'taken' : ''}`}
                      onClick={() => item && markTaken(item.items[0].id)}
                    >
                      {taken ? t('taken') : t('notTaken')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consultation History Card */}
          <div className="patient-card consultations-card">
            <h2>{t('consultationHistory')}</h2>
            {consultations.length === 0 ? (
              <p style={{ color: '#728292', fontSize: '9px', textAlign: 'center', padding: '20px' }}>{t('noConsultations')}</p>
            ) : (
              consultations.map((c) => (
                <div key={c.id} className="consultation-item">
                  <div>
                    <strong>{c.doctorName}</strong>
                    <p>{c.type} · {c.date}</p>
                    <span className={`status-badge ${c.status}`}>{c.status}</span>
                  </div>
                  <button className="patient-btn small" onClick={() => navigate(`/doctor/patients/${c.patientId}`)}>
                    {t('viewDetails')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audio Player Bar */}
        {audioPlaying && audioRef && (
          <div className="patient-audio-bar">
            <div className="audio-info">
              <strong>{currentPrescription?.items?.[0]?.medicineName || t('audioInstructions')}</strong>
              <span>{currentPrescription?.patientLanguage || language}</span>
            </div>
            <div className="audio-controls">
              <button onClick={() => (audioRef.paused ? audioRef.play() : audioRef.pause())}>
                {audioRef.paused ? '▶' : '⏸'}
              </button>
              <input
                type="range"
                min="0"
                max={audioDuration || 100}
                value={audioCurrentTime}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (audioRef) audioRef.currentTime = Number(target.value);
                }}
              />
              <button onClick={() => { if (audioRef) { const r = Math.min(audioRef.playbackRate + 0.25, 2); audioRef.playbackRate = r; setPlaybackRate(r); } }}>
                ⨉{playbackRate}
              </button>
              <button onClick={() => { if (audioRef) { const v = Math.max(audioRef.volume - 0.1, 0); audioRef.volume = v; setVolume(v); } }}>
                🔊
              </button>
            </div>
            <div className="audio-time">
              {formatDuration(audioCurrentTime)} / {formatDuration(audioDuration)}
            </div>
          </div>
        )}

        <div className="patient-demo-note">
          <p>{DEMO_MODE ? t('demoMode') : t('liveMode')}</p>
        </div>
      </section>
    </div>
  );
}
