import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, MapPin, Users, Clock, Gift, Star, Filter, Search,
  Instagram, Music2, ArrowRight, Loader2, X, Check, AlertCircle,
  Calendar, Tag, ChevronDown, Building2
} from 'lucide-react';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CampaignsCatalog = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [applicationNote, setApplicationNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasCreatorProfile, setHasCreatorProfile] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    platform: '',
    search: ''
  });

  const categories = [
    'Food & Gastro', 'Beauty', 'Fashion', 'Lifestyle', 'Travel',
    'Fitness', 'Tech', 'Pets', 'Parenting', 'Home & Deco', 'Entertainment', 'Services'
  ];

  const cities = ['Asunción', 'San Lorenzo', 'Luque', 'Encarnación', 'Ciudad del Este'];

  useEffect(() => {
    checkCreatorProfile();
    fetchCampaigns();
  }, []);

  const checkCreatorProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_URL}/api/ugc/creators/me`, { headers });
      if (res.ok) {
        const data = await res.json();
        
        // Redirect to onboarding if profile needs update
        if (data.needs_profile_update) {
          navigate('/ugc/creator/onboarding');
          return;
        }
        
        setHasCreatorProfile(true);
        setCreatorProfile(data);
      }
    } catch (err) {
      // Not a creator
    }
  };

  const fetchCampaigns = async () => {
    try {
      let query = new URLSearchParams();
      if (filters.category) query.append('category', filters.category);
      if (filters.city) query.append('city', filters.city);
      if (filters.platform) query.append('platform', filters.platform);
      
      const res = await fetch(`${API_URL}/api/ugc/campaigns/available?${query}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (campaign) => {
    if (!hasCreatorProfile) {
      navigate('/ugc/creator/onboarding');
      return;
    }
    setSelectedCampaign(campaign);
    setApplicationNote('');
    setError('');
    setShowModal(true);
  };

  const submitApplication = async () => {
    setApplying(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Debes iniciar sesión para aplicar');
      }
      
      const res = await fetch(`${API_URL}/api/ugc/applications/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          note: applicationNote,
          proposed_content: ''
        })
      });

      // Read response as text first to avoid "body is disturbed or locked" error on Safari/iOS
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Error del servidor - respuesta inválida');
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Error al aplicar');
      }

      setSuccess('¡Aplicación enviada! La marca revisará tu perfil.');
      setShowModal(false);
      // Refresh campaigns
      fetchCampaigns();
      // Clear success after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short'
    });
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!c.name?.toLowerCase().includes(search) && 
          !c.description?.toLowerCase().includes(search) &&
          !c.brand?.company_name?.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Show creator navbar if logged in as creator */}
      {hasCreatorProfile && <UGCNavbar type="creator" />}
      
      {/* Header - Only show if NOT a creator (public view) */}
      {!hasCreatorProfile && (
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-light">
              <span className="text-[#d4a968] italic">Avenue</span> UGC
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                to="/ugc/creator/onboarding"
                className="px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors"
              >
                Registrarme como Creator
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className={`max-w-6xl mx-auto px-6 ${hasCreatorProfile ? 'mt-20' : 'mt-6'}`}>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        </div>
      )}

      <div className={`max-w-6xl mx-auto px-6 ${hasCreatorProfile ? 'pt-20 pb-24' : 'py-8'}`}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-light mb-3">
            {hasCreatorProfile ? 'Explorar' : 'Campañas'} <span className="text-[#d4a968] italic">{hasCreatorProfile ? 'campañas' : 'disponibles'}</span>
          </h1>
          <p className="text-gray-400">
            Encontrá campañas que se ajusten a tu perfil y postulate para colaborar con marcas
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar campañas..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => { setFilters({...filters, category: e.target.value}); fetchCampaigns(); }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm min-w-[150px]"
          >
            <option value="" className="bg-black">Todas las categorías</option>
            {categories.map(cat => <option key={cat} value={cat} className="bg-black">{cat}</option>)}
          </select>
          <select
            value={filters.city}
            onChange={(e) => { setFilters({...filters, city: e.target.value}); fetchCampaigns(); }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm min-w-[150px]"
          >
            <option value="" className="bg-black">Todas las ciudades</option>
            {cities.map(city => <option key={city} value={city} className="bg-black">{city}</option>)}
          </select>
          <select
            value={filters.platform}
            onChange={(e) => { setFilters({...filters, platform: e.target.value}); fetchCampaigns(); }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm min-w-[150px]"
          >
            <option value="" className="bg-black">Todas las plataformas</option>
            <option value="instagram" className="bg-black">Instagram</option>
            <option value="tiktok" className="bg-black">TikTok</option>
          </select>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No hay campañas disponibles</h3>
            <p className="text-gray-500">Volvé pronto para ver nuevas oportunidades</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map(campaign => (
              <div 
                key={campaign.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-[#d4a968]/50 transition-all group"
              >
                {/* Campaign Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#d4a968]/20 text-[#d4a968] rounded-full text-xs">
                        {campaign.category}
                      </span>
                      <span className="px-2 py-1 bg-white/10 text-gray-400 rounded-full text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {campaign.city}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {campaign.requirements?.platforms?.includes('instagram') && (
                        <Instagram className="w-4 h-4 text-pink-400" />
                      )}
                      {campaign.requirements?.platforms?.includes('tiktok') && (
                        <Music2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium text-white mb-2 group-hover:text-[#d4a968] transition-colors">
                    {campaign.name}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {campaign.description}
                  </p>

                  {/* Brand Info */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#d4a968]" />
                    </div>
                    <span className="text-gray-300 text-sm">{campaign.brand?.company_name}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-500">Canje</p>
                      <p className="text-[#d4a968] font-medium text-sm">{formatPrice(campaign.canje?.value || 0)}</p>
                    </div>
                    {/* Show slots only if 1 or 2 remaining */}
                    {campaign.slots_available !== undefined && campaign.slots_available <= 2 && campaign.slots_available > 0 ? (
                      <div className="text-center p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <p className="text-xs text-orange-400">¡Últimos cupos!</p>
                        <p className="text-orange-300 font-medium text-sm">{campaign.slots_available}</p>
                      </div>
                    ) : (
                      <div className="text-center p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-500">Estado</p>
                        <p className="text-green-400 font-medium text-sm">Disponible</p>
                      </div>
                    )}
                  </div>

                  {/* Requirements */}
                  {campaign.requirements?.min_followers && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Users className="w-3 h-3" />
                      Mín. {campaign.requirements.min_followers.toLocaleString()} seguidores
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="px-5 pb-5">
                  {campaign.has_applied ? (
                    <div className="w-full py-3 rounded-lg bg-green-500/20 text-green-400 text-center text-sm font-medium">
                      ✓ Ya aplicaste
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApply(campaign)}
                      className="w-full py-3 rounded-lg bg-[#d4a968] text-black font-medium hover:bg-[#c49958] transition-colors flex items-center justify-center gap-2"
                    >
                      Postularme <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Modal */}
      {showModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Postularme a campaña</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Campaign Info */}
              <div className="p-4 bg-white/5 rounded-xl">
                <h3 className="text-white font-medium mb-2">{selectedCampaign.name}</h3>
                <span className="text-[#d4a968] text-sm">{selectedCampaign.brand?.company_name}</span>
              </div>
              
              {/* Campaign Description - Larger area */}
              {selectedCampaign.description && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Descripción de la campaña</h4>
                  <div className="max-h-56 overflow-y-auto pr-2 scrollbar-thin">
                    <p className="text-gray-400 text-sm whitespace-pre-line leading-relaxed">
                      {selectedCampaign.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Canje Details - Clearer value explanation */}
              <div className="p-4 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-[#d4a968]" />
                    <span className="text-[#d4a968] font-medium">¿Qué recibirás?</span>
                  </div>
                  {selectedCampaign.canje?.value > 0 && (
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                      Valor aprox: {formatPrice(selectedCampaign.canje?.value)}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-line">{selectedCampaign.canje?.description || 'Ver detalles con la marca'}</p>
              </div>

              {/* Application Note */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  ¿Por qué sos ideal para esta campaña? (opcional)
                </label>
                <textarea
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Contale a la marca por qué te interesa y qué podés aportar..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Your Profile Preview */}
              {creatorProfile && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 mb-2">Tu perfil:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 font-medium">
                        {creatorProfile.name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{creatorProfile.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {creatorProfile.social_profiles?.instagram && (
                          <span className="flex items-center gap-1">
                            <Instagram className="w-3 h-3 text-pink-400" />
                            {creatorProfile.social_profiles.instagram.followers?.toLocaleString() || '?'}
                          </span>
                        )}
                        {creatorProfile.social_profiles?.tiktok && (
                          <span className="flex items-center gap-1">
                            <Music2 className="w-3 h-3 text-cyan-400" />
                            {creatorProfile.social_profiles.tiktok.followers?.toLocaleString() || '?'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitApplication}
                disabled={applying}
                className="flex-1 py-3 rounded-lg bg-[#d4a968] text-black font-medium hover:bg-[#c49958] transition-colors flex items-center justify-center gap-2"
              >
                {applying ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Check className="w-4 h-4" /> Enviar postulación</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsCatalog;
