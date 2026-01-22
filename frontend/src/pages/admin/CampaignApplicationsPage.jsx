import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Star, Award, Eye, TrendingUp, Instagram, Music2, 
  BadgeCheck, MapPin, Loader2, CheckCircle, XCircle, Clock, UserCheck,
  BarChart3, MessageSquare, RefreshCw, Filter
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

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
  const [error, setError] = useState('');

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
                onClick={() => navigate('/admin')}
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="applied">Pendientes</option>
              <option value="shortlisted">Preseleccionados</option>
              <option value="confirmed">Confirmados</option>
              <option value="rejected">Rechazados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
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
            <div className="grid grid-cols-[50px_200px_80px_140px_140px_180px_100px_1fr] gap-2 px-4 py-3 bg-white/5 border-b border-white/10 text-xs text-gray-500 uppercase tracking-wide">
              <div></div>
              <div>Creador</div>
              <div className="text-center">Nivel</div>
              <div className="text-center">Instagram</div>
              <div className="text-center">TikTok</div>
              <div className="text-center">Métricas</div>
              <div className="text-center">Estado</div>
              <div className="text-center">Acciones</div>
            </div>
            
            {/* Table Body */}
            {applications.map((app, idx) => {
              const creator = app.creator || {};
              const verifiedIG = creator.verified_instagram;
              const verifiedTT = creator.verified_tiktok;
              const socialAccounts = creator.social_accounts || {};
              
              const igUsername = verifiedIG?.username || socialAccounts.instagram?.username;
              const ttUsername = verifiedTT?.username || socialAccounts.tiktok?.username;
              const igVerified = !!verifiedIG;
              const ttVerified = !!verifiedTT;
              
              return (
                <div 
                  key={app.id}
                  data-testid={`application-row-${app.id}`}
                  className={`grid grid-cols-[50px_200px_80px_140px_140px_180px_100px_1fr] gap-2 px-4 py-3 items-center hover:bg-white/5 transition-colors ${idx !== 0 ? 'border-t border-white/5' : ''}`}
                >
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
                        <span className="truncate max-w-[80px]">@{igUsername}</span>
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
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] ${
                          ttVerified 
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                      >
                        <Music2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[80px]">@{ttUsername}</span>
                        {ttVerified && <BadgeCheck className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />}
                      </a>
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
              );
            })}
          </div>
        )}
        
        {/* Motivation Section - Expandable */}
        {applications.some(app => app.motivation) && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Motivaciones de los aplicantes</h3>
            <div className="grid gap-3">
              {applications.filter(app => app.motivation).map(app => (
                <div key={app.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-white text-sm">{app.creator_name}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-gray-300 italic">"{app.motivation}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignApplicationsPage;
