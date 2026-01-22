import React, { useState } from 'react';
import { 
  Users, Star, Award, RefreshCw, Instagram, Music2, Eye, TrendingUp, 
  BarChart3, MessageSquare, ExternalLink, BadgeCheck, MapPin, ChevronDown, ChevronUp
} from 'lucide-react';

// Format large numbers
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const LevelBadge = ({ level }) => {
  const configs = {
    rookie: { color: 'text-gray-400 bg-gray-500/20', label: 'Rookie' },
    trusted: { color: 'text-blue-400 bg-blue-500/20', label: 'Trusted' },
    pro: { color: 'text-purple-400 bg-purple-500/20', label: 'Pro' },
    elite: { color: 'text-yellow-400 bg-yellow-500/20', label: 'Elite' }
  };

  const config = configs[level] || configs.rookie;
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${config.color}`}>
      {config.label}
    </span>
  );
};

const AdminCreatorsTab = ({
  creators,
  creatorFilter,
  setCreatorFilter,
  fetchCreators,
  handleVerifyCreator,
  handleToggleCreatorStatus
}) => {
  const [expandedCreator, setExpandedCreator] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(null);

  return (
    <div className="space-y-4" data-testid="admin-creators-tab">
      {/* Filters - Compact */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={creatorFilter.level}
            onChange={(e) => { setCreatorFilter({...creatorFilter, level: e.target.value}); fetchCreators(); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
          >
            <option value="">Todos los niveles</option>
            <option value="rookie">Rookie</option>
            <option value="trusted">Trusted</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
          <select
            value={creatorFilter.verified}
            onChange={(e) => { setCreatorFilter({...creatorFilter, verified: e.target.value}); fetchCreators(); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
          >
            <option value="">Todos</option>
            <option value="true">Verificados</option>
            <option value="false">No verificados</option>
          </select>
        </div>
        <button 
          onClick={fetchCreators}
          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
          data-testid="refresh-creators-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Creators List - Compact */}
      {creators.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No hay creators registrados</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {creators.map((creator, idx) => {
            const verifiedIG = creator.verified_instagram;
            const verifiedTT = creator.verified_tiktok;
            const unverifiedIG = creator.unverified_instagram;
            const unverifiedTT = creator.unverified_tiktok;
            const isExpanded = expandedCreator === creator.id;
            
            return (
              <div 
                key={creator.id}
                data-testid={`creator-card-${creator.id}`}
                className={`${idx !== 0 ? 'border-t border-white/5' : ''} hover:bg-white/5 transition-colors`}
              >
                {/* Main Row - Compact */}
                <div className="px-4 py-2.5 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {creator.profile_pic ? (
                      <img 
                        src={creator.profile_pic} 
                        alt={creator.name} 
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-sm">
                        {creator.name?.charAt(0) || 'C'}
                      </div>
                    )}
                    {creator.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                        <BadgeCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Name + Level + Location */}
                  <div className="min-w-[140px] flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-white text-sm truncate max-w-[100px]">{creator.name}</span>
                      <LevelBadge level={creator.level} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      {creator.city && (
                        <>
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[80px]">{creator.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Social Links - Compact */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Instagram */}
                    {(verifiedIG || unverifiedIG) && (
                      <a 
                        href={verifiedIG ? `https://instagram.com/${verifiedIG.username}` : (unverifiedIG?.url || `https://instagram.com/${unverifiedIG?.username}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          verifiedIG 
                            ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                        title={verifiedIG ? 'Instagram verificado' : 'Instagram sin verificar'}
                      >
                        <Instagram className="w-3 h-3" />
                        <span className="max-w-[60px] truncate">@{verifiedIG?.username || unverifiedIG?.username}</span>
                        {verifiedIG && <BadgeCheck className="w-2.5 h-2.5 text-green-400" />}
                      </a>
                    )}
                    
                    {/* TikTok */}
                    {(verifiedTT || unverifiedTT) && (
                      <a 
                        href={verifiedTT ? `https://tiktok.com/@${verifiedTT.username}` : (unverifiedTT?.url || `https://tiktok.com/@${unverifiedTT?.username}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          verifiedTT 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                        title={verifiedTT ? 'TikTok verificado' : 'TikTok sin verificar'}
                      >
                        <Music2 className="w-3 h-3" />
                        <span className="max-w-[60px] truncate">@{verifiedTT?.username || unverifiedTT?.username}</span>
                        {verifiedTT && <BadgeCheck className="w-2.5 h-2.5 text-green-400" />}
                      </a>
                    )}
                    
                    {!verifiedIG && !unverifiedIG && !verifiedTT && !unverifiedTT && (
                      <span className="text-[10px] text-gray-600 italic">Sin redes</span>
                    )}
                  </div>
                  
                  {/* Stats - Compact inline */}
                  <div className="flex items-center gap-3 text-xs flex-grow justify-center">
                    <div className="flex items-center gap-1 text-yellow-400" title="Rating">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{(creator.avg_rating || 0).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-400" title="Campañas">
                      <Award className="w-3 h-3" />
                      <span>{creator.campaigns_participated || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-400" title="Prom. Vistas">
                      <Eye className="w-3 h-3" />
                      <span>{formatNumber(creator.avg_views)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-400" title="Prom. Alcance">
                      <Users className="w-3 h-3" />
                      <span>{formatNumber(creator.avg_reach)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400" title="Prom. Interacciones">
                      <TrendingUp className="w-3 h-3" />
                      <span>{formatNumber(creator.avg_interactions)}</span>
                    </div>
                  </div>
                  
                  {/* Actions - Compact */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setShowMetricsModal(creator)}
                      className="p-1.5 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                      title="Ver Métricas"
                      data-testid={`metrics-btn-${creator.id}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowReviewsModal(creator)}
                      className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                      title={`Ver Reviews (${creator.total_reviews || 0})`}
                      data-testid={`reviews-btn-${creator.id}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {!creator.is_verified && (
                      <button
                        onClick={() => handleVerifyCreator(creator.id)}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] hover:bg-green-500/30 transition-colors"
                        data-testid={`verify-btn-${creator.id}`}
                      >
                        Verificar
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleCreatorStatus(creator.id, !creator.is_active)}
                      className={`px-2 py-1 rounded text-[10px] transition-colors ${
                        creator.is_active 
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}
                      data-testid={`toggle-status-btn-${creator.id}`}
                    >
                      {creator.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Metrics Modal */}
      {showMetricsModal && (
        <CreatorMetricsModal 
          creator={showMetricsModal} 
          onClose={() => setShowMetricsModal(null)} 
        />
      )}
      
      {/* Reviews Modal */}
      {showReviewsModal && (
        <CreatorReviewsModal 
          creator={showReviewsModal} 
          onClose={() => setShowReviewsModal(null)} 
        />
      )}
    </div>
  );
};

// Creator Metrics Modal Component
const CreatorMetricsModal = ({ creator, onClose }) => {
  const [metrics, setMetrics] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { getApiUrl } = await import('../../utils/api');
        const API_URL = getApiUrl();
        const token = localStorage.getItem('token');
        
        const res = await fetch(`${API_URL}/api/ugc/admin/metrics?creator_id=${creator.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics || []);
        }
      } catch (err) {
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
  }, [creator.id]);
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Métricas de {creator.name}</h3>
            <p className="text-xs text-gray-400">{metrics.length} entregas reportadas</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-gray-400 text-xl">&times;</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#d4a968] animate-spin" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay métricas registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.map((metric, idx) => (
                <div key={metric.id || idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">
                      {new Date(metric.submitted_at || metric.created_at).toLocaleDateString('es-PY')}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                      {metric.platform || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.views)}</p>
                      <p className="text-[10px] text-gray-500">Views</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.reach)}</p>
                      <p className="text-[10px] text-gray-500">Reach</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.likes)}</p>
                      <p className="text-[10px] text-gray-500">Likes</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.comments)}</p>
                      <p className="text-[10px] text-gray-500">Comments</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.shares)}</p>
                      <p className="text-[10px] text-gray-500">Shares</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formatNumber(metric.saves)}</p>
                      <p className="text-[10px] text-gray-500">Saves</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-white text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Creator Reviews Modal Component
const CreatorReviewsModal = ({ creator, onClose }) => {
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { getApiUrl } = await import('../../utils/api');
        const API_URL = getApiUrl();
        const token = localStorage.getItem('token');
        
        const res = await fetch(`${API_URL}/api/ugc/admin/creators/${creator.id}/reviews`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [creator.id]);
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Reviews de {creator.name}</h3>
            <p className="text-xs text-gray-400">
              Rating: <span className="text-yellow-400">{creator.avg_rating?.toFixed(1) || '0.0'}</span> ({reviews.length} reviews)
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-gray-400 text-xl">&times;</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#d4a968] animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No hay reviews registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, idx) => (
                <div key={review.id || idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                      <span className="text-white text-xs ml-1">{review.rating}/5</span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('es-PY')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 text-xs italic">"{review.comment}"</p>
                  )}
                  {review.brand_name && (
                    <p className="text-[10px] text-gray-500 mt-1">— {review.brand_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-white text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreatorsTab;
