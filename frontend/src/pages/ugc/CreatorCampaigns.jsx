import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
  Instagram, Music2, Users, ChevronRight, Ban, Camera, Upload, Eye, 
  ExternalLink, Star, MessageSquare, Filter, Search, Calendar, Award,
  FileText, ArrowRight, Zap
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

// Tab button component - defined outside to avoid re-renders
const TabButton = ({ id, label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
      active 
        ? 'border-[#d4a968] text-[#d4a968]' 
        : 'border-transparent text-gray-400 hover:text-white'
    }`}
  >
    {label}
    {count > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-[#d4a968]/20' : 'bg-white/10'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const CreatorCampaigns = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('available'); // 'available', 'applications', 'deliverables'
  
  // Data states
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [campaignsRes, applicationsRes, deliverablesRes] = await Promise.all([
        fetch(`${API_URL}/api/ugc/campaigns?status=active`, { headers }),
        fetch(`${API_URL}/api/ugc/applications/me`, { headers }),
        fetch(`${API_URL}/api/ugc/deliverables/me`, { headers })
      ]);

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }

      if (applicationsRes.ok) {
        const data = await applicationsRes.json();
        setApplications(data.applications || []);
      }

      if (deliverablesRes.ok) {
        const data = await deliverablesRes.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleCancelParticipation = async (applicationId) => {
    if (!window.confirm('¿Estás seguro de cancelar tu participación? Esta acción no se puede deshacer.')) {
      return;
    }

    setActionLoading(applicationId);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/${applicationId}/withdraw`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAllData();
      } else {
        // Read response as text first to avoid "body is disturbed or locked" error on Safari/iOS
        const responseText = await res.text();
        let error;
        try {
          error = JSON.parse(responseText);
        } catch (parseErr) {
          error = {};
        }
        alert(error.detail || 'Error al cancelar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  // Status helpers
  const getApplicationStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pendiente', icon: Clock },
      approved: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Aprobado', icon: CheckCircle },
      confirmed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rechazado', icon: XCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Retirado', icon: Ban },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completado', icon: Award }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status, icon: Clock };
  };

  const getDeliverableStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Por Publicar', icon: Upload },
      published: { color: 'bg-blue-500/20 text-blue-400', label: 'Publicado', icon: CheckCircle },
      submitted: { color: 'bg-blue-500/20 text-blue-400', label: 'Enviado', icon: CheckCircle },
      resubmitted: { color: 'bg-blue-500/20 text-blue-400', label: 'Reenviado', icon: CheckCircle },
      changes_requested: { color: 'bg-orange-500/20 text-orange-400', label: 'Cambios Solicitados', icon: AlertCircle },
      approved: { color: 'bg-green-500/20 text-green-400', label: 'Aprobado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: AlertCircle },
      cancelled_by_admin: { color: 'bg-red-500/20 text-red-400', label: 'Cancelado por Admin', icon: AlertCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400', label: 'Cancelado', icon: Clock },
      metrics_pending: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas Pendientes', icon: Clock },
      metrics_submitted: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas Enviadas', icon: CheckCircle },
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completado', icon: CheckCircle }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status, icon: Clock };
  };

  const canUploadMetrics = (status) => {
    return ['published', 'submitted', 'resubmitted', 'approved', 'metrics_pending'].includes(status);
  };

  // Calculate counts for tabs
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const activeDeliverables = deliverables.filter(d => !['completed', 'rejected', 'withdrawn', 'cancelled_by_admin'].includes(d.status)).length;

  // Filter data based on search and status
  const filteredCampaigns = campaigns.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApplications = applications.filter(a => {
    const matchesSearch = a.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredDeliverables = deliverables.filter(d => {
    const matchesSearch = d.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') return matchesSearch && ['awaiting_publish', 'changes_requested', 'published', 'submitted', 'resubmitted', 'metrics_pending'].includes(d.status);
    if (statusFilter === 'completed') return matchesSearch && ['approved', 'completed', 'metrics_submitted'].includes(d.status);
    if (statusFilter === 'rejected') return matchesSearch && (d.status === 'rejected' || d.status === 'cancelled_by_admin');
    if (statusFilter === 'cancelled') return matchesSearch && d.status === 'withdrawn';
    return matchesSearch && d.status === statusFilter;
  });

  // Handlers for tabs
  const handleTabClick = (id) => {
    setActiveTab(id);
    setStatusFilter('all');
  };

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

  return (
    <>
      <UGCNavbar type="creator" />
      <div className="min-h-screen bg-black pt-14 pb-20 md:pt-16 md:pb-8" data-testid="creator-campaigns-page">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-light text-white">
              Mis <span className="text-[#d4a968] italic">Campañas</span>
            </h1>
            <p className="text-gray-400 mt-1">Explora, aplica y gestiona tus colaboraciones</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-6 overflow-x-auto">
            <TabButton id="available" label="Disponibles" count={filteredCampaigns.length} active={activeTab === 'available'} onClick={() => handleTabClick('available')} />
            <TabButton id="applications" label="Mis Aplicaciones" count={pendingApplications} active={activeTab === 'applications'} onClick={() => handleTabClick('applications')} />
            <TabButton id="deliverables" label="Mis Entregas" count={activeDeliverables} active={activeTab === 'deliverables'} onClick={() => handleTabClick('deliverables')} />
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar campañas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d4a968]/50"
              />
            </div>
            
            {activeTab !== 'available' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#d4a968]/50"
              >
                <option value="all">Todos los estados</option>
                {activeTab === 'applications' && (
                  <>
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobado</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="rejected">Rechazado</option>
                  </>
                )}
                {activeTab === 'deliverables' && (
                  <>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completadas</option>
                    <option value="rejected">Rechazadas</option>
                    <option value="cancelled">Canceladas</option>
                  </>
                )}
              </select>
            )}

            <button
              onClick={fetchAllData}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>

          {/* Content */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              {filteredCampaigns.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No hay campañas disponibles en este momento</p>
                </div>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/ugc/campaigns/${campaign.id}`}
                    className="block p-5 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {campaign.cover_image ? (
                        <img src={campaign.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                          <Briefcase className="w-8 h-8 text-[#d4a968]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium group-hover:text-[#d4a968] transition-colors line-clamp-1">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{campaign.brand_name}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {campaign.slots_available || 0} lugares
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(campaign.end_date).toLocaleDateString('es-PY')}
                          </span>
                          {campaign.compensation && (
                            <span className="text-[#d4a968]">{campaign.compensation}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968] transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tenés aplicaciones todavía</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    className="mt-4 px-4 py-2 bg-[#d4a968] text-black rounded-lg text-sm font-medium hover:bg-[#c49958] transition-colors"
                  >
                    Explorar Campañas
                  </button>
                </div>
              ) : (
                filteredApplications.map((app) => {
                  const statusConfig = getApplicationStatusConfig(app.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={app.id}
                      className="p-5 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-medium">{app.campaign_name || 'Campaña'}</h3>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{app.brand_name || 'Marca'}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Aplicado: {new Date(app.created_at).toLocaleDateString('es-PY')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {app.status === 'approved' && (
                            <Link
                              to={`/ugc/campaigns/${app.campaign_id}`}
                              className="px-3 py-1.5 bg-[#d4a968] text-black rounded-lg text-sm font-medium hover:bg-[#c49958] transition-colors"
                            >
                              Confirmar
                            </Link>
                          )}
                          
                          {['pending', 'approved'].includes(app.status) && (
                            <button
                              onClick={() => handleCancelParticipation(app.id)}
                              disabled={actionLoading === app.id}
                              className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === app.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Retirar'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              {filteredDeliverables.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                  <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No tenés entregas activas</p>
                  <p className="text-sm text-gray-500 mt-1">Aplicá a campañas para comenzar a crear contenido</p>
                </div>
              ) : (
                filteredDeliverables.map((deliverable) => {
                  const statusConfig = getDeliverableStatusConfig(deliverable.status);
                  const StatusIcon = statusConfig.icon;
                  const showMetricsButton = canUploadMetrics(deliverable.status);
                  
                  return (
                    <div
                      key={deliverable.id}
                      className="p-5 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-medium">{deliverable.campaign_name || 'Campaña'}</h3>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{deliverable.brand_name || 'Marca'}</p>
                          
                          {deliverable.content_url && (
                            <a
                              href={deliverable.content_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[#d4a968] mt-2 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver contenido publicado
                            </a>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/ugc/creator/deliverable/${deliverable.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Link>
                          
                          {showMetricsButton && (
                            <Link
                              to={`/ugc/creator/metrics/${deliverable.id}`}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#d4a968] text-black rounded-lg text-sm font-medium hover:bg-[#c49958] transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              Métricas
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreatorCampaigns;
