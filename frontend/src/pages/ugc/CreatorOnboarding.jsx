import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Instagram, Music2, Check, Loader2, LogIn, 
  Shield, Camera, Sparkles, CheckCircle, User, MapPin, Phone, 
  Briefcase, Globe, Calendar, CreditCard, Upload, X, Eye, EyeOff,
  ChevronDown, AlertCircle
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import SocialVerification from '../../components/SocialVerification';

const API_URL = getApiUrl();

const CATEGORIES = [
  'Gastronomía', 'Belleza', 'Moda', 'Lifestyle', 'Viajes',
  'Fitness', 'Tecnología', 'Mascotas', 'Maternidad', 'Hogar & Deco'
];

const COUNTRIES = [
  { code: 'PY', name: 'Paraguay', phoneCode: '+595' },
  { code: 'AR', name: 'Argentina', phoneCode: '+54' },
  { code: 'BR', name: 'Brasil', phoneCode: '+55' },
  { code: 'UY', name: 'Uruguay', phoneCode: '+598' },
  { code: 'BO', name: 'Bolivia', phoneCode: '+591' },
  { code: 'CL', name: 'Chile', phoneCode: '+56' },
  { code: 'CO', name: 'Colombia', phoneCode: '+57' },
  { code: 'PE', name: 'Perú', phoneCode: '+51' },
  { code: 'EC', name: 'Ecuador', phoneCode: '+593' },
  { code: 'VE', name: 'Venezuela', phoneCode: '+58' },
  { code: 'MX', name: 'México', phoneCode: '+52' },
  { code: 'ES', name: 'España', phoneCode: '+34' },
  { code: 'US', name: 'Estados Unidos', phoneCode: '+1' },
];

const CITIES_BY_COUNTRY = {
  PY: ['Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este', 'Otra'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Otra'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Otra'],
  UY: ['Montevideo', 'Salto', 'Paysandú', 'Otra'],
  BO: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Otra'],
  default: ['Capital', 'Otra']
};

const EDUCATION_LEVELS = [
  { value: 'secondary', label: 'Secundaria' },
  { value: 'technical', label: 'Técnico/Terciario' },
  { value: 'university', label: 'Universitario' },
  { value: 'postgraduate', label: 'Posgrado' },
  { value: 'other', label: 'Otro' }
];

const LANGUAGES = ['Español', 'Inglés', 'Portugués', 'Guaraní', 'Francés', 'Alemán', 'Italiano', 'Otro'];

const GENDERS = [
  { value: 'female', label: 'Femenino' },
  { value: 'male', label: 'Masculino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decir' }
];

const CreatorOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // Start at 0 for welcome message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [isProfileUpdate, setIsProfileUpdate] = useState(false); // True if updating existing profile

  // Form state - all 5 steps
  const [formData, setFormData] = useState({
    // Step 1: Personal Data
    name: '',
    birth_date: '',
    gender: '',
    document_id: '',
    // Step 2: Location & Contact
    country: 'PY',
    city: '',
    phone_country_code: '+595',
    phone: '',
    // Step 3: Professional Profile
    categories: [],
    bio: '',
    education_level: '',
    occupation: '',
    languages: ['Español'],
    portfolio_url: '',
    // Step 4: Social Networks
    instagram_username: '',
    tiktok_username: '',
    // Step 5: Profile Picture & Terms
    profile_picture: null,
    terms_accepted: false
  });

  // State for verification step
  const [verificationData, setVerificationData] = useState({});
  const [skipVerification, setSkipVerification] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Check authentication
  useEffect(() => {
    const verifyAuth = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setCurrentUser(null);
          setCheckingAuth(false);
          return;
        }
        
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData);
          
          // Pre-fill name from Google account
          if (userData.name) {
            setFormData(prev => ({ ...prev, name: userData.name }));
          }
          
          // Check if already has creator profile
          const creatorRes = await fetch(`${API_URL}/api/ugc/creators/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (creatorRes.ok) {
            const creatorData = await creatorRes.json();
            setExistingProfile(creatorData);
            
            // Check if profile needs update (missing critical fields)
            if (creatorData.needs_profile_update) {
              setIsProfileUpdate(true);
              setStep(0); // Show welcome message first
              
              // Pre-fill existing data
              prefillExistingData(creatorData);
            } else {
              // Profile is complete - show already registered message
              setAlreadyRegistered(true);
            }
          } else {
            // No profile - new onboarding
            setStep(1);
          }
        } else {
          localStorage.removeItem('auth_token');
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setCurrentUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    verifyAuth();
  }, []);

  // Pre-fill form with existing profile data
  const prefillExistingData = (profile) => {
    // Extract Instagram username from social_networks
    const instagramNetwork = profile.social_networks?.find(sn => sn.platform === 'instagram');
    const tiktokNetwork = profile.social_networks?.find(sn => sn.platform === 'tiktok');
    
    // Determine country code from existing data
    let countryCode = profile.country || 'PY';
    // If country is full name, try to find code
    const countryMatch = COUNTRIES.find(c => c.name === profile.country || c.code === profile.country);
    if (countryMatch) {
      countryCode = countryMatch.code;
    }
    
    setFormData(prev => ({
      ...prev,
      name: profile.name || prev.name,
      birth_date: profile.birth_date || '',
      gender: profile.gender || '',
      document_id: profile.document_id || '',
      country: countryCode,
      city: profile.city || '',
      phone_country_code: profile.phone_country_code || '+595',
      phone: profile.phone || '',
      categories: profile.categories || [],
      bio: profile.bio || '',
      education_level: profile.education_level || '',
      occupation: profile.occupation || '',
      languages: profile.languages || ['Español'],
      portfolio_url: profile.portfolio_url || '',
      instagram_username: instagramNetwork?.username || '',
      tiktok_username: tiktokNetwork?.username || '',
      terms_accepted: false // Must accept again
    }));
    
    // Set profile picture preview if exists
    if (profile.profile_picture) {
      setProfilePicturePreview(profile.profile_picture);
    }
  };

  // Update cities when country changes
  const getCities = useCallback(() => {
    return CITIES_BY_COUNTRY[formData.country] || CITIES_BY_COUNTRY.default;
  }, [formData.country]);

  // Handle country change
  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      phone_country_code: country?.phoneCode || '+595',
      city: '' // Reset city when country changes
    }));
  };

  // Handle category toggle
  const handleCategoryToggle = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  // Handle language toggle
  const handleLanguageToggle = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede ser mayor a 5MB');
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profile_picture: reader.result }));
      setProfilePicturePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove profile picture
  const removeProfilePicture = () => {
    setFormData(prev => ({ ...prev, profile_picture: null }));
    setProfilePicturePreview(null);
  };

  // Validate age (18+)
  const validateAge = (birthDate) => {
    if (!birthDate) return false;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 18;
  };

  // Validation per step
  const validateStep = (stepNumber) => {
    const errors = {};
    
    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) errors.name = 'Ingresá tu nombre completo';
        if (!formData.birth_date) {
          errors.birth_date = 'Seleccioná tu fecha de nacimiento';
        } else if (!validateAge(formData.birth_date)) {
          errors.birth_date = 'Debes ser mayor de 18 años para registrarte';
        }
        if (!formData.gender) errors.gender = 'Seleccioná tu género';
        if (!formData.document_id.trim()) errors.document_id = 'Ingresá tu número de cédula de identidad';
        break;
      case 2:
        if (!formData.country) errors.country = 'Seleccioná tu país de residencia';
        if (!formData.city) errors.city = 'Seleccioná tu ciudad';
        if (!formData.phone.trim()) {
          errors.phone = 'Ingresá tu número de teléfono o WhatsApp';
        } else if (!/^\d{6,15}$/.test(formData.phone.replace(/\s/g, ''))) {
          errors.phone = 'El número de teléfono debe tener entre 6 y 15 dígitos';
        }
        break;
      case 3:
        if (formData.categories.length === 0) errors.categories = 'Seleccioná al menos una categoría de contenido que te represente';
        break;
      case 4:
        if (!formData.instagram_username && !formData.tiktok_username) {
          errors.social = 'Conectá al menos una red social (Instagram o TikTok) para continuar';
        }
        break;
      case 5:
        if (!formData.terms_accepted) errors.terms = 'Debes aceptar los términos y condiciones para completar tu registro';
        break;
      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Get readable error summary for current step
  const getErrorSummary = () => {
    const errorList = Object.values(validationErrors);
    if (errorList.length === 0) return null;
    return errorList;
  };

  // Check if can proceed to next step
  const canProceed = () => {
    return validateStep(step);
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1);
      setError('');
    }
  };

  // Handle verification complete
  const handleVerificationComplete = (platform, data) => {
    setVerificationData(prev => ({
      ...prev,
      [platform]: data
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      
      // Prepare submit data
      const submitData = {
        // Step 1
        name: formData.name,
        birth_date: formData.birth_date,
        gender: formData.gender,
        document_id: formData.document_id,
        // Step 2
        country: formData.country,
        city: formData.city,
        phone_country_code: formData.phone_country_code,
        phone: formData.phone.replace(/\s/g, ''),
        // Step 3
        categories: formData.categories,
        bio: formData.bio || null,
        education_level: formData.education_level || null,
        occupation: formData.occupation || null,
        languages: formData.languages,
        portfolio_url: formData.portfolio_url || null,
        // Step 4
        instagram_username: formData.instagram_username || null,
        tiktok_username: formData.tiktok_username || null,
        social_verification: Object.keys(verificationData).length > 0 ? verificationData : null,
        // Step 5
        profile_picture: formData.profile_picture || null,
        terms_accepted: formData.terms_accepted,
        terms_version: '1.0'
      };
      
      // Use different endpoint for profile update vs new onboarding
      const endpoint = isProfileUpdate 
        ? `${API_URL}/api/ugc/creators/me/complete-profile`
        : `${API_URL}/api/ugc/creators/onboarding`;
      
      const response = await fetch(endpoint, {
        method: isProfileUpdate ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al actualizar perfil');
      }

      // Redirect to creator dashboard
      navigate('/ugc/creator/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      
      // Parse server error for better messages
      let errorMessage = 'Error de conexión. Por favor intenta de nuevo.';
      
      if (err.message) {
        // Map common server errors to user-friendly messages
        const errorMappings = {
          'Debes ser mayor de 18 años': 'Debes ser mayor de 18 años para registrarte como creador.',
          'Invalid salt': 'Error de autenticación. Por favor cerrá sesión e ingresá nuevamente.',
          'terms': 'Debes aceptar los términos y condiciones para continuar.',
          'already exists': 'Ya existe una cuenta con este correo electrónico.',
          'document_id': 'El número de documento ingresado no es válido.',
          'phone': 'El número de teléfono ingresado no es válido.',
          'categories': 'Seleccioná al menos una categoría de contenido.',
          'social': 'Conectá al menos una red social (Instagram o TikTok).',
          'profile_picture': 'Error al subir la foto de perfil. Intentá con otra imagen.',
          'network': 'Error de conexión. Verificá tu conexión a internet.',
          'Failed to fetch': 'Error de conexión. Verificá tu conexión a internet.',
        };
        
        // Check if error message matches any known pattern
        for (const [key, message] of Object.entries(errorMappings)) {
          if (err.message.toLowerCase().includes(key.toLowerCase())) {
            errorMessage = message;
            break;
          }
        }
        
        // If no match found, use the original error message if it looks user-friendly
        if (errorMessage === 'Error de conexión. Por favor intenta de nuevo.' && 
            err.message.length < 200 && 
            !err.message.includes('Error') &&
            !err.message.includes('exception')) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  // Show message if already registered
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
            <button onClick={() => navigate('/ugc/creators')} className="text-gray-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <span className="text-xl font-light">
              <span className="text-[#d4a968] italic">Avenue</span> UGC
            </span>
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
            Tu perfil de creator ya está activo. Podés acceder a tu panel para ver campañas y gestionar tu perfil.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/ugc/creator/dashboard')}
              data-testid="go-to-dashboard-btn"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Ir a mi Panel de Creator
            </button>
            
            <button
              onClick={() => navigate('/ugc/creators')}
              className="w-full border border-white/20 text-white py-3 px-6 rounded-lg hover:bg-white/5 transition-all"
            >
              Ver información de creators
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
            <button onClick={() => navigate('/ugc/creators')} className="text-gray-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <span className="text-xl font-light">
              <span className="text-[#d4a968] italic">Avenue</span> UGC
            </span>
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-purple-400" />
          </div>
          
          <h1 className="text-3xl font-light mb-4">
            ¡Hola, <span className="text-[#d4a968] italic">Creator</span>!
          </h1>
          
          <p className="text-gray-400 mb-8">
            Para crear tu perfil de creator necesitás iniciar sesión o crear una cuenta primero.
          </p>
          
          <button
            onClick={() => {
              sessionStorage.setItem('redirect_after_login', '/ugc/creator/onboarding');
              navigate('/?login=creator');
            }}
            data-testid="login-btn"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Iniciar sesión / Registrarme
          </button>
          
          <p className="text-gray-500 text-sm mt-6">
            Es rápido y fácil con tu cuenta de Google
          </p>
        </div>
      </div>
    );
  }

  // Step titles for progress
  const stepTitles = [
    'Bienvenido',
    'Datos Personales',
    'Ubicación y Contacto',
    'Perfil Profesional',
    'Redes Sociales',
    'Foto y Confirmación'
  ];

  // Welcome message for existing users who need to update
  if (step === 0 && isProfileUpdate) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="border-b border-white/10">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
            <span className="text-xl font-light">
              <span className="text-[#d4a968] italic">Avenue</span> UGC
            </span>
          </div>
        </div>
        
        <div className="max-w-lg mx-auto px-6 py-16 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#d4a968]/20 to-purple-500/20 flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-12 h-12 text-[#d4a968]" />
          </div>
          
          <h1 className="text-3xl font-light mb-4">
            ¡Hola, <span className="text-[#d4a968] italic">{existingProfile?.name?.split(' ')[0] || 'Creator'}</span>!
          </h1>
          
          <p className="text-gray-300 text-lg mb-6">
            Necesitamos actualizar tu información de contacto
          </p>
          
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-left mb-8">
            <p className="text-gray-400 mb-4">
              Para brindarte <span className="text-white font-medium">mejor soporte</span> y mejorar tu experiencia en la plataforma, necesitamos algunos datos adicionales:
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#d4a968]" />
                <span>Número de WhatsApp para que las marcas te contacten</span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#d4a968]" />
                <span>Fecha de nacimiento</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#d4a968]" />
                <span>Documento de identidad</span>
              </li>
            </ul>
          </div>
          
          <p className="text-gray-500 text-sm mb-8">
            Tus datos existentes ya están pre-cargados. Solo necesitás completar lo que falta.
          </p>
          
          <button
            onClick={() => setStep(1)}
            data-testid="start-update-btn"
            className="w-full bg-gradient-to-r from-[#d4a968] to-purple-500 text-black py-4 px-6 rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Actualizar mi perfil
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-gray-600 text-xs mt-6">
            Este proceso toma menos de 2 minutos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : (isProfileUpdate ? null : navigate('/ugc/creators'))} className={`text-gray-400 hover:text-white flex items-center gap-2 ${step === 1 && isProfileUpdate ? 'invisible' : ''}`}>
            <ArrowLeft className="w-5 h-5" />
            {step > 1 ? 'Anterior' : 'Volver'}
          </button>
          <span className="text-[#d4a968]">
            {isProfileUpdate ? 'Actualización de perfil' : `Paso ${step} de 5`}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-1 bg-gradient-to-r from-[#d4a968] to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          {stepTitles[step]}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        
        {/* ==================== STEP 1: Personal Data ==================== */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-light mb-2">Datos <span className="text-[#d4a968] italic">personales</span></h1>
              <p className="text-gray-400">Información básica para tu perfil</p>
            </div>

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre completo *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full bg-white/5 border ${validationErrors.name ? 'border-red-500' : 'border-white/10'} rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none`}
                    placeholder="Tu nombre completo"
                    data-testid="name-input"
                  />
                </div>
                {validationErrors.name && <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha de nacimiento *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={`w-full bg-white/5 border ${validationErrors.birth_date ? 'border-red-500' : 'border-white/10'} rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none`}
                    data-testid="birth-date-input"
                  />
                </div>
                {validationErrors.birth_date && <p className="text-red-400 text-sm mt-1">{validationErrors.birth_date}</p>}
                <p className="text-gray-500 text-xs mt-1">Debes ser mayor de 18 años</p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Género *</label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDERS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setFormData({...formData, gender: g.value})}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.gender === g.value
                          ? 'border-[#d4a968] bg-[#d4a968]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      data-testid={`gender-${g.value}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{g.label}</span>
                        {formData.gender === g.value && <Check className="w-4 h-4 text-[#d4a968]" />}
                      </div>
                    </button>
                  ))}
                </div>
                {validationErrors.gender && <p className="text-red-400 text-sm mt-1">{validationErrors.gender}</p>}
              </div>

              {/* Document ID */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Número de documento (CI) *</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.document_id}
                    onChange={(e) => setFormData({...formData, document_id: e.target.value.replace(/[^0-9.]/g, '')})}
                    className={`w-full bg-white/5 border ${validationErrors.document_id ? 'border-red-500' : 'border-white/10'} rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none`}
                    placeholder="Ej: 4.567.890"
                    data-testid="document-id-input"
                  />
                </div>
                {validationErrors.document_id && <p className="text-red-400 text-sm mt-1">{validationErrors.document_id}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 2: Location & Contact ==================== */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-light mb-2">Ubicación y <span className="text-[#d4a968] italic">contacto</span></h1>
              <p className="text-gray-400">¿Dónde te encontramos?</p>
            </div>

            <div className="space-y-6">
              {/* Country */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">País *</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none cursor-pointer appearance-none"
                    data-testid="country-select"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className={`w-full bg-[#1a1a1a] border ${validationErrors.city ? 'border-red-500' : 'border-white/10'} rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none cursor-pointer appearance-none`}
                    data-testid="city-select"
                  >
                    <option value="">Seleccionar ciudad</option>
                    {getCities().map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                </div>
                {validationErrors.city && <p className="text-red-400 text-sm mt-1">{validationErrors.city}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono (WhatsApp) *</label>
                <div className="flex gap-3">
                  <div className="w-28">
                    <select
                      value={formData.phone_country_code}
                      onChange={(e) => setFormData({...formData, phone_country_code: e.target.value})}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-3 text-white focus:border-[#d4a968] focus:outline-none cursor-pointer appearance-none text-center"
                      data-testid="phone-code-select"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.phoneCode}>{c.phoneCode}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/[^0-9\s]/g, '')})}
                      className={`w-full bg-white/5 border ${validationErrors.phone ? 'border-red-500' : 'border-white/10'} rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none`}
                      placeholder="981 234 567"
                      data-testid="phone-input"
                    />
                  </div>
                </div>
                {validationErrors.phone && <p className="text-red-400 text-sm mt-1">{validationErrors.phone}</p>}
                <p className="text-gray-500 text-xs mt-1">Las marcas te contactarán por WhatsApp</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: Professional Profile ==================== */}
        {step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-light mb-2">Perfil <span className="text-[#d4a968] italic">profesional</span></h1>
              <p className="text-gray-400">Contanos sobre tu trabajo como creator</p>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Categorías de contenido *</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        formData.categories.includes(cat)
                          ? 'border-[#d4a968] bg-[#d4a968]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{cat}</span>
                        {formData.categories.includes(cat) && <Check className="w-4 h-4 text-[#d4a968]" />}
                      </div>
                    </button>
                  ))}
                </div>
                {validationErrors.categories && <p className="text-red-400 text-sm mt-1">{validationErrors.categories}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio (opcional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Contá un poco sobre vos y tu contenido..."
                  data-testid="bio-input"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nivel educativo (opcional)</label>
                <select
                  value={formData.education_level}
                  onChange={(e) => setFormData({...formData, education_level: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="">Seleccionar</option>
                  {EDUCATION_LEVELS.map(ed => (
                    <option key={ed.value} value={ed.value}>{ed.label}</option>
                  ))}
                </select>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ocupación (opcional)</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                    placeholder="Ej: Estudiante, Diseñador, etc."
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Idiomas</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all ${
                        formData.languages.includes(lang)
                          ? 'border-[#d4a968] bg-[#d4a968]/10 text-[#d4a968]'
                          : 'border-white/20 text-gray-400 hover:border-white/40'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Portfolio URL */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Portfolio o web personal (opcional)</label>
                <input
                  type="url"
                  value={formData.portfolio_url}
                  onChange={(e) => setFormData({...formData, portfolio_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="https://tu-portfolio.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 4: Social Networks ==================== */}
        {step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-light mb-2">Tus <span className="text-[#d4a968] italic">redes</span></h1>
              <p className="text-gray-400">Conectá al menos una red social</p>
            </div>

            <div className="space-y-6">
              {/* Instagram */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg">Instagram</span>
                </div>
                <input
                  type="text"
                  value={formData.instagram_username}
                  onChange={(e) => setFormData({...formData, instagram_username: e.target.value.replace('@', '')})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="@tu_usuario"
                  data-testid="instagram-input"
                />
              </div>

              {/* TikTok */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/20">
                    <Music2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg">TikTok</span>
                </div>
                <input
                  type="text"
                  value={formData.tiktok_username}
                  onChange={(e) => setFormData({...formData, tiktok_username: e.target.value.replace('@', '')})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="@tu_usuario"
                  data-testid="tiktok-input"
                />
              </div>

              {validationErrors.social && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.social}
                  </p>
                </div>
              )}

              {/* Verification Info */}
              <div className="p-5 bg-gradient-to-br from-[#d4a968]/20 to-purple-500/10 border border-[#d4a968]/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-[#d4a968]" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Verificación con IA</h3>
                    <p className="text-gray-300 text-sm">
                      Ahora podés verificar tus seguidores subiendo un screenshot. Los creadores verificados tienen <span className="text-[#d4a968] font-medium">3x más chances</span> de ser seleccionados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Component */}
              {(formData.instagram_username || formData.tiktok_username) && !skipVerification && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <SocialVerification 
                    onVerificationComplete={handleVerificationComplete}
                    initialData={verificationData}
                    saveImmediately={false}
                  />
                </div>
              )}

              {/* Show verified accounts */}
              {Object.keys(verificationData).length > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-green-400 text-sm font-medium mb-2">✓ Cuentas verificadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(verificationData).map(([platform, data]) => (
                      <span key={platform} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                        {platform}: {data.follower_count?.toLocaleString()} seguidores
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skip option */}
              {(formData.instagram_username || formData.tiktok_username) && Object.keys(verificationData).length === 0 && !skipVerification && (
                <button
                  onClick={() => setSkipVerification(true)}
                  className="w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
                >
                  Verificar después →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==================== STEP 5: Profile Picture & Confirmation ==================== */}
        {step === 5 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-light mb-2">Foto y <span className="text-[#d4a968] italic">confirmación</span></h1>
              <p className="text-gray-400">Último paso para completar tu perfil</p>
            </div>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm text-gray-400 mb-4">Foto de perfil (opcional)</label>
                <div className="flex items-center gap-6">
                  {/* Preview */}
                  <div className="relative">
                    {profilePicturePreview ? (
                      <div className="relative">
                        <img 
                          src={profilePicturePreview} 
                          alt="Preview" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-[#d4a968]"
                        />
                        <button
                          onClick={removeProfilePicture}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : currentUser?.picture ? (
                      <img 
                        src={currentUser.picture} 
                        alt="Google" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload button */}
                  <div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        data-testid="profile-picture-input"
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                        <Upload className="w-4 h-4" />
                        Subir foto
                      </span>
                    </label>
                    <p className="text-gray-500 text-xs mt-2">
                      {currentUser?.picture && !profilePicturePreview ? 'Usaremos tu foto de Google si no subís otra' : 'JPG, PNG o WebP. Máx 5MB'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-lg font-medium mb-4 text-[#d4a968]">Resumen de tu perfil</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ubicación:</span>
                    <span className="text-white">{formData.city}, {COUNTRIES.find(c => c.code === formData.country)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teléfono:</span>
                    <span className="text-white">{formData.phone_country_code} {formData.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Categorías:</span>
                    <span className="text-white">{formData.categories.join(', ')}</span>
                  </div>
                  {formData.instagram_username && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Instagram:</span>
                      <span className="text-white">@{formData.instagram_username}</span>
                    </div>
                  )}
                  {formData.tiktok_username && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">TikTok:</span>
                      <span className="text-white">@{formData.tiktok_username}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className={`p-5 border rounded-xl ${validationErrors.terms ? 'border-red-500 bg-red-500/5' : 'border-white/10 bg-white/5'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.terms_accepted}
                    onChange={(e) => setFormData({...formData, terms_accepted: e.target.checked})}
                    className="mt-1 w-5 h-5 rounded border-gray-600 bg-transparent text-[#d4a968] focus:ring-[#d4a968]"
                    data-testid="terms-checkbox"
                  />
                  <span className="text-sm text-gray-300">
                    He leído y acepto los{' '}
                    <a href="/terminos-creadores" target="_blank" className="text-[#d4a968] hover:underline">
                      Términos y Condiciones para Creadores UGC
                    </a>{' '}
                    y la{' '}
                    <a href="/politica-privacidad" target="_blank" className="text-[#d4a968] hover:underline">
                      Política de Privacidad
                    </a>
                    {' '}de Avenue.
                  </span>
                </label>
                {validationErrors.terms && <p className="text-red-400 text-sm mt-2">{validationErrors.terms}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className={`px-6 py-3 rounded-lg ${
              step === 1 ? 'invisible' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            Anterior
          </button>

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#d4a968] text-black hover:bg-[#c49958] transition-colors"
              data-testid="next-btn"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg ${
                !loading
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              } transition-all`}
              data-testid="submit-btn"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando perfil...</>
              ) : (
                <>Crear mi perfil <Check className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add styles for animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CreatorOnboarding;
