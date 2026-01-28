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

      // Read response as text first to avoid "body is disturbed or locked" error on Safari/iOS
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        data = {};
      }

      if (res.ok) {
        alert(data.message || 'Participación cancelada');
        fetchApplications();
      } else {
        alert(data.detail || 'Error al cancelar');
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

      // Read response as text first to avoid "body is disturbed or locked" error on Safari/iOS
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        data = {};
      }

      if (res.ok) {
        alert(data.message || 'Aplicación retirada');
        fetchApplications();
      } else {
        alert(data.detail || 'Error al retirar');
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
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* UGC Navbar */}
      <UGCNavbar type="creator" />

      {/* Main Content */}
      <div className="pt-16 md:pt-20 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-light mb-0.5">
            Mis <span className="text-[#d4a968] italic">Aplicaciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Gestiona tus aplicaciones a campañas</p>
        </div>

        {/* Stats - Compact for mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-2.5 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl text-center">
            <p className="text-lg sm:text-2xl font-semibold text-blue-400">{pendingCount}</p>
            <p className="text-[10px] sm:text-sm text-blue-400/70">Espera</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-green-500/10 border border-green-500/20 rounded-lg sm:rounded-xl text-center">
            <p className="text-lg sm:text-2xl font-semibold text-green-400">{confirmedCount}</p>
            <p className="text-[10px] sm:text-sm text-green-400/70">Confirmadas</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-[#d4a968]/10 border border-[#d4a968]/20 rounded-lg sm:rounded-xl text-center">
            <p className="text-lg sm:text-2xl font-semibold text-[#d4a968]">{applications.length}</p>
            <p className="text-[10px] sm:text-sm text-[#d4a968]/70">Total</p>
          </div>
        </div>

        {/* Filters - Scrollable on mobile */}
        <div className="flex gap-2 mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'En Espera' },
            { id: 'confirmed', label: 'Confirmadas' },
            { id: 'finished', label: 'Finalizadas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black font-medium'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
              data-testid={`filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchApplications}
            className="p-1.5 sm:p-2 bg-white/5 rounded-full text-gray-400 hover:text-white ml-auto flex-shrink-0"
            data-testid="refresh-applications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-6 sm:p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Users className="w-10 h-10 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base sm:text-xl text-white mb-2">No hay aplicaciones</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              {activeFilter === 'all' 
                ? 'Aplica a campañas para aparecer aquí'
                : 'No hay aplicaciones en esta categoría'}
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black text-xs sm:text-sm font-medium rounded-full hover:bg-[#c49958]"
              data-testid="browse-campaigns-link"
            >
              Ver campañas
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredApplications.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const StatusIcon = statusConfig.icon;
              const campaign = app.campaign;
              
              return (
                <div
                  key={app.id}
                  className={`p-3 sm:p-5 bg-white/5 border rounded-lg sm:rounded-xl transition-all ${
                    app.status === 'confirmed' ? 'border-green-500/30' : 'border-white/10'
                  }`}
                  data-testid={`application-${app.id}`}
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-2.5 sm:gap-4">
                    {/* Campaign Image */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-white/10 overflow-hidden flex-shrink-0">
                      {campaign?.assets?.cover_image ? (
                        <img 
                          src={campaign.assets.cover_image} 
                          alt={campaign?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#d4a968]/20 to-[#d4a968]/5">
                          <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a968]/50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-white text-xs sm:text-base leading-tight line-clamp-2">{campaign?.name || 'Campaña'}</h3>
                          <p className="text-[10px] sm:text-sm text-gray-500 truncate">{campaign?.brand?.company_name || '-'}</p>
                        </div>
                        {/* Status Badge */}
                        <div className={`flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full flex-shrink-0 ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-[10px] sm:text-sm">{statusConfig.label}</span>
                        </div>
                      </div>
                      
                      {/* Date info */}
                      <div className="mt-1.5 text-[10px] sm:text-xs text-gray-500">
                        <span>Aplicado: {new Date(app.applied_at).toLocaleDateString()}</span>
                        {app.confirmed_at && (
                          <span className="text-green-400 ml-2">
                            • Confirmado: {new Date(app.confirmed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions - Below on mobile, compact buttons */}
                  {actionLoading !== app.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
                      {/* Pending applications - can withdraw */}
                      {['applied', 'shortlisted'].includes(app.status) && (
                        <button
                          onClick={() => handleWithdrawApplication(app.id)}
                          className="text-[10px] sm:text-xs text-gray-400 hover:text-red-400 transition-colors"
                          data-testid={`withdraw-${app.id}`}
                        >
                          Retirar aplicación
                        </button>
                      )}

                      {/* Confirmed applications */}
                      {app.status === 'confirmed' && (
                        <>
                          <Link
                            to="/ugc/creator/workspace"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a968] text-black text-[10px] sm:text-xs font-medium"
                            data-testid={`go-to-workspace-${app.id}`}
                          >
                            Ir al Workspace
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleCancelParticipation(app.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] sm:text-xs hover:bg-red-500/20 transition-colors"
                            data-testid={`cancel-participation-${app.id}`}
                          >
                            <Ban className="w-3 h-3" />
                            <span className="hidden sm:inline">Cancelar</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {actionLoading === app.id && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-center">
                      <Loader2 className="w-4 h-4 text-[#d4a968] animate-spin" />
                    </div>
                  )}

                  {/* Info banner for confirmed */}
                  {app.status === 'confirmed' && (
                    <div className="mt-2.5 flex items-start gap-2 p-2.5 sm:p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-sm text-green-400 leading-snug">
                        ¡Confirmado! Revisá tu workspace para ver los detalles.
                      </span>
                    </div>
                  )}

                  {/* Warning for cancelled */}
                  {app.status === 'cancelled' && (
                    <div className="mt-2.5 flex items-start gap-2 p-2.5 sm:p-3 bg-orange-500/10 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-sm text-orange-400 leading-snug">
                        Participación cancelada. Podés aplicar a otras campañas.
                      </span>
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
