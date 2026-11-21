import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Asset } from '@/components/Asset';

export function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="patient-shell">
      <header className="patient-header">
        <button className="patient-back" onClick={() => logout()}>
          <span>↪</span> Sign out
        </button>
        <div className="patient-brand">
          <strong>VaaniRx</strong>
          <small>Patient Portal</small>
        </div>
      </header>
      <section className="patient-content">
        <Outlet />
      </section>
    </div>
  );
}
