import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Gift, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MFAVerification, MFASetup } from './MFAComponents';
import { trackLogin, trackSignUp } from '../utils/analytics';

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
    phone: '',
    acceptTerms: false
  });

  // Use current origin for production, fallback to env variable for development
  const API_URL = window.location.hostname === 'localhost' 
    ? (process.env.REACT_APP_BACKEND_URL || '') 
    : window.location.origin;

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

      // CRITICAL: Check if user is a creator with incomplete profile
      // Must redirect to onboarding IMMEDIATELY before allowing any navigation
      if (isLogin && data.token && data.has_creator_profile) {
        try {
          const creatorRes = await fetch(`${API_URL}/api/ugc/creators/me`, {
            headers: { 'Authorization': `Bearer ${data.token}` }
          });
          
          if (creatorRes.ok) {
            const creatorData = await creatorRes.json();
            if (creatorData.needs_profile_update) {
              // Force redirect to onboarding
              console.log('Creator profile incomplete, forcing onboarding redirect');
              window.location.href = '/ugc/creator/onboarding';
              return;
            }
          }
        } catch (creatorErr) {
          console.error('Error checking creator profile:', creatorErr);
          // Continue with normal flow if check fails
        }
      }

      // Check for welcome coupon (new registration)
      if (data.welcome_coupon) {
        setWelcomeCoupon(data.welcome_coupon);
        // Store the user data to pass after modal closes
        localStorage.setItem('pending_login_data', JSON.stringify(data));
        // Track signup for new users
        trackSignUp('email');
      } else {
        // Track login
        trackLogin('email');
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA verification success
  const handleMFAVerified = async (data) => {
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    setMfaRequired(false);
    setPartialToken(null);
    trackLogin('email_mfa');
    
    // CRITICAL: Check if user is a creator with incomplete profile
    if (data.token && data.has_creator_profile) {
      try {
        const creatorRes = await fetch(`${API_URL}/api/ugc/creators/me`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        
        if (creatorRes.ok) {
          const creatorData = await creatorRes.json();
          if (creatorData.needs_profile_update) {
            console.log('Creator profile incomplete after MFA, forcing onboarding redirect');
            window.location.href = '/ugc/creator/onboarding';
            return;
          }
        }
      } catch (creatorErr) {
        console.error('Error checking creator profile:', creatorErr);
      }
    }
    
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

            {/* Terms checkbox - only for registration */}
            {!isLogin && (
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="sr-only"
                      data-testid="register-accept-terms-checkbox"
                    />
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                      formData.acceptTerms 
                        ? 'border-[#d4a968] bg-[#d4a968]' 
                        : 'border-gray-500 group-hover:border-gray-400'
                    }`}>
                      {formData.acceptTerms && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    Acepto los{' '}
                    <a 
                      href="/shop/terminos-condiciones" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#d4a968] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      términos y condiciones
                    </a>
                    {' '}y la{' '}
                    <a 
                      href="/politica-privacidad" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#d4a968] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      política de privacidad
                    </a>
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all hover:opacity-90"
              disabled={loading || (!isLogin && !formData.acceptTerms)}
              style={{ 
                backgroundColor: (!isLogin && !formData.acceptTerms) ? '#555' : '#d4a968', 
                color: '#000000',
                cursor: (!isLogin && !formData.acceptTerms) ? 'not-allowed' : 'pointer'
              }}
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
  const [status, setStatus] = useState('connecting');
  const [attempts, setAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [pendingAuthData, setPendingAuthData] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const hasProcessed = React.useRef(false);
  const shouldStop = React.useRef(false);
  const isProcessing = React.useRef(false);
  
  // Use current origin for production, fallback to env variable for development
  const API_URL = window.location.hostname === 'localhost' 
    ? (process.env.REACT_APP_BACKEND_URL || '') 
    : window.location.origin;
  
  const MAX_ATTEMPTS = 5;
  const RETRY_DELAY = 2000;

  const messages = [
    'Conectando...',
    'Un momento...',
    'Casi listo...',
    'Verificando...',
    'Último intento...'
  ];

  React.useEffect(() => {
    // Strict check to prevent multiple calls
    if (hasProcessed.current || isProcessing.current) {
      console.log('AuthCallback: Already processed or processing, skipping');
      return;
    }
    hasProcessed.current = true;
    isProcessing.current = true;

    const processAuth = async (retryCount = 0) => {
      if (shouldStop.current || retryCount >= MAX_ATTEMPTS) {
        setError('No se pudo conectar después de varios intentos.');
        setStatus('error');
        isProcessing.current = false;
        return;
      }

      try {
        setAttempts(retryCount + 1);
        
        // Get session_id from URL
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        const fullUrl = window.location.href;
        
        let sessionId = null;
        
        // Try fragment first
        if (hash.includes('session_id=')) {
          sessionId = new URLSearchParams(hash.substring(1)).get('session_id');
        }
        
        // Try query params
        if (!sessionId && search.includes('session_id=')) {
          sessionId = new URLSearchParams(search).get('session_id');
        }
        
        // Debug info
        const debug = `URL: ${fullUrl.substring(0, 100)}... | Hash: ${hash.substring(0, 50)} | Session: ${sessionId ? 'found' : 'NOT FOUND'}`;
        setDebugInfo(debug);
        console.log('AuthCallback Debug:', debug);

        if (!sessionId) {
          setError('No se encontró la sesión de Google. Intentá iniciar sesión de nuevo.');
          setStatus('error');
          isProcessing.current = false;
          return;
        }

        // Call backend
        const callUrl = `${API_URL}/api/auth/google/callback`;
        console.log('Calling:', callUrl);
        
        // Create AbortController for this request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(callUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        
        // Read response as text first to avoid "body stream already read" error
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseErr) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Error del servidor - respuesta inválida');
        }
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.detail || 'Error de autenticación');
        }

        // Success!
        shouldStop.current = true;
        isProcessing.current = false;
        
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }

        // Clear URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Check if user needs to accept terms (new Google user)
        if (data.needs_terms_acceptance) {
          setPendingAuthData(data);
          setShowTermsModal(true);
          setStatus('terms');
          return;
        }
        
        // CRITICAL: Check if user is a creator with incomplete profile
        // Must redirect to onboarding IMMEDIATELY before allowing any navigation
        if (data.token && data.has_creator_profile) {
          console.log('User has creator profile, checking if complete...');
          try {
            const creatorRes = await fetch(`${API_URL}/api/ugc/creators/me`, {
              headers: { 'Authorization': `Bearer ${data.token}` }
            });
            
            console.log('Creator profile check response status:', creatorRes.status);
            
            if (creatorRes.ok) {
              const creatorText = await creatorRes.text();
              let creatorData;
              try {
                creatorData = JSON.parse(creatorText);
              } catch (e) {
                console.error('Failed to parse creator response:', creatorText);
                creatorData = {};
              }
              
              console.log('Creator profile needs_profile_update:', creatorData.needs_profile_update);
              console.log('Creator profile missing_fields:', creatorData.missing_fields);
              
              if (creatorData.needs_profile_update) {
                // Force redirect to onboarding - don't call onAuthComplete yet
                console.log('Creator profile incomplete, forcing onboarding redirect NOW');
                // Use replace to prevent back button from returning here
                window.location.replace('/ugc/creator/onboarding');
                return;
              }
            } else {
              console.error('Creator profile check failed with status:', creatorRes.status);
            }
          } catch (creatorErr) {
            console.error('Error checking creator profile:', creatorErr);
            // Continue with normal flow if check fails
          }
        } else {
          console.log('User does not have creator profile or no token, skipping check');
          console.log('has_creator_profile:', data.has_creator_profile);
        }
        
        if (onAuthComplete) {
          onAuthComplete(data);
        }
      } catch (err) {
        console.error('Auth error:', err.message, err);
        
        if (shouldStop.current) {
          isProcessing.current = false;
          return;
        }
        
        const isNetworkError = err.message === 'Load failed' || 
                              err.message === 'Failed to fetch' ||
                              err.name === 'TypeError' ||
                              err.name === 'AbortError';
        
        // Also retry on "body stream already read" errors
        const isBodyStreamError = err.message?.includes('body stream already read');
        
        if ((isNetworkError || isBodyStreamError) && retryCount < MAX_ATTEMPTS - 1) {
          setStatus('retrying');
          setDebugInfo(prev => prev + ` | Retry ${retryCount + 1}: ${err.message}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          if (!shouldStop.current) {
            return processAuth(retryCount + 1);
          }
        } else {
          setError(`Error: ${err.message}`);
          setStatus('error');
          isProcessing.current = false;
        }
      }
    };

    processAuth();
    
    return () => {
      shouldStop.current = true;
    };
  }, []); // Empty deps - run once only

  // Handle terms acceptance
  const handleAcceptTerms = async () => {
    if (!acceptedTerms || !pendingAuthData) return;
    
    setSavingTerms(true);
    try {
      // Save terms acceptance
      const termsToAccept = [
        { terms_slug: 'privacy-policy', terms_version: '1.0' },
        { terms_slug: 'terms-ecommerce', terms_version: '1.0' }
      ];
      
      const token = localStorage.getItem('auth_token');
      for (const term of termsToAccept) {
        await fetch(`${API_URL}/api/terms/accept`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(term)
        });
      }
      
      // Complete auth
      setShowTermsModal(false);
      if (onAuthComplete) {
        onAuthComplete(pendingAuthData);
      }
    } catch (err) {
      console.error('Failed to save terms:', err);
      // Still complete auth even if terms save fails
      if (onAuthComplete) {
        onAuthComplete(pendingAuthData);
      }
    } finally {
      setSavingTerms(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setStatus('connecting');
    setAttempts(0);
    setDebugInfo('');
    shouldStop.current = false;
    hasProcessed.current = false;
    window.location.reload(); // Full reload to retry
  };

  const handleCancel = () => {
    shouldStop.current = true;
    // Clear hash and go home
    window.history.replaceState(null, '', '/');
    window.location.href = '/';
  };

  // Show terms acceptance modal for new Google users
  if (showTermsModal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968', maxWidth: '450px', width: '90%' }}>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#d4a968]/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[#d4a968]" />
              </div>
              <h2 className="text-xl font-medium" style={{ color: '#f5ede4' }}>
                ¡Bienvenido a Avenue!
              </h2>
              <p className="text-sm mt-2" style={{ color: '#a8a8a8' }}>
                Para continuar, necesitamos que aceptes nuestros términos
              </p>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="sr-only"
                    data-testid="google-accept-terms-checkbox"
                  />
                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                    acceptedTerms 
                      ? 'border-[#d4a968] bg-[#d4a968]' 
                      : 'border-gray-500 group-hover:border-gray-400'
                  }`}>
                    {acceptedTerms && <Check className="w-3 h-3 text-black" />}
                  </div>
                </div>
                <span className="text-sm" style={{ color: '#a8a8a8' }}>
                  Acepto los{' '}
                  <a 
                    href="/shop/terminos-condiciones" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#d4a968] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    términos y condiciones
                  </a>
                  {' '}y la{' '}
                  <a 
                    href="/politica-privacidad" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#d4a968] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    política de privacidad
                  </a>
                </span>
              </label>
            </div>
            
            <Button
              onClick={handleAcceptTerms}
              disabled={!acceptedTerms || savingTerms}
              className="w-full py-4 rounded-none text-xs tracking-[0.2em] uppercase font-medium transition-all"
              style={{ 
                backgroundColor: acceptedTerms ? '#d4a968' : '#555', 
                color: '#000000',
                cursor: acceptedTerms ? 'pointer' : 'not-allowed'
              }}
            >
              {savingTerms ? 'Guardando...' : 'Continuar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardContent className="p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p style={{ color: '#f5ede4', marginBottom: '8px', fontSize: '16px' }}>{error}</p>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              Intentos: {attempts}
            </p>
            {/* Debug info for troubleshooting */}
            <p style={{ color: '#444', marginBottom: '20px', fontSize: '10px', wordBreak: 'break-all' }}>
              {debugInfo}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRetry}
                style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
              >
                Reintentar
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                style={{ borderColor: '#333', color: '#888' }}
              >
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-[#d4a968]/20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a968] animate-spin"></div>
        </div>
        
        <p style={{ color: '#f5ede4', fontSize: '18px', marginBottom: '8px' }}>
          {messages[Math.min(attempts - 1, messages.length - 1)] || 'Conectando...'}
        </p>
        
        {status === 'retrying' && attempts > 1 && (
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
            Intento {attempts} de {MAX_ATTEMPTS}
          </p>
        )}
        
        {/* Show debug info after first attempt */}
        {attempts > 0 && debugInfo && (
          <p style={{ color: '#333', fontSize: '9px', marginBottom: '12px', maxWidth: '300px', margin: '0 auto', wordBreak: 'break-all' }}>
            {debugInfo}
          </p>
        )}
        
        <button
          onClick={handleCancel}
          className="mt-6 text-sm underline"
          style={{ color: '#666' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
