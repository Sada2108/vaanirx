import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { LANGUAGES } from '@/lib/demoData';

const A = '/assets';

function Asset({ name, className = '' }: { name: string; className?: string }) {
  return <img alt="" className={className} src={`${A}/${name}`} />;
}

function PortalCard({
  role,
  title,
  subtitle,
  icon,
  color,
}: {
  role: 'doctor' | 'patient';
  title: string;
  subtitle: string;
  icon: string;
  color: string;
}) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | null>(null);

  return (
    <section className={`portal-card ${color}`}>
      <div className="portal-icon">
        <Asset name={icon} className="w-8 h-8" />
      </div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="portal-divider" />
      <div className="portal-actions">
        <button
          className="portal-btn"
          onClick={() => setMode('login')}
          aria-label={`${role} login`}
        >
          {role === 'doctor' ? 'Doctor Login' : 'Patient Login'}
        </button>
        <button
          className="portal-btn portal-btn-outline"
          onClick={() => setMode('register')}
          aria-label={`${role} registration`}
        >
          {role === 'doctor' ? 'Doctor Registration' : 'Patient Registration'}
        </button>
      </div>
      {mode === 'login' && (
        <AuthForm role={role} mode="login" onSuccess={login} onBack={() => setMode(null)} />
      )}
      {mode === 'register' && (
        <AuthForm role={role} mode="register" onSuccess={register} onBack={() => setMode(null)} />
      )}
    </section>
  );
}

function AuthForm({
  role,
  mode,
  onSuccess,
  onBack,
}: {
  role: 'doctor' | 'patient';
  mode: 'login' | 'register';
  onSuccess: (role: 'doctor' | 'patient', data: Record<string, unknown>) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name) {
      setError('Please enter your name');
      return;
    }
    onSuccess(role, { name, email, language, password });
  };

  const isRegister = mode === 'register';

  return (
    <div className="auth-form">
      <button className="auth-back" onClick={onBack}>
        ← Back
      </button>
      <h3>{isRegister ? 'Create Account' : 'Welcome back'}</h3>
      <p>{isRegister ? 'Join VaaniRx' : 'Sign in to continue'}</p>
      <form onSubmit={handleSubmit} className="auth-form-inner">
        <label className="auth-label">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </label>
        {isRegister && (
          <>
            <label className="auth-label">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com"
              />
            </label>
            <label className="auth-label">
              Preferred language
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="auth-label">
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <span className="auth-hint">Demo mode: any password works</span>
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-actions">
          <button type="button" className="auth-btn auth-btn-outline" onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className="auth-btn auth-btn-primary">
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </div>
        <p className="auth-note">
          {`Running in ${import.meta.env.VITE_DEMO_MODE === 'false' ? 'live' : 'demo'} mode`}
        </p>
      </form>
    </div>
  );
}

export default function EntryPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    return role === 'doctor' ? <Navigate to="/doctor/dashboard" replace /> : <Navigate to="/patient/dashboard" replace />;
  }

  return (
    <div className="entry-page">
      <div className="entry-brand">
        <div className="entry-logo">
          <span><i /><i /><i /><i /></span>
        </div>
        <div className="entry-text">
          <strong>VaaniRx</strong>
          <small>Listen • Understand • Clarify</small>
        </div>
      </div>
      <div className="entry-grid">
        <PortalCard
          role="doctor"
          title="Doctor Portal"
          subtitle="Transcribe, document, and prescribe in any language."
          icon="73b3f.svg"
          color="doctor-portal"
        />
        <PortalCard
          role="patient"
          title="Patient Portal"
          subtitle="Access your prescriptions and audio instructions with a QR code."
          icon="45d6d.svg"
          color="patient-portal"
        />
      </div>
      <div className="entry-footer">
        <p>
          VaaniRx &mdash; multilingual healthcare voice AI. Demo mode active.
        </p>
      </div>
    </div>
  );
}
