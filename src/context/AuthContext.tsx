import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

export type Role = 'doctor' | 'patient' | null;

export interface AuthUser {
  role: 'doctor' | 'patient';
  name: string;
  email?: string;
  id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  isAuthenticated: boolean;
  demoMode: boolean;
  login: (role: 'doctor' | 'patient', data: Record<string, unknown>) => void;
  register: (role: 'doctor' | 'patient', data: Record<string, unknown>) => void;
  logout: () => void;
  setDemoMode: (value: boolean) => void;
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [demoMode, setDemoMode] = useState(DEMO_MODE);

  const login = useCallback((role: 'doctor' | 'patient', data: Record<string, unknown>) => {
    setUser({
      role,
      name: (data.name as string) || 'User',
      id: `demo-${role}-${Date.now()}`,
      email: (data.email as string) || undefined,
    });
  }, []);

  const register = useCallback(
    (role: 'doctor' | 'patient', data: Record<string, unknown>) => {
      setUser({
        role,
        name: (data.name as string) || 'User',
        id: `demo-${role}-${Date.now()}`,
        email: (data.email as string) || undefined,
      });
    },
    [],
  );

  const logout = useCallback(() => setUser(null), []);

  const value: AuthContextType = {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    demoMode,
    login,
    register,
    logout,
    setDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
