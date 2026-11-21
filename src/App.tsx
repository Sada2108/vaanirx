import React, { Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DEMO_MODE } from '@/lib/config';
import EntryPage from '@/pages/entry/EntryPage';
import { DoctorLayout } from '@/layouts/DoctorLayout';
import { PatientLayout } from '@/layouts/PatientLayout';

function RequireRole({ roles, children }: { roles: ('doctor' | 'patient')[]; children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/entry" replace />;
  if (!role || !roles.includes(role)) return <Navigate to="/entry" replace />;
  return <>{children}</>;
}

function DemoBanner() {
  const [dismissed, setDismissed] = useState(localStorage.getItem('vaanirx_demo_dismissed') === 'true');
  if (dismissed || !DEMO_MODE) return null;
  return (
    <div className="demo-banner">
      <span>🔬 Demo mode active &mdash; sample data, no live ElevenLabs calls</span>
      <button onClick={() => { localStorage.setItem('vaanirx_demo_dismissed', 'true'); setDismissed(true); }}>
        Dismiss
      </button>
    </div>
  );
}

const DoctorDashboard = React.lazy(() => import('@/pages/doctor/Dashboard'));
const DoctorConsultations = React.lazy(() => import('@/pages/doctor/Consultations'));
const DoctorPatients = React.lazy(() => import('@/pages/doctor/Patients'));
const DoctorPatientDetail = React.lazy(() => import('@/pages/doctor/PatientDetail'));
const DoctorPrescriptions = React.lazy(() => import('@/pages/doctor/Prescriptions'));
const DoctorAnalytics = React.lazy(() => import('@/pages/doctor/Analytics'));
const DoctorSettings = React.lazy(() => import('@/pages/doctor/Settings'));
const PatientDashboard = React.lazy(() => import('@/pages/patient/Dashboard'));
const PublicQRPage = React.lazy(() => import('@/pages/patient/QRView'));

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DemoBanner />
        <Suspense fallback={<div className="app-shell">Loading VaaniRx&hellip;</div>}>
          <Routes>
            <Route path="/entry" element={<EntryPage />} />
          <Route path="/qr/:token" element={<PublicQRPage />} />
          <Route
            path="/doctor/*"
            element={
              <RequireRole roles={['doctor']}>
                <DoctorLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="/doctor/dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="consultations" element={<DoctorConsultations />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:id" element={<DoctorPatientDetail />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="analytics" element={<DoctorAnalytics />} />
            <Route path="settings" element={<DoctorSettings />} />
          </Route>
          <Route
            path="/patient/*"
            element={
              <RequireRole roles={['patient']}>
                <PatientLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="/patient/dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
          </Route>
          <Route path="/" element={<Navigate to="/entry" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
