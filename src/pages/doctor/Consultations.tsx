import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Asset } from '@/components/Asset';

export default function DoctorConsultations() {
  const [consultations, setConsultations] = useState<any[]>([]);

  const load = () => api.getConsultations().then(setConsultations);

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> CONSULTATIONS</div>
            <h1>Consultation History</h1>
            <p>Review past and ongoing patient consultations.</p>
          </div>
          <button className="primary-action" onClick={load}>Refresh</button>
        </div>

        <div className="table">
          <div className="table-head"><span>Patient</span><span>Language</span><span>Type</span><span>Date</span><span>Status</span></div>
          {consultations.length ? consultations.map((c) => (
            <button className="table-row" key={c.id}>
              <span className="patient"><i>{c.patientName?.split(' ').map((n: string) => n[0]).join('') || '?'}</i><span><strong>{c.patientName}</strong><small>{c.type}</small></span></span>
              <span>{c.patientLanguage}</span><span>{c.type}</span><span>{c.date}</span>
              <span><em className={c.status === 'In review' ? 'review' : ''}>{c.status}</em></span>
            </button>
          )) : (
            <button className="table-row" disabled>
              <span className="patient"><i>—</i><span><strong>No consultations</strong><small>Start a new consultation</small></span></span>
              <span>—</span><span>—</span><span>—</span><span><em>—</em></span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
