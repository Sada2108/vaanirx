import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Asset } from '@/components/Asset';

export function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="dashboard">
        <Sidebar user={user} onLogout={logout} />
        <main className="main">
          <Topbar user={user} onLogout={logout} navigate={navigate} />
          <section className="content">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const navItems = [
    ['Dashboard', '73b3f.svg', '/doctor/dashboard'],
    ['Consultations', '4d01f.svg', '/doctor/consultations'],
    ['Patients', '45d6d.svg', '/doctor/patients'],
    ['Prescriptions', '3a180.svg', '/doctor/prescriptions'],
    ['Analytics', 'e1f72.svg', '/doctor/analytics'],
    ['Settings', '808e6.svg', '/doctor/settings'],
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span>
          <i /><i /><i /><i />
        </span>
        <strong>VaaniRx</strong>
        <small>Listen • Understand • Clarify</small>
      </div>
      <p className="nav-label">WORKSPACE</p>
      <nav>
        {navItems.map(([label, icon, to], index) => (
          <NavLink key={label} to={to} className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`} end={index === 0}>
            <Asset name={icon} /> {label}
            {label === 'Prescriptions' && <b>3</b>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button className="care-card">
          <Asset name="16073.svg" />
          <strong>Built for better care</strong>
          <span>Your voice. More time<br />for your patients.</span>
          <em>Register a patient ↗</em>
        </button>
        <button className="help">
          <Asset name="a606b.svg" /> Help & resources
        </button>
        <div className="sidebar-account">
          <span className="avatar">{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'AS'}</span>
          <span>
            <strong>{user?.name || 'Dr. Ananya Sharma'}</strong>
            <small>Doctor · General Physician</small>
          </span>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>
          <span>↪</span> Log out
        </button>
      </div>
    </aside>
  );
}

function Topbar({
  user,
  onLogout,
  navigate,
}: {
  user: any;
  onLogout: () => void;
  navigate: (to: string) => void;
}) {
  const languages = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Marathi'];
  const [language, setLanguage] = useState('English');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>Workspace</span><b>/</b><strong>Overview</strong>
      </div>
      <label className="search">
        <Asset name="e51d5.svg" />
        <input aria-label="Search" placeholder="Search patients, consultations..." />
        <kbd>⌘ K</kbd>
      </label>
      <label className="language-select compact">
        <span>Language</span>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Consultation language">
          {languages.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <div className="top-actions">
        <div className="menu-anchor">
          <button
            className="icon-button notification-button"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Asset name="597ec.svg" />
            <span className="notification-count">3</span>
          </button>
          {notificationsOpen && (
            <div className="popover notifications">
              <div className="popover-heading">
                <div>
                  <strong>Notifications</strong>
                  <span>3 new</span>
                </div>
                <button onClick={() => setNotificationsOpen(false)}>Mark all read</button>
              </div>
              <button className="notification-item" onClick={() => navigate('/doctor/prescriptions')}>
                <span className="notification-icon"><Asset name="2b341.svg" /></span>
                <span>
                  <strong>3 prescriptions await approval</strong>
                  <small>Review and sign before sending to patients.</small>
                  <em>Just now</em>
                </span>
              </button>
              <button className="notification-item">
                <span className="notification-icon"><Asset name="a8ebd.svg" /></span>
                <span>
                  <strong>Consultation begins in 15 minutes</strong>
                  <small>Follow-up with Rohan Kapoor.</small>
                  <em>8 min ago</em>
                </span>
              </button>
            </div>
          )}
        </div>
        <div className="divider" />
        <div className="menu-anchor">
          <button
            className="profile-trigger"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            aria-expanded={profileOpen}
          >
            <span className="avatar">{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'AS'}</span>
            <span className="profile-copy">
              <strong>{user?.name || 'Dr. Ananya Sharma'}</strong>
              <small>General Physician</small>
            </span>
            <span className="role-pill">DOCTOR</span>
            <Asset name="139ce.svg" className="chevron" />
          </button>
          {profileOpen && (
            <div className="popover profile-menu">
              <div className="profile-summary">
                <span className="avatar large">{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'AS'}</span>
                <span>
                  <strong>{user?.name || 'Dr. Ananya Sharma'}</strong>
                  <small>Doctor · General Physician</small>
                </span>
              </div>
              <button onClick={() => navigate('/doctor/settings')}>
                <span>⚙</span> Account settings
              </button>
              <hr />
              <button className="logout" onClick={() => onLogout()}>
                <span>↪</span> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
