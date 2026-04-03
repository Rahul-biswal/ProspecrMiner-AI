import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // On mount: check if we have a valid stored token
  useEffect(() => {
    const token = localStorage.getItem('pm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then(data => {
        if (data.user) setUser(data.user);
        else localStorage.removeItem('pm_token');
      })
      .catch(() => localStorage.removeItem('pm_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.token) {
      localStorage.setItem('pm_token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error || 'Login failed' };
  };

  const register = async (name, email, password, inviteCode = '') => {
    const data = await api.register(name, email, password, inviteCode);

    if (data.token) {
      localStorage.setItem('pm_token', data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('pm_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
