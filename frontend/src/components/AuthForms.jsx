import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Gift, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MFAVerification, MFASetup } from './MFAComponents';

export const AuthForms = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [welcomeCoupon, setWelcomeCoupon] = useState(null);
  const [couponCopied, setCouponCopied] = useState(false);
  
  // MFA states
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);
  const [partialToken, setPartialToken] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  
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

      // Check if MFA verification is required
      if (data.mfa_required) {
        setMfaRequired(true);
        setPartialToken(data.partial_token);
        setPendingUserData(data);
        return;
      }
      
      // Check if MFA setup is required (admin first login)
      if (data.mfa_setup_required) {
        setMfaSetupRequired(true);
        setPartialToken(data.partial_token);
        setPendingUserData(data);
        return;
      }

      // Store token in localStorage as backup
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Check for welcome coupon (new registration)
      if (data.welcome_coupon) {
        setWelcomeCoupon(data.welcome_coupon);
        // Store the user data to pass after modal closes
        localStorage.setItem('pending_login_data', JSON.stringify(data));
      } else {
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification success
  const handleMFAVerified = (data) => {
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    setMfaRequired(false);
    setPartialToken(null);
    onLogin(data);
  };

  // Handle MFA setup completion
  const handleMFASetupComplete = async () => {
    // After MFA setup, we need to get the new token
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const userData = await response.json();
      setMfaSetupRequired(false);
      setPartialToken(null);
      onLogin({ ...pendingUserData, ...userData, token: localStorage.getItem('auth_token') });
    } catch (err) {
      // If we can't get user data, just proceed with what we have
      setMfaSetupRequired(false);
      onLogin(pendingUserData);
    }
  };

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(welcomeCoupon);
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const handleContinueAfterCoupon = () => {
    const pendingData = localStorage.getItem('pending_login_data');
    if (pendingData) {
      const data = JSON.parse(pendingData);
      localStorage.removeItem('pending_login_data');
      onLogin(data);
    }
    onClose();
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  // Show MFA verification modal
  if (mfaRequired) {
    return (
      <MFAVerification
        partialToken={partialToken}
        onVerified={handleMFAVerified}
        onCancel={() => {
          setMfaRequired(false);
          setPartialToken(null);
        }}
      />
    );
  }

  // Show MFA setup modal (required for admins)
  if (mfaSetupRequired) {
    return (
      <MFASetup
        token={partialToken}
        onComplete={handleMFASetupComplete}
      />
    );
  }

  // Show welcome coupon modal
  if (welcomeCoupon) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }}>
        <Card className="w-full max-w-md relative" style={{ backgroundColor: '#000000', border: '1px solid rgba(212, 169, 104, 0.5)' }}>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 169, 104, 0.1)' }}>
                <Gift className="w-10 h-10 text-[#d4a968]" />
              </div>
              
              <h2 className="text-2xl font-light tracking-[0.15em] uppercase text-white mb-2">
                ¡Bienvenido a Avenue!
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Gracias por crear tu cuenta. Aquí está tu cupón de bienvenida:
              </p>
              
              <div className="bg-gradient-to-r from-[#d4a968]/20 to-[#d4a968]/10 border border-[#d4a968]/50 rounded-xl p-6 mb-6">
                <p className="text-xs text-gray-400 mb-2 tracking-[0.15em] uppercase">Tu cupón de 10% de descuento</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-[#d4a968] tracking-wider">
                    {welcomeCoupon}
                  </span>
                  <button
                    onClick={handleCopyCoupon}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copiar código"
                  >
                    {couponCopied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Válido por 30 días • Un solo uso
                </p>
              </div>
              
              <p className="text-xs text-gray-500 mb-6">
                Usalo en el checkout ingresando el código en el campo de cupón de descuento.
              </p>
              
              <Button
                onClick={handleContinueAfterCoupon}
                className="w-full py-3 text-sm tracking-[0.15em] uppercase"
                style={{ backgroundColor: '#d4a968', color: '#000' }}
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
      <Card className="w-full max-w-md relative" style={{ backgroundColor: '#000000', border: '1px solid rgba(212, 169, 104, 0.3)' }}>
        <CardHeader className="pb-2">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xl text-gray-500 hover:text-white transition-colors"
          >
            ×
          </button>
          <div className="text-center pt-2">
            <h2 className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-1">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-xs tracking-[0.15em] uppercase text-gray-500">
              {isLogin ? 'Bienvenido a Avenue' : 'Únete a Avenue'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 rounded text-center text-xs tracking-wider" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs tracking-[0.1em] uppercase mb-2 text-gray-400">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 rounded-none border text-sm tracking-wide"
                    style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ede4' }}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-[0.1em] uppercase mb-2 text-gray-400">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 rounded-none border text-sm tracking-wide"
                    style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ede4' }}
                    placeholder="+595 9XX XXX XXX"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase mb-2 text-gray-400">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 rounded-none border text-sm tracking-wide"
                style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ede4' }}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs tracking-[0.1em] uppercase mb-2 text-gray-400">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-4 rounded-none border pr-12 text-sm tracking-wide"
                  style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', color: '#f5ede4' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-4 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all hover:opacity-90"
              disabled={loading}
              style={{ backgroundColor: '#d4a968', color: '#000000' }}
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-xs tracking-[0.1em] uppercase" style={{ backgroundColor: '#000000', color: '#666' }}>
                  o continuar con
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full mt-6 py-4 rounded-none flex items-center justify-center gap-3 text-xs tracking-[0.15em] uppercase transition-all hover:bg-white/5"
              style={{ backgroundColor: 'transparent', color: '#f5ede4', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-sm"
              style={{ color: '#d4a968' }}
            >
              <span className="text-xs tracking-[0.1em] uppercase text-gray-500 hover:text-[#d4a968] transition-colors">
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </span>
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
