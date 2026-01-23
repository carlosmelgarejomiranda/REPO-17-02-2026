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

  // Check if metrics can be uploaded (published but not yet submitted)
  const canUploadMetrics = (status) => {
    return ['published', 'submitted', 'resubmitted', 'under_review', 'approved', 'metrics_pending'].includes(status);
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
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* UGC Navbar */}
      <UGCNavbar type="creator" />

      {/* Main Content */}
      <div className="pt-16 md:pt-20 max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-5">
          <h1 className="text-xl sm:text-3xl font-light mb-0.5">
            Mis <span className="text-[#d4a968] italic">Entregas</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">Gestiona tus entregas de contenido UGC</p>
        </div>

        {/* Stats - Mobile optimized 2x2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg sm:rounded-xl">
            <p className="text-xl sm:text-3xl font-semibold text-yellow-400">{pendingCount}</p>
            <p className="text-[10px] sm:text-sm text-yellow-400/70">Pendientes</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg sm:rounded-xl">
            <p className="text-xl sm:text-3xl font-semibold text-purple-400">{reviewCount}</p>
            <p className="text-[10px] sm:text-sm text-purple-400/70">En Revisión</p>
          </div>
          <div className="p-2.5 sm:p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg sm:rounded-xl">
            <p className="text-xl sm:text-3xl font-semibold text-green-400">
              {deliverables.filter(d => ['approved', 'completed'].includes(d.status)).length}
            </p>
            <p className="text-[10px] sm:text-sm text-green-400/70">Completados</p>
          </div>
          <Link 
            to="/ugc/creator/feedback"
            className="p-2.5 sm:p-4 bg-gradient-to-br from-[#d4a968]/10 to-[#d4a968]/5 border border-[#d4a968]/20 rounded-lg sm:rounded-xl hover:border-[#d4a968]/40 transition-all"
            data-testid="feedback-link"
          >
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 sm:w-6 sm:h-6 text-[#d4a968]" />
              <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#d4a968]" />
            </div>
            <p className="text-[10px] sm:text-sm text-[#d4a968]/70 mt-0.5">Feedback</p>
          </Link>
        </div>

        {/* Filters - Scrollable on mobile */}
        <div className="flex items-center gap-2 mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'review', label: 'En Revisión' },
            { id: 'completed', label: 'Completadas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === f.id
                  ? 'bg-[#d4a968] text-black font-medium'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={fetchDeliverables}
            className="p-1.5 sm:p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 ml-auto flex-shrink-0"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Deliverables List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredDeliverables.length === 0 ? (
          <div className="p-6 sm:p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <Camera className="w-10 h-10 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3" />
            <h3 className="text-base sm:text-xl text-white mb-2">No hay entregas</h3>
            <p className="text-xs sm:text-sm text-gray-400 mb-4">
              {activeFilter === 'all' 
                ? 'Aplica a campañas para empezar a crear contenido'
                : 'No hay entregas en esta categoría'}
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black text-xs sm:text-sm font-medium rounded-full hover:bg-[#c49958] transition-all"
            >
              Ver campañas
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDeliverables.map((del) => {
              const statusConfig = getStatusConfig(del.status);
              const StatusIcon = statusConfig.icon;
              const needsUrlAction = ['awaiting_publish', 'changes_requested'].includes(del.status);
              const needsMetrics = canUploadMetrics(del.status) && !['metrics_submitted', 'completed'].includes(del.status);
              
              return (
                <div
                  key={del.id}
                  className={`p-3 sm:p-4 bg-white/5 border rounded-lg sm:rounded-xl transition-all ${
                    needsUrlAction ? 'border-yellow-500/30' : needsMetrics ? 'border-cyan-500/30' : 'border-white/10'
                  }`}
                >
                  {/* Main Row - Clickable to detail */}
                  <Link
                    to={`/ugc/creator/deliverable/${del.id}`}
                    className="flex items-center gap-2.5 sm:gap-3 hover:opacity-80"
                  >
                    {/* Platform Icon */}
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      del.platform === 'tiktok' ? 'bg-black border border-white/20' : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                    }`}>
                      {del.platform === 'tiktok' ? (
                        <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-medium text-white text-xs sm:text-sm leading-snug truncate">{del.campaign?.name}</h3>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{del.brand?.company_name}</p>
                    </div>

                    {/* Status Badge - Only icon on mobile */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs flex-shrink-0 ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline text-xs">{statusConfig.label}</span>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </Link>

                  {/* Action hints and buttons */}
                  {(needsUrlAction || needsMetrics) && (
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <p className="text-[10px] sm:text-xs flex items-center gap-1.5">
                        <AlertCircle className={`w-3 h-3 flex-shrink-0 ${needsUrlAction ? 'text-yellow-400' : 'text-cyan-400'}`} />
                        <span className={needsUrlAction ? 'text-yellow-400' : 'text-cyan-400'}>
                          {del.status === 'awaiting_publish' && 'Registra tu URL'}
                          {del.status === 'changes_requested' && 'Cambios solicitados'}
                          {needsMetrics && !needsUrlAction && 'Subí tus métricas'}
                        </span>
                      </p>
                      {needsMetrics && !needsUrlAction && (
                        <Link
                          to={`/ugc/creator/metrics/${del.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1 bg-cyan-500 text-black rounded-full text-[10px] sm:text-xs font-medium hover:bg-cyan-400 transition-colors"
                          data-testid={`upload-metrics-${del.id}`}
                        >
                          Subir
                        </Link>
                      )}
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

export default CreatorWorkspace;
