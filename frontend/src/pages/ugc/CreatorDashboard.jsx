import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Star, TrendingUp, Award, Briefcase, Clock, CheckCircle,
  ArrowRight, Instagram, Music2, Camera, BarChart3, Loader2, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

const CreatorDashboard = () => {
  const { user } = useAuth();
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

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        
        // Build social_networks from social_accounts if social_networks is empty
        let socialNetworks = profileData.social_networks || [];
        const socialAccounts = profileData.social_accounts || {};
        
        // If we have verified social accounts, use them
        if (Object.keys(socialAccounts).length > 0) {
          // Create a map of existing networks by platform
          const existingPlatforms = new Set(socialNetworks.map(sn => sn.platform));
          
          // Update existing networks with verified data
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
          
          // Add verified accounts that don't exist in social_networks
          Object.entries(socialAccounts).forEach(([platform, data]) => {
            if (!existingPlatforms.has(platform) && data.verified_by_ai) {
              socialNetworks.push({
                platform: platform,
                username: data.username,
                followers: data.follower_count,
                verified_by_ai: true,
                verified_at: data.verified_at
              });
            }
          });
        }
        
        profileData.social_networks = socialNetworks;
        setProfile(profileData);
      }

      if (deliverablesRes.ok) {
        const delData = await deliverablesRes.json();
        setDeliverables(delData.deliverables || []);
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
      trusted: 'from-blue-500 to-blue-600',
      pro: 'from-purple-500 to-purple-600',
      elite: 'from-[#d4a968] to-amber-600'
    };
    return colors[level] || colors.rookie;
  };

  const getLevelLabel = (level) => {
    const labels = { rookie: 'Rookie', trusted: 'Trusted', pro: 'Pro', elite: 'Elite' };
    return labels[level] || 'Rookie';
  };

  const getStatusColor = (status) => {
    const colors = {
      awaiting_publish: 'bg-yellow-500/20 text-yellow-400',
      published: 'bg-blue-500/20 text-blue-400',
      submitted: 'bg-purple-500/20 text-purple-400',
      approved: 'bg-green-500/20 text-green-400',
      changes_requested: 'bg-orange-500/20 text-orange-400',
      metrics_pending: 'bg-cyan-500/20 text-cyan-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  const getStatusLabel = (status) => {
    const labels = {
      awaiting_publish: 'Por publicar',
      published: 'Publicado',
      submitted: 'Enviado',
      under_review: 'En revisión',
      approved: 'Aprobado',
      changes_requested: 'Cambios solicitados',
      metrics_pending: 'Métricas pendientes',
      metrics_submitted: 'Métricas enviadas',
      completed: 'Completado'
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </a>
          <div className="flex items-center gap-4">
            <Link to="/ugc/campaigns" className="text-gray-400 hover:text-white transition-colors">
              Campañas
            </Link>
            <Link to="/ugc/creator/profile" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <User className="w-5 h-5" />
              Mi Perfil
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-light mb-2">
            Hola, <span className="text-[#d4a968] italic">{profile?.name || user?.name}</span>
          </h1>
          <p className="text-gray-400">Este es tu panel de creador UGC</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {/* Level Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLevelColor(profile?.level)} flex items-center justify-center mb-4`}>
              <Award className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Nivel</p>
            <p className="text-2xl font-medium">{getLevelLabel(profile?.level)}</p>
            <div className="mt-2 h-1 bg-white/10 rounded-full">
              <div 
                className="h-1 bg-[#d4a968] rounded-full transition-all"
                style={{ width: `${profile?.level_progress || 0}%` }}
              />
            </div>
          </div>

          {/* Rating Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Rating</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-medium">{profile?.stats?.avg_rating?.toFixed(1) || '0.0'}</p>
              <span className="text-gray-500 text-sm">/ 5.0</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{profile?.stats?.total_ratings || 0} reviews</p>
          </div>

          {/* Campaigns Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Campañas</p>
            <p className="text-2xl font-medium">{profile?.stats?.completed_campaigns || 0}</p>
            <p className="text-xs text-gray-500 mt-1">completadas</p>
          </div>

          {/* On-Time Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Puntualidad</p>
            <p className="text-2xl font-medium">{profile?.stats?.delivery_on_time_rate || 100}%</p>
            <p className="text-xs text-gray-500 mt-1">entregas a tiempo</p>
          </div>
        </div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Active Deliverables */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Entregas Activas</h2>
              <Link to="/ugc/creator/workspace" className="text-[#d4a968] text-sm hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {deliverables.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 rounded-xl text-center">
                <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No tenés entregas activas</p>
                <Link
                  to="/ugc/campaigns"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
                >
                  Buscar campañas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {deliverables.slice(0, 5).map((item) => (
                  <Link
                    key={item.deliverable.id}
                    to={`/ugc/creator/deliverable/${item.deliverable.id}`}
                    className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                          {item.deliverable.platform === 'tiktok' ? (
                            <Music2 className="w-5 h-5 text-[#d4a968]" />
                          ) : (
                            <Instagram className="w-5 h-5 text-[#d4a968]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.campaign?.name}</p>
                          <p className="text-sm text-gray-500">{item.brand?.company_name}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(item.deliverable.status)}`}>
                        {getStatusLabel(item.deliverable.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Social Networks */}
          <div>
            <h2 className="text-xl font-medium mb-6">Mis Redes</h2>
            <div className="space-y-4">
              {profile?.social_networks?.length > 0 ? (
                profile.social_networks.map((sn, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {sn.platform === 'tiktok' ? (
                        <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center">
                          <Music2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                          <Instagram className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="font-medium flex items-center gap-2">
                        @{sn.username}
                        {sn.verified_by_ai && (
                          <BadgeCheck className="w-4 h-4 text-green-400" title="Verificado con IA" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Seguidores:</span>
                      <span className={`font-medium ${sn.verified_by_ai ? 'text-green-400' : 'text-white'}`}>
                        {sn.followers ? sn.followers.toLocaleString() : 'Sin actualizar'}
                        {sn.verified_by_ai && <span className="text-xs text-gray-500 ml-1">✓</span>}
                      </span>
                    </div>
                    {!sn.followers && (
                      <Link
                        to="/ugc/creator/profile"
                        className="mt-3 block text-xs text-[#d4a968] hover:underline"
                      >
                        Verificar con screenshot →
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                  <p className="text-gray-400 text-sm">No tenés redes conectadas</p>
                </div>
              )}

              <Link
                to="/ugc/creator/profile"
                className="block p-4 border border-dashed border-white/20 rounded-xl text-center text-gray-400 hover:border-[#d4a968]/50 hover:text-[#d4a968] transition-all"
              >
                + Agregar red social
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
