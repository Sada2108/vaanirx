import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Asset } from '@/components/Asset';

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.getPatient(id).then(setPatient).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="app-shell">Loading patient&hellip;</div>;
  if (!patient) return <div className="app-shell">Patient not found.</div>;

  return (
    <div className="app-shell">
      <div className="dashboard">
        <main className="main">
          <section className="content">
            <div className="welcome">
              <div>
                <button className="secondary-action register" onClick={() => navigate('/doctor/patients')}>← Back to patients</button>
              </div>
              <div>
                <h1>{patient.name}</h1>
                <p>{patient.age} years · {patient.gender} · {patient.language}</p>
              </div>
            </div>

            <div className="metrics">
              <button className="metric-card">
                <span className="metric-title">Preferred language</span>
                <span className="metric-icon"><Asset name="e51d5.svg" /></span>
                <strong>{patient.preferredLanguage}</strong>
                <span className="metric-foot">Primary consultation language</span>
              </button>
              <button className="metric-card">
                <span className="metric-title">Allergies</span>
                <span className="metric-icon"><Asset name="2b341.svg" /></span>
                <strong>{patient.allergies.length ? patient.allergies.join(', ') : 'None reported'}</strong>
                <span className="metric-foot">Recorded allergies</span>
              </button>
              <button className="metric-card">
                <span className="metric-title">Medical history</span>
                <span className="metric-icon"><Asset name="83f40.svg" /></span>
                <strong>{patient.medicalHistory.length ? patient.medicalHistory.join(', ') : 'None recorded'}</strong>
                <span className="metric-foot">Historical conditions</span>
              </button>
              <button className="metric-card">
                <span className="metric-title">Last visit</span>
                <span className="metric-icon"><Asset name="a8ebd.svg" /></span>
                <strong>{patient.lastVisit || '—'}</strong>
                <span className="metric-foot">Most recent consultation</span>
              </button>
            </div>

            <div className="quick-actions">
              <span>Clinical history</span>
              <button>Previous consultations</button>
              <button>Previous prescriptions</button>
              <small>{patient.phone}</small>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
