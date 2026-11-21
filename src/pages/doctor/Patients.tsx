import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { type Patient, LANGUAGES } from '@/lib/demoData';
import { Asset } from '@/components/Asset';

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Patient>>({});

  const load = () => api.getPatients().then(setPatients);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      api.updatePatient(editing, form).then(() => { setEditing(null); setForm({}); load(); });
    } else {
      api.addPatient({
        name: form.name || '',
        initials: (form.name || '').split(' ').map((n) => n[0]).join(''),
        age: Number(form.age) || 0,
        gender: (form.gender as Patient['gender']) || 'Male',
        language: (form.language as any) || 'English',
        phone: form.phone || '',
        allergies: (form.allergies as string[]) || [],
        medicalHistory: (form.medicalHistory as string[]) || [],
        preferredLanguage: (form.preferredLanguage as any) || 'English',
      }).then(() => { setForm({}); load(); });
    }
  };

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> PATIENT MANAGEMENT</div>
            <h1>Patient Directory</h1>
            <p>Add, edit, and review patient records and clinical history.</p>
          </div>
          <button className="primary-action" onClick={() => { setEditing(null); setForm({}); }}>＋ Add Patient</button>
        </div>

        {editing && (
          <div className="modal metric-detail" style={{ maxWidth: '520px', margin: '24px auto' }}>
            <h2>{editing ? 'Edit Patient' : 'Add Patient'}</h2>
            <form onSubmit={handleSave} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label>Full name<input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label>Mobile number<input required type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label>Age<input type="number" value={form.age || ''} onChange={(e) => setForm({ ...form, age: Number(e.target.value) }) } /></label>
              <label>Gender<select value={form.gender || 'Male'} onChange={(e) => setForm({ ...form, gender: e.target.value as Patient['gender'] })}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select></label>
              <label>Preferred language<select value={form.preferredLanguage || 'English'} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value as any })}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select></label>
              <label>Allergies (comma separated)<input value={form.allergies?.join(', ') || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
              <label>Medical history (comma separated)<input value={form.medicalHistory?.join(', ') || ''} onChange={(e) => setForm({ ...form, medicalHistory: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} /></label>
            </form>
            <div className="modal-actions">
              <button type="button" onClick={() => { setEditing(null); setForm({}); }}>Cancel</button>
              <button type="submit">Save Patient</button>
            </div>
          </div>
        )}

        <div className="metrics">
          {patients.map((p) => (
            <button
              key={p.id}
              className="metric-card"
              onClick={() => navigate(`/doctor/patients/${p.id}`)}
            >
              <span className="metric-title">{p.name}</span>
              <span className="metric-icon"><Asset name="45d6d.svg" /></span>
              <strong>{p.age}</strong>
              <span className="metric-foot"><b>{p.language}</b> {p.preferredLanguage}</span>
              <span className="card-arrow">›</span>
            </button>
          ))}
        </div>

        <div className="quick-actions">
          <span>{patients.length} patients</span>
          <button onClick={load}>Refresh</button>
          <small>Preferred language · allergies · medical history</small>
        </div>
      </section>
    </div>
  );
}
