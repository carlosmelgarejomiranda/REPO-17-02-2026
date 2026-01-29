import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Star, TrendingUp, Award, Briefcase, Clock, CheckCircle,
  ArrowRight, Instagram, Music2, Camera, BarChart3, Loader2, BadgeCheck, 
  FileText, ChevronRight, Plus, Zap
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [profileRes, deliverablesRes] = await Promise.all([
        fetch(`${API_URL}/api/ugc/creators/me`, { headers }),
        fetch(`${API_URL}/api/ugc/creators/me/active-deliverables`, { headers })
      ]);

      // Recalculate stats in the background (don't wait for response)
      fetch(`${API_URL}/api/ugc/creators/me/recalculate-stats`, {
        method: 'POST',
        headers
      }).catch(() => {}); // Ignore errors

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        
        // Check if profile needs update - redirect to onboarding
        if (profileData.needs_profile_update) {
          navigate('/ugc/creator/onboarding');
          return;
        }
        
        let socialNetworks = profileData.social_networks || profileData.social_media || [];
        const socialAccounts = profileData.social_accounts || {};
        
        if (Object.keys(socialAccounts).length > 0) {
          const existingPlatforms = new Set(socialNetworks.map(sn => sn.platform));
          
          socialNetworks = socialNetworks.map(sn => {
            const verifiedData = socialAccounts[sn.platform];
            if (verifiedData && verifiedData.verified_by_ai) {
              return {
                ...sn,
                followers: verifiedData.follower_count,
                verified_by_ai: true,
                verified_at: verifiedData.verified_at
              };
            }
            return sn;
          });
          
          Object.entries(socialAccounts).forEach(([platform, data]) => {
            if (!existingPlatforms.has(platform) && data.verified_by_ai) {
              socialNetworks.push({
                platform,
                username: data.username,
                followers: data.follower_count,
                verified_by_ai: true,
                verified_at: data.verified_at
              });
            }
          });
        }
        
        setProfile({ ...profileData, social_networks: socialNetworks });
      }

      if (deliverablesRes.ok) {
        const deliverablesData = await deliverablesRes.json();
        setDeliverables(deliverablesData.deliverables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      rookie: 'from-gray-500 to-gray-600',
      rising: 'from-blue-500 to-blue-600',
      established: 'from-purple-500 to-purple-600',
      top: 'from-yellow-500 to-orange-500',
      elite: 'from-[#d4a968] to-yellow-500'
    };
    return colors[level] || colors.rookie;
  };

  const getLevelLabel = (level) => {
    const labels = { rookie: 'Rookie', rising: 'Rising', established: 'Established', top: 'Top', elite: 'Elite' };
    return labels[level] || 'Rookie';
  };

  const getStatusColor = (status) => {
    const colors = {
      awaiting_publish: 'bg-yellow-500/20 text-yellow-400',
      submitted: 'bg-purple-500/20 text-purple-400',
      under_review: 'bg-purple-500/20 text-purple-400',
      changes_requested: 'bg-orange-500/20 text-orange-400',
      approved: 'bg-green-500/20 text-green-400',
      completed: 'bg-green-500/20 text-green-400',
      metrics_pending: 'bg-cyan-500/20 text-cyan-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      awaiting_publish: 'Por Publicar',
      submitted: 'Enviado',
      under_review: 'En Revisión',
      changes_requested: 'Cambios',
      approved: 'Aprobado',
      completed: 'Completado',
      metrics_pending: 'Métricas'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  // Merge stats from profile.stats and root level fields (for maximum compatibility)
  const profileStats = profile?.stats || {};
  const stats = {
    ...profileStats,
    // Completed campaigns - check multiple fields
    completed_campaigns: profile?.completed_campaigns || profileStats?.total_completed || profileStats?.completed_campaigns || 0,
    // Delivery on time rate
    delivery_on_time_rate: profile?.delivery_on_time_rate || profileStats?.delivery_on_time_rate || 100,
    // Total reach - check multiple fields
    total_reach: profile?.total_reach || profileStats?.total_reach || 0,
    // Total views
    total_views: profile?.total_views || profileStats?.total_views || 0,
    // Rating
    avg_rating: profile?.rating || profileStats?.avg_rating || 0
  };
  const socialNetworks = profile?.social_networks || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <UGCNavbar type="creator" />

      {/* Main Content */}
      <div className="pt-16 pb-24 md:pb-8">
        {/* Header Section - Compact on mobile */}
        <div className="px-4 md:px-6 py-4 md:py-6 bg-gradient-to-b from-[#d4a968]/10 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Hola,</p>
                <h1 className="text-xl md:text-2xl font-medium">
                  <span className="text-[#d4a968]">{profile?.name || user?.name}</span>
                </h1>
              </div>
              {/* Level Badge - Compact */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getLevelColor(profile?.level)}`}>
                <Award className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{getLevelLabel(profile?.level)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {/* Rating */}
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-[#d4a968]" />
                </div>
                <span className="text-xs text-gray-400">Rating</span>
              </div>
              <p className="text-xl md:text-2xl font-semibold">{stats.avg_rating?.toFixed(1) || '0.0'}</p>
              <p className="text-[10px] md:text-xs text-gray-500">{stats.total_ratings || 0} reviews</p>
            </div>

            {/* Campaigns */}
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-[#d4a968]" />
                </div>
                <span className="text-xs text-gray-400">Campañas</span>
              </div>
              <p className="text-xl md:text-2xl font-semibold">{stats.completed_campaigns || 0}</p>
              <p className="text-[10px] md:text-xs text-gray-500">completadas</p>
            </div>

            {/* On-Time */}
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs text-gray-400">A tiempo</span>
              </div>
              <p className="text-xl md:text-2xl font-semibold">{stats.delivery_on_time_rate || 100}%</p>
              <p className="text-[10px] md:text-xs text-gray-500">puntualidad</p>
            </div>

            {/* Total Reach */}
            <div className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#d4a968]" />
                </div>
                <span className="text-xs text-gray-400">Alcance</span>
              </div>
              <p className="text-xl md:text-2xl font-semibold">
                {stats.total_reach ? (stats.total_reach > 1000 ? `${(stats.total_reach/1000).toFixed(1)}K` : stats.total_reach) : '0'}
              </p>
              <p className="text-[10px] md:text-xs text-gray-500">total reach</p>
            </div>
          </div>

          {/* Prominent CTA - Explorar Campañas */}
          <Link
            to="/ugc/campaigns"
            className="block mb-6 p-4 md:p-5 bg-gradient-to-r from-[#d4a968]/20 to-purple-500/10 border border-[#d4a968]/30 rounded-xl hover:border-[#d4a968]/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#d4a968] flex items-center justify-center">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-[#d4a968] transition-colors">Explorar nuevas campañas</p>
                  <p className="text-sm text-gray-400">Encontrá oportunidades para colaborar con marcas</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-[#d4a968] group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Active Deliverables - Takes 2 cols on desktop */}
            <div className="md:col-span-2 order-1">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-medium">Entregas Activas</h2>
                <Link to="/ugc/creator/my-work" className="text-[#d4a968] text-xs md:text-sm hover:underline flex items-center gap-1">
                  Ver todas <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {deliverables.length === 0 ? (
                <div className="p-6 md:p-8 bg-white/5 border border-white/10 rounded-xl text-center">
                  <Camera className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm mb-3">No tenés entregas activas</p>
                  <Link
                    to="/ugc/campaigns"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black text-sm rounded-lg hover:bg-[#c49958]"
                  >
                    Explorar campañas <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {deliverables.slice(0, 4).map((item) => (
                    <Link
                      key={item.deliverable.id}
                      to={`/ugc/creator/deliverable/${item.deliverable.id}`}
                      className="block p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Platform Icon */}
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          item.deliverable.platform === 'tiktok' 
                            ? 'bg-black border border-white/20' 
                            : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                        }`}>
                          {item.deliverable.platform === 'tiktok' ? (
                            <Music2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          ) : (
                            <Instagram className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm md:text-base text-white leading-tight line-clamp-1">
                                {item.campaign?.name || 'Campaña'}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.brand?.company_name || '-'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs whitespace-nowrap flex-shrink-0 ${getStatusColor(item.deliverable.status)}`}>
                              {getStatusLabel(item.deliverable.status)}
                            </span>
                          </div>
                          
                          {/* Action hint for pending items */}
                          {['awaiting_publish', 'changes_requested', 'published'].includes(item.deliverable.status) && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                              <span className="text-[10px] md:text-xs text-yellow-400">
                                {item.deliverable.status === 'awaiting_publish' && 'Registrá tu URL'}
                                {item.deliverable.status === 'changes_requested' && 'Revisá los cambios'}
                                {item.deliverable.status === 'published' && 'Podés subir métricas'}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Social Networks - Sidebar on desktop, full width on mobile */}
            <div className="order-2">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-medium">Mis Redes</h2>
                <Link to="/ugc/creator/profile" className="text-[#d4a968] text-xs hover:underline flex items-center gap-1">
                  Editar <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              
              {socialNetworks.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {socialNetworks.map((sn, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sn.platform === 'tiktok' ? (
                            <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center">
                              <Music2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                              <Instagram className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium flex items-center gap-1">
                              @{sn.username}
                              {sn.verified_by_ai && (
                                <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
                              )}
                            </p>
                            <p className={`text-xs ${sn.verified_by_ai ? 'text-green-400' : 'text-gray-400'}`}>
                              {sn.followers ? `${sn.followers.toLocaleString()} seguidores` : 'Sin verificar'}
                            </p>
                          </div>
                        </div>
                        {!sn.verified_by_ai && (
                          <Link
                            to="/ugc/creator/profile"
                            className="text-[10px] px-2 py-1 bg-[#d4a968]/20 text-[#d4a968] rounded-full"
                          >
                            Verificar
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-dashed border-white/20 rounded-xl text-center">
                  <Plus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm mb-2">Agregá tus redes</p>
                  <Link
                    to="/ugc/creator/profile"
                    className="text-[#d4a968] text-xs hover:underline"
                  >
                    Configurar perfil →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
