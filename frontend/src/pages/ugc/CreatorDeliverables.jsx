import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { 
  Loader2, RefreshCw, Instagram, Music2, CheckCircle, Clock, 
  AlertCircle, ExternalLink, Calendar, BarChart3, Star, FileText,
  ArrowRight, Upload, Link as LinkIcon, ChevronRight
} from 'lucide-react';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

// Helper: obtener URL del post (fallback a instagram_url o tiktok_url)
const getPostUrl = (deliverable) => {
  return deliverable?.post_url || deliverable?.instagram_url || deliverable?.tiktok_url || null;
};

const CreatorDeliverables = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    fetchDeliverables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Calculate deadline status using stored deadlines
  const getDeadlineStatus = (deliverable, type) => {
    const isCancelledDel = deliverable.status === 'cancelled' || deliverable.application_status === 'cancelled';

    // Use stored deadline from deliverable if available
    const storedDeadline = type === 'url' ? deliverable.url_deadline : deliverable.metrics_deadline;
    
    let deadline;
    if (storedDeadline) {
      // Use the pre-calculated deadline from the database
      deadline = new Date(storedDeadline);
    } else {
      // Fallback: calculate from confirmation date with default 7/14 days
      const confirmationDate = deliverable.confirmed_at || deliverable.created_at;
      if (!confirmationDate) return null;
      
      const confirmed = new Date(confirmationDate);
      const daysLimit = type === 'url' ? 7 : 14;
      deadline = new Date(confirmed);
      deadline.setDate(deadline.getDate() + daysLimit);
    }

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
      return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/10', label: 'Entregado', icon: CheckCircle };
    }

    if (isCancelledDel) {
      return { status: 'cancelled', color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Cancelado', icon: Clock };
    }

    if (daysRemaining < 0) {
      return { status: 'late', color: 'text-red-400', bgColor: 'bg-red-500/10', label: `${daysLate}d atrasado`, icon: AlertCircle };
    }
    if (daysRemaining <= 2) {
      return { status: 'urgent', color: 'text-red-400', bgColor: 'bg-red-500/10', label: `${daysRemaining}d`, icon: AlertCircle };
    }
    if (daysRemaining <= 5) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/10', label: `${daysRemaining}d`, icon: Clock };
    }
    return { status: 'ok', color: 'text-green-400', bgColor: 'bg-green-500/10', label: `${daysRemaining}d`, icon: Clock };
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
    if (isCancelled(d)) return false;
    if (activeFilter === 'pending') return isPending(d);
    if (activeFilter === 'completed') return isCompleted(d);
    if (activeFilter === 'action') return needsAction(d);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <UGCNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <UGCNavbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-light text-white">Mis Entregas</h1>
            <p className="text-gray-500 text-sm">Gestiona tus entregas pendientes</p>
          </div>
          <button
            onClick={fetchDeliverables}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('action')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeFilter === 'action'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Requieren Acción
            {needsActionCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-orange-500/30">{needsActionCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeFilter === 'pending'
                ? 'bg-[#d4a968]/20 text-[#d4a968] border border-[#d4a968]/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            En Progreso
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-[#d4a968]/30">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              activeFilter === 'completed'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Completadas
            {completedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-green-500/30">{completedCount}</span>
            )}
          </button>
        </div>

        {/* Deliverables List */}
        {filteredDeliverables.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">
              {activeFilter === 'action' 
                ? 'No tenés entregas que requieran acción'
                : activeFilter === 'pending'
                ? 'No tenés entregas en progreso'
                : 'No tenés entregas completadas'}
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#e5ba79] text-sm font-medium"
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
              const hasChangesRequested = del.status === 'changes_requested';

              return (
                <div 
                  key={del.id} 
                  className={`bg-white/5 border rounded-xl overflow-hidden transition-all ${
                    hasChangesRequested 
                      ? 'border-orange-500/30' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Changes Requested Banner */}
                  {hasChangesRequested && (
                    <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm font-medium">Cambios solicitados</span>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">{del.campaign?.name || 'Campaña'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">{del.campaign?.brand_name || ''}</p>
                      </div>
                      
                      {/* Action Button */}
                      <Link
                        to={`/ugc/creator/deliverable/${del.id}`}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-colors ${
                          !del.post_url 
                            ? 'bg-[#d4a968] text-black hover:bg-[#e5ba79]'
                            : !del.metrics_submitted_at
                            ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {!del.post_url ? (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Subir URL
                          </>
                        ) : !del.metrics_submitted_at ? (
                          <>
                            <BarChart3 className="w-3.5 h-3.5" />
                            Métricas
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-3.5 h-3.5" />
                            Ver
                          </>
                        )}
                      </Link>
                    </div>

                    {/* Deadline Progress */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* URL Deadline */}
                      <div className={`p-3 rounded-lg border ${urlStatus?.bgColor || 'bg-white/5'} ${
                        urlStatus?.status === 'late' ? 'border-red-500/30' : 'border-transparent'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[11px] text-gray-500 uppercase">URL</span>
                          </div>
                          <span className={`text-xs font-medium ${urlStatus?.color || 'text-gray-400'}`}>
                            {urlStatus?.label || '7d'}
                          </span>
                        </div>
                        {del.post_url ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs text-green-400">Enviado</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Pendiente</span>
                        )}
                      </div>

                      {/* Metrics Deadline */}
                      <div className={`p-3 rounded-lg border ${metricsStatus?.bgColor || 'bg-white/5'} ${
                        metricsStatus?.status === 'late' ? 'border-red-500/30' : 'border-transparent'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[11px] text-gray-500 uppercase">Métricas</span>
                          </div>
                          <span className={`text-xs font-medium ${metricsStatus?.color || 'text-gray-400'}`}>
                            {metricsStatus?.label || '14d'}
                          </span>
                        </div>
                        {del.metrics_submitted_at ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-xs text-green-400">Enviado</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Pendiente</span>
                        )}
                      </div>
                    </div>

                    {/* Changes Feedback */}
                    {hasChangesRequested && del.brand_feedback && (
                      <div className="mt-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                        <p className="text-gray-300 text-sm">{del.brand_feedback}</p>
                      </div>
                    )}

                    {/* URLs if submitted */}
                    {(del.instagram_url || del.tiktok_url) && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
                        {del.instagram_url && (
                          <a
                            href={del.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-pink-400 text-sm hover:underline"
                          >
                            <Instagram className="w-4 h-4" />
                            Instagram
                          </a>
                        )}
                        {del.tiktok_url && (
                          <a
                            href={del.tiktok_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-cyan-400 text-sm hover:underline"
                          >
                            <Music2 className="w-4 h-4" />
                            TikTok
                          </a>
                        )}
                      </div>
                    )}

                    {/* Rating if exists */}
                    {del.brand_rating && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= del.brand_rating.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        {del.brand_rating.comment && (
                          <span className="text-gray-500 text-xs truncate">{del.brand_rating.comment}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorDeliverables;
