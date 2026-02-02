import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, httpClient } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify session with backend on app load
    const checkAuth = async () => {
      try {
        // Call /auth/me to verify cookie-based session
        const response = await httpClient.get('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user.email);
          setRole(response.data.user.role);
          setMustChangePassword(response.data.user.mustChangePassword || false);
        }
      } catch (error) {
        // Session invalid or expired, clear everything
        setUser(null);
        setRole(null);
        setMustChangePassword(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginApi(email, password);
    const resolvedUser = res?.user?.email || email;
    const resolvedRole = res?.user?.role || null;
    const resolvedMustChangePassword = res?.user?.mustChangePassword || false;
    setUser(resolvedUser);
    setRole(resolvedRole);
    setMustChangePassword(resolvedMustChangePassword);
    return { user: resolvedUser, role: resolvedRole, mustChangePassword: resolvedMustChangePassword };
  };

  const logout = async () => {
    try {
      // Call logout API to clear cookie
      await httpClient.post('/auth/logout');
    } catch (error) {
      // Continue with client-side logout even if API call fails
    }
    // Clear localStorage token
    localStorage.removeItem('authToken');
    setUser(null);
    setRole(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, mustChangePassword, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};