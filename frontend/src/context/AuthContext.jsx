import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    return Boolean(token && storedUser);
  });

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      authService.getMe()
        .then(res => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (username, email, password) => {
    const res = await authService.register({ username, email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
