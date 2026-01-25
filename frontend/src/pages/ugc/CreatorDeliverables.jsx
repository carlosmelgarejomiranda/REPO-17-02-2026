import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { 
  Loader2, RefreshCw, Instagram, Music2, CheckCircle, Clock, 
  AlertCircle, ExternalLink, Calendar, BarChart3, Star, FileText,
  ArrowRight, Upload
} from 'lucide-react';

const API_URL = getApiUrl();

const CreatorDeliverables = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const fetchDeliverables = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/my-deliverables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error('Error fetching deliverables:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate deadline status
  const getDeadlineStatus = (deliverable, type) => {
    const confirmationDate = deliverable.confirmed_at || deliverable.created_at;
    if (!confirmationDate) return null;

    const isCancelledDel = deliverable.status === 'cancelled' || deliverable.application_status === 'cancelled';

    const confirmed = new Date(confirmationDate);
    const daysLimit = type === 'url' ? 7 : 14;
    const deadline = new Date(confirmed);
    deadline.setDate(deadline.getDate() + daysLimit);

    let referenceDate = new Date();
    if (isCancelledDel && deliverable.cancelled_at) {
      referenceDate = new Date(deliverable.cancelled_at);
    } else if (isCancelledDel && deliverable.updated_at) {
      referenceDate = new Date(deliverable.updated_at);
    }

    const timeDiff = deadline - referenceDate;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysLate = Math.abs(daysRemaining);

    const isSubmitted = type === 'url' ? !!deliverable.post_url : !!deliverable.metrics_submitted_at;

    if (isSubmitted) {
      return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/20', label: '✓ Entregado' };
    }

    if (isCancelledDel) {
      return { status: 'cancelled', color: 'text-gray-500', bgColor: 'bg-gray-500/20', label: 'Cancelado' };
    }

    if (daysRemaining < 0) {
      return { status: 'late', color: 'text-red-400', bgColor: 'bg-red-500/20', label: `${daysLate}d atrasado` };
    }
    if (daysRemaining <= 2) {
      return { status: 'urgent', color: 'text-red-400', bgColor: 'bg-red-500/20', label: `${daysRemaining}d restantes` };
    }
    if (daysRemaining <= 5) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: `${daysRemaining}d restantes` };
    }
    return { status: 'ok', color: 'text-green-400', bgColor: 'bg-green-500/20', label: `${daysRemaining}d restantes` };
  };

  const getStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { color: 'bg-gray-500/20 text-gray-400', label: 'Esperando publicación' },
      url_submitted: { color: 'bg-blue-500/20 text-blue-400', label: 'URL enviada' },
      submitted: { color: 'bg-yellow-500/20 text-yellow-400', label: 'En revisión' },
      resubmitted: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Reenviado' },
      changes_requested: { color: 'bg-orange-500/20 text-orange-400', label: 'Cambios solicitados' },
      approved: { color: 'bg-green-500/20 text-green-400', label: 'Aprobado' },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado' },
      metrics_pending: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas pendientes' },
      metrics_submitted: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas enviadas' },
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completado' },
      cancelled: { color: 'bg-gray-600/20 text-gray-500', label: 'Cancelado' }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status };
  };

  // Filter helpers
  const isCancelled = (del) => del.status === 'cancelled' || del.application_status === 'cancelled';
  const isPending = (del) => !isCancelled(del) && (!del.post_url || !del.metrics_submitted_at);
  const isCompleted = (del) => !isCancelled(del) && del.post_url && del.metrics_submitted_at;
  const needsAction = (del) => !isCancelled(del) && (del.status === 'changes_requested' || !del.post_url);

  // Counts
  const activeDeliverables = deliverables.filter(d => !isCancelled(d));
  const pendingCount = activeDeliverables.filter(d => isPending(d)).length;
  const completedCount = activeDeliverables.filter(d => isCompleted(d)).length;
  const needsActionCount = activeDeliverables.filter(d => needsAction(d)).length;

  // Filter
  const filteredDeliverables = deliverables.filter(d => {
    if (isCancelled(d)) return false; // Hide cancelled by default
    if (activeFilter === 'pending') return isPending(d);
    if (activeFilter === 'completed') return isCompleted(d);
    if (activeFilter === 'action') return needsAction(d);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-white">Mis Entregas</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona todas tus entregas pendientes</p>
        </div>
        <button
          onClick={fetchDeliverables}
          className="px-4 py-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveFilter('action')}
          className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
            activeFilter === 'action' 
              ? 'bg-orange-500/20 border-2 border-orange-500' 
              : 'bg-white/5 border border-white/10 hover:border-white/20'
          }`}
        >
          <p className={`text-2xl font-light ${activeFilter === 'action' ? 'text-orange-400' : 'text-white'}`}>
            {needsActionCount}
          </p>
          <p className="text-sm text-gray-400">Requieren Acción</p>
        </div>
        <div 
          onClick={() => setActiveFilter('pending')}
          className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
            activeFilter === 'pending' 
              ? 'bg-yellow-500/20 border-2 border-yellow-500' 
              : 'bg-white/5 border border-white/10 hover:border-white/20'
          }`}
        >
          <p className={`text-2xl font-light ${activeFilter === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
            {pendingCount}
          </p>
          <p className="text-sm text-gray-400">En Progreso</p>
        </div>
        <div 
          onClick={() => setActiveFilter('completed')}
          className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
            activeFilter === 'completed' 
              ? 'bg-green-500/20 border-2 border-green-500' 
              : 'bg-white/5 border border-white/10 hover:border-white/20'
          }`}
        >
          <p className={`text-2xl font-light ${activeFilter === 'completed' ? 'text-green-400' : 'text-white'}`}>
            {completedCount}
          </p>
          <p className="text-sm text-gray-400">Completadas</p>
        </div>
      </div>

      {/* Deliverables List */}
      {filteredDeliverables.length === 0 ? (
        <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {activeFilter === 'action' 
              ? 'No tenés entregas que requieran acción'
              : activeFilter === 'pending'
              ? 'No tenés entregas pendientes'
              : 'No tenés entregas completadas'}
          </p>
          <Link
            to="/ugc/creator/campaigns"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#e5ba79]"
          >
            Ver campañas disponibles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliverables.map((del) => {
            const statusConfig = getStatusConfig(del.status);
            const urlStatus = getDeadlineStatus(del, 'url');
            const metricsStatus = getDeadlineStatus(del, 'metrics');

            return (
              <div 
                key={del.id} 
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg text-white font-medium">{del.campaign?.name || 'Campaña'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{del.campaign?.brand_name || ''}</p>
                  </div>
                  
                  {/* Action Button */}
                  <Link
                    to={`/ugc/creator/deliverable/${del.id}`}
                    className="px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#e5ba79] flex items-center gap-2 text-sm"
                  >
                    {!del.post_url ? (
                      <>
                        <Upload className="w-4 h-4" />
                        Subir URL
                      </>
                    ) : !del.metrics_submitted_at ? (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Subir Métricas
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Ver Detalle
                      </>
                    )}
                  </Link>
                </div>

                {/* Progress Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* URL Status */}
                  <div className={`p-3 rounded-lg ${urlStatus?.bgColor || 'bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        URL del Post (7 días)
                      </span>
                      {urlStatus && (
                        <span className={`text-xs font-medium ${urlStatus.color}`}>
                          {urlStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {del.instagram_url && (
                        <a href={del.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline flex items-center gap-1 text-sm">
                          <Instagram className="w-4 h-4" />
                          Instagram
                        </a>
                      )}
                      {del.tiktok_url && (
                        <a href={del.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 text-sm">
                          <Music2 className="w-4 h-4" />
                          TikTok
                        </a>
                      )}
                      {!del.instagram_url && !del.tiktok_url && (
                        <span className="text-gray-500 text-sm">Pendiente de enviar</span>
                      )}
                    </div>
                  </div>

                  {/* Metrics Status */}
                  <div className={`p-3 rounded-lg ${metricsStatus?.bgColor || 'bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        Métricas (14 días)
                      </span>
                      {metricsStatus && (
                        <span className={`text-xs font-medium ${metricsStatus.color}`}>
                          {metricsStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {del.metrics_submitted_at ? (
                        <span className="text-green-400 text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Enviadas
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Pendiente de enviar</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Changes Requested Alert */}
                {del.status === 'changes_requested' && del.brand_feedback && (
                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-orange-400 text-sm font-medium">Cambios solicitados:</p>
                        <p className="text-gray-300 text-sm mt-1">{del.brand_feedback}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating if exists */}
                {del.brand_rating && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">{del.brand_rating.rating}/5</span>
                    {del.brand_rating.comment && (
                      <span className="text-gray-400 text-sm ml-2">"{del.brand_rating.comment}"</span>
                    )}
                  </div>
                )}

                {/* Confirmed date */}
                {del.confirmed_at && (
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Confirmado: {new Date(del.confirmed_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CreatorDeliverables;
