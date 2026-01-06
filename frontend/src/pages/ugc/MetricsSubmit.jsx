import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, Camera, BarChart3, Eye, Heart, MessageCircle,
  Share2, Bookmark, CheckCircle, AlertCircle, Loader2, HelpCircle,
  Instagram, Music2, Sparkles, Clock
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

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
  const [metrics, setMetrics] = useState({
    views: '',
    reach: '',
    likes: '',
    comments: '',
    shares: '',
    saves: ''
  });
  const [aiConfidence, setAiConfidence] = useState(null);
  const [useManualInput, setUseManualInput] = useState(false);

  useEffect(() => {
    fetchDeliverable();
  }, [deliverableId]);

  const fetchDeliverable = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${deliverableId}`, { credentials: 'include' });
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
  };

  const handleScreenshotChange = async (url) => {
    setScreenshotUrl(url);
    setAiConfidence(null);
    
    if (!url.trim()) return;
    
    // Validate URL format
    if (!url.startsWith('http')) {
      setError('Ingresa una URL válida (debe comenzar con http:// o https://)');
      return;
    }
    
    setError('');
  };

  const handleSubmit = async () => {
    if (!screenshotUrl.trim()) {
      setError('Ingresa la URL del screenshot de métricas');
      return;
    }

    setSubmitting(true);
    setError('');
    setAiProcessing(true);

    try {
      const res = await fetch(`${API_URL}/api/ugc/metrics/submit/${deliverableId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          screenshot_url: screenshotUrl,
          views: metrics.views ? parseInt(metrics.views) : null,
          reach: metrics.reach ? parseInt(metrics.reach) : null,
          likes: metrics.likes ? parseInt(metrics.likes) : null,
          comments: metrics.comments ? parseInt(metrics.comments) : null,
          shares: metrics.shares ? parseInt(metrics.shares) : null,
          saves: metrics.saves ? parseInt(metrics.saves) : null
        })
      });

      setAiProcessing(false);
      
      if (res.ok) {
        const data = await res.json();
        setAiConfidence(data.ai_confidence);
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

  const isMetricsWindowOpen = () => {
    if (!deliverable?.metrics_window_opens) return false;
    const now = new Date();
    const opens = new Date(deliverable.metrics_window_opens);
    const closes = deliverable.metrics_window_closes ? new Date(deliverable.metrics_window_closes) : null;
    return now >= opens && (!closes || now <= closes);
  };

  const getWindowStatus = () => {
    if (!deliverable?.metrics_window_opens) {
      return { status: 'not_ready', message: 'La ventana de métricas aún no está configurada' };
    }
    
    const now = new Date();
    const opens = new Date(deliverable.metrics_window_opens);
    const closes = deliverable.metrics_window_closes ? new Date(deliverable.metrics_window_closes) : null;
    
    if (now < opens) {
      const daysUntil = Math.ceil((opens - now) / (1000 * 60 * 60 * 24));
      return { 
        status: 'pending', 
        message: `La ventana abre en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
        date: opens.toLocaleDateString('es-PY')
      };
    }
    
    if (closes && now > closes) {
      return { status: 'late', message: 'La ventana cerró - envío tardío' };
    }
    
    if (closes) {
      const daysLeft = Math.ceil((closes - now) / (1000 * 60 * 60 * 24));
      return { 
        status: 'open', 
        message: `${daysLeft} día${daysLeft !== 1 ? 's' : ''} restantes`,
        date: closes.toLocaleDateString('es-PY')
      };
    }
    
    return { status: 'open', message: 'Ventana abierta' };
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={`/ugc/creator/deliverable/${deliverableId}`} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Volver
          </Link>
          <span className="text-[#d4a968] italic">Subir Métricas</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Campaign Info */}
        <div className="mb-8 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            deliverable.platform === 'tiktok' ? 'bg-black border border-white/20' : 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
          }`}>
            {deliverable.platform === 'tiktok' ? (
              <Music2 className="w-7 h-7 text-white" />
            ) : (
              <Instagram className="w-7 h-7 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-light">{deliverable.campaign?.name}</h1>
            <p className="text-gray-400">{deliverable.brand?.company_name}</p>
          </div>
        </div>

        {/* Metrics Window Status */}
        <div className={`mb-6 p-4 rounded-xl border ${
          windowStatus.status === 'open' ? 'bg-green-500/10 border-green-500/30' :
          windowStatus.status === 'late' ? 'bg-orange-500/10 border-orange-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${
              windowStatus.status === 'open' ? 'text-green-400' :
              windowStatus.status === 'late' ? 'text-orange-400' :
              'text-blue-400'
            }`} />
            <div>
              <p className={`font-medium ${
                windowStatus.status === 'open' ? 'text-green-400' :
                windowStatus.status === 'late' ? 'text-orange-400' :
                'text-blue-400'
              }`}>
                {windowStatus.message}
              </p>
              {windowStatus.date && (
                <p className="text-sm text-gray-400">
                  {windowStatus.status === 'pending' ? 'Abre:' : 'Cierra:'} {windowStatus.date}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="font-medium mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#d4a968]" />
            Cómo subir tus métricas
          </h2>
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>Abre {deliverable.platform === 'tiktok' ? 'TikTok' : 'Instagram'} y ve a tu publicación</li>
            <li>Accede a las estadísticas/insights de la publicación</li>
            <li>Toma un screenshot que muestre: views, reach, likes, comentarios, compartidos</li>
            <li>Sube el screenshot a un servicio como Imgur, Google Drive o similar</li>
            <li>Pega el link directo de la imagen aquí</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">
            💡 Nuestro sistema AI extraerá automáticamente los números del screenshot
          </p>
        </div>

        {/* Screenshot URL Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            <Camera className="w-4 h-4 inline mr-1" />
            URL del screenshot de métricas *
          </label>
          <input
            type="url"
            value={screenshotUrl}
            onChange={(e) => handleScreenshotChange(e.target.value)}
            placeholder="https://i.imgur.com/... o link de Google Drive"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
          />
        </div>

        {/* Manual Input Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setUseManualInput(!useManualInput)}
            className="text-sm text-[#d4a968] hover:underline flex items-center gap-1"
          >
            {useManualInput ? '▼' : '►'} Ingresar métricas manualmente (opcional)
          </button>
          
          {useManualInput && (
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs text-gray-500 mb-4">
                Si el AI no puede leer tu screenshot, ingresa los números aquí
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Eye className="w-3 h-3 inline mr-1" /> Views
                  </label>
                  <input
                    type="number"
                    value={metrics.views}
                    onChange={(e) => setMetrics({...metrics, views: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <BarChart3 className="w-3 h-3 inline mr-1" /> Reach
                  </label>
                  <input
                    type="number"
                    value={metrics.reach}
                    onChange={(e) => setMetrics({...metrics, reach: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Heart className="w-3 h-3 inline mr-1" /> Likes
                  </label>
                  <input
                    type="number"
                    value={metrics.likes}
                    onChange={(e) => setMetrics({...metrics, likes: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <MessageCircle className="w-3 h-3 inline mr-1" /> Comentarios
                  </label>
                  <input
                    type="number"
                    value={metrics.comments}
                    onChange={(e) => setMetrics({...metrics, comments: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Share2 className="w-3 h-3 inline mr-1" /> Compartidos
                  </label>
                  <input
                    type="number"
                    value={metrics.shares}
                    onChange={(e) => setMetrics({...metrics, shares: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    <Bookmark className="w-3 h-3 inline mr-1" /> Guardados
                  </label>
                  <input
                    type="number"
                    value={metrics.saves}
                    onChange={(e) => setMetrics({...metrics, saves: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Processing Indicator */}
        {aiProcessing && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <div>
                <p className="text-purple-400 font-medium">Procesando con AI...</p>
                <p className="text-sm text-gray-400">Extrayendo métricas del screenshot</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !screenshotUrl.trim() || windowStatus.status === 'pending'}
          className="w-full py-4 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Enviar Métricas
            </>
          )}
        </button>

        {windowStatus.status === 'pending' && (
          <p className="text-center text-sm text-gray-500 mt-3">
            Debes esperar a que se abra la ventana de métricas para enviar
          </p>
        )}

        {/* Post Link */}
        {deliverable.post_url && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">Tu publicación:</p>
            <a
              href={deliverable.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4a968] hover:underline text-sm break-all"
            >
              {deliverable.post_url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsSubmit;
