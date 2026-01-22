import React, { useState } from 'react';
import { 
  Users, Star, Award, RefreshCw, Instagram, Music2, Eye, TrendingUp, 
  BarChart3, MessageSquare, ExternalLink, BadgeCheck, MapPin
} from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

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
    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${config.color}`}>
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
    <div className="space-y-6" data-testid="admin-creators-tab">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={creatorFilter.level}
            onChange={(e) => { setCreatorFilter({...creatorFilter, level: e.target.value}); fetchCreators(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos los niveles</option>
            <option value="rookie">Rookie</option>
            <option value="rising">Rising</option>
            <option value="trusted">Trusted</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
          <select
            value={creatorFilter.verified}
            onChange={(e) => { setCreatorFilter({...creatorFilter, verified: e.target.value}); fetchCreators(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos</option>
            <option value="true">Verificados</option>
            <option value="false">No verificados</option>
          </select>
        </div>
        <button 
          onClick={fetchCreators}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
          data-testid="refresh-creators-btn"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Creators Grid */}
      {creators.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No hay creators registrados</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {creators.map((creator) => {
            const verifiedIG = creator.verified_instagram;
            const verifiedTT = creator.verified_tiktok;
            
            return (
              <div 
                key={creator.id}
                data-testid={`creator-card-${creator.id}`}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-[#d4a968]/30 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  {/* Avatar + Name + Level */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {creator.profile_pic ? (
                        <img 
                          src={creator.profile_pic} 
                          alt={creator.name} 
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-xl">
                          {creator.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      {creator.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                          <BadgeCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-white text-lg">{creator.name}</h4>
                        <LevelBadge level={creator.level} />
                      </div>
                      <p className="text-sm text-gray-400">{creator.email}</p>
                      {creator.city && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {creator.city}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!creator.is_verified && (
                      <button
                        onClick={() => handleVerifyCreator(creator.id)}
                        className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30 transition-colors"
                        data-testid={`verify-btn-${creator.id}`}
                      >
                        Verificar
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleCreatorStatus(creator.id, !creator.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
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
                
                {/* Social Accounts Row */}
                <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-white/10">
                  {/* Instagram */}
                  {verifiedIG ? (
                    <a 
                      href={`https://instagram.com/${verifiedIG.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-400/50 transition-colors"
                      data-testid={`ig-link-${creator.id}`}
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-white">@{verifiedIG.username}</span>
                      <span className="text-xs text-gray-400">{formatNumber(verifiedIG.follower_count || verifiedIG.followers)}</span>
                      <BadgeCheck className="w-3.5 h-3.5 text-green-400" title="Verificado" />
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  ) : creator.social_accounts?.instagram ? (
                    <a 
                      href={`https://instagram.com/${creator.social_accounts.instagram.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-gray-300">@{creator.social_accounts.instagram.username}</span>
                      <span className="text-xs text-gray-500">{formatNumber(creator.social_accounts.instagram.followers)}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  ) : null}
                  
                  {/* TikTok */}
                  {verifiedTT ? (
                    <a 
                      href={`https://tiktok.com/@${verifiedTT.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 hover:border-white/40 transition-colors"
                      data-testid={`tt-link-${creator.id}`}
                    >
                      <Music2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-white">@{verifiedTT.username}</span>
                      <span className="text-xs text-gray-400">{formatNumber(verifiedTT.follower_count || verifiedTT.followers)}</span>
                      <BadgeCheck className="w-3.5 h-3.5 text-green-400" title="Verificado" />
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  ) : creator.social_accounts?.tiktok ? (
                    <a 
                      href={`https://tiktok.com/@${creator.social_accounts.tiktok.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <Music2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-gray-300">@{creator.social_accounts.tiktok.username}</span>
                      <span className="text-xs text-gray-500">{formatNumber(creator.social_accounts.tiktok.followers)}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </a>
                  ) : null}
                  
                  {/* No social accounts */}
                  {!verifiedIG && !verifiedTT && !creator.social_accounts?.instagram && !creator.social_accounts?.tiktok && (
                    <span className="text-xs text-gray-500 italic px-3 py-1.5">Sin redes verificadas</span>
                  )}
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {/* Rating */}
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">{creator.avg_rating?.toFixed(1) || (creator.stats?.avg_rating || 0).toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{creator.total_reviews || 0} reseñas</p>
                  </div>
                  
                  {/* Campaigns */}
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <Award className="w-4 h-4" />
                      <span className="font-semibold">{creator.campaigns_participated || 0}</span>
                    </div>
                    <p className="text-xs text-gray-500">Campañas</p>
                  </div>
                  
                  {/* Avg Views */}
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">{formatNumber(creator.avg_views)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Prom. Vistas</p>
                  </div>
                  
                  {/* Avg Reach */}
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="font-semibold">{formatNumber(creator.avg_reach)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Prom. Alcance</p>
                  </div>
                  
                  {/* Avg Interactions */}
                  <div className="bg-white/5 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-semibold">{formatNumber(creator.avg_interactions)}</span>
                    </div>
                    <p className="text-xs text-gray-500">Prom. Interacc.</p>
                  </div>
                </div>
                
                {/* Action Buttons Row */}
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => setShowMetricsModal(creator)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                    data-testid={`metrics-btn-${creator.id}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Ver Métricas Completas
                  </button>
                  <button
                    onClick={() => setShowReviewsModal(creator)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                    data-testid={`reviews-btn-${creator.id}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ver Reviews ({creator.total_reviews || 0})
                  </button>
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
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-semibold text-white">Métricas de {creator.name}</h3>
            <p className="text-sm text-gray-400 mt-1">{metrics.length} entregas reportadas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-gray-400 text-2xl">&times;</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-[#d4a968] animate-spin" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay métricas registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric, idx) => (
                <div key={metric.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">
                      {new Date(metric.submitted_at || metric.created_at).toLocaleDateString('es-PY')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                      {metric.platform || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.views)}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.reach)}</p>
                      <p className="text-xs text-gray-500">Reach</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.likes)}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.comments)}</p>
                      <p className="text-xs text-gray-500">Comments</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.shares)}</p>
                      <p className="text-xs text-gray-500">Shares</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{formatNumber(metric.saves)}</p>
                      <p className="text-xs text-gray-500">Saves</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-white"
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
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-semibold text-white">Reviews de {creator.name}</h3>
            <p className="text-sm text-gray-400 mt-1">
              Rating promedio: <span className="text-yellow-400">{creator.avg_rating?.toFixed(1) || '0.0'}</span> ({reviews.length} reviews)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-gray-400 text-2xl">&times;</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-[#d4a968] animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No hay reviews registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, idx) => (
                <div key={review.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                      <span className="text-white font-medium ml-2">{review.rating}/5</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('es-PY')}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-300 text-sm mt-2 italic">"{review.comment}"</p>
                  )}
                  {review.brand_name && (
                    <p className="text-xs text-gray-500 mt-2">— {review.brand_name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreatorsTab;
