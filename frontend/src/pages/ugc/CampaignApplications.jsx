import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Star, Loader2, CheckCircle, 
  Clock, UserCheck, Instagram, Music2, Eye, TrendingUp, Award, BadgeCheck, MapPin, Lock,
  Download
} from 'lucide-react';

const API_URL = getApiUrl();

// Format numbers
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const CampaignApplications = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    
    try {
      // Fetch campaign
      const campaignRes = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (campaignRes.ok) {
        const data = await campaignRes.json();
        setCampaign(data);
      }

      // Fetch applications
      const appsRes = await fetch(`${API_URL}/api/ugc/applications/campaign/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}/applications/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Get filename from Content-Disposition header or use default
        const contentDisposition = res.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `aplicaciones_${campaign?.name || 'campaign'}.xlsx`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al exportar');
      }
    } catch (err) {
      console.error(err);
      alert('Error al exportar');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado', icon: UserCheck },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado', icon: CheckCircle },
    };
    const badge = badges[status] || badges.applied;
    const Icon = badge.icon;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  // Filter applications - brands can only see shortlisted and confirmed
  const visibleApplications = applications.filter(app => 
    app.status === 'shortlisted' || app.status === 'confirmed'
  );
  
  // Count pending for info display
  const pendingCount = applications.filter(app => app.status === 'applied').length;
  const shortlistedCount = applications.filter(app => app.status === 'shortlisted').length;
  const confirmedCount = applications.filter(app => app.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to={`/ugc/brand/campaigns/${campaignId}/reports`} 
            className="flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a Reportes
          </Link>
          <span className="text-[#d4a968] italic">Aplicaciones</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-light mb-2">
                Creadores de <span className="text-[#d4a968] italic">{campaign?.name}</span>
              </h1>
              <p className="text-gray-400 text-sm mb-4">
                Creadores preseleccionados y confirmados para tu campaña
              </p>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExportExcel}
              disabled={exporting || applications.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="export-applications-btn"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </>
              )}
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span className="text-sm text-gray-400">{pendingCount} pendientes</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">{shortlistedCount} preseleccionados</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">{confirmedCount} confirmados</span>
            </div>
            <div className="text-sm text-gray-500">
              {campaign?.slots_filled || 0}/{campaign?.slots || 0} cupos ocupados
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mb-6 p-4 bg-[#d4a968]/10 border border-[#d4a968]/20 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-[#d4a968] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">
              <span className="text-[#d4a968] font-medium">Solo visualización:</span> La selección y gestión de creadores es realizada por el equipo de Avenue. 
              Aquí puedes ver los creadores que han sido preseleccionados o confirmados para tu campaña.
            </p>
          </div>
        </div>

        {/* Applications List */}
        {visibleApplications.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Sin creadores asignados aún</h3>
            <p className="text-gray-400">
              {pendingCount > 0 
                ? `Hay ${pendingCount} aplicaciones pendientes de revisión por el equipo de Avenue.`
                : 'Todavía no hay creadores que hayan aplicado a esta campaña.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleApplications.map(app => (
              <div 
                key={app.id}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* Creator Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-xl">
                        {app.creator_name?.charAt(0) || 'C'}
                      </div>
                      {app.creator?.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                          <BadgeCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-lg text-white">{app.creator_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          app.creator_level === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                          app.creator_level === 'trusted' ? 'bg-blue-500/20 text-blue-400' :
                          app.creator_level === 'elite' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {app.creator_level || 'rookie'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">@{app.creator_username}</p>
                      
                      {/* Social Links */}
                      <div className="flex items-center gap-3 mt-3">
                        {app.creator?.social_accounts?.instagram && (
                          <a 
                            href={`https://instagram.com/${app.creator.social_accounts.instagram.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-400 text-sm hover:bg-pink-500/30 transition-colors"
                          >
                            <Instagram className="w-4 h-4" />
                            @{app.creator.social_accounts.instagram.username}
                          </a>
                        )}
                        {app.creator?.social_accounts?.tiktok && (
                          <a 
                            href={`https://tiktok.com/@${app.creator.social_accounts.tiktok.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
                          >
                            <Music2 className="w-4 h-4" />
                            @{app.creator.social_accounts.tiktok.username}
                          </a>
                        )}
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          {app.creator_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          {formatNumber(app.creator_followers)} seguidores
                        </span>
                        {app.creator?.campaigns_participated > 0 && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Award className="w-4 h-4" />
                            {app.creator.campaigns_participated} campañas
                          </span>
                        )}
                        {/* On-time delivery rate */}
                        {app.creator?.stats?.delivery_on_time_rate !== undefined && (
                          <span className={`flex items-center gap-1 ${
                            app.creator.stats.delivery_on_time_rate >= 90 ? 'text-green-400' :
                            app.creator.stats.delivery_on_time_rate >= 70 ? 'text-yellow-400' :
                            'text-orange-400'
                          }`}>
                            <Clock className="w-4 h-4" />
                            {app.creator.stats.delivery_on_time_rate}% a tiempo
                          </span>
                        )}
                        {/* Average late hours */}
                        {app.creator?.stats?.avg_delivery_lag_hours > 0 && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <TrendingUp className="w-4 h-4" />
                            ~{Math.round(app.creator.stats.avg_delivery_lag_hours / 24)} días prom.
                          </span>
                        )}
                      </div>

                      {/* Motivation */}
                      {app.motivation && (
                        <p className="mt-3 text-gray-300 italic text-sm max-w-xl bg-white/5 p-3 rounded-lg">
                          "{app.motivation}"
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-3">
                        {app.status === 'confirmed' ? 'Confirmado' : 'Preseleccionado'} el {formatDate(app.updated_at || app.applied_at)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(app.status)}
                    {app.status === 'confirmed' && (
                      <span className="text-xs text-green-400/70">Listo para crear contenido</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignApplications;
