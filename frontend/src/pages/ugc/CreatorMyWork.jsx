import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Loader2, Search,
  Instagram, Music2, ChevronRight, Upload, Eye, Star, 
  Calendar, Award, FileText, MessageSquare, History
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const CreatorMyWork = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [applicationsRes, deliverablesRes] = await Promise.all([
        fetch(`${API_URL}/api/ugc/applications/me`, { headers }),
        fetch(`${API_URL}/api/ugc/deliverables/me`, { headers })
      ]);

      if (applicationsRes.ok) {
        const data = await applicationsRes.json();
        const apps = data.applications || [];
        // Separate active applications from history
        setApplications(apps.filter(a => !['completed', 'cancelled'].includes(a.status)));
        setHistory(apps.filter(a => ['completed', 'cancelled'].includes(a.status)));
      }

      if (deliverablesRes.ok) {
        const data = await deliverablesRes.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Count items that need attention
  const pendingDeliverables = deliverables.filter(d => 
    ['awaiting_publish', 'changes_requested', 'published'].includes(d.status)
  );
  const completedDeliverables = deliverables.filter(d => 
    ['approved', 'completed'].includes(d.status)
  );

  const getApplicationStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'En espera', icon: Clock },
      applied: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Postulado', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Preseleccionado', icon: Star },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Aprobado', icon: CheckCircle },
      confirmed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'No seleccionado', icon: XCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Retirado', icon: XCircle },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completado', icon: Award }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status, icon: Clock };
  };

  const getDeliverableStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        label: 'Subir URL', 
        icon: Upload,
        needsAction: true 
      },
      published: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        label: 'Subir métricas', 
        icon: Upload,
        needsAction: true 
      },
      changes_requested: { 
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', 
        label: 'Cambios solicitados', 
        icon: AlertCircle,
        needsAction: true 
      },
      pending_review: { 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', 
        label: 'En revisión', 
        icon: Eye,
        needsAction: false 
      },
      approved: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        label: 'Aprobado', 
        icon: CheckCircle,
        needsAction: false 
      },
      completed: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        label: 'Completado', 
        icon: Award,
        needsAction: false 
      }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400', label: status, icon: Clock, needsAction: false };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <UGCNavbar type="creator" />
        <div className="pt-16 pb-24 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4a968]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <UGCNavbar type="creator" />

      <div className="pt-16 pb-24 md:pb-8">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 md:py-6 border-b border-white/10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-light">
              Mi <span className="text-[#d4a968] italic">Trabajo</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Gestiona tus postulaciones y entregas</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 sticky top-14 bg-black z-40">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'applications'
                    ? 'border-[#d4a968] text-[#d4a968]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Postulaciones
                {applications.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'applications' ? 'bg-[#d4a968]/20' : 'bg-white/10'
                  }`}>
                    {applications.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('deliverables')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'deliverables'
                    ? 'border-[#d4a968] text-[#d4a968]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                Entregas
                {pendingDeliverables.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'deliverables' ? 'bg-[#d4a968]/20' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {pendingDeliverables.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'history'
                    ? 'border-[#d4a968] text-[#d4a968]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Historial
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* ==================== TAB: POSTULACIONES ==================== */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tenés postulaciones activas</p>
                  <Link
                    to="/ugc/campaigns"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Explorar campañas
                  </Link>
                </div>
              ) : (
                applications.map((app) => {
                  const statusConfig = getApplicationStatusConfig(app.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={app.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Platform icon */}
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Instagram className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-white line-clamp-1">
                                {app.campaign_name || 'Campaña'}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {app.brand_name || '-'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(app.applied_at || app.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ==================== TAB: ENTREGAS ==================== */}
          {activeTab === 'deliverables' && (
            <div className="space-y-6">
              {/* Pendientes */}
              {pendingDeliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    Pendientes ({pendingDeliverables.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingDeliverables.map((item) => {
                      const statusConfig = getDeliverableStatusConfig(item.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <Link
                          key={item.id}
                          to={`/ugc/creator/deliverable/${item.id}`}
                          className={`block p-4 bg-white/5 border rounded-xl hover:border-[#d4a968]/50 transition-all ${
                            statusConfig.needsAction ? 'border-yellow-500/30' : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              item.platform === 'tiktok' 
                                ? 'bg-black border border-white/20' 
                                : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                            }`}>
                              {item.platform === 'tiktok' ? (
                                <Music2 className="w-6 h-6 text-white" />
                              ) : (
                                <Instagram className="w-6 h-6 text-white" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium text-white line-clamp-1">
                                    {item.campaign_name || 'Campaña'}
                                  </h3>
                                  <p className="text-sm text-gray-400">{item.brand_name || '-'}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </span>
                              </div>
                              
                              {statusConfig.needsAction && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                                  <span className="text-xs text-yellow-400">Necesita tu acción</span>
                                </div>
                              )}
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completadas */}
              {completedDeliverables.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Completadas ({completedDeliverables.length})
                  </h3>
                  <div className="space-y-3">
                    {completedDeliverables.map((item) => {
                      const statusConfig = getDeliverableStatusConfig(item.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <Link
                          key={item.id}
                          to={`/ugc/creator/deliverable/${item.id}`}
                          className="block p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              item.platform === 'tiktok' 
                                ? 'bg-black border border-white/20' 
                                : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
                            }`}>
                              {item.platform === 'tiktok' ? (
                                <Music2 className="w-6 h-6 text-white" />
                              ) : (
                                <Instagram className="w-6 h-6 text-white" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white line-clamp-1">
                                {item.campaign_name || 'Campaña'}
                              </h3>
                              <p className="text-sm text-gray-400">{item.brand_name || '-'}</p>
                            </div>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {deliverables.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No tenés entregas activas</p>
                  <Link
                    to="/ugc/campaigns"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Explorar campañas
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB: HISTORIAL ==================== */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Tu historial aparecerá aquí cuando completes campañas</p>
                </div>
              ) : (
                history.map((app) => {
                  const statusConfig = getApplicationStatusConfig(app.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={app.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-white line-clamp-1">
                                {app.campaign_name || 'Campaña'}
                              </h3>
                              <p className="text-sm text-gray-400">{app.brand_name || '-'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(app.completed_at || app.updated_at)}
                            </span>
                            {app.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                {app.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorMyWork;
