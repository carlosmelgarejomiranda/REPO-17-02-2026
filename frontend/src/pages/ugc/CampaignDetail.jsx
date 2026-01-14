import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Calendar, Gift, Users, Clock, 
  Instagram, Music2, Loader2, Check, AlertCircle,
  Building2, Target, ChevronRight, Star
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [hasCreatorProfile, setHasCreatorProfile] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    checkCreatorProfile();
    fetchCampaign();
  }, [id]);

  const checkCreatorProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const res = await fetch(`${API_URL}/api/ugc/creators/me`, { 
        headers
      });
      if (res.ok) {
        const data = await res.json();
        setHasCreatorProfile(true);
        setCreatorProfile(data);
      }
    } catch (err) {
      // Not a creator
    }
  };

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      console.log('Fetching campaign:', id, 'from:', API_URL);
      
      const res = await fetch(`${API_URL}/api/ugc/campaigns/${id}`, {
        headers
      });
      
      console.log('Campaign response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Campaign data received:', data?.name);
        setCampaign(data);
        
        // Check if already applied
        if (token) {
          try {
            const appRes = await fetch(`${API_URL}/api/ugc/applications/my`, {
              headers
            });
            if (appRes.ok) {
              const appData = await appRes.json();
              const applications = appData.applications || [];
              setHasApplied(applications.some(a => a.campaign_id === id));
            }
          } catch (appErr) {
            console.log('Error checking applications:', appErr);
          }
        }
      } else {
        const errorText = await res.text();
        console.error('Campaign fetch error:', res.status, errorText);
        setError('Campaña no encontrada');
      }
    } catch (err) {
      console.error('Campaign fetch exception:', err);
      setError('Error al cargar la campaña. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!hasCreatorProfile) {
      navigate('/ugc/creator/onboarding');
      return;
    }
    setApplicationNote('');
    setError('');
    setShowModal(true);
  };

  const submitApplication = async () => {
    setApplying(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/applications/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          campaign_id: id,
          note: applicationNote,
          proposed_content: ''
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Error al aplicar');
      }

      setSuccess('¡Aplicación enviada! La marca revisará tu perfil.');
      setShowModal(false);
      setHasApplied(true);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'A convenir';
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a968]" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-xl">{error}</p>
        <Link 
          to="/ugc/campaigns" 
          className="text-[#d4a968] hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4a968]" />
        <p className="text-gray-400">Cargando campaña...</p>
      </div>
    );
  }

  const canje = campaign.canje || {};
  const requirements = campaign.requirements || {};
  const timeline = campaign.timeline || {};

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            to="/ugc/campaigns" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="max-w-4xl mx-auto px-6 pt-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Campaign Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover Image */}
          {campaign.assets?.cover_image ? (
            <div className="w-full md:w-64 h-48 md:h-48 rounded-xl overflow-hidden flex-shrink-0">
              <img 
                src={campaign.assets.cover_image} 
                alt={campaign.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full md:w-64 h-48 md:h-48 rounded-xl bg-gradient-to-br from-[#d4a968]/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-16 h-16 text-white/40" />
            </div>
          )}

          {/* Campaign Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#d4a968]/20 text-[#d4a968] rounded-full text-sm">
                {campaign.category || 'General'}
              </span>
              {campaign.city && (
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <MapPin className="w-3 h-3" />
                  {campaign.city}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-light text-white mb-2">{campaign.name}</h1>
            
            {campaign.brand?.company_name && (
              <p className="text-gray-400 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {campaign.brand.company_name}
              </p>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h3 className="text-lg font-medium text-white mb-4">Sobre la campaña</h3>
          <div className="text-gray-300 leading-relaxed">
            {campaign.description?.split('\n').map((line, index) => {
              // Empty line = paragraph break
              if (!line.trim()) {
                return <div key={index} className="h-3" />;
              }
              
              // Separator line
              if (line.includes('───') || line.includes('---')) {
                return <hr key={index} className="border-white/10 my-4" />;
              }
              
              // Subtitle with emoji (📌)
              if (line.trim().startsWith('📌') || line.trim().startsWith('🎯') || line.trim().startsWith('✨') || line.trim().startsWith('💡')) {
                return (
                  <h4 key={index} className="text-[#d4a968] font-medium text-lg mt-4 mb-2">
                    {line}
                  </h4>
                );
              }
              
              // Bullet point
              if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                return (
                  <div key={index} className="flex items-start gap-2 ml-2 my-1">
                    <span className="text-[#d4a968] mt-1">•</span>
                    <span>{line.trim().substring(1).trim()}</span>
                  </div>
                );
              }
              
              // Bold text simulation (text between **)
              if (line.includes('**')) {
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={index} className="my-1">
                    {parts.map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
                    )}
                  </p>
                );
              }
              
              // Regular paragraph
              return <p key={index} className="my-1">{line}</p>;
            })}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Compensation */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#d4a968]" />
              Compensación
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-400 text-sm">Tipo:</span>
                <p className="text-white capitalize">{canje.type || 'Producto'}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Descripción:</span>
                <p className="text-white">{canje.description || 'A convenir con la marca'}</p>
              </div>
              {canje.value > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">Valor estimado:</span>
                  <p className="text-[#d4a968] font-medium">{formatPrice(canje.value)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#d4a968]" />
              Requisitos
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Instagram className="w-5 h-5 text-pink-400" />
                  <Music2 className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-gray-300 text-sm">Perfil público requerido</span>
              </div>
              
              {requirements.min_followers > 0 && (
                <div>
                  <span className="text-gray-400 text-sm">Seguidores mínimos:</span>
                  <p className="text-white">{requirements.min_followers?.toLocaleString()}+</p>
                </div>
              )}
              
              {requirements.min_age && (
                <div>
                  <span className="text-gray-400 text-sm">Edad mínima:</span>
                  <p className="text-white">{requirements.min_age} años</p>
                </div>
              )}
              
              {requirements.gender && requirements.gender !== 'all' && (
                <div>
                  <span className="text-gray-400 text-sm">Género:</span>
                  <p className="text-white capitalize">
                    {requirements.gender === 'male' ? 'Masculino' : 'Femenino'}
                  </p>
                </div>
              )}
              
              {requirements.residence && (
                <div>
                  <span className="text-gray-400 text-sm">Residencia:</span>
                  <p className="text-white">{requirements.residence}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#d4a968]" />
            Fechas importantes
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {timeline.applications_deadline && (
              <div>
                <span className="text-gray-400 text-sm">Cierre de aplicaciones:</span>
                <p className="text-white">{formatDate(timeline.applications_deadline)}</p>
              </div>
            )}
            {timeline.publish_start && (
              <div>
                <span className="text-gray-400 text-sm">Inicio publicación:</span>
                <p className="text-white">{formatDate(timeline.publish_start)}</p>
              </div>
            )}
            {timeline.publish_end && (
              <div>
                <span className="text-gray-400 text-sm">Fin publicación:</span>
                <p className="text-white">{formatDate(timeline.publish_end)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Slots Info */}
        <div className="flex items-center justify-between bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#d4a968]" />
            <div>
              <span className="text-gray-400 text-sm">Cupos disponibles</span>
              <p className="text-2xl font-light text-white">
                {campaign.available_slots || 0} <span className="text-gray-500 text-lg">/ {campaign.total_slots_loaded || campaign.slots || '?'}</span>
              </p>
            </div>
          </div>

          {/* Apply Button */}
          {hasApplied ? (
            <div className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-xl">
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-300">Ya aplicaste</span>
            </div>
          ) : (
            <button
              onClick={handleApply}
              className="px-8 py-3 bg-[#d4a968] text-black font-medium rounded-xl hover:bg-[#c49958] transition-colors flex items-center gap-2"
            >
              Aplicar ahora
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link 
            to="/ugc/campaigns" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            Ver más campañas
          </Link>
        </div>
      </div>

      {/* Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-medium text-white">Aplicar a {campaign.name}</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Mensaje para la marca (opcional)
                </label>
                <textarea
                  value={applicationNote}
                  onChange={(e) => setApplicationNote(e.target.value)}
                  placeholder="Cuéntale a la marca por qué eres ideal para esta campaña..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none resize-none"
                />
              </div>
              
              <p className="text-sm text-gray-400">
                Tu perfil de creator será compartido con la marca para su revisión.
              </p>
            </div>
            
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors text-white"
              >
                Cancelar
              </button>
              <button
                onClick={submitApplication}
                disabled={applying}
                className="flex-1 px-4 py-3 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Enviar aplicación
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
