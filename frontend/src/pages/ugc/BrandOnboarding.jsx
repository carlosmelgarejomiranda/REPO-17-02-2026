import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2, Globe, Instagram, Phone, MapPin, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const INDUSTRIES = [
  'Gastronomía', 'Moda', 'Belleza', 'Tecnología', 'Salud & Fitness',
  'Hogar & Deco', 'Turismo', 'Entretenimiento', 'Retail', 'Servicios', 'Educación', 'Finanzas', 'Otro'
];

// Countries with phone codes - expandable for global
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

// Cities by country
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

const BrandOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPackage = searchParams.get('package'); // Get package from URL if redirected from pricing
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    country: 'PY',
    city: '',
    contact_first_name: user?.name?.split(' ')[0] || '',
    contact_last_name: user?.name?.split(' ').slice(1).join(' ') || '',
    phone_country_code: '+595',
    contact_phone: '',
    website: '',
    instagram: '',
    description: ''
  });

  const handleCountryChange = (countryCode) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData(prev => ({
      ...prev,
      country: countryCode,
      phone_country_code: country?.phoneCode || '',
      city: '' // Reset city when country changes
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Clean URL inputs - remove protocol and www
  const cleanUrl = (url) => {
    if (!url) return '';
    return url.replace(/^(https?:\/\/)?(www\.)?/i, '').trim();
  };

  // Clean Instagram - remove @ symbol
  const cleanInstagram = (handle) => {
    if (!handle) return '';
    return handle.replace(/^@/, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare data for API
      const submitData = {
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

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/brands/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al crear perfil');
      }

      // If came from package selection, go directly to that package checkout
      // Otherwise go to packages page
      if (selectedPackage) {
        navigate(`/ugc/brand/packages?select=${selectedPackage}`);
      } else {
        navigate('/ugc/brand/packages');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.company_name && formData.industry && formData.country && 
                  formData.city && formData.contact_first_name && formData.contact_last_name && 
                  formData.contact_phone;

  const availableCities = CITIES_BY_COUNTRY[formData.country] || ['Otra'];

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

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            Registrá tu <span className="text-[#d4a968] italic">marca</span>
          </h1>
          <p className="text-gray-400">
            Completá los datos de tu empresa para comenzar a crear campañas UGC
          </p>
          {selectedPackage && (
            <p className="text-[#d4a968] text-sm mt-2">
              Paquete seleccionado: {selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Info */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-[#d4a968]" />
              <h2 className="text-lg">Información de la empresa</h2>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre de la empresa *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
                placeholder="Mi Empresa S.A."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Rubro *</label>
              <select
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                required
              >
                <option value="" className="bg-black">Seleccionar...</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind} className="bg-black">{ind}</option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">País *</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  required
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.code} className="bg-black">
                      {country.flag} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  required
                >
                  <option value="" className="bg-black">Seleccionar...</option>
                  {availableCities.map(city => (
                    <option key={city} value={city} className="bg-black">{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Descripción breve (opcional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describí brevemente tu empresa y qué tipo de contenido buscás..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-[#d4a968]" />
              <h2 className="text-lg">Contacto principal</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.contact_first_name}
                  onChange={(e) => handleChange('contact_first_name', e.target.value)}
                  placeholder="Juan"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  required
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
                  required
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
                  {COUNTRIES.filter(c => c.phoneCode).map(country => (
                    <option key={country.code} value={country.phoneCode} className="bg-black">
                      {country.flag} {country.phoneCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange('contact_phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="981123456"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  required
                />
              </div>
              <p className="text-gray-600 text-xs mt-1">Solo números, sin espacios ni guiones</p>
            </div>
          </div>

          {/* Online Presence */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-[#d4a968]" />
              <h2 className="text-lg">Presencia online</h2>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Sitio web</label>
              <div className="flex">
                <span className="px-4 py-3 bg-white/10 border border-white/10 border-r-0 rounded-l-lg text-gray-500 text-sm">
                  https://
                </span>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange('website', cleanUrl(e.target.value))}
                  placeholder="miempresa.com.py"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-r-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              <p className="text-gray-600 text-xs mt-1">Ej: avenue.com.py (sin https://)</p>
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
              <p className="text-gray-600 text-xs mt-1">Ej: avenuepy (sin el @)</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full py-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isValid && !loading
                ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando perfil...
              </>
            ) : (
              'Continuar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BrandOnboarding;
