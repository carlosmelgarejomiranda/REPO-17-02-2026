import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

// Helper to get correct API URL for both preview and production
const getApiUrl = () => {
  // In production (deployed site), use current origin
  // In development/preview, use the env variable
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  return process.env.REACT_APP_BACKEND_URL || '';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = getApiUrl();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('auth_token');
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Always declare hooks at top level
  const [fallbackUser, setFallbackUser] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(true);
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    // Only run if no context (not wrapped in AuthProvider)
    if (context) return;
    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          headers
        });
        if (res.ok) {
          const data = await res.json();
          setFallbackUser(data);
        } else {
          setFallbackUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setFallbackUser(null);
      } finally {
        setFallbackLoading(false);
      }
    };
    checkAuth();
  }, [context, API_URL]);

  // Return context if available, otherwise fallback
  if (context) {
    return context;
  }
  
  return { user: fallbackUser, loading: fallbackLoading, setUser: setFallbackUser, checkAuth: () => {} };
};
