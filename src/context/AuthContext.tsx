import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, role?: UserRole) => Promise<boolean>;
  register: (fullName: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('quiz_app_token');
    const savedUser = localStorage.getItem('quiz_app_user');

    if (savedToken && savedUser) {
      try {
        setAuthState({
          user: JSON.parse(savedUser),
          token: savedToken,
          isAuthenticated: true,
        });
      } catch (e) {
        localStorage.removeItem('quiz_app_token');
        localStorage.removeItem('quiz_app_user');
      }
    } else {
      // Auto-login as Demo Teacher by default for immediate preview!
      quickDemoLogin('teacher@demo.com', 'TEACHER');
    }
  }, []);

  const quickDemoLogin = async (email: string, role: UserRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('quiz_app_token', data.token);
        localStorage.setItem('quiz_app_user', JSON.stringify(data.user));
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      }
    } catch (err) {
      console.warn('Auto demo login notice:', err);
    }
  };

  const login = async (email: string, role?: UserRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('quiz_app_token', data.token);
        localStorage.setItem('quiz_app_user', JSON.stringify(data.user));
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const register = async (fullName: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('quiz_app_token', data.token);
        localStorage.setItem('quiz_app_user', JSON.stringify(data.user));
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('quiz_app_token');
    localStorage.removeItem('quiz_app_user');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  const switchRole = (role: UserRole) => {
    if (role === 'TEACHER') {
      quickDemoLogin('teacher@demo.com', 'TEACHER');
    } else {
      quickDemoLogin('student@demo.com', 'STUDENT');
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
