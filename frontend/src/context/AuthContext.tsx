import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { roleHomePath } from '../constants/status';
import { api } from '../services/api';
import { storage } from '../services/storage';
import type { User } from '../types/domain';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [loading, setLoading] = useState(Boolean(storage.getToken()));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        storage.clearToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password) {
        const result = await api.login(email, password);
        storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
        toast.success(`Welcome, ${result.user.name}`);
        return roleHomePath[result.user.role];
      },
      async register(input) {
        const result = await api.register(input);
        storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
        toast.success('Account created');
        return roleHomePath[result.user.role];
      },
      logout() {
        storage.clearToken();
        setToken(null);
        setUser(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
