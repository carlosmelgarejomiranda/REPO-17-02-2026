import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Camera, BarChart3, Eye, Heart, MessageCircle,
  Share2, Bookmark, CheckCircle, AlertCircle, Loader2, HelpCircle,
  Instagram, Music2, Sparkles, Clock, Users, Globe, PieChart, Play
} from 'lucide-react';

const API_URL = getApiUrl();

const MetricsSubmit = () => {
  const { deliverableId } = useParams();
  const navigate = useNavigate();
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [demographicsUrl, setDemographicsUrl] = useState('');
  const [metrics, setMetrics] = useState({
    views: '',
    reach: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    watch_time_seconds: '',
    video_length_seconds: ''
  });
  const [aiResult, setAiResult] = useState(null);
  const [useManualInput, setUseManualInput] = useState(false);

  const fetchDeliverable = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${deliverableId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDeliverable(data);
      } else {
        setError('No se encontró la entrega');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [deliverableId]);

  useEffect(() => {
    fetchDeliverable();
  }, [fetchDeliverable]);

  const handleSubmit = async () => {
    if (!screenshotUrl.trim()) {
      setError('Ingresa la URL del screenshot de métricas');
      return;
    }

    setSubmitting(true);
    setError('');
    setAiProcessing(true);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_URL}/api/ugc/metrics/submit/${deliverableId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          screenshot_url: screenshotUrl,
          demographics_screenshot_url: demographicsUrl || null,
          views: metrics.views ? parseInt(metrics.views) : null,
          reach: metrics.reach ? parseInt(metrics.reach) : null,
          likes: metrics.likes ? parseInt(metrics.likes) : null,
          comments: metrics.comments ? parseInt(metrics.comments) : null,
          shares: metrics.shares ? parseInt(metrics.shares) : null,
          saves: metrics.saves ? parseInt(metrics.saves) : null,
          watch_time_seconds: metrics.watch_time_seconds ? parseInt(metrics.watch_time_seconds) : null,
          video_length_seconds: metrics.video_length_seconds ? parseInt(metrics.video_length_seconds) : null
        })
      });

      setAiProcessing(false);
      
      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
        setSuccess('¡Métricas enviadas exitosamente!' + (data.is_late ? ' (Nota: Envío tardío)' : ''));
        setTimeout(() => navigate('/ugc/creator/workspace'), 2000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al enviar métricas');
      }
    } catch (err) {
      setAiProcessing(false);
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getWindowStatus = () => {
    if (!deliverable?.confirmed_at && !deliverable?.metrics_window_closes) {
      return { status: 'open', message: 'Podés subir tus métricas ahora' };
    }
    
    const now = new Date();
    const closes = deliverable.metrics_window_closes ? new Date(deliverable.metrics_window_closes) : null;
    
    if (closes && now > closes) {
      return { status: 'late', message: 'Fecha límite pasada - envío tardío' };
    }
    
    if (closes) {
      const daysLeft = Math.ceil((closes - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3) {
        return { 
          status: 'urgent', 
          message: `¡Solo ${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}!`,
          date: closes.toLocaleDateString('es-PY')
        };
      }
      return { 
        status: 'open', 
        message: `${daysLeft} días restantes`,
        date: closes.toLocaleDateString('es-PY')
      };
    }
    
    return { status: 'open', message: 'Podés subir tus métricas' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  if (!deliverable) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p>{error || 'Entrega no encontrada'}</p>
          <Link to="/ugc/creator/workspace" className="text-[#d4a968] hover:underline mt-4 block">
            Volver al workspace
          </Link>
        </div>
      </div>
    );
  }

  const windowStatus = getWindowStatus();
  const platform = deliverable.platform || 'instagram';

  return (
    <div className="min-h-screen bg-black text-white" data-testid="metrics-submit-page">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creator/workspace" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Mi Workspace
          </Link>
          <div className="flex items-center gap-2">
            {platform === 'instagram' ? (
              <Instagram className="w-5 h-5 text-pink-400" />
            ) : (
              <Music2 className="w-5 h-5 text-cyan-400" />
            )}
            <span className="text-[#d4a968] italic capitalize">{platform}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">
            Subir <span className="text-[#d4a968] italic">Métricas</span>
          </h1>
          <p className="text-gray-400">Sube capturas de las estadísticas de tu contenido</p>
        </div>

        {/* Window Status */}
        <div className={`p-4 rounded-xl mb-8 ${
          windowStatus.status === 'open' ? 'bg-green-500/10 border border-green-500/30' :
          windowStatus.status === 'late' ? 'bg-orange-500/10 border border-orange-500/30' :
          'bg-yellow-500/10 border border-yellow-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${
              windowStatus.status === 'open' ? 'text-green-400' :
              windowStatus.status === 'late' ? 'text-orange-400' :
              'text-yellow-400'
            }`} />
            <div>
              <p className={`font-medium ${
                windowStatus.status === 'open' ? 'text-green-400' :
                windowStatus.status === 'late' ? 'text-orange-400' :
                'text-yellow-400'
              }`}>{windowStatus.message}</p>
              {windowStatus.date && (
                <p className="text-sm text-gray-400">Fecha límite: {windowStatus.date}</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Feature Banner */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-8">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-purple-400 font-medium">Extracción Automática con IA</p>
              <p className="text-sm text-gray-400 mt-1">
                Sube tus capturas y nuestra IA extraerá automáticamente: views, reach, likes, comments, shares, saves, 
                tiempo de visualización, y datos demográficos (género, país, edad).
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Screenshots Upload Section */}
        <div className="space-y-6 mb-8">
          {/* Metrics Screenshot */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#d4a968]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Screenshot de Métricas *</h3>
                <p className="text-sm text-gray-400">Captura de la pantalla de estadísticas (obligatorio)</p>
              </div>
            </div>
            
            <input
              type="text"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="https://ejemplo.com/screenshot-metricas.jpg"
              className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
              data-testid="metrics-screenshot-input"
            />

            <div className="mt-3 p-3 bg-black/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">La IA extraerá automáticamente:</p>
              <div className="flex flex-wrap gap-2">
                {['Views', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'Watch Time', 'Video Duration'].map(metric => (
                  <span key={metric} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-400">{metric}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Demographics Screenshot */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">Screenshot de Demografía</h3>
                <p className="text-sm text-gray-400">Captura de audiencia (opcional pero recomendado)</p>
              </div>
            </div>
            
            <input
              type="text"
              value={demographicsUrl}
              onChange={(e) => setDemographicsUrl(e.target.value)}
              placeholder="https://ejemplo.com/screenshot-demografia.jpg"
              className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              data-testid="demographics-screenshot-input"
            />

            <div className="mt-3 p-3 bg-black/50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">La IA extraerá automáticamente:</p>
              <div className="flex flex-wrap gap-2">
                {['Género (M/F)', 'Países', 'Ciudades', 'Rangos de Edad'].map(metric => (
                  <span key={metric} className="px-2 py-1 bg-purple-500/10 rounded text-xs text-purple-300">{metric}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Input Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setUseManualInput(!useManualInput)}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm"
          >
            <HelpCircle className="w-4 h-4" />
            {useManualInput ? 'Ocultar entrada manual' : '¿La IA no extrajo bien? Ingresa manualmente'}
          </button>
        </div>

        {/* Manual Input Fields */}
        {useManualInput && (
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-8">
            <h3 className="text-white font-medium mb-4">Entrada Manual (opcional)</h3>
            <p className="text-sm text-gray-400 mb-4">Solo completa si la IA no extrajo correctamente</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Eye className="w-4 h-4" /> Views
                </label>
                <input
                  type="number"
                  value={metrics.views}
                  onChange={(e) => setMetrics({...metrics, views: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Users className="w-4 h-4" /> Reach
                </label>
                <input
                  type="number"
                  value={metrics.reach}
                  onChange={(e) => setMetrics({...metrics, reach: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Heart className="w-4 h-4" /> Likes
                </label>
                <input
                  type="number"
                  value={metrics.likes}
                  onChange={(e) => setMetrics({...metrics, likes: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <MessageCircle className="w-4 h-4" /> Comments
                </label>
                <input
                  type="number"
                  value={metrics.comments}
                  onChange={(e) => setMetrics({...metrics, comments: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Share2 className="w-4 h-4" /> Shares
                </label>
                <input
                  type="number"
                  value={metrics.shares}
                  onChange={(e) => setMetrics({...metrics, shares: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Bookmark className="w-4 h-4" /> Saves
                </label>
                <input
                  type="number"
                  value={metrics.saves}
                  onChange={(e) => setMetrics({...metrics, saves: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Clock className="w-4 h-4" /> Watch Time (seg)
                </label>
                <input
                  type="number"
                  value={metrics.watch_time_seconds}
                  onChange={(e) => setMetrics({...metrics, watch_time_seconds: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Play className="w-4 h-4" /> Video Length (seg)
                </label>
                <input
                  type="number"
                  value={metrics.video_length_seconds}
                  onChange={(e) => setMetrics({...metrics, video_length_seconds: e.target.value})}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-black border border-white/20 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !screenshotUrl.trim()}
          className="w-full py-4 bg-[#d4a968] text-black font-semibold rounded-xl hover:bg-[#c49958] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="submit-metrics-btn"
        >
          {aiProcessing ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              Procesando con IA...
            </>
          ) : submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Enviar Métricas
            </>
          )}
        </button>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#d4a968]" />
            ¿Cómo tomar las capturas?
          </h3>
          
          <div className="space-y-4 text-sm text-gray-400">
            <div>
              <p className="text-white font-medium mb-1">📊 Screenshot de Métricas:</p>
              <p>En {platform === 'instagram' ? 'Instagram' : 'TikTok'}, ve a tu publicación → Estadísticas → Captura la pantalla donde aparecen views, likes, comentarios, etc.</p>
            </div>
            
            <div>
              <p className="text-white font-medium mb-1">👥 Screenshot de Demografía:</p>
              <p>En la misma sección de estadísticas, busca &quot;Audiencia&quot; o &quot;Seguidores&quot; → Captura donde aparece distribución por género, edad y ubicación.</p>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400">💡 Tip: Sube las imágenes a un servicio como Imgur o Google Drive y pega el enlace directo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsSubmit;
