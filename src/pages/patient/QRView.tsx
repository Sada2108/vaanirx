import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, generateTts } from '@/lib/api';

export default function QRView() {
  const { token } = useParams();
  const [prescription, setPrescription] = useState<any>(null);
  const [error, setError] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [language, setLanguage] = useState('Hindi');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getPrescriptionByQrToken(token).then((p) => {
      setPrescription(p);
      if (p.audioUrl) setAudioUrl(p.audioUrl);
    }).catch(() => {
      setError('Invalid or expired prescription link.');
    });
  }, [token]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const toggleAudio = async () => {
    if (audioPlaying) {
      audioRef.current?.pause();
      setAudioPlaying(false);
      return;
    }
    if (!prescription) return;
    const item = prescription.items?.[0];
    if (!item) return;

    // Generate TTS if no audio yet
    if (!audioUrl) {
      setGenerating(true);
      try {
        const instructions = item.instructions || `Take ${item.medicineName} ${item.dosage} ${item.frequency} for ${item.duration}.`;
        const result = await generateTts(instructions, { language });
        setAudioUrl(result.audioUrl);
        audioRef.current = new Audio(result.audioUrl);
        audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
        audioRef.current.onended = () => setAudioPlaying(false);
      } catch (err) {
        setError('Failed to generate audio instructions.');
      } finally {
        setGenerating(false);
      }
    } else {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play().then(() => setAudioPlaying(true)).catch(() => setAudioPlaying(false));
      audioRef.current.onended = () => setAudioPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `vaanirx-prescription-${prescription?.id}.mp3`;
    a.click();
  };

  if (error) {
    return (
      <div className="qr-shell">
        <div className="qr-card">
          <h2>Prescription Access</h2>
          <p style={{ color: '#c65348' }}>{error}</p>
          <p style={{ color: '#728292', fontSize: '9px', marginTop: 10 }}>
            Scan a valid VaaniRx QR code to view your prescription.
          </p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="qr-shell">
        <div className="qr-card">
          <h2>Prescription Access</h2>
          <p>Loading prescription&hellip;</p>
        </div>
      </div>
    );
  }

  const item = prescription.items?.[0];

  return (
    <div className="qr-shell">
      <div className="qr-card">
        <div className="qr-header">
          <strong>VaaniRx</strong>
          <span>Prescription</span>
        </div>
        <h2>{item?.medicineName || 'Prescribed Medicine'}</h2>
        <p className="qr-patient">For: {prescription.patientName}</p>
        <p className="qr-doctor">Prescribed by: {prescription.doctorName}</p>
        <p className="qr-date">Date: {prescription.date}</p>

        <div className="qr-detail">
          <div><strong>Strength</strong><span>{item?.strength || '—'}</span></div>
          <div><strong>Dosage</strong><span>{item?.dosage || '—'}</span></div>
          <div><strong>Frequency</strong><span>{item?.frequency || '—'}</span></div>
          <div><strong>Duration</strong><span>{item?.duration || '—'}</span></div>
          <div><strong>Timing</strong><span>{item?.timing || '—'}</span></div>
        </div>

        <div className="qr-instructions">
          <strong>Instructions</strong>
          <p>{item?.instructions || 'Take as directed by your doctor.'}</p>
        </div>

        <div className="qr-lang">
          <label>Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option>English</option><option>Hindi</option><option>Tamil</option><option>Malayalam</option><option>Marathi</option>
          </select>
        </div>

        <div className="qr-audio">
          <button onClick={toggleAudio} className="qr-audio-btn" disabled={generating}>
            {generating ? 'Generating audio…' : audioPlaying ? '⏹ Stop Audio' : '▶ Play Audio Instructions'}
          </button>
          {audioPlaying && <p className="qr-audio-note">Playing prescription audio in {language}</p>}
          {audioUrl && (
            <button className="qr-download" onClick={downloadAudio}>Download Audio</button>
          )}
        </div>

        <p className="qr-note">
          This link is secure and revocable. Share only with the patient.
        </p>
      </div>
    </div>
  );
}
