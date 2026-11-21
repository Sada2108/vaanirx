import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api, generateTts } from '@/lib/api';
import { Asset } from '@/components/Asset';
import { DEMO_PATIENTS } from '@/lib/demoData';

const ALLERGY_CONFLICTS: Record<string, string[]> = {
  'penicillin': ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin'],
  'sulfa': ['sulfamethoxazole', 'sulfonamide', 'bactrim'],
};

function checkAllergyConflict(medicineName: string, allergies: string[]): string | null {
  const med = medicineName.toLowerCase();
  for (const allergy of allergies) {
    const a = allergy.toLowerCase();
    const conflictMeds = ALLERGY_CONFLICTS[a] || [a];
    if (conflictMeds.some((m) => med.includes(m) || m.includes(med))) {
      return allergy;
    }
  }
  return null;
}

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [draft, setDraft] = useState<{ id: string; medicineName: string; strength: string; dosage: string; frequency: string; duration: string; timing: string; instructions: string }>({
    id: `item-${Date.now()}`,
    medicineName: '', strength: '', dosage: '', frequency: '', duration: '', timing: '', instructions: '',
  });
  const [showDraft, setShowDraft] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<{ allergy: string; medicine: string } | null>(null);
  const defaultPatient = DEMO_PATIENTS[0];

  const load = () => api.getPrescriptions().then(setPrescriptions);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const conflict = checkAllergyConflict(draft.medicineName, defaultPatient.allergies);
    if (conflict) {
      setConflictWarning({ allergy: conflict, medicine: draft.medicineName });
      return;
    }
    await issuePrescription();
  };

  const issuePrescription = async () => {
    const issued = await api.issuePrescription({
      patientId: defaultPatient.id,
      patientName: defaultPatient.name,
      doctorId: user?.id || 'd1',
      doctorName: user?.name || 'Dr. Ananya Sharma',
      items: [draft],
    });
    // Generate TTS audio for patient instructions
    try {
      const instructions = draft.instructions || `Take ${draft.medicineName} ${draft.dosage} ${draft.frequency} for ${draft.duration}.`;
      await generateTts(instructions, { language: defaultPatient.preferredLanguage });
    } catch {
      // TTS failure should not block prescription issuance
    }
    setShowDraft(false);
    setDraft({ id: `item-${Date.now()}`, medicineName: '', strength: '', dosage: '', frequency: '', duration: '', timing: '', instructions: '' });
    load();
  };

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> PRESCRIPTIONS</div>
            <h1>Prescriptions</h1>
            <p>Draft, review, and issue prescriptions for your patients.</p>
          </div>
          <button className="primary-action" onClick={() => setShowDraft(true)}>＋ Issue Prescription</button>
        </div>

        {conflictWarning && (
          <div className="modal metric-detail" style={{ maxWidth: '520px', margin: '24px auto' }}>
            <h2>⚠ Allergy Conflict Warning</h2>
            <p>Patient {defaultPatient.name} is allergic to <strong>{conflictWarning.allergy}</strong>. Prescribing <strong>{conflictWarning.medicine}</strong> may cause an adverse reaction.</p>
            <p style={{ color: '#c65348', fontSize: '8px', marginTop: 8 }}>AI must not independently prescribe. Doctor approval required.</p>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button type="button" onClick={() => setConflictWarning(null)}>Cancel</button>
              <button type="button" onClick={() => { setConflictWarning(null); issuePrescription(); }} style={{ background: '#c65348', borderColor: '#c65348', color: 'white' }}>Issue Anyway (Doctor Override)</button>
            </div>
          </div>
        )}

        {showDraft && !conflictWarning && (
          <div className="modal metric-detail" style={{ maxWidth: '560px', margin: '24px auto' }}>
            <h2>New Prescription Draft</h2>
            <p>AI suggestions must be reviewed and approved by a doctor before issuing.</p>
            <form onSubmit={handleSave} className="form-grid" style={{ marginTop: 20 }}>
              <label>Medicine name<input required value={draft.medicineName} onChange={(e) => setDraft({ ...draft, medicineName: e.target.value })} /></label>
              <label>Strength<input value={draft.strength} onChange={(e) => setDraft({ ...draft, strength: e.target.value })} /></label>
              <label>Dosage<input value={draft.dosage} onChange={(e) => setDraft({ ...draft, dosage: e.target.value })} /></label>
              <label>Frequency<input value={draft.frequency} onChange={(e) => setDraft({ ...draft, frequency: e.target.value })} /></label>
              <label>Duration<input value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} /></label>
              <label>Timing<input value={draft.timing} onChange={(e) => setDraft({ ...draft, timing: e.target.value })} /></label>
              <label>Additional instructions<textarea value={draft.instructions} onChange={(e) => setDraft({ ...draft, instructions: e.target.value })} /></label>
              <p style={{ color: '#c65348', fontSize: '8px', marginTop: 6 }}>AI must not independently prescribe. Doctor approval required.</p>
            </form>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDraft(false)}>Cancel</button>
              <button type="submit">Issue Prescription</button>
            </div>
          </div>
        )}

        <div className="metrics">
          {prescriptions.length ? prescriptions.map((p) => (
            <button
              key={p.id}
              className="metric-card"
              onClick={() => navigate(`/doctor/prescriptions/${p.id}`)}
            >
              <span className="metric-title">{p.patientName}</span>
              <span className="metric-icon"><Asset name="2b341.svg" /></span>
              <strong>{p.items.length}</strong>
              <span className="metric-foot"><b>{p.status}</b> {p.date}</span>
              <span className="card-arrow">›</span>
            </button>
          )) : (
            <div className="metric-card">
              <span className="metric-title">No prescriptions yet</span>
              <span className="metric-icon"><Asset name="b59b4.svg" /></span>
              <strong>—</strong>
              <span className="metric-foot">Issue your first prescription</span>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <span>{prescriptions.length} prescriptions</span>
          <button onClick={load}>Refresh</button>
          <small>Doctor-verified prescriptions only</small>
        </div>
      </section>
    </div>
  );
}
