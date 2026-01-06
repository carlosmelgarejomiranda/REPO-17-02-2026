import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Building2, Globe, Instagram } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const INDUSTRIES = [
  'Gastronomía', 'Moda', 'Belleza', 'Tecnología', 'Salud & Fitness',
  'Hogar & Deco', 'Turismo', 'Entretenimiento', 'Retail', 'Servicios', 'Otro'
];

const CITIES = [
  'Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 'Lambaré',
  'Capiatá', 'Encarnación', 'Ciudad del Este', 'Otra'
];

const BrandOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    city: '',
    contact_name: user?.name || '',
    contact_phone: user?.phone || '',
    website: '',
    instagram_url: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/brands/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al crear perfil');
      }

      // Redirect to packages page
      navigate('/ugc/brand/packages');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.company_name && formData.industry && formData.city && formData.contact_name;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <button onClick={() => navigate('/ugc/select-role')} className="text-gray-400 hover:text-white flex items-center gap-2">
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Info */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-[#d4a968]" />
              <h2 className="text-lg">Información de la empresa</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de la empresa *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="Tu Marca S.A."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rubro *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  required
                >
                  <option value="">Seleccionar rubro</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Ciudad *</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  required
                >
                  <option value="">Seleccionar ciudad</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="Breve descripción de tu marca"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <h2 className="text-lg">Contacto principal</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de contacto *</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="+595 9XX XXX XXX"
                />
              </div>
            </div>
          </div>

          {/* Online Presence */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
            <h2 className="text-lg">Presencia online</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" /> Sitio web
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="https://tumarca.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  <Instagram className="w-4 h-4 inline mr-1" /> Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="https://instagram.com/tumarca"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isValid || loading}
              className={`flex items-center gap-2 px-8 py-4 rounded-lg text-lg ${
                isValid && !loading
                  ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creando perfil...</>
              ) : (
                <>Continuar <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandOnboarding;
