import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'developer' | 'viewer';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;

    localStorage.setItem('token', access_token);
    if (refresh_token) {
      localStorage.setItem('refreshToken', refresh_token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const demoLogin = async (role: 'ADMIN' | 'DEVELOPER' | 'VIEWER') => {
    const response = await api.post<AuthResponse>('/auth/demo-login', { role });
    const { access_token, refresh_token, user } = response.data;

    localStorage.setItem('token', access_token);
    if (refresh_token) {
      localStorage.setItem('refreshToken', refresh_token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const signup = async (data: SignupData) => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    const { access_token, refresh_token, user } = response.data;

    localStorage.setItem('token', access_token);
    if (refresh_token) {
      localStorage.setItem('refreshToken', refresh_token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        demoLogin,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
