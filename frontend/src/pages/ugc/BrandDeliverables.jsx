import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock, ExternalLink,
  Instagram, Music2, Loader2, RefreshCw, Star, Eye, MessageSquare,
  ChevronDown, Send, Users
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const BrandDeliverables = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
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
      // Fetch campaign details
      const campaignRes = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaign(campaignData);
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
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completado' }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status };
  };

  const filteredDeliverables = deliverables.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return ['submitted', 'resubmitted'].includes(d.status);
    if (activeFilter === 'approved') return ['approved', 'completed'].includes(d.status);
    if (activeFilter === 'changes') return d.status === 'changes_requested';
    return true;
  });

  const pendingCount = deliverables.filter(d => ['submitted', 'resubmitted'].includes(d.status)).length;

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
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-2xl font-light text-white">{deliverables.length}</p>
            <p className="text-sm text-gray-400">Total</p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-yellow-400">{pendingCount}</p>
            <p className="text-sm text-gray-400">Por revisar</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-green-400">
              {deliverables.filter(d => ['approved', 'completed'].includes(d.status)).length}
            </p>
            <p className="text-sm text-gray-400">Aprobados</p>
          </div>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-orange-400">
              {deliverables.filter(d => d.status === 'changes_requested').length}
            </p>
            <p className="text-sm text-gray-400">Con cambios</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'pending', label: `Por revisar (${pendingCount})` },
            { id: 'all', label: 'Todas' },
            { id: 'approved', label: 'Aprobadas' },
            { id: 'changes', label: 'Con cambios' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
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
              {activeFilter === 'pending' 
                ? 'No hay entregas pendientes de revisión'
                : 'No hay entregas en esta categoría'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const isPending = ['submitted', 'resubmitted'].includes(del.status);
              const isSelected = selectedDeliverable?.id === del.id;

              return (
                <div
                  key={del.id}
                  className={`p-5 bg-white/5 border rounded-xl transition-all ${
                    isPending ? 'border-yellow-500/30' : 'border-white/10'
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

                  {/* Post URL */}
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

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>Ronda: {del.review_round || 1}</span>
                    {del.is_on_time !== null && (
                      <span className={del.is_on_time ? 'text-green-400' : 'text-orange-400'}>
                        {del.is_on_time ? 'A tiempo' : 'Fuera de tiempo'}
                      </span>
                    )}
                  </div>

                  {/* Review Actions */}
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDeliverables;
