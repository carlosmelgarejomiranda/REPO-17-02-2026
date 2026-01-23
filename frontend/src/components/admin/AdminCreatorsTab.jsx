import React, { useState } from 'react';
import { 
  Users, Star, Award, RefreshCw, Instagram, Music2, Eye, TrendingUp, 
  BarChart3, MessageSquare, ExternalLink, BadgeCheck, MapPin
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
    <span className={`inline-block w-16 text-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${config.color}`}>
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
  const [showMetricsModal, setShowMetricsModal] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(null);

  return (
    <div className="space-y-4" data-testid="admin-creators-tab">
      {/* Filters */}
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

      {/* Creators Table */}
      {creators.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No hay creators registrados</p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          {/* Total Count Header */}
          <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4a968]" />
                <span className="text-white font-medium">{creators.length}</span>
                <span className="text-gray-400 text-sm">Creators registrados</span>
              </div>
            </div>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-[40px_180px_70px_130px_130px_200px_160px] gap-2 px-3 py-2 bg-white/5 border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-wide">
            <div></div>
            <div>Nombre</div>
            <div className="text-center">Nivel</div>
            <div className="text-center">Instagram</div>
            <div className="text-center">TikTok</div>
            <div className="text-center">Métricas</div>
            <div className="text-center">Acciones</div>
          </div>
          
          {/* Table Body */}
          {creators.map((creator, idx) => {
            const verifiedIG = creator.verified_instagram;
            const verifiedTT = creator.verified_tiktok;
            const unverifiedIG = creator.unverified_instagram;
            const unverifiedTT = creator.unverified_tiktok;
            
            const igUsername = verifiedIG?.username || unverifiedIG?.username;
            const ttUsername = verifiedTT?.username || unverifiedTT?.username;
            const igVerified = !!verifiedIG;
            const ttVerified = !!verifiedTT;
            
            return (
              <div 
                key={creator.id}
                data-testid={`creator-row-${creator.id}`}
                className={`grid grid-cols-[40px_180px_70px_130px_130px_200px_160px] gap-2 px-3 py-2 items-center hover:bg-white/5 transition-colors ${idx !== 0 ? 'border-t border-white/5' : ''}`}
              >
                {/* Avatar */}
                <div className="relative">
                  {creator.profile_pic ? (
                    <img 
                      src={creator.profile_pic} 
                      alt={creator.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-xs">
                      {creator.name?.charAt(0) || 'C'}
                    </div>
                  )}
                  {creator.is_verified && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                      <BadgeCheck className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Name + Location */}
                <div className="overflow-hidden">
                  <p className="font-medium text-white text-xs truncate" title={creator.name}>
                    {creator.name}
                  </p>
                  {creator.city && (
                    <p className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{creator.city}</span>
                    </p>
                  )}
                </div>
                
                {/* Level */}
                <div className="text-center">
                  <LevelBadge level={creator.level} />
                </div>
                
                {/* Instagram */}
                <div className="text-center">
                  {igUsername ? (
                    <a 
                      href={`https://instagram.com/${igUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] max-w-full ${
                        igVerified 
                          ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                      title={igVerified ? 'Verificado' : 'Sin verificar'}
                    >
                      <Instagram className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[70px]">@{igUsername}</span>
                      {igVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />}
                    </a>
                  ) : (
                    <span className="text-[10px] text-gray-600">—</span>
                  )}
                </div>
                
                {/* TikTok */}
                <div className="text-center">
                  {ttUsername ? (
                    <a 
                      href={`https://tiktok.com/@${ttUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] max-w-full ${
                        ttVerified 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}
                      title={ttVerified ? 'Verificado' : 'Sin verificar'}
                    >
                      <Music2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate max-w-[70px]">@{ttUsername}</span>
                      {ttVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />}
                    </a>
                  ) : (
                    <span className="text-[10px] text-gray-600">—</span>
                  )}
                </div>
                
                {/* Metrics */}
                <div className="flex items-center justify-center gap-3 text-[10px]">
                  <div className="flex items-center gap-0.5 text-yellow-400 w-8" title="Rating">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{(creator.avg_rating || 0).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-blue-400 w-6" title="Campañas">
                    <Award className="w-3 h-3" />
                    <span>{creator.campaigns_participated || 0}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-purple-400 w-10" title="Prom. Vistas">
                    <Eye className="w-3 h-3" />
                    <span>{formatNumber(creator.avg_views)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-green-400 w-10" title="Prom. Alcance">
                    <Users className="w-3 h-3" />
                    <span>{formatNumber(creator.avg_reach)}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-orange-400 w-10" title="Prom. Interacc.">
                    <TrendingUp className="w-3 h-3" />
                    <span>{formatNumber(creator.avg_interactions)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => setShowMetricsModal(creator)}
                    className="p-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                    title="Ver Métricas"
                    data-testid={`metrics-btn-${creator.id}`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowReviewsModal(creator)}
                    className="p-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                    title={`Reviews (${creator.total_reviews || 0})`}
                    data-testid={`reviews-btn-${creator.id}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  {!creator.is_verified && (
                    <button
                      onClick={() => handleVerifyCreator(creator.id)}
                      className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] hover:bg-green-500/30 transition-colors"
                      data-testid={`verify-btn-${creator.id}`}
                    >
                      Verificar
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleCreatorStatus(creator.id, !creator.is_active)}
                    className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
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
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-semibold text-white">Métricas de {creator.name}</h3>
            <p className="text-xs text-gray-400">{metrics.length} entregas reportadas</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <span className="text-gray-400 text-xl">&times;</span>
          </button>
        </div>
        
        {/* Summary Stats */}
        {creator.stats && (
          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className={`text-lg font-semibold ${
                  (creator.stats.delivery_on_time_rate || 100) >= 90 ? 'text-green-400' :
                  (creator.stats.delivery_on_time_rate || 100) >= 70 ? 'text-yellow-400' :
                  'text-orange-400'
                }`}>
                  {creator.stats.delivery_on_time_rate || 100}%
                </p>
                <p className="text-[10px] text-gray-500">Entregas a tiempo</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-purple-400">
                  {creator.stats.avg_delivery_lag_hours 
                    ? `${Math.round(creator.stats.avg_delivery_lag_hours / 24)}d`
                    : '0d'}
                </p>
                <p className="text-[10px] text-gray-500">Prom. días entrega</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-yellow-400">
                  {(creator.avg_rating || 0).toFixed(1)}
                </p>
                <p className="text-[10px] text-gray-500">Rating promedio</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-400">
                  {creator.campaigns_participated || 0}
                </p>
                <p className="text-[10px] text-gray-500">Campañas</p>
              </div>
            </div>
          </div>
        )}
        
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
