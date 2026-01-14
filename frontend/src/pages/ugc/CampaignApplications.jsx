import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Star, Loader2, CheckCircle, XCircle, 
  Clock, UserCheck, AlertCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const CampaignApplications = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleUpdateStatus = async (applicationId, newStatus, reason = null) => {
    setActionLoading(applicationId);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado', icon: UserCheck },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: XCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400', label: 'Retirada', icon: AlertCircle }
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

  const slotsAvailable = (campaign?.slots || 0) - (campaign?.slots_filled || 0);

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
          <h1 className="text-3xl font-light mb-2">
            Aplicaciones de <span className="text-[#d4a968] italic">{campaign?.name}</span>
          </h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span>{applications.length} aplicaciones totales</span>
            <span>•</span>
            <span>{campaign?.slots_filled || 0}/{campaign?.slots} cupos ocupados</span>
            {slotsAvailable > 0 && (
              <>
                <span>•</span>
                <span className="text-green-400">{slotsAvailable} cupos disponibles</span>
              </>
            )}
          </div>
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No hay aplicaciones</h3>
            <p className="text-gray-400">Todavía no hay creadores que hayan aplicado a esta campaña</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div 
                key={app.id}
                className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  {/* Creator Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-xl">
                      {app.creator_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-white">{app.creator_name}</h3>
                      <p className="text-gray-400">@{app.creator_username}</p>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {app.creator_followers?.toLocaleString() || 0} seguidores
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-4 h-4 fill-current" />
                          {app.creator_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-xs capitalize text-gray-300">
                          {app.creator_level || 'rookie'}
                        </span>
                      </div>

                      {/* Motivation */}
                      {app.motivation && (
                        <p className="mt-3 text-gray-300 italic text-sm max-w-xl">
                          "{app.motivation}"
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Aplicó el {formatDate(app.applied_at)}
                      </p>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(app.status)}

                    {/* Action Buttons */}
                    {app.status === 'applied' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'shortlisted')}
                          disabled={actionLoading === app.id}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                        >
                          Preseleccionar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                          disabled={actionLoading === app.id || slotsAvailable === 0}
                          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'rejected', 'No cumple requisitos')}
                          disabled={actionLoading === app.id}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {app.status === 'shortlisted' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'confirmed')}
                          disabled={actionLoading === app.id || slotsAvailable === 0}
                          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'rejected', 'No seleccionado')}
                          disabled={actionLoading === app.id}
                          className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}

                    {app.status === 'confirmed' && (
                      <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
                        <CheckCircle className="w-4 h-4" />
                        Creador confirmado
                      </div>
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
