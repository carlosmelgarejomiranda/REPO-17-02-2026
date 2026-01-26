import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Loader2, Building2, Globe, Instagram, Phone, User, Mail, 
  AlertCircle, LogIn, Check, Lock, Eye, EyeOff, Users, CheckCircle
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

const API_URL = getApiUrl();

const BrandOnboarding = ({ user: propUser, onLoginClick }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPackage = searchParams.get('package');
  
  // Steps: 1 = Auth, 2 = Required Data, 3 = Optional Data
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [formData, setFormData] = useState({
    // Auth (Step 1)
    email: '',
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
    description: '',
    // Terms acceptance (Step 3 - Required)
    acceptTerms: false
  });

  useEffect(() => {
    checkAuth();
  }, []);

  // Re-check auth when user prop changes (after modal login)
  useEffect(() => {
    if (propUser && !isAuthenticated) {
      checkAuth();
    }
  }, [propUser]);

  const checkAuth = async () => {
    try {
      // Try with token first, then cookies
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_URL}/api/auth/me`, { 
        headers,
        credentials: 'include' 
      });
      
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
        const brandRes = await fetch(`${API_URL}/api/ugc/brands/me`, { 
          headers,
          credentials: 'include' 
        });
        
        if (brandRes.ok) {
          // Already has brand profile - show message instead of redirecting
          setAlreadyRegistered(true);
          return;
        }
        
        setStep(2); // Skip to step 2 if logged in but no brand profile
      }
    } catch (err) {
      // Not authenticated
      console.error('Auth check error:', err);
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
        description: formData.description,
        accept_terms: formData.acceptTerms
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

      // Record terms acceptance if checkbox was checked
      if (formData.acceptTerms && token) {
        try {
          await fetch(`${API_URL}/api/terms/accept`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              terms_slug: 'terms-ugc-brand',
              terms_version: '1.0'
            })
          });
        } catch (termsErr) {
          console.error('Failed to record terms acceptance:', termsErr);
          // Don't fail the onboarding if terms recording fails
        }
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

  // Handle login click - save redirect path first
  const handleLoginClick = () => {
    sessionStorage.setItem('redirect_after_login', '/ugc/brand/onboarding');
    if (onLoginClick) {
      onLoginClick();
    }
  };

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

  // Show message if already registered as brand
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
            <button onClick={() => navigate('/ugc/marcas')} className="text-gray-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <span className="text-[#d4a968] italic">Registro de Marca</span>
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-light mb-4">
            ¡Ya estás <span className="text-[#d4a968] italic">registrado</span>!
          </h1>
          
          <p className="text-gray-400 mb-8">
            Tu marca ya está registrada en nuestra plataforma. Podés acceder a tu panel para ver tus campañas y gestionar tu perfil.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/ugc/brand/dashboard')}
              className="w-full bg-[#d4a968] text-black py-4 px-6 rounded-lg font-medium hover:bg-[#c49958] transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Ir a mi Panel de Marca
            </button>
            
            <button
              onClick={() => navigate('/ugc/marcas')}
              className="w-full border border-white/20 text-white py-3 px-6 rounded-lg hover:bg-white/5 transition-all"
            >
              Ver información de marcas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
<div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <button onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/ugc/marcas');
            }
          }} className="text-gray-400 hover:text-white flex items-center gap-2">
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

        {/* STEP 1: Authentication - Show login prompt instead of custom form */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-[#d4a968]/20 rounded-full flex items-center justify-center mb-6">
                <Lock className="w-10 h-10 text-[#d4a968]" />
              </div>
              <h1 className="text-3xl font-light mb-3">
                Primero, <span className="text-[#d4a968] italic">iniciá sesión</span>
              </h1>
              <p className="text-gray-400 max-w-md mx-auto">
                Para crear tu perfil de marca necesitás una cuenta de Avenue. 
                Podés iniciar sesión o crear una cuenta nueva.
              </p>
            </div>

            <div className="max-w-sm mx-auto space-y-4">
              <button
                onClick={handleLoginClick}
                className="w-full py-4 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-all flex items-center justify-center gap-3"
                data-testid="brand-onboarding-login-btn"
              >
                <LogIn className="w-5 h-5" />
                Iniciar Sesión / Crear Cuenta
              </button>

              <p className="text-center text-gray-500 text-sm">
                Ya tenés cuenta? Usá el mismo usuario que usás para la tienda o el estudio.
              </p>
            </div>

            {/* Benefits preview */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-center text-gray-400 mb-6">¿Por qué registrarte como marca?</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <Users className="w-8 h-8 text-[#d4a968] mx-auto mb-2" />
                  <p className="text-sm text-white">Acceso a +50 creadores</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <Building2 className="w-8 h-8 text-[#d4a968] mx-auto mb-2" />
                  <p className="text-sm text-white">Campañas personalizadas</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-[#d4a968] mx-auto mb-2" />
                  <p className="text-sm text-white">Métricas verificadas</p>
                </div>
              </div>
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
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rubro *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none appearance-none cursor-pointer"
                  style={{ colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                >
                  <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Seleccionar...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>{ind}</option>)}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">País *</label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    {COUNTRIES.map(c => <option key={c.code} value={c.code} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Seleccionar...</option>
                    {availableCities.map(city => <option key={city} value={city} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>{city}</option>)}
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
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Apellido *</label>
                  <input
                    type="text"
                    value={formData.contact_last_name}
                    onChange={(e) => handleChange('contact_last_name', e.target.value)}
                    placeholder="Pérez"
                    className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.phone_country_code}
                    onChange={(e) => handleChange('phone_country_code', e.target.value)}
                    className="w-32 px-3 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
                  >
                    {COUNTRIES.filter(c => c.phoneCode).map(c => (
                      <option key={c.code} value={c.phoneCode} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>{c.flag} {c.phoneCode}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleChange('contact_phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="981123456"
                    className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
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
                    className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-r-lg text-white focus:border-[#d4a968] focus:outline-none"
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
                    className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-r-lg text-white focus:border-[#d4a968] focus:outline-none"
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
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none"
                />
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="pt-4 border-t border-white/10">
                <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                      className="sr-only"
                      data-testid="brand-accept-terms-checkbox"
                    />
                    <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                      formData.acceptTerms 
                        ? 'border-[#d4a968] bg-[#d4a968]' 
                        : 'border-gray-500 group-hover:border-gray-400'
                    }`}>
                      {formData.acceptTerms && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 leading-relaxed">
                    Acepto los{' '}
                    <a 
                      href="/terminos-condiciones" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#d4a968] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      términos y condiciones para marcas UGC
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
                    {' '}*
                  </span>
                </label>
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
                disabled={loading || !formData.acceptTerms}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  !loading && formData.acceptTerms ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
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
