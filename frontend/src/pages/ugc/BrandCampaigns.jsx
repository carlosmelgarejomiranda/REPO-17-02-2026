import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, MoreVertical, Users, Eye, Play, Pause, CheckCircle, 
  Clock, ArrowRight, Loader2, Building2, ChevronDown,
  Instagram, Music2, MapPin, Calendar, AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const BrandCampaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, draft, live, closed, completed
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/campaigns/me/all`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (campaignId) => {
    setLoadingApplications(true);
    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/campaign/${campaignId}`, { 
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleSelectCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    fetchApplications(campaign.id);
  };

  const handlePublishCampaign = async (campaignId) => {
    setActionLoading(campaignId);
    try {
      const res = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        fetchCampaigns();
        if (selectedCampaign?.id === campaignId) {
          setSelectedCampaign({...selectedCampaign, status: 'live'});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    setActionLoading(campaignId);
    try {
      const res = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}/close`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        fetchCampaigns();
        if (selectedCampaign?.id === campaignId) {
          setSelectedCampaign({...selectedCampaign, status: 'closed'});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus, reason = null) => {
    setActionLoading(applicationId);
    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        // Refresh applications
        if (selectedCampaign) {
          fetchApplications(selectedCampaign.id);
          fetchCampaigns(); // Also refresh campaigns to update slots_filled
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Borrador' },
      live: { color: 'bg-green-500/20 text-green-400', label: 'Activa' },
      closed: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Cerrada' },
      in_production: { color: 'bg-purple-500/20 text-purple-400', label: 'En Producción' },
      completed: { color: 'bg-blue-500/20 text-blue-400', label: 'Completada' },
      cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelada' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>{badge.label}</span>;
  };

  const getApplicationStatusBadge = (status) => {
    const badges = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente' },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado' },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado' },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado' },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400', label: 'Retirada' }
    };
    const badge = badges[status] || badges.applied;
    return <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>{badge.label}</span>;
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'all') return true;
    return c.status === activeTab;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/ugc/brand/dashboard" className="text-gray-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/ugc/brand/deliverables" className="text-gray-400 hover:text-white transition-colors">
              Entregas
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light mb-2">
              Mis <span className="text-[#d4a968] italic">Campañas</span>
            </h1>
            <p className="text-gray-400">Gestiona tus campañas y revisa aplicaciones</p>
          </div>
          <Link
            to="/ugc/brand/campaigns/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Campaña
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'draft', label: 'Borradores' },
            { id: 'live', label: 'Activas' },
            { id: 'closed', label: 'Cerradas' },
            { id: 'completed', label: 'Completadas' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Campaigns List */}
            <div>
              <h2 className="text-lg font-medium mb-4 text-gray-300">
                {filteredCampaigns.length} campaña{filteredCampaigns.length !== 1 ? 's' : ''}
              </h2>

              {filteredCampaigns.length === 0 ? (
                <div className="p-8 bg-white/5 border border-white/10 rounded-xl text-center">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tenés campañas{activeTab !== 'all' ? ` en estado "${activeTab}"` : ''}</p>
                  <Link
                    to="/ugc/brand/campaigns/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
                  >
                    <Plus className="w-4 h-4" /> Crear Campaña
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCampaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      onClick={() => handleSelectCampaign(campaign)}
                      className={`p-5 bg-white/5 border rounded-xl cursor-pointer transition-all ${
                        selectedCampaign?.id === campaign.id
                          ? 'border-[#d4a968] bg-[#d4a968]/5'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-white">{campaign.name}</h3>
                          <p className="text-sm text-gray-500">{campaign.category} • {campaign.city}</p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {campaign.slots_filled || 0}/{campaign.slots} cupos
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {campaign.applications_count || 0} aplicaciones
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePublishCampaign(campaign.id); }}
                            disabled={actionLoading === campaign.id}
                            className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors flex items-center justify-center gap-1"
                          >
                            {actionLoading === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><Play className="w-4 h-4" /> Publicar</>
                            )}
                          </button>
                        )}
                        {campaign.status === 'live' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloseCampaign(campaign.id); }}
                            disabled={actionLoading === campaign.id}
                            className="flex-1 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-1"
                          >
                            {actionLoading === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <><Pause className="w-4 h-4" /> Cerrar</>
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectCampaign(campaign); }}
                          className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                        >
                          Ver Aplicaciones
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applications Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {!selectedCampaign ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Selecciona una campaña para ver sus aplicaciones</p>
                </div>
              ) : (
                <>
                  {/* Panel Header */}
                  <div className="p-5 border-b border-white/10">
                    <h3 className="font-medium text-white mb-1">{selectedCampaign.name}</h3>
                    <p className="text-sm text-gray-400">
                      {applications.length} aplicaciones • {selectedCampaign.slots_filled || 0}/{selectedCampaign.slots} cupos llenos
                    </p>
                  </div>

                  {/* Applications List */}
                  <div className="max-h-[600px] overflow-y-auto">
                    {loadingApplications ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-[#d4a968] animate-spin mx-auto" />
                      </div>
                    ) : applications.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No hay aplicaciones todavía</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {applications.map(app => (
                          <div key={app.id} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                  <span className="text-purple-400 font-medium">
                                    {app.creator_name?.charAt(0) || 'C'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-white">{app.creator_name}</p>
                                  <p className="text-sm text-gray-500">@{app.creator_username}</p>
                                </div>
                              </div>
                              {getApplicationStatusBadge(app.status)}
                            </div>

                            {/* Creator Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {app.creator_followers?.toLocaleString() || 0} seg.
                              </span>
                              <span className="flex items-center gap-1 text-yellow-500">
                                ★ {app.creator_rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-white/10 text-xs capitalize">
                                {app.creator_level}
                              </span>
                            </div>

                            {/* Motivation */}
                            {app.motivation && (
                              <p className="text-sm text-gray-300 mb-3 italic">"{app.motivation}"</p>
                            )}

                            {/* Actions */}
                            {app.status === 'applied' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                                  disabled={actionLoading === app.id}
                                  className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors"
                                >
                                  Preseleccionar
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'confirmed')}
                                  disabled={actionLoading === app.id || selectedCampaign.slots_filled >= selectedCampaign.slots}
                                  className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', 'No cumple con los requisitos')}
                                  disabled={actionLoading === app.id}
                                  className="py-2 px-3 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {app.status === 'shortlisted' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'confirmed')}
                                  disabled={actionLoading === app.id || selectedCampaign.slots_filled >= selectedCampaign.slots}
                                  className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected', 'No seleccionado')}
                                  disabled={actionLoading === app.id}
                                  className="py-2 px-3 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}

                            {app.status === 'confirmed' && (
                              <div className="mt-3 p-2 bg-green-500/10 rounded-lg text-center">
                                <span className="text-green-400 text-sm flex items-center justify-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Creator confirmado
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                              Aplicó: {formatDate(app.applied_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandCampaigns;
