import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Instagram, Music2, Check, Loader2, LogIn, Shield, Camera, Sparkles } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import SocialVerification from '../../components/SocialVerification';

const API_URL = getApiUrl();

const CATEGORIES = [
  'Gastronomía', 'Belleza', 'Moda', 'Lifestyle', 'Viajes',
  'Fitness', 'Tecnología', 'Mascotas', 'Maternidad', 'Hogar & Deco'
];

const CITIES = [
  'Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré',
  'Capiatá', 'Encarnación', 'Ciudad del Este', 'Otra'
];

const CreatorOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication directly
  useEffect(() => {
    const verifyAuth = async () => {
      // Small delay to ensure token is saved after redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const token = localStorage.getItem('auth_token');
        console.log('CreatorOnboarding - Token found:', token ? 'YES' : 'NO');
        console.log('CreatorOnboarding - API_URL:', API_URL);
        
        if (!token) {
          console.log('CreatorOnboarding - No token, showing login prompt');
          setCurrentUser(null);
          setCheckingAuth(false);
          return;
        }
        
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('CreatorOnboarding - Auth response status:', res.status);
        
        if (res.ok) {
          const userData = await res.json();
          console.log('CreatorOnboarding - User authenticated:', userData.email);
          setCurrentUser(userData);
        } else {
          console.log('CreatorOnboarding - Auth failed, clearing token');
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

  // Update form data when user loads
  useEffect(() => {
    if (currentUser?.name) {
      setFormData(prev => ({ ...prev, name: currentUser.name }));
    }
  }, [currentUser]);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    categories: [],
    bio: '',
    instagram_username: '',
    tiktok_username: ''
  });

  // State for verification step
  const [verificationData, setVerificationData] = useState({});
  const [skipVerification, setSkipVerification] = useState(false);

  const handleCategoryToggle = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/ugc/creators/onboarding`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al crear perfil');
      }

      // Redirect to creator dashboard
      navigate('/ugc/creator/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name && formData.city;
    if (step === 2) return formData.categories.length > 0;
    if (step === 3) return formData.instagram_username || formData.tiktok_username;
    if (step === 4) return true; // Verification is optional
    return true;
  };

  const handleVerificationComplete = (platform, data) => {
    setVerificationData(prev => ({
      ...prev,
      [platform]: data
    }));
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
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
              // Store intended destination and redirect to home with login flag
              sessionStorage.setItem('redirect_after_login', '/ugc/creator/onboarding');
              navigate('/?login=creator');
            }}
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <button onClick={() => navigate('/ugc/creators')} className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <span className="text-[#d4a968]">Paso {step} de 3</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="h-1 bg-white/10 rounded-full">
          <div 
            className="h-1 bg-[#d4a968] rounded-full transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-2">Información <span className="text-[#d4a968] italic">básica</span></h1>
              <p className="text-gray-400">Contanos un poco sobre vos</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Ciudad</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Seleccionar ciudad</option>
                  {CITIES.map(city => (
                    <option key={city} value={city} style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Bio (opcional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none resize-none"
                  rows={3}
                  placeholder="Contá un poco sobre vos y tu contenido..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-2">Tus <span className="text-[#d4a968] italic">categorías</span></h1>
              <p className="text-gray-400">Seleccioná las áreas en las que creás contenido</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.categories.includes(cat)
                      ? 'border-[#d4a968] bg-[#d4a968]/10'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{cat}</span>
                    {formData.categories.includes(cat) && (
                      <Check className="w-5 h-5 text-[#d4a968]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Social Networks */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-2">Tus <span className="text-[#d4a968] italic">redes</span></h1>
              <p className="text-gray-400">Conectá al menos una red social</p>
            </div>

            <div className="space-y-6">
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
                />
              </div>

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
                />
              </div>
            </div>

            <p className="text-sm text-gray-500">
              En el siguiente paso podrás verificar tus seguidores con un screenshot.
            </p>
          </div>
        )}

        {/* Step 4: Verify Social Networks */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-light mb-2">Verificá tus <span className="text-[#d4a968] italic">seguidores</span></h1>
              <p className="text-gray-400">Aumentá tus chances de ser seleccionado</p>
            </div>

            {/* Info banner */}
            <div className="p-5 bg-gradient-to-br from-[#d4a968]/20 to-purple-500/10 border border-[#d4a968]/30 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-[#d4a968]" />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">¿Por qué verificar?</h3>
                  <p className="text-gray-300 text-sm">
                    Los creadores con seguidores verificados tienen <span className="text-[#d4a968] font-medium">3x más chances</span> de ser seleccionados por las marcas. 
                    La verificación genera confianza y demuestra que tu audiencia es real.
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Component */}
            {!skipVerification ? (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <SocialVerification 
                  onVerificationComplete={handleVerificationComplete}
                  initialData={verificationData}
                />
              </div>
            ) : (
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 mb-4">Podrás verificar tus redes en cualquier momento desde tu perfil</p>
                <button
                  onClick={() => setSkipVerification(false)}
                  className="text-[#d4a968] hover:underline text-sm"
                >
                  Quiero verificar ahora
                </button>
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
            {!skipVerification && Object.keys(verificationData).length === 0 && (
              <button
                onClick={() => setSkipVerification(true)}
                className="w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
              >
                Hacerlo luego →
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
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

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg ${
                canProceed()
                  ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg ${
                canProceed() && !loading
                  ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creando perfil...</>
              ) : (
                <>Crear mi perfil<Check className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorOnboarding;
