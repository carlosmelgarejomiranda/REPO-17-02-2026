import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Star, Award, Eye, TrendingUp, Instagram, Music2, 
  BadgeCheck, MapPin, Loader2, CheckCircle, XCircle, Clock, UserCheck,
  BarChart3, MessageSquare, RefreshCw, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

// WhatsApp icon component
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Format numbers
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

// Level Badge
const LevelBadge = ({ level }) => {
  const configs = {
    rookie: { color: 'text-gray-400 bg-gray-500/20', label: 'Rookie' },
    rising: { color: 'text-blue-400 bg-blue-500/20', label: 'Rising' },
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

// Status Badge
const StatusBadge = ({ status }) => {
  const configs = {
    applied: { color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', label: 'Pendiente', icon: Clock },
    shortlisted: { color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', label: 'Preseleccionado', icon: UserCheck },
    confirmed: { color: 'text-green-400 bg-green-500/20 border-green-500/30', label: 'Confirmado', icon: CheckCircle },
    rejected: { color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'Rechazado', icon: XCircle },
    cancelled: { color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', label: 'Cancelado', icon: XCircle },
  };
  const config = configs[status] || configs.applied;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const CampaignApplicationsPage = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [hasAiVerified, setHasAiVerified] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');
  const [expandedMotivation, setExpandedMotivation] = useState(null); // Track which application's motivation is expanded

  // Sort applications locally
  const sortedApplications = React.useMemo(() => {
    let filtered = applications;
    
    // Filter by AI verified if set
    if (hasAiVerified === 'true') {
      filtered = applications.filter(app => {
        const creator = app.creator || {};
        return creator.verified_instagram || creator.verified_tiktok;
      });
    }
    
    if (!sortBy) return filtered;
    
    return [...filtered].sort((a, b) => {
      const creatorA = a.creator || {};
      const creatorB = b.creator || {};
      let aVal = 0, bVal = 0;
      
      if (sortBy === 'ig_followers') {
        aVal = creatorA.verified_instagram?.follower_count || creatorA.unverified_instagram?.followers || 0;
        bVal = creatorB.verified_instagram?.follower_count || creatorB.unverified_instagram?.followers || 0;
      } else if (sortBy === 'tt_followers') {
        aVal = creatorA.verified_tiktok?.follower_count || creatorA.unverified_tiktok?.followers || 0;
        bVal = creatorB.verified_tiktok?.follower_count || creatorB.unverified_tiktok?.followers || 0;
      } else if (sortBy === 'avg_views') {
        aVal = creatorA.avg_views || 0;
        bVal = creatorB.avg_views || 0;
      } else if (sortBy === 'rating') {
        aVal = creatorA.avg_rating || a.creator_rating || 0;
        bVal = creatorB.avg_rating || b.creator_rating || 0;
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [applications, sortBy, sortOrder, hasAiVerified]);

  // Fetch campaign and applications
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch campaign details
      const campaignRes = await fetch(`${API_URL}/api/ugc/admin/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (campaignRes.ok) {
        const data = await campaignRes.json();
        const found = data.campaigns?.find(c => c.id === campaignId);
        if (found) setCampaign(found);
      }
      
      // Fetch applications
      let url = `${API_URL}/api/ugc/admin/campaigns/${campaignId}/applications`;
      if (statusFilter) url += `?status=${statusFilter}`;
      
      const appsRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [campaignId, statusFilter]);

  // Update application status
  const handleUpdateStatus = async (applicationId, newStatus) => {
    setActionLoading(applicationId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ugc/admin/applications/${applicationId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        fetchData(); // Refresh data
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al actualizar estado');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const canConfirm = campaign && (campaign.available_slots || 0) > (campaign.slots_filled || 0);

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
      <div className="bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold">Aplicaciones</h1>
                <p className="text-sm text-gray-400 truncate max-w-md">
                  {campaign?.name || 'Campaña'}
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-light text-green-400">{campaign?.available_slots || 0}</p>
                <p className="text-xs text-gray-500">Disponibles</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-white">{campaign?.slots_filled || 0}</p>
                <p className="text-xs text-gray-500">Confirmados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-gray-400">{campaign?.total_slots_loaded || campaign?.slots || 0}</p>
                <p className="text-xs text-gray-500">Total Cupos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-light text-[#d4a968]">{applications.length}</p>
                <p className="text-xs text-gray-500">Aplicaciones</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm [&>option]:bg-[#1a1a1a] [&>option]:text-white"
            >
              <option value="">Todos los estados</option>
              <option value="applied">Pendientes</option>
              <option value="shortlisted">Preseleccionados</option>
              <option value="confirmed">Confirmados</option>
              <option value="rejected">Rechazados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          <select
            value={hasAiVerified}
            onChange={(e) => setHasAiVerified(e.target.value)}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm [&>option]:bg-[#1a1a1a] [&>option]:text-white"
          >
            <option value="">Todas las cuentas</option>
            <option value="true">Con redes verificadas IA</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setSortOrder('desc'); }}
            className="px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm [&>option]:bg-[#1a1a1a] [&>option]:text-white"
          >
            <option value="">Ordenar por...</option>
            <option value="ig_followers">Seguidores IG</option>
            <option value="tt_followers">Seguidores TT</option>
            <option value="avg_views">Prom. Vistas</option>
            <option value="rating">Rating</option>
          </select>
          {sortBy && (
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-2 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-sm"
            >
              {sortOrder === 'desc' ? '↓ Mayor' : '↑ Menor'}
            </button>
          )}
          <button 
            onClick={fetchData}
            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {applications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No hay aplicaciones {statusFilter ? `con estado "${statusFilter}"` : ''}</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[50px_180px_80px_110px_70px_110px_70px_160px_100px_1fr] gap-2 px-4 py-3 bg-white/5 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
              <div></div>
              <div>Creador</div>
              <div className="text-center">Nivel</div>
              <div className="text-center">Instagram</div>
              <div className="text-center cursor-pointer hover:text-white" onClick={() => { setSortBy('ig_followers'); setSortOrder(sortBy === 'ig_followers' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                Seg. IG {sortBy === 'ig_followers' && (sortOrder === 'desc' ? '↓' : '↑')}
              </div>
              <div className="text-center">TikTok</div>
              <div className="text-center cursor-pointer hover:text-white" onClick={() => { setSortBy('tt_followers'); setSortOrder(sortBy === 'tt_followers' && sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                Seg. TT {sortBy === 'tt_followers' && (sortOrder === 'desc' ? '↓' : '↑')}
              </div>
              <div className="text-center">Métricas</div>
              <div className="text-center">Estado</div>
              <div className="text-center">Acciones</div>
            </div>
            
            {/* Table Body */}
            {sortedApplications.map((app, idx) => {
              const creator = app.creator || {};
              const verifiedIG = creator.verified_instagram;
              const verifiedTT = creator.verified_tiktok;
              
              // Try both social_accounts (legacy) and social_networks (new)
              const socialAccounts = creator.social_accounts || {};
              const socialNetworks = creator.social_networks || [];
              
              // Get Instagram username from verified, social_networks, or social_accounts
              const igFromNetworks = socialNetworks.find(s => s.platform === 'instagram');
              const ttFromNetworks = socialNetworks.find(s => s.platform === 'tiktok');
              
              const igUsername = verifiedIG?.username || igFromNetworks?.username || socialAccounts.instagram?.username;
              const ttUsername = verifiedTT?.username || ttFromNetworks?.username || socialAccounts.tiktok?.username;
              const igVerified = !!verifiedIG;
              const ttVerified = !!verifiedTT;
              const igFollowers = verifiedIG?.follower_count || igFromNetworks?.followers || 0;
              const ttFollowers = verifiedTT?.follower_count || ttFromNetworks?.followers || 0;
              
              return (
                <div 
                  key={app.id}
                  data-testid={`application-row-${app.id}`}
                  className={`bg-[#0d0d0d] border border-white/10 rounded-lg overflow-hidden transition-all ${idx !== 0 ? 'mt-3' : ''}`}
                >
                  {/* Main Row */}
                  <div className="grid grid-cols-[50px_180px_80px_110px_70px_110px_70px_160px_100px_1fr] gap-2 px-4 py-3 items-center">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-sm">
                        {app.creator_name?.charAt(0) || 'C'}
                      </div>
                      {creator.is_verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5">
                          <BadgeCheck className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Name + Username + Location */}
                    <div className="overflow-hidden">
                      <p className="font-medium text-white text-sm truncate" title={app.creator_name}>
                        {app.creator_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">@{app.creator_username}</p>
                      {creator.city && (
                        <p className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{creator.city}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Level */}
                    <div className="text-center">
                      <LevelBadge level={creator.level || app.creator_level} />
                    </div>
                    
                    {/* Instagram */}
                    <div className="text-center">
                      {igUsername ? (
                        <a 
                          href={`https://instagram.com/${igUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                            igVerified 
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                              : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                        >
                          <Instagram className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[60px]">@{igUsername}</span>
                          {igVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />}
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-600">—</span>
                      )}
                    </div>
                    
                    {/* IG Followers */}
                    <div className="text-center">
                      {igFollowers > 0 ? (
                        <span className={`text-xs font-medium ${igVerified ? 'text-pink-400' : 'text-gray-400'}`}>
                          {formatNumber(igFollowers)}
                          {igVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 inline ml-1" />}
                        </span>
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
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                            ttVerified 
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                              : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                        >
                          <Music2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[60px]">@{ttUsername}</span>
                          {ttVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />}
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-600">—</span>
                      )}
                    </div>
                    
                    {/* TT Followers */}
                    <div className="text-center">
                      {ttFollowers > 0 ? (
                        <span className={`text-xs font-medium ${ttVerified ? 'text-cyan-400' : 'text-gray-400'}`}>
                          {formatNumber(ttFollowers)}
                          {ttVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 inline ml-1" />}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-600">—</span>
                      )}
                    </div>
                    
                    {/* Metrics */}
                    <div className="flex items-center justify-center gap-2 text-[10px]">
                      <div className="flex items-center gap-0.5 text-yellow-400" title="Rating">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{(creator.avg_rating || app.creator_rating || 0).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-blue-400" title="Campañas">
                        <Award className="w-3 h-3" />
                        <span>{creator.campaigns_participated || 0}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-purple-400" title="Prom. Vistas">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(creator.avg_views)}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-green-400" title="Prom. Interacc.">
                        <TrendingUp className="w-3 h-3" />
                        <span>{formatNumber(creator.avg_interactions)}</span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="text-center">
                      <StatusBadge status={app.status} />
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      {/* WhatsApp button - always visible if creator has valid phone */}
                      {creator.phone && creator.phone !== 'N/A' && (
                        <a
                          href={`https://wa.me/${creator.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                          title={`WhatsApp: ${creator.phone}`}
                          data-testid={`whatsapp-btn-${app.id}`}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>
                      )}
                      
                      {actionLoading === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#d4a968]" />
                      ) : (
                        <>
                          {app.status === 'applied' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                                className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] hover:bg-purple-500/30 transition-colors"
                              >
                                Preseleccionar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                disabled={!canConfirm}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!canConfirm ? 'No hay cupos disponibles' : ''}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/30 transition-colors"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          
                          {app.status === 'shortlisted' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                                disabled={!canConfirm}
                                className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!canConfirm ? 'No hay cupos disponibles' : ''}
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/30 transition-colors"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          
                          {app.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                if (window.confirm('¿Cancelar la participación de este creador?')) {
                                  handleUpdateStatus(app.id, 'cancelled');
                                }
                              }}
                              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/30 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                          
                          {(app.status === 'rejected' || app.status === 'cancelled') && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'applied')}
                              className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] hover:bg-blue-500/30 transition-colors"
                            >
                              Reactivar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Motivation Section - Integrated in card */}
                  {app.motivation && (
                    <div className="border-t border-white/5 px-4 py-2 bg-white/[0.02]">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs text-gray-400 italic ${expandedMotivation === app.id ? '' : 'line-clamp-2'}`}>
                            &ldquo;{app.motivation}&rdquo;
                          </p>
                          {app.motivation.length > 100 && (
                            <button
                              onClick={() => setExpandedMotivation(expandedMotivation === app.id ? null : app.id)}
                              className="text-[10px] text-[#d4a968] hover:text-[#e5ba79] mt-1 flex items-center gap-0.5 transition-colors"
                            >
                              {expandedMotivation === app.id ? (
                                <>Ver menos <ChevronUp className="w-3 h-3" /></>
                              ) : (
                                <>Ver más <ChevronDown className="w-3 h-3" /></>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignApplicationsPage;
