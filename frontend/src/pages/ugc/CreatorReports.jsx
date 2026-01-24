import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Star, Clock, Award, Eye, Heart, MessageCircle,
  Share2, Users, Calendar, ChevronDown, ChevronUp, Loader2, Filter,
  Instagram, Music2, Globe, MapPin, CheckCircle, AlertCircle
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CreatorReports = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // all, 30d, 90d, year
  const [expandedMetric, setExpandedMetric] = useState(null);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Fetch creator profile (for stats) and metrics
      const [profileRes, metricsRes, feedbackRes] = await Promise.all([
        fetch(`${API_URL}/api/ugc/creators/me`, { headers }),
        fetch(`${API_URL}/api/ugc/metrics/me?time_range=${timeRange}`, { headers }),
        fetch(`${API_URL}/api/ugc/creators/me/feedback`, { headers })
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        const profileStats = profile.stats || {};
        setStats({
          total_campaigns: profile.completed_campaigns || profileStats.total_completed || 0,
          avg_rating: profile.rating || profileStats.avg_rating || 0,
          total_reviews: profile.review_count || profileStats.total_ratings || 0,
          level: profile.level || 'rookie',
          on_time_rate: profile.delivery_on_time_rate || profileStats.delivery_on_time_rate || 100,
          total_views: profileStats.total_views || 0,
          total_engagement: profile.total_engagement || 0,
          verified_platforms: Object.keys(profile.social_accounts || {}).length
        });
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics || []);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setReviews(feedbackData.feedback || []);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getLevelConfig = (level) => {
    const configs = {
      rookie: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Rookie' },
      trusted: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Trusted' },
      pro: { color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Pro' },
      elite: { color: 'text-[#d4a968]', bg: 'bg-[#d4a968]/20', label: 'Elite' }
    };
    return configs[level] || configs.rookie;
  };

  // Calculate aggregated metrics
  const aggregatedMetrics = metrics.reduce((acc, m) => {
    acc.totalViews += m.views || 0;
    acc.totalReach += m.reach || 0;
    acc.totalLikes += m.likes || 0;
    acc.totalComments += m.comments || 0;
    acc.totalShares += m.shares || 0;
    acc.totalSaves += m.saves || 0;
    return acc;
  }, { totalViews: 0, totalReach: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalSaves: 0 });

  const avgEngagementRate = metrics.length > 0 
    ? metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / metrics.length 
    : 0;

  if (loading) {
    return (
      <>
        <UGCNavbar type="creator" />
        <div className="min-h-screen bg-black pt-14 pb-20 md:pt-16 md:pb-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
        </div>
      </>
    );
  }

  const levelConfig = getLevelConfig(stats?.level);

  return (
    <>
      <UGCNavbar type="creator" />
      <div className="min-h-screen bg-black pt-14 pb-20 md:pt-16 md:pb-8" data-testid="creator-reports-page">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-light text-white">
                Mis <span className="text-[#d4a968] italic">Reportes</span>
              </h1>
              <p className="text-gray-400 mt-1">Tu rendimiento y estadísticas</p>
            </div>
            
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4a968]/50"
              >
                <option value="all">Todo el tiempo</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Level */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${levelConfig.bg} flex items-center justify-center`}>
                  <Award className={`w-5 h-5 ${levelConfig.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${levelConfig.color}`}>{levelConfig.label}</p>
              <p className="text-sm text-gray-500 mt-1">Tu nivel</p>
            </div>

            {/* Rating */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats?.avg_rating?.toFixed(1) || '0.0'}
                <span className="text-base text-gray-500 font-normal">/5</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">{stats?.total_reviews || 0} reviews</p>
            </div>

            {/* On-Time Rate */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.on_time_rate || 0}%</p>
              <p className="text-sm text-gray-500 mt-1">Entregas a tiempo</p>
            </div>

            {/* Completed Campaigns */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stats?.total_campaigns || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Campañas completadas</p>
            </div>
          </div>

          {/* Aggregated Metrics */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#d4a968]" />
              Métricas Totales
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <Eye className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{formatNumber(aggregatedMetrics.totalViews)}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <Users className="w-5 h-5 text-green-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{formatNumber(aggregatedMetrics.totalReach)}</p>
                <p className="text-xs text-gray-500">Reach</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <Heart className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{formatNumber(aggregatedMetrics.totalLikes)}</p>
                <p className="text-xs text-gray-500">Likes</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <MessageCircle className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{formatNumber(aggregatedMetrics.totalComments)}</p>
                <p className="text-xs text-gray-500">Comments</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <Share2 className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{formatNumber(aggregatedMetrics.totalShares)}</p>
                <p className="text-xs text-gray-500">Shares</p>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                <TrendingUp className="w-5 h-5 text-[#d4a968] mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{avgEngagementRate.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">Avg. Engagement</p>
              </div>
            </div>
          </div>

          {/* Individual Metrics History */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#d4a968]" />
              Historial de Métricas
            </h2>
            
            {metrics.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aún no tenés métricas registradas</p>
                <p className="text-sm text-gray-500 mt-1">Las métricas aparecerán cuando completes campañas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {metrics.map((metric) => {
                  const isExpanded = expandedMetric === metric.id;
                  const hasDemographics = metric.demographics && (
                    metric.demographics.gender?.male || 
                    metric.demographics.countries?.length > 0
                  );
                  
                  return (
                    <div 
                      key={metric.id}
                      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                    >
                      <div 
                        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {metric.platform === 'instagram' ? (
                              <Instagram className="w-5 h-5 text-pink-400" />
                            ) : metric.platform === 'tiktok' ? (
                              <Music2 className="w-5 h-5 text-cyan-400" />
                            ) : (
                              <Globe className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <p className="text-white font-medium">{metric.campaign_name || 'Campaña'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(metric.submitted_at).toLocaleDateString('es-PY')}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-4 text-sm">
                              <span className="text-gray-400">
                                <Eye className="w-4 h-4 inline mr-1" />
                                {formatNumber(metric.views)}
                              </span>
                              <span className="text-gray-400">
                                <Heart className="w-4 h-4 inline mr-1" />
                                {formatNumber(metric.likes)}
                              </span>
                              {metric.engagement_rate && (
                                <span className="text-[#d4a968]">
                                  {metric.engagement_rate.toFixed(2)}% eng.
                                </span>
                              )}
                            </div>
                            
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-4">
                          {/* Detailed metrics */}
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.views)}</p>
                              <p className="text-xs text-gray-500">Views</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.reach)}</p>
                              <p className="text-xs text-gray-500">Reach</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.likes)}</p>
                              <p className="text-xs text-gray-500">Likes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.comments)}</p>
                              <p className="text-xs text-gray-500">Comments</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.shares)}</p>
                              <p className="text-xs text-gray-500">Shares</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-white">{formatNumber(metric.saves)}</p>
                              <p className="text-xs text-gray-500">Saves</p>
                            </div>
                          </div>
                          
                          {/* Demographics if available */}
                          {hasDemographics && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-sm text-gray-400 mb-3">Demografía de la audiencia:</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Gender */}
                                {metric.demographics.gender && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Género</p>
                                    <div className="flex gap-2">
                                      {metric.demographics.gender.male && (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                          Hombres: {metric.demographics.gender.male}%
                                        </span>
                                      )}
                                      {metric.demographics.gender.female && (
                                        <span className="px-2 py-1 bg-pink-500/20 text-pink-400 rounded text-xs">
                                          Mujeres: {metric.demographics.gender.female}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Countries */}
                                {metric.demographics.countries?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Top Países</p>
                                    <div className="flex flex-wrap gap-1">
                                      {metric.demographics.countries.slice(0, 3).map((c, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs">
                                          {c.country}: {c.percentage}%
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Age ranges */}
                                {metric.demographics.age_ranges?.length > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Edades</p>
                                    <div className="flex flex-wrap gap-1">
                                      {metric.demographics.age_ranges.slice(0, 3).map((a, i) => (
                                        <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                          {a.range}: {a.percentage}%
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#d4a968]" />
              Reviews de Marcas
            </h2>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aún no tenés reviews</p>
                <p className="text-sm text-gray-500 mt-1">Las marcas podrán dejarte reviews al completar campañas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div 
                    key={review.id}
                    className="p-5 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-medium">{review.brand_name || 'Marca'}</p>
                        <p className="text-sm text-gray-500">{review.campaign_name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating 
                                ? 'text-yellow-400 fill-yellow-400' 
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-400 mt-3 text-sm italic">&ldquo;{review.comment}&rdquo;</p>
                    )}
                    
                    <p className="text-xs text-gray-600 mt-3">
                      {new Date(review.created_at).toLocaleDateString('es-PY')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatorReports;
