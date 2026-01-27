import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink,
  Instagram, Music2, Loader2, RefreshCw, Star, Eye, MessageSquare,
  ChevronDown, Send, Users, Link as LinkIcon, BarChart3, Calendar,
  Pencil, RotateCcw, Shield, Building2, Trash2
} from 'lucide-react';

const API_URL = getApiUrl();

const AdminDeliverables = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [brand, setBrand] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  
  // Edit URL Modal
  const [showEditUrlModal, setShowEditUrlModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [editTiktokUrl, setEditTiktokUrl] = useState('');
  
  // Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetDeliverable, setResetDeliverable] = useState(null);
  const [resetOptions, setResetOptions] = useState({ urls: true, metrics: true });

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
        const campaignData = await campaignRes.json();
        setCampaign(campaignData);
        
        // Fetch brand info
        if (campaignData.brand_id) {
          const brandRes = await fetch(`${API_URL}/api/ugc/brands/${campaignData.brand_id}`, { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (brandRes.ok) {
            setBrand(await brandRes.json());
          }
        }
      }

      // Fetch deliverables
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

  // Calculate deadline status
  const getDeadlineStatus = (deliverable, type) => {
    const confirmationDate = deliverable.confirmed_at || deliverable.created_at;
    if (!confirmationDate) return null;

    // Check if deliverable is cancelled
    const isCancelled = deliverable.status === 'cancelled' || deliverable.application_status === 'cancelled';
    
    const confirmed = new Date(confirmationDate);
    const daysLimit = type === 'url' ? 7 : 14;
    const deadline = new Date(confirmed);
    deadline.setDate(deadline.getDate() + daysLimit);

    // If cancelled, use cancellation date instead of now for calculating delay
    // The delay should be frozen at the moment of cancellation
    let referenceDate = new Date();
    if (isCancelled && deliverable.cancelled_at) {
      referenceDate = new Date(deliverable.cancelled_at);
    } else if (isCancelled && deliverable.updated_at) {
      // Fallback to updated_at if cancelled_at not available
      referenceDate = new Date(deliverable.updated_at);
    }

    const timeDiff = deadline - referenceDate;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const daysLate = Math.abs(daysRemaining);

    const isSubmitted = type === 'url' ? !!deliverable.post_url : !!deliverable.metrics_submitted_at;

    if (isSubmitted) {
      return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Entregado' };
    }

    // If cancelled, show frozen state
    if (isCancelled) {
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
        label: `${daysLate} días de retraso`,
        deadline
      };
    }

    if (daysRemaining <= 2) {
      return { status: 'urgent', color: 'text-red-400', bgColor: 'bg-red-500/20', label: `${daysRemaining} días`, deadline };
    }
    if (daysRemaining <= 5) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: `${daysRemaining} días`, deadline };
    }

    return { status: 'ok', color: 'text-green-400', bgColor: 'bg-green-500/20', label: `${daysRemaining} días`, deadline };
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

  // Check deliverable states
  const isCancelled = (del) => del.status === 'cancelled' || del.application_status === 'cancelled';
  const isReadyToRate = (del) => !isCancelled(del) && del.post_url && del.metrics_submitted_at && !del.brand_rating;
  const isCompletedAndRated = (del) => !isCancelled(del) && del.post_url && del.metrics_submitted_at && del.brand_rating;
  const isPendingDelivery = (del) => !isCancelled(del) && (!del.post_url || !del.metrics_submitted_at);
  const hasUrlIssue = (del) => !isCancelled(del) && del.post_url && (
    (del.instagram_url && !del.instagram_url.includes('/p/') && !del.instagram_url.includes('/reel/')) ||
    (del.tiktok_url && !del.tiktok_url.includes('/video/'))
  );

  // Filters - exclude cancelled by default unless showCancelled is true or filter is 'cancelled'
  const filteredDeliverables = deliverables.filter(d => {
    // If viewing cancelled specifically, show only cancelled
    if (activeFilter === 'cancelled') return isCancelled(d);
    
    // For other filters, hide cancelled unless checkbox is enabled
    if (!showCancelled && isCancelled(d)) return false;
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'to_rate') return isReadyToRate(d);
    if (activeFilter === 'completed') return isCompletedAndRated(d);
    if (activeFilter === 'pending') return isPendingDelivery(d);
    if (activeFilter === 'issues') return hasUrlIssue(d);
    return true;
  });

  // Counts - don't include cancelled in regular counts
  const cancelledCount = deliverables.filter(d => isCancelled(d)).length;
  const activeDeliverables = deliverables.filter(d => !isCancelled(d));
  const toRateCount = activeDeliverables.filter(d => isReadyToRate(d)).length;
  const completedCount = activeDeliverables.filter(d => isCompletedAndRated(d)).length;
  const pendingCount = activeDeliverables.filter(d => isPendingDelivery(d)).length;
  const issuesCount = activeDeliverables.filter(d => hasUrlIssue(d)).length;

  // Open edit URL modal
  const openEditUrlModal = (del) => {
    setEditingDeliverable(del);
    setEditInstagramUrl(del.instagram_url || '');
    setEditTiktokUrl(del.tiktok_url || '');
    setShowEditUrlModal(true);
  };

  // Save edited URLs
  const handleSaveUrls = async () => {
    if (!editingDeliverable) return;
    
    setActionLoading(editingDeliverable.id);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/deliverables/${editingDeliverable.id}/update-urls`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instagram_url: editInstagramUrl || null,
          tiktok_url: editTiktokUrl || null
        })
      });

      if (res.ok) {
        setShowEditUrlModal(false);
        setEditingDeliverable(null);
        fetchData();
        alert('URLs actualizados correctamente');
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al actualizar URLs');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  // Open reset modal
  const openResetModal = (del) => {
    setResetDeliverable(del);
    setResetOptions({ urls: true, metrics: true });
    setShowResetModal(true);
  };

  // Reset deliverable
  const handleResetDeliverable = async () => {
    if (!resetDeliverable) return;
    
    setActionLoading(resetDeliverable.id);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/deliverables/${resetDeliverable.id}/reset`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resetOptions)
      });

      if (res.ok) {
        setShowResetModal(false);
        setResetDeliverable(null);
        fetchData();
        alert('Entrega reseteada correctamente');
      } else {
        const data = await res.json();
        alert(data.detail || 'Error al resetear');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#d4a968]" />
            <span className="text-[#d4a968] italic">Admin - Gestión de Entregas</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Campaign & Brand Header */}
        {campaign && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {brand && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {brand.company_name}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-light mb-2">{campaign.name}</h1>
            <p className="text-gray-400">{campaign.category} • {campaign.city}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div 
            onClick={() => setActiveFilter('all')}
            className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
              activeFilter === 'all' 
                ? 'bg-white/10 border-2 border-white/30' 
                : 'bg-white/5 border border-white/10 hover:border-white/20'
            }`}
          >
            <p className="text-2xl font-light text-white">{activeDeliverables.length}</p>
            <p className="text-sm text-gray-400">Activos</p>
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
            <p className="text-sm text-gray-400">Pendientes</p>
          </div>
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
          {issuesCount > 0 && (
            <div 
              onClick={() => setActiveFilter('issues')}
              className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
                activeFilter === 'issues' 
                  ? 'bg-red-500/20 border-2 border-red-500' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <p className={`text-2xl font-light ${activeFilter === 'issues' ? 'text-red-400' : 'text-white'}`}>
                {issuesCount}
              </p>
              <p className="text-sm text-gray-400">Con Problemas</p>
            </div>
          )}
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

        {/* Refresh Button & Cancelled Toggle */}
        <div className="flex items-center justify-between mb-4">
          {/* Show cancelled toggle - only show when not in 'cancelled' filter */}
          {activeFilter !== 'cancelled' && cancelledCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#d4a968] focus:ring-[#d4a968] focus:ring-offset-0"
              />
              Incluir cancelados ({cancelledCount})
            </label>
          )}
          {(activeFilter === 'cancelled' || cancelledCount === 0) && <div />}
          
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Deliverables Grid */}
        {filteredDeliverables.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay entregas en esta categoría</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const urlStatus = getDeadlineStatus(del, 'url');
              const metricsStatus = getDeadlineStatus(del, 'metrics');
              const hasIssue = hasUrlIssue(del);

              return (
                <div
                  key={del.id}
                  className={`p-5 bg-white/5 border rounded-xl transition-all ${
                    hasIssue ? 'border-red-500/50' : 'border-white/10'
                  }`}
                >
                  {/* Issue Alert */}
                  {hasIssue && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400">Posible URL incorrecto</span>
                    </div>
                  )}

                  {/* Creator Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-medium">
                          {del.creator?.name?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{del.creator?.name || 'Creador'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {del.creator?.social_networks?.[0] && (
                            <span>@{del.creator.social_networks[0].username}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Delivery Status */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`p-2 rounded-lg ${urlStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <LinkIcon className={`w-3 h-3 ${urlStatus?.color || 'text-gray-400'}`} />
                        <span className="text-xs text-gray-400">URL</span>
                      </div>
                      <p className={`text-xs ${urlStatus?.color || 'text-gray-400'}`}>
                        {urlStatus?.label || 'Pendiente'}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${metricsStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <BarChart3 className={`w-3 h-3 ${metricsStatus?.color || 'text-gray-400'}`} />
                        <span className="text-xs text-gray-400">Métricas</span>
                      </div>
                      <p className={`text-xs ${metricsStatus?.color || 'text-gray-400'}`}>
                        {metricsStatus?.label || 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  {/* URLs Display */}
                  {(del.instagram_url || del.tiktok_url) && (
                    <div className="mb-4 space-y-2">
                      {del.instagram_url && (
                        <a
                          href={del.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-pink-400 hover:underline"
                        >
                          <Instagram className="w-3 h-3" />
                          <span className="truncate">{del.instagram_url}</span>
                        </a>
                      )}
                      {del.tiktok_url && (
                        <a
                          href={del.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-cyan-400 hover:underline"
                        >
                          <Music2 className="w-3 h-3" />
                          <span className="truncate">{del.tiktok_url}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Confirmation Date */}
                  {del.confirmed_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Calendar className="w-3 h-3" />
                      Confirmado: {formatDate(del.confirmed_at)}
                    </div>
                  )}

                  {/* Rating Display */}
                  {del.brand_rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-gray-400">Rating:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= del.brand_rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin Actions */}
                  <div className="pt-4 border-t border-white/10 flex gap-2">
                    <button
                      onClick={() => openEditUrlModal(del)}
                      disabled={actionLoading === del.id}
                      className="flex-1 py-2 px-3 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar URLs
                    </button>
                    <button
                      onClick={() => openResetModal(del)}
                      disabled={actionLoading === del.id}
                      className="flex-1 py-2 px-3 bg-orange-500/20 text-orange-400 rounded-lg text-xs hover:bg-orange-500/30 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Resetear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit URL Modal */}
      {showEditUrlModal && editingDeliverable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-medium flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-400" />
                Editar URLs
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Creador: {editingDeliverable.creator?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Instagram URL */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  URL de Instagram
                </label>
                <input
                  type="url"
                  value={editInstagramUrl}
                  onChange={(e) => setEditInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* TikTok URL */}
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Music2 className="w-4 h-4 text-cyan-400" />
                  URL de TikTok
                </label>
                <input
                  type="url"
                  value={editTiktokUrl}
                  onChange={(e) => setEditTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@usuario/video/..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <p className="text-xs text-gray-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Dejá vacío para eliminar el URL de esa plataforma
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => { setShowEditUrlModal(false); setEditingDeliverable(null); }}
                className="px-5 py-2 rounded-lg border border-white/20 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUrls}
                disabled={actionLoading === editingDeliverable?.id}
                className="px-5 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === editingDeliverable?.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && resetDeliverable && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-medium flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-400" />
                Resetear Entrega
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Creador: {resetDeliverable.creator?.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Seleccioná qué querés resetear. El creador podrá volver a subir la información.
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={resetOptions.urls}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, urls: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#d4a968]"
                  />
                  <div>
                    <p className="text-white text-sm">URLs de publicación</p>
                    <p className="text-xs text-gray-500">Instagram y TikTok URLs</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={resetOptions.metrics}
                    onChange={(e) => setResetOptions(prev => ({ ...prev, metrics: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#d4a968]"
                  />
                  <div>
                    <p className="text-white text-sm">Métricas</p>
                    <p className="text-xs text-gray-500">Screenshots y datos de métricas</p>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-400">
                  ⚠️ Esta acción no se puede deshacer. El creador será notificado de que debe volver a subir su información.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => { setShowResetModal(false); setResetDeliverable(null); }}
                className="px-5 py-2 rounded-lg border border-white/20 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDeliverable}
                disabled={actionLoading === resetDeliverable?.id || (!resetOptions.urls && !resetOptions.metrics)}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === resetDeliverable?.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Resetear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDeliverables;
