import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export const AuthForms = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        
        body: JSON.stringify(body)
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Error del servidor');
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Error de autenticación');
      }

      // Store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
        <CardHeader>
          <CardTitle className="text-center italic" style={{ color: '#f5ede4' }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl"
            style={{ color: '#666' }}
          >
            ×
          </button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                    <User className="w-4 h-4 inline mr-1" /> Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded border"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                    <Phone className="w-4 h-4 inline mr-1" /> Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3 rounded border"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                    placeholder="+595 9XX XXX XXX"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 rounded border"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>
                <Lock className="w-4 h-4 inline mr-1" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 rounded border pr-10"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: '#666' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3"
              disabled={loading}
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: '#333' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2" style={{ backgroundColor: '#1a1a1a', color: '#666' }}>
                  o continuar con
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-4 py-3 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #333' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm"
              style={{ color: '#d4a968' }}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const AuthCallback = ({ onAuthComplete }) => {
  const [error, setError] = useState(null);
  const hasProcessed = React.useRef(false);
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  React.useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const sessionId = new URLSearchParams(hash.substring(1)).get('session_id');

        if (!sessionId) {
          throw new Error('No session_id found');
        }

        // Exchange session_id for user data
        const response = await fetch(`${API_URL}/api/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Authentication failed');
        }

        // Store token
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        // Clear URL fragment and redirect
        window.history.replaceState(null, '', window.location.pathname);
        
        if (onAuthComplete) {
          onAuthComplete(data);
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message);
      }
    };

    processAuth();
  }, [API_URL, onAuthComplete]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardContent className="p-8 text-center">
            <p style={{ color: '#ef4444' }}>Error: {error}</p>
            <Button
              onClick={() => window.location.href = '/studio'}
              className="mt-4"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto mb-4" 
             style={{ borderColor: '#d4a968', borderTopColor: 'transparent' }}></div>
        <p style={{ color: '#a8a8a8' }}>Autenticando...</p>
      </div>
    </div>
  );
};
