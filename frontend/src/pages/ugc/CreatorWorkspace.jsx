import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Clock, CheckCircle, AlertCircle, ExternalLink,
  Instagram, Music2, Upload, Eye, Loader2, RefreshCw, ChevronRight,
  Star, MessageSquare
} from 'lucide-react';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CreatorWorkspace = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchDeliverables();
  }, []);

  const fetchDeliverables = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/deliverables/me`, { 
        headers: token ? { 'Authorization': `Bearer ${token}` } : {} 
      });
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Por Publicar', icon: Upload },
      published: { color: 'bg-blue-500/20 text-blue-400', label: 'Publicado', icon: CheckCircle },
      submitted: { color: 'bg-purple-500/20 text-purple-400', label: 'Enviado', icon: Eye },
      resubmitted: { color: 'bg-purple-500/20 text-purple-400', label: 'Reenviado', icon: Eye },
      under_review: { color: 'bg-purple-500/20 text-purple-400', label: 'En Revisión', icon: Eye },
      changes_requested: { color: 'bg-orange-500/20 text-orange-400', label: 'Cambios Solicitados', icon: AlertCircle },
      approved: { color: 'bg-green-500/20 text-green-400', label: 'Aprobado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: AlertCircle },
      metrics_pending: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas Pendientes', icon: Clock },
      metrics_submitted: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Métricas Enviadas', icon: CheckCircle },
      completed: { color: 'bg-green-500/20 text-green-400', label: 'Completado', icon: CheckCircle }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status, icon: Clock };
  };

  const filteredDeliverables = deliverables.filter(d => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return ['awaiting_publish', 'changes_requested'].includes(d.status);
    if (activeFilter === 'review') return ['submitted', 'resubmitted', 'under_review'].includes(d.status);
    if (activeFilter === 'completed') return ['approved', 'completed'].includes(d.status);
    return true;
  });

  const pendingCount = deliverables.filter(d => ['awaiting_publish', 'changes_requested'].includes(d.status)).length;
  const reviewCount = deliverables.filter(d => ['submitted', 'resubmitted', 'under_review'].includes(d.status)).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creator/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Dashboard
          </Link>
          <span className="text-[#d4a968] italic">Mi Workspace</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">
            Mis <span className="text-[#d4a968] italic">Entregas</span>
          </h1>
          <p className="text-gray-400">Gestiona tus entregas de contenido UGC</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-yellow-400">{pendingCount}</p>
            <p className="text-sm text-gray-400">Pendientes</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-purple-400">{reviewCount}</p>
            <p className="text-sm text-gray-400">En Revisión</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
            <p className="text-2xl font-light text-green-400">
              {deliverables.filter(d => ['approved', 'completed'].includes(d.status)).length}
            </p>
            <p className="text-sm text-gray-400">Completados</p>
          </div>
          <Link 
            to="/ugc/creator/feedback"
            className="p-4 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl text-center hover:border-[#d4a968]/50 transition-all"
            data-testid="feedback-link"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 text-[#d4a968]" />
              <MessageSquare className="w-4 h-4 text-[#d4a968]" />
            </div>
            <p className="text-sm text-gray-400">Ver Feedback</p>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'review', label: 'En Revisión' },
            { id: 'completed', label: 'Completadas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchDeliverables}
            className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white ml-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Deliverables List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredDeliverables.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No hay entregas</h3>
            <p className="text-gray-400 mb-6">
              {activeFilter === 'all' 
                ? 'Aplica a campañas para empezar a crear contenido'
                : 'No hay entregas en esta categoría'}
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
            >
              Ver campañas disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const StatusIcon = statusConfig.icon;
              const needsAction = ['awaiting_publish', 'changes_requested', 'metrics_pending'].includes(del.status);
              
              return (
                <Link
                  key={del.id}
                  to={`/ugc/creator/deliverable/${del.id}`}
                  className={`block p-5 bg-white/5 border rounded-xl transition-all hover:border-[#d4a968]/50 ${
                    needsAction ? 'border-yellow-500/30' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        del.platform === 'tiktok' ? 'bg-black border border-white/20' : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                      }`}>
                        {del.platform === 'tiktok' ? (
                          <Music2 className="w-6 h-6 text-white" />
                        ) : (
                          <Instagram className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white mb-1">{del.campaign?.name}</h3>
                        <p className="text-sm text-gray-500">{del.brand?.company_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm">{statusConfig.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>

                  {/* Action hint */}
                  {needsAction && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-sm text-yellow-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {del.status === 'awaiting_publish' && 'Registra la URL de tu publicación'}
                        {del.status === 'changes_requested' && 'La marca solicitó cambios - revisa y reenvía'}
                        {del.status === 'metrics_pending' && 'Subí tus métricas cuando la ventana se abra'}
                      </p>
                    </div>
                  )}

                  {/* Review notes if changes requested */}
                  {del.status === 'changes_requested' && del.review_notes?.length > 0 && (
                    <div className="mt-3 p-3 bg-orange-500/10 rounded-lg">
                      <p className="text-sm text-orange-400">
                        <span className="font-medium">Feedback:</span> {del.review_notes[del.review_notes.length - 1]?.note}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorWorkspace;
