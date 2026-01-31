import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink,
  Instagram, Music2, Loader2, RefreshCw, Star, Eye, MessageSquare,
  ChevronDown, Send, Users, Link as LinkIcon, BarChart3, Calendar
} from 'lucide-react';

const API_URL = getApiUrl();

const BrandDeliverables = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState('to_rate');
  const [showCancelled, setShowCancelled] = useState(false);
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingDeliverable, setRatingDeliverable] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const campaignRes = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaign(campaignData);
      }

      const delRes = await fetch(`${API_URL}/api/ugc/deliverables/campaign/${campaignId}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeliverables(delData.deliverables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (deliverableId, action) => {
    setActionLoading(deliverableId);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${deliverableId}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes || null
        })
      });

      if (res.ok) {
        setReviewNotes('');
        setSelectedDeliverable(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al procesar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const openRatingModal = (deliverable) => {
    setRatingDeliverable(deliverable);
    setRatingValue(deliverable.brand_rating?.rating || 0);
    setRatingComment(deliverable.brand_rating?.comment || '');
    setShowRatingModal(true);
  };

  const handleRate = async () => {
    if (ratingValue < 1 || ratingValue > 5) {
      alert('Seleccioná una calificación de 1 a 5 estrellas');
      return;
    }

    setActionLoading(ratingDeliverable.id);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${ratingDeliverable.id}/rate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: ratingValue,
          comment: ratingComment || null
        })
      });

      if (res.ok) {
        setShowRatingModal(false);
        setRatingDeliverable(null);
        setRatingValue(0);
        setRatingComment('');
        fetchData();
        alert('Calificación guardada');
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al calificar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate deadline status for URL and Metrics from stored deadlines or campaign settings
  const getDeadlineStatus = (deliverable, type) => {
    // Check if deliverable is cancelled
    const isCancelledDel = deliverable.status === 'cancelled' || deliverable.application_status === 'cancelled';

    // Use stored deadline from deliverable if available
    const storedDeadline = type === 'url' ? deliverable.url_deadline : deliverable.metrics_deadline;
    
    let deadline;
    if (storedDeadline) {
      // Use the pre-calculated deadline from the database
      deadline = new Date(storedDeadline);
    } else {
      // Fallback: calculate from confirmation date using campaign settings or defaults
      const confirmationDate = deliverable.confirmed_at || deliverable.created_at;
      if (!confirmationDate) return null;
      
      const confirmed = new Date(confirmationDate);
      // Use campaign settings if available, otherwise default to 7/14 days
      const daysLimit = type === 'url' 
        ? (campaign?.url_delivery_days || 7) 
        : (campaign?.metrics_delivery_days || 14);
      deadline = new Date(confirmed);
      deadline.setDate(deadline.getDate() + daysLimit);
    }

    // If cancelled, freeze the calculation at cancellation time
    let referenceDate = new Date();
    if (isCancelledDel && deliverable.cancelled_at) {
      referenceDate = new Date(deliverable.cancelled_at);
    } else if (isCancelledDel && deliverable.updated_at) {
      referenceDate = new Date(deliverable.updated_at);
    }

    const timeDiff = deadline - referenceDate;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysLate = Math.abs(daysRemaining);

    // Already submitted?
    const isSubmitted = type === 'url' ? !!deliverable.post_url : !!deliverable.metrics_submitted_at;

    if (isSubmitted) {
      return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Entregado' };
    }

    // If cancelled, show frozen state
    if (isCancelledDel) {
      if (daysRemaining < 0) {
        return { 
          status: 'cancelled_late', 
          color: 'text-gray-500', 
          bgColor: 'bg-gray-500/20',
          label: `Cancelado (${daysLate}d retraso)`,
          deadline
        };
      }
      return { 
        status: 'cancelled', 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-500/20',
        label: 'Cancelado',
        deadline
      };
    }

    if (daysRemaining < 0) {
      return { 
        status: 'late', 
        color: 'text-red-400', 
        bgColor: 'bg-red-500/20',
        label: `${daysLate} ${daysLate === 1 ? 'día' : 'días'} de retraso`,
        deadline
      };
    }

    if (daysRemaining <= 1) {
      return { 
        status: 'urgent', 
        color: 'text-red-400', 
        bgColor: 'bg-red-500/20',
        label: daysRemaining === 0 ? 'Vence hoy' : 'Vence mañana',
        deadline
      };
    }

    if (daysRemaining <= 3) {
      return { 
        status: 'warning', 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500/20',
        label: `${daysRemaining} días restantes`,
        deadline
      };
    }

    if (daysRemaining <= 5) {
      return { 
        status: 'caution', 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-500/20',
        label: `${daysRemaining} días restantes`,
        deadline
      };
    }

    return { 
      status: 'ok', 
      color: 'text-green-400', 
      bgColor: 'bg-green-500/20',
      label: `${daysRemaining} días restantes`,
      deadline
    };
  };

  // Check if deliverable is cancelled
  const isCancelled = (del) => del.status === 'cancelled' || del.application_status === 'cancelled';

  // Check if deliverable is ready to be rated (URL + Metrics submitted)
  const isReadyToRate = (del) => {
    return !isCancelled(del) && del.post_url && del.metrics_submitted_at && !del.brand_rating;
  };

  // Check if deliverable is completed and rated
  const isCompletedAndRated = (del) => {
    return !isCancelled(del) && del.post_url && del.metrics_submitted_at && del.brand_rating;
  };

  // Check if still pending delivery (either URL or metrics)
  const isPendingDelivery = (del) => {
    return !isCancelled(del) && (!del.post_url || !del.metrics_submitted_at);
  };

  const getStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { color: 'bg-gray-500/20 text-gray-400', label: 'Esperando publicación' },
      published: { color: 'bg-blue-500/20 text-blue-400', label: 'Publicado' },
      submitted: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendiente revisión' },
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

  // New filter logic - exclude cancelled by default
  const filteredDeliverables = deliverables.filter(d => {
    // If viewing cancelled specifically, show only cancelled
    if (activeFilter === 'cancelled') return isCancelled(d);
    
    // For other filters, hide cancelled unless checkbox is enabled
    if (!showCancelled && isCancelled(d)) return false;
    
    if (activeFilter === 'to_rate') return isReadyToRate(d);
    if (activeFilter === 'completed') return isCompletedAndRated(d);
    if (activeFilter === 'pending') return isPendingDelivery(d);
    return true;
  });

  // Counts for stats - don't include cancelled in regular counts
  const cancelledCount = deliverables.filter(d => isCancelled(d)).length;
  const activeDeliverables = deliverables.filter(d => !isCancelled(d));
  const toRateCount = activeDeliverables.filter(d => isReadyToRate(d)).length;
  const completedCount = activeDeliverables.filter(d => isCompletedAndRated(d)).length;
  const pendingCount = activeDeliverables.filter(d => isPendingDelivery(d)).length;

  const formatDeadlineDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });
  };

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
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/brand/campaigns" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Mis Campañas
          </Link>
          <span className="text-[#d4a968] italic">Revisión de Entregas</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Campaign Header */}
        {campaign && (
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">{campaign.name}</h1>
            <p className="text-gray-400">{campaign.category} • {campaign.city}</p>
          </div>
        )}

        {/* Stats */}
        <div className={`grid ${cancelledCount > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mb-6`}>
          <div 
            onClick={() => setActiveFilter('to_rate')}
            className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
              activeFilter === 'to_rate' 
                ? 'bg-[#d4a968]/20 border-2 border-[#d4a968]' 
                : 'bg-white/5 border border-white/10 hover:border-white/20'
            }`}
          >
            <p className={`text-2xl font-light ${activeFilter === 'to_rate' ? 'text-[#d4a968]' : 'text-white'}`}>
              {toRateCount}
            </p>
            <p className="text-sm text-gray-400">Por Calificar</p>
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
            <p className="text-sm text-gray-400">Pendiente de Entrega</p>
          </div>
          {cancelledCount > 0 && (
            <div 
              onClick={() => setActiveFilter('cancelled')}
              className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
                activeFilter === 'cancelled' 
                  ? 'bg-gray-600/30 border-2 border-gray-500' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <p className={`text-2xl font-light ${activeFilter === 'cancelled' ? 'text-gray-400' : 'text-gray-500'}`}>
                {cancelledCount}
              </p>
              <p className="text-sm text-gray-500">Canceladas</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          {[
            { id: 'to_rate', label: 'Calificar', count: toRateCount },
            { id: 'completed', label: 'Completadas', count: completedCount },
            { id: 'pending', label: 'Pendiente de Entrega', count: pendingCount }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeFilter === f.id ? 'bg-black/20' : 'bg-white/10'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
          
          {/* Cancelled toggle - only show when not in 'cancelled' filter */}
          {activeFilter !== 'cancelled' && cancelledCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#d4a968] focus:ring-[#d4a968] focus:ring-offset-0"
              />
              Incluir cancelados
            </label>
          )}
          
          <button
            onClick={fetchData}
            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Deliverables Grid */}
        {filteredDeliverables.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {activeFilter === 'to_rate' 
                ? 'No hay entregas listas para calificar'
                : activeFilter === 'completed'
                ? 'No hay entregas completadas y calificadas'
                : activeFilter === 'cancelled'
                ? 'No hay entregas canceladas'
                : 'No hay entregas pendientes'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const urlStatus = getDeadlineStatus(del, 'url');
              const metricsStatus = getDeadlineStatus(del, 'metrics');
              const canRate = isReadyToRate(del);
              const isSelected = selectedDeliverable?.id === del.id;
              const isPending = ['submitted', 'resubmitted'].includes(del.status);

              return (
                <div
                  key={del.id}
                  className={`p-5 bg-white/5 border rounded-xl transition-all ${
                    canRate ? 'border-[#d4a968]/50' : isPending ? 'border-yellow-500/30' : 'border-white/10'
                  } ${isSelected ? 'ring-2 ring-[#d4a968]' : ''}`}
                >
                  {/* Creator Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-medium">
                          {del.creator?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{del.creator?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="capitalize">{del.creator?.level}</span>
                          {del.creator?.social_networks?.[0] && (
                            <span>• @{del.creator.social_networks[0].username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Delivery Status Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* URL Status */}
                    <div className={`p-3 rounded-lg ${urlStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <LinkIcon className={`w-4 h-4 ${urlStatus?.color || 'text-gray-400'}`} />
                        <span className="text-xs text-gray-400">URL Publicación</span>
                      </div>
                      {del.post_url ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-sm text-green-400">Entregado</span>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-sm ${urlStatus?.color || 'text-gray-400'}`}>
                            {urlStatus?.label || 'Pendiente'}
                          </p>
                          {urlStatus?.deadline && urlStatus.status !== 'completed' && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Límite: {formatDeadlineDate(urlStatus.deadline)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Metrics Status */}
                    <div className={`p-3 rounded-lg ${metricsStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className={`w-4 h-4 ${metricsStatus?.color || 'text-gray-400'}`} />
                        <span className="text-xs text-gray-400">Métricas</span>
                      </div>
                      {del.metrics_submitted_at ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-sm text-green-400">Entregado</span>
                        </div>
                      ) : (
                        <div>
                          <p className={`text-sm ${metricsStatus?.color || 'text-gray-400'}`}>
                            {metricsStatus?.label || 'Pendiente'}
                          </p>
                          {metricsStatus?.deadline && metricsStatus.status !== 'completed' && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Límite: {formatDeadlineDate(metricsStatus.deadline)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post URL Link */}
                  {del.post_url && (
                    <div className="mb-4 p-3 bg-black/30 rounded-lg">
                      <a
                        href={del.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#d4a968] hover:underline flex items-center gap-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver publicación
                      </a>
                    </div>
                  )}

                  {/* Round Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>Ronda: {del.review_round || 1}</span>
                    {del.confirmed_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Confirmado: {new Date(del.confirmed_at).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>

                  {/* Review Actions for pending submissions */}
                  {isPending && (
                    <div className="space-y-3">
                      {isSelected ? (
                        <>
                          <textarea
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Notas de revisión (opcional)..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReview(del.id, 'approve')}
                              disabled={actionLoading === del.id}
                              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {actionLoading === del.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleReview(del.id, 'request_changes')}
                              disabled={actionLoading === del.id || del.review_round >= 2}
                              className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Cambios
                            </button>
                            <button
                              onClick={() => handleReview(del.id, 'reject')}
                              disabled={actionLoading === del.id}
                              className="py-2 px-3 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => { setSelectedDeliverable(null); setReviewNotes(''); }}
                            className="w-full py-2 text-gray-400 text-sm hover:text-white"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedDeliverable(del)}
                          className="w-full py-2 bg-[#d4a968] text-black rounded-lg text-sm hover:bg-[#c49958] flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Revisar entrega
                        </button>
                      )}
                    </div>
                  )}

                  {/* Previous review notes */}
                  {del.review_notes?.length > 0 && del.status !== 'submitted' && (
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Último feedback:</p>
                      <p className="text-sm text-gray-300">
                        {del.review_notes[del.review_notes.length - 1]?.note || 'Sin comentarios'}
                      </p>
                    </div>
                  )}

                  {/* Rating Section */}
                  {canRate && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => openRatingModal(del)}
                        className="w-full py-3 bg-[#d4a968] text-black rounded-lg text-sm hover:bg-[#c49958] flex items-center justify-center gap-2 font-medium"
                      >
                        <Star className="w-5 h-5" />
                        Calificar entrega
                      </button>
                    </div>
                  )}

                  {/* Already rated */}
                  {del.brand_rating && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Tu calificación:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= del.brand_rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => openRatingModal(del)}
                          className="text-xs text-[#d4a968] hover:underline"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && ratingDeliverable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-medium">Calificar Entrega</h3>
              <p className="text-sm text-gray-400 mt-1">
                Calificá la entrega de {ratingDeliverable.creator?.name}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Star Rating */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">Calificación</label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingValue(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoverRating || ratingValue) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {ratingValue === 1 && 'Malo'}
                  {ratingValue === 2 && 'Regular'}
                  {ratingValue === 3 && 'Bueno'}
                  {ratingValue === 4 && 'Muy bueno'}
                  {ratingValue === 5 && 'Excelente'}
                </p>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Comentario privado <span className="text-gray-500">(opcional)</span>
                </label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Solo visible para vos, Avenue y el creador..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Este comentario es privado, solo lo ven Avenue y el creador
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => { setShowRatingModal(false); setRatingDeliverable(null); setRatingValue(0); setRatingComment(''); }}
                className="px-5 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRate}
                disabled={ratingValue < 1 || actionLoading === ratingDeliverable?.id}
                className="px-5 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === ratingDeliverable?.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Star className="w-5 h-5" />
                )}
                Guardar Calificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDeliverables;
