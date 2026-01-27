import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedRole && storedToken) {
      setUser(storedUser);
      setRole(storedRole);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await loginApi(username, password);
    const resolvedUser = res?.user?.username || username;
    const resolvedRole = res?.user?.role || null;
    const authToken = res?.token || null;
    setUser(resolvedUser);
    setRole(resolvedRole);
    if (authToken) {
      setToken(authToken);
      localStorage.setItem('token', authToken);
    }
    localStorage.setItem('user', resolvedUser);
    if (resolvedRole) {
      localStorage.setItem('role', resolvedRole);
    }
    return { user: resolvedUser, role: resolvedRole };
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};