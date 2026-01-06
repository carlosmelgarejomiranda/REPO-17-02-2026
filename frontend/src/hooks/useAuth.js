import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
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
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setFallbackUser(data);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
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
  
  return { user: fallbackUser, loading: fallbackLoading, setUser: setFallbackUser };
};
