import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../utils/api';
import { 
  ArrowLeft, Loader2, RefreshCw, Users, Instagram, Music2,
  CheckCircle, Clock, AlertCircle, ExternalLink, Calendar,
  Eye, BarChart3, Star, FileText
} from 'lucide-react';

const API_URL = getApiUrl();

const AdminCreatorDeliverables = () => {
  const { creatorId } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    fetchData();
  }, [creatorId]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      // Fetch creator info
      const creatorRes = await fetch(`${API_URL}/api/ugc/admin/creators/${creatorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (creatorRes.ok) {
        const creatorData = await creatorRes.json();
        setCreator(creatorData);
      }

      // Fetch creator's deliverables
      const delRes = await fetch(`${API_URL}/api/ugc/admin/creators/${creatorId}/deliverables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeliverables(delData.deliverables || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
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
      return { status: 'completed', color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Entregado' };
    }

    if (isCancelledDel) {
      if (daysRemaining < 0) {
        return { status: 'cancelled_late', color: 'text-gray-500', bgColor: 'bg-gray-500/20', label: `Cancelado (${daysLate}d)` };
      }
      return { status: 'cancelled', color: 'text-gray-500', bgColor: 'bg-gray-500/20', label: 'Cancelado' };
    }

    if (daysRemaining < 0) {
      return { status: 'late', color: 'text-red-400', bgColor: 'bg-red-500/20', label: `${daysLate}d retraso` };
    }
    if (daysRemaining <= 2) {
      return { status: 'urgent', color: 'text-red-400', bgColor: 'bg-red-500/20', label: `${daysRemaining}d` };
    }
    if (daysRemaining <= 5) {
      return { status: 'warning', color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: `${daysRemaining}d` };
    }
    return { status: 'ok', color: 'text-green-400', bgColor: 'bg-green-500/20', label: `${daysRemaining}d` };
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
  const hasIssue = (del) => !isCancelled(del) && del.status === 'changes_requested';

  // Counts
  const cancelledCount = deliverables.filter(d => isCancelled(d)).length;
  const activeDeliverables = deliverables.filter(d => !isCancelled(d));
  const pendingCount = activeDeliverables.filter(d => isPending(d)).length;
  const completedCount = activeDeliverables.filter(d => isCompleted(d)).length;
  const issuesCount = activeDeliverables.filter(d => hasIssue(d)).length;

  // Filter
  const filteredDeliverables = deliverables.filter(d => {
    if (activeFilter === 'cancelled') return isCancelled(d);
    if (!showCancelled && isCancelled(d)) return false;
    if (activeFilter === 'pending') return isPending(d);
    if (activeFilter === 'completed') return isCompleted(d);
    if (activeFilter === 'issues') return hasIssue(d);
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <span className="text-[#d4a968] italic">Entregas del Creator</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Creator Header */}
        {creator && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#d4a968] to-[#a07830] rounded-full flex items-center justify-center text-2xl font-light text-black">
                  {creator.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h1 className="text-2xl font-light text-white">{creator.name}</h1>
                  <p className="text-gray-400">{creator.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {creator.social_accounts?.instagram && (
                      <a 
                        href={`https://instagram.com/${creator.social_accounts.instagram.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-pink-400 text-sm hover:underline"
                      >
                        <Instagram className="w-4 h-4" />
                        @{creator.social_accounts.instagram.username}
                      </a>
                    )}
                    {creator.social_accounts?.tiktok && (
                      <a 
                        href={`https://tiktok.com/@${creator.social_accounts.tiktok.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 text-sm hover:underline"
                      >
                        <Music2 className="w-4 h-4" />
                        @{creator.social_accounts.tiktok.username}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  creator.level === 'elite' ? 'bg-[#d4a968]/20 text-[#d4a968]' :
                  creator.level === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                  creator.level === 'trusted' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {creator.level?.charAt(0).toUpperCase() + creator.level?.slice(1) || 'Rookie'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className={`grid ${cancelledCount > 0 ? 'grid-cols-5' : 'grid-cols-4'} gap-4 mb-6`}>
          <div 
            onClick={() => setActiveFilter('all')}
            className={`p-4 rounded-xl text-center cursor-pointer transition-all ${
              activeFilter === 'all' 
                ? 'bg-white/10 border-2 border-white/30' 
                : 'bg-white/5 border border-white/10 hover:border-white/20'
            }`}
          >
            <p className="text-2xl font-light text-white">{activeDeliverables.length}</p>
            <p className="text-sm text-gray-400">Total Activas</p>
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
                  ? 'bg-orange-500/20 border-2 border-orange-500' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
            >
              <p className={`text-2xl font-light ${activeFilter === 'issues' ? 'text-orange-400' : 'text-white'}`}>
                {issuesCount}
              </p>
              <p className="text-sm text-gray-400">Con Cambios</p>
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

        {/* Refresh & Toggle */}
        <div className="flex items-center justify-between mb-6">
          {activeFilter !== 'cancelled' && cancelledCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#d4a968]"
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
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {activeFilter === 'pending' 
                ? 'No hay entregas pendientes'
                : activeFilter === 'completed'
                ? 'No hay entregas completadas'
                : activeFilter === 'cancelled'
                ? 'No hay entregas canceladas'
                : 'Este creator no tiene entregas asignadas'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const urlStatus = getDeadlineStatus(del, 'url');
              const metricsStatus = getDeadlineStatus(del, 'metrics');
              const delIsCancelled = isCancelled(del);

              return (
                <div 
                  key={del.id} 
                  className={`bg-white/5 border rounded-xl p-5 ${
                    delIsCancelled ? 'border-gray-700 opacity-60' : 'border-white/10'
                  }`}
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
                    <div className="flex items-center gap-2">
                      {del.post_url && (
                        <a
                          href={del.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                          title="Ver publicación"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      {del.brand_rating && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 rounded-lg">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-sm">{del.brand_rating.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deadline Status Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* URL Status */}
                    <div className={`p-3 rounded-lg ${urlStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">URL (7 días)</span>
                        {urlStatus && (
                          <span className={`text-xs font-medium ${urlStatus.color}`}>
                            {urlStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {del.instagram_url && (
                          <a href={del.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {del.tiktok_url && (
                          <a href={del.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                            <Music2 className="w-4 h-4" />
                          </a>
                        )}
                        {!del.instagram_url && !del.tiktok_url && (
                          <span className="text-gray-500 text-sm">Sin enviar</span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Status */}
                    <div className={`p-3 rounded-lg ${metricsStatus?.bgColor || 'bg-white/5'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Métricas (14 días)</span>
                        {metricsStatus && (
                          <span className={`text-xs font-medium ${metricsStatus.color}`}>
                            {metricsStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {del.metrics_submitted_at ? (
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            <BarChart3 className="w-4 h-4" />
                            Enviadas
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Sin enviar</span>
                        )}
                      </div>
                    </div>
                  </div>

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
    </div>
  );
};

export default AdminCreatorDeliverables;
