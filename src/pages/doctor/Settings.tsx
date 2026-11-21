import { useAuth } from '@/context/AuthContext';
import { Asset } from '@/components/Asset';

export default function DoctorSettings() {
  const { user, logout } = useAuth();

  return (
    <div>
      <section className="content">
        <div className="welcome">
          <div>
            <div className="eyebrow"><span className="role-dot" /> SETTINGS</div>
            <h1>Account Settings</h1>
            <p>Manage your doctor profile and preferences.</p>
          </div>
        </div>

        <div className="modal metric-detail" style={{ maxWidth: '460px', margin: '24px auto' }}>
          <div className="modal-icon"><Asset name="139ce.svg" /></div>
          <h2>Doctor Profile</h2>
          <p>Name, role, and workspace preferences.</p>
          <div className="form-grid" style={{ marginTop: 20, gridTemplateColumns: '1fr' }}>
            <label>Full name<input defaultValue={user?.name || 'Dr. Ananya Sharma'} /></label>
            <label>Role<input defaultValue="General Physician" /></label>
            <label>Email<input defaultValue={`${(user?.name || 'doctor').toLowerCase().replace(' ', '.')}@vaanirx.demo`} /></label>
          </div>
          <div className="modal-actions" style={{ marginTop: 22 }}>
            <button className="logout" onClick={logout}>Log out</button>
          </div>
        </div>
      </section>
    </div>
  );
}
