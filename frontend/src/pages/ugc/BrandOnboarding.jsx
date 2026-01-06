import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Loader2, Building2, Globe, Instagram, Phone, User, Mail, 
  AlertCircle, LogIn, Check, Lock, Eye, EyeOff
} from 'lucide-react';

const INDUSTRIES = [
  'Gastronomía', 'Moda', 'Belleza', 'Tecnología', 'Salud & Fitness',
  'Hogar & Deco', 'Turismo', 'Entretenimiento', 'Retail', 'Servicios', 'Educación', 'Finanzas', 'Otro'
];

const COUNTRIES = [
  { code: 'PY', name: 'Paraguay', phoneCode: '+595', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', phoneCode: '+55', flag: '🇧🇷' },
  { code: 'UY', name: 'Uruguay', phoneCode: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', phoneCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', phoneCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', phoneCode: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', phoneCode: '+593', flag: '🇪🇨' },
  { code: 'MX', name: 'México', phoneCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', phoneCode: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', phoneCode: '+1', flag: '🇺🇸' },
  { code: 'OTHER', name: 'Otro', phoneCode: '', flag: '🌍' }
];

const CITIES_BY_COUNTRY = {
  PY: ['Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este', 'Otra'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Otra'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Otra'],
  UY: ['Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Otra'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Viña del Mar', 'Otra'],
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Otra'],
  PE: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Otra'],
  EC: ['Quito', 'Guayaquil', 'Cuenca', 'Otra'],
  MX: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Otra'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Otra'],
  US: ['Miami', 'New York', 'Los Angeles', 'Houston', 'Otra'],
  OTHER: ['Otra']
};

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const BrandOnboarding = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPackage = searchParams.get('package');
  
  // Steps: 1 = Auth, 2 = Required Data, 3 = Optional Data
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Auth (Step 1)
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    // Required (Step 2)
    company_name: '',
    industry: '',
    country: 'PY',
    city: '',
    contact_first_name: '',
    contact_last_name: '',
    phone_country_code: '+595',
    contact_phone: '',
    // Optional (Step 3)
    website: '',
    instagram: '',
    description: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const userData = await res.json();
        setIsAuthenticated(true);
        setFormData(prev => ({
          ...prev,
          email: userData.email || '',
          contact_first_name: userData.name?.split(' ')[0] || '',
          contact_last_name: userData.name?.split(' ').slice(1).join(' ') || ''
        }));
        
        // Check if already has brand profile
        const brandRes = await fetch(`${API_URL}/api/ugc/brands/me`, { credentials: 'include' });
        if (brandRes.ok) {
          // Already has brand profile, redirect to dashboard
          navigate('/ugc/brand/dashboard');
          return;
        }
        
        setStep(2); // Skip to step 2 if logged in but no brand profile
      }
    } catch (err) {
      // Not authenticated
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      phone_country_code: country?.phoneCode || '',
      city: ''
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const cleanUrl = (url) => url ? url.replace(/^(https?:\/\/)?(www\.)?/i, '').trim() : '';
  const cleanInstagram = (handle) => handle ? handle.replace(/^@/, '').trim() : '';

  // Step 1: Handle Login
  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Por favor ingresa email y contraseña');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Error de conexión' }));
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      const data = await res.json();

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
        setFormData(prev => ({
          ...prev,
          contact_first_name: data.name?.split(' ')[0] || prev.contact_first_name,
          contact_last_name: data.name?.split(' ').slice(1).join(' ') || prev.contact_last_name
        }));
        
        // Check if already has brand profile
        const brandRes = await fetch(`${API_URL}/api/ugc/brands/me`, { 
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (brandRes.ok) {
          navigate('/ugc/brand/dashboard');
          return;
        }
        
        setStep(2);
      } else if (data.mfa_required) {
        throw new Error('MFA requerido. Por favor usa el botón de inicio de sesión principal.');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Handle Register
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          name: formData.name || formData.email.split('@')[0]
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Error al registrarse');
      }

      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setIsAuthenticated(true);
        setStep(2);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 validation
  const isStep2Valid = formData.company_name && formData.industry && formData.country && 
                       formData.city && formData.contact_first_name && formData.contact_last_name && 
                       formData.contact_phone;

  // Final submit (Step 3)
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const submitData = {
        email: formData.email,
        company_name: formData.company_name,
        industry: formData.industry,
        country: formData.country,
        city: formData.city,
        contact_name: `${formData.contact_first_name} ${formData.contact_last_name}`.trim(),
        contact_first_name: formData.contact_first_name,
        contact_last_name: formData.contact_last_name,
        contact_phone: `${formData.phone_country_code}${formData.contact_phone}`,
        phone_country_code: formData.phone_country_code,
        website: formData.website ? `https://${cleanUrl(formData.website)}` : '',
        instagram_url: formData.instagram ? `https://instagram.com/${cleanInstagram(formData.instagram)}` : '',
        instagram_handle: cleanInstagram(formData.instagram),
        description: formData.description
      };

      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/brands/onboarding`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const responseText = await res.text();
      let data;
      try { data = JSON.parse(responseText); } catch { data = { detail: responseText }; }

      if (!res.ok) {
        throw new Error(data.detail || 'Error al crear perfil');
      }

      // Success! Go to brand dashboard
      navigate('/ugc/brand/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const availableCities = CITIES_BY_COUNTRY[formData.country] || ['Otra'];

  const steps = [
    { num: 1, label: 'Cuenta', icon: Lock },
    { num: 2, label: 'Datos', icon: Building2 },
    { num: 3, label: 'Completar', icon: Check }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <span className="text-[#d4a968] italic">Registro de Marca</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <React.Fragment key={s.num}>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isActive ? 'bg-[#d4a968] text-black' : 
                    isCompleted ? 'bg-green-500/20 text-green-400' : 
                    'bg-white/5 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-12 h-0.5 ${step > s.num ? 'bg-green-500' : 'bg-white/10'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* STEP 1: Authentication */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-light mb-3">
                {authMode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
              </h1>
              <p className="text-gray-400">
                {authMode === 'login' 
                  ? 'Ingresá con tu cuenta de Avenue' 
                  : 'Registrate para comenzar a crear campañas UGC'}
              </p>
            </div>

            {/* Auth Mode Tabs */}
            <div className="flex bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  authMode === 'login' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${
                  authMode === 'register' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                Registrarse
              </button>
            </div>

            <div className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Contraseña *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirmar contraseña *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                    required
                  />
                </div>
              )}

              <button
                onClick={authMode === 'login' ? handleLogin : handleRegister}
                disabled={loading || !formData.email || !formData.password}
                className={`w-full py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  !loading && formData.email && formData.password
                    ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</>
                ) : (
                  <>{authMode === 'login' ? 'Continuar' : 'Crear cuenta'} <ArrowRight className="w-5 h-5" /></>
                )}
              </button>

              {/* Google login option */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-black text-gray-500">o continuar con</span></div>
              </div>

              <button
                onClick={onLoginClick}
                className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Required Data */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-3">
                Datos de tu <span className="text-[#d4a968] italic">empresa</span>
              </h1>
              <p className="text-gray-400">Información básica para crear tu perfil de marca</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de la empresa *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  placeholder="Mi Empresa S.A."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rubro *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                >
                  <option value="" className="bg-black">Seleccionar...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind} className="bg-black">{ind}</option>)}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">País *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code} className="bg-black">{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    <option value="" className="bg-black">Seleccionar...</option>
                    {availableCities.map(city => <option key={city} value={city} className="bg-black">{city}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre del contacto *</label>
                  <input
                    type="text"
                    value={formData.contact_first_name}
                    onChange={(e) => handleChange('contact_first_name', e.target.value)}
                    placeholder="Juan"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Apellido *</label>
                  <input
                    type="text"
                    value={formData.contact_last_name}
                    onChange={(e) => handleChange('contact_last_name', e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.phone_country_code}
                    onChange={(e) => handleChange('phone_country_code', e.target.value)}
                    className="w-32 px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    {COUNTRIES.filter(c => c.phoneCode).map(c => (
                      <option key={c.code} value={c.phoneCode} className="bg-black">{c.flag} {c.phoneCode}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="981123456"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  isStep2Valid ? 'bg-[#d4a968] text-black hover:bg-[#c49958]' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Siguiente <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Optional Data */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-3">
                Casi <span className="text-[#d4a968] italic">listo</span>
              </h1>
              <p className="text-gray-400">Información adicional para completar tu perfil (opcional)</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Sitio web</label>
                <div className="flex">
                  <span className="px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-lg text-gray-500 text-sm">https://</span>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleChange('website', cleanUrl(e.target.value))}
                    placeholder="miempresa.com.py"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Instagram</label>
                <div className="flex">
                  <span className="px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-lg text-gray-500 text-sm flex items-center gap-1">
                    <Instagram className="w-4 h-4" /> @
                  </span>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => handleChange('instagram', cleanInstagram(e.target.value))}
                    placeholder="miempresa"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripción de la empresa</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Contanos brevemente sobre tu empresa y qué tipo de contenido buscás..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 text-gray-400 hover:text-white flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  !loading ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-700 text-gray-400'
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creando perfil...</>
                ) : (
                  <><Check className="w-5 h-5" /> Completar registro</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandOnboarding;
