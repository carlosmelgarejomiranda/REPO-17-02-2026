import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
  Instagram, Music2, Users, ChevronRight, Ban
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CreatorApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/applications/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        const data = await res.json();
        alert(data.message || 'Participación cancelada');
        fetchApplications();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al cancelar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('¿Estás seguro de retirar tu aplicación?')) {
      return;
    }

    setActionLoading(applicationId);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Aplicación retirada');
        fetchApplications();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al retirar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado', icon: CheckCircle },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: XCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400', label: 'Retirado', icon: XCircle },
      cancelled: { color: 'bg-orange-500/20 text-orange-400', label: 'Cancelado', icon: Ban }
    };
    return configs[status] || configs.applied;
  };

  const filteredApplications = applications.filter(app => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return ['applied', 'shortlisted'].includes(app.status);
    if (activeFilter === 'confirmed') return app.status === 'confirmed';
    if (activeFilter === 'finished') return ['rejected', 'withdrawn', 'cancelled'].includes(app.status);
    return true;
  });

  const pendingCount = applications.filter(a => ['applied', 'shortlisted'].includes(a.status)).length;
  const confirmedCount = applications.filter(a => a.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* UGC Navbar */}
      <UGCNavbar type="creator" />

      {/* Main Content */}
      <div className="pt-20 max-w-5xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">
            Mis <span className="text-[#d4a968] italic">Aplicaciones</span>
          </h1>
          <p className="text-gray-400">Gestiona tus aplicaciones a campañas UGC</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-blue-400">{pendingCount}</p>
            <p className="text-sm text-gray-400">En Espera</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-green-400">{confirmedCount}</p>
            <p className="text-sm text-gray-400">Confirmadas</p>
          </div>
          <div className="p-4 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl text-center">
            <p className="text-2xl font-light text-[#d4a968]">{applications.length}</p>
            <p className="text-sm text-gray-400">Total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'En Espera' },
            { id: 'confirmed', label: 'Confirmadas' },
            { id: 'finished', label: 'Finalizadas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              data-testid={`filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchApplications}
            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white ml-auto"
            data-testid="refresh-applications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No hay aplicaciones</h3>
            <p className="text-gray-400 mb-6">
              {activeFilter === 'all' 
                ? 'Aplica a campañas para aparecer aquí'
                : 'No hay aplicaciones en esta categoría'}
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
              data-testid="browse-campaigns-link"
            >
              Ver campañas disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              const campaign = app.campaign;
              
              return (
                <div
                  key={app.id}
                  className={`p-5 bg-white/5 border rounded-xl transition-all ${
                    app.status === 'confirmed' ? 'border-green-500/30' : 'border-white/10'
                  }`}
                  data-testid={`application-${app.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {/* Campaign Image */}
                      <div className="w-16 h-16 rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                        {campaign?.assets?.cover_image ? (
                          <img 
                            src={campaign.assets.cover_image} 
                            alt={campaign?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#d4a968]/20 to-[#d4a968]/5">
                            <Instagram className="w-6 h-6 text-[#d4a968]/50" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-white mb-1">{campaign?.name || 'Campaña'}</h3>
                        <p className="text-sm text-gray-500 mb-2">{campaign?.brand?.company_name || '-'}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Aplicado: {new Date(app.applied_at).toLocaleDateString()}</span>
                          {app.confirmed_at && (
                            <span className="text-green-400">
                              Confirmado: {new Date(app.confirmed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>

                      {/* Actions */}
                      {actionLoading === app.id ? (
                        <Loader2 className="w-5 h-5 text-[#d4a968] animate-spin" />
                      ) : (
                        <>
                          {/* Pending applications - can withdraw */}
                          {['applied', 'shortlisted'].includes(app.status) && (
                            <button
                              onClick={() => handleWithdrawApplication(app.id)}
                              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                              data-testid={`withdraw-${app.id}`}
                            >
                              Retirar aplicación
                            </button>
                          )}

                          {/* Confirmed applications - can cancel participation */}
                          {app.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelParticipation(app.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                              data-testid={`cancel-participation-${app.id}`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Cancelar Participación
                            </button>
                          )}

                          {/* Confirmed - link to workspace */}
                          {app.status === 'confirmed' && (
                            <Link
                              to="/ugc/creator/workspace"
                              className="flex items-center gap-1 text-xs text-[#d4a968] hover:underline"
                              data-testid={`go-to-workspace-${app.id}`}
                            >
                              Ir al Workspace <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info banner for confirmed */}
                  {app.status === 'confirmed' && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">
                          ¡Estás confirmado! Revisá tu workspace para ver los detalles de la entrega.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Warning for cancelled */}
                  {app.status === 'cancelled' && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-orange-400">
                          Tu participación fue cancelada. Podés aplicar a otras campañas.
                        </span>
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

export default CreatorApplications;
