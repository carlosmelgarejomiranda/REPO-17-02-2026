import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, BarChart3, Eye, Heart, MessageCircle,
  Share2, Bookmark, CheckCircle, AlertCircle, Loader2, HelpCircle,
  Instagram, Music2, Sparkles, Clock, Users, Play,
  X, Plus, PartyPopper
} from 'lucide-react';

const API_URL = getApiUrl();
const MAX_IMAGES = 10;

// Processing messages that rotate during AI analysis
const PROCESSING_MESSAGES = [
  "Analizando imágenes con IA...",
  "Detectando métricas de rendimiento...",
  "Extrayendo datos de views y alcance...",
  "Procesando información de engagement...",
  "Identificando datos demográficos...",
  "Analizando distribución por género...",
  "Extrayendo datos de ubicación...",
  "Procesando rangos de edad...",
  "Consolidando información...",
  "Casi listo..."
];

// Processing Screen Component
const ProcessingScreen = ({ totalImages, instagramCount, tiktokCount }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  
  useEffect(() => {
    // Simulate progress based on estimated time (15 seconds per image)
    const estimatedTime = totalImages * 12000; // 12 seconds per image
    const interval = 100; // Update every 100ms
    const increment = (100 / (estimatedTime / interval)) * 0.85; // Cap at 85%
    
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(prev + increment, 85));
    }, interval);
    
    // Rotate messages every 3 seconds
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 3000);
    
    return () => {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
    };
  }, [totalImages]);
  
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-12 h-12 text-purple-400 animate-bounce" />
          </div>
          {/* Rotating ring */}
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '3s' }}>
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="4"
                strokeDasharray="70 200"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-light text-white mb-2">
          Procesando con <span className="text-purple-400 italic">IA</span>
        </h2>
        
        {/* Current message */}
        <p className="text-gray-400 mb-6 h-6 transition-all duration-500">
          {PROCESSING_MESSAGES[messageIndex]}
        </p>
        
        {/* Image counts */}
        <div className="flex justify-center gap-6 mb-6">
          {instagramCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Instagram className="w-4 h-4 text-pink-400" />
              <span className="text-gray-400">{instagramCount} imágenes</span>
            </div>
          )}
          {tiktokCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Music2 className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-400">{tiktokCount} imágenes</span>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Progress percentage */}
        <p className="text-sm text-gray-500">
          {Math.round(progress)}% completado
        </p>
        
        {/* Tip */}
        <p className="text-xs text-gray-600 mt-6">
          Esto puede tomar hasta {Math.ceil(totalImages * 0.2)} minutos dependiendo de la cantidad de imágenes
        </p>
      </div>
    </div>
  );
};

// Success Screen Component
const SuccessScreen = ({ onContinue, extractedData }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-14 h-14 text-green-400" />
        </div>
        
        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <PartyPopper className="absolute top-1/4 left-1/4 w-8 h-8 text-yellow-400 animate-bounce" />
          <PartyPopper className="absolute top-1/3 right-1/4 w-6 h-6 text-pink-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-light text-white mb-2">
          ¡Métricas <span className="text-green-400 italic">Enviadas</span>!
        </h2>
        
        <p className="text-gray-400 mb-6">
          La IA procesó exitosamente tus screenshots
        </p>
        
        {/* Extracted summary - Enhanced display */}
        {extractedData && Object.keys(extractedData).length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">Datos extraídos por IA:</p>
              <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                Verificable
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {extractedData.views > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.views?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">views</span>
                  </div>
                </div>
              )}
              {extractedData.reach > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Users className="w-4 h-4 text-green-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.reach?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">alcance</span>
                  </div>
                </div>
              )}
              {extractedData.likes > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Heart className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.likes?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">likes</span>
                  </div>
                </div>
              )}
              {extractedData.comments > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.comments?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">comments</span>
                  </div>
                </div>
              )}
              {extractedData.shares > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.shares?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">shares</span>
                  </div>
                </div>
              )}
              {extractedData.saves > 0 && (
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                  <Bookmark className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-white font-medium">{extractedData.saves?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs ml-1">saves</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">
              Estos datos fueron extraídos automáticamente de tus screenshots y pueden ser verificados por el administrador
            </p>
          </div>
        )}
        
        {/* No data extracted notice */}
        {(!extractedData || Object.keys(extractedData).length === 0) && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-yellow-400">
              No se pudieron extraer métricas automáticamente. Los screenshots fueron guardados para revisión manual.
            </p>
          </div>
        )}
        
        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

// Screenshot upload card component - moved outside to avoid re-renders
const ScreenshotUploadCard = ({ 
  platform, 
  icon: Icon, 
  iconColor, 
  bgColor, 
  borderColor,
  screenshots, 
  previews, 
  onFilesSelect, 
  onRemove, 
  inputRef,
  uploading 
}) => (
  <div className={`p-6 bg-white/5 border ${borderColor} rounded-xl`}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <h3 className="text-white font-medium text-lg">Screenshots de {platform}</h3>
        <p className="text-sm text-gray-400">
          Métricas + Demografía ({screenshots.length}/{MAX_IMAGES} imágenes)
        </p>
      </div>
    </div>

    {/* Preview Grid */}
    {previews.length > 0 && (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative group aspect-square">
            <img 
              src={preview} 
              alt={`Screenshot ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-white/10"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white">
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Upload Area */}
    {screenshots.length < MAX_IMAGES && (
      <div 
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed ${borderColor} rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-colors`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesSelect}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className={`w-8 h-8 ${iconColor} animate-spin`} />
            <p className="text-gray-400 text-sm">Procesando imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center`}>
              <Plus className={`w-6 h-6 ${iconColor}`} />
            </div>
            <p className="text-white font-medium">
              {screenshots.length === 0 ? 'Subir screenshots' : 'Agregar más'}
            </p>
            <p className="text-gray-500 text-sm">
              Arrastra o hacé click • Hasta {MAX_IMAGES - screenshots.length} imágenes más
            </p>
          </div>
        )}
      </div>
    )}

    {/* Info tags */}
    <div className="mt-4 p-3 bg-black/50 rounded-lg">
      <p className="text-xs text-gray-500 mb-2">La IA extraerá de todas las imágenes:</p>
      <div className="flex flex-wrap gap-2">
        {['Views', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'Watch Time', 'Género', 'Países', 'Ciudades', 'Edad'].map(metric => (
          <span key={metric} className={`px-2 py-1 ${bgColor} rounded text-xs ${iconColor}`}>{metric}</span>
        ))}
      </div>
    </div>
  </div>
);

const MetricsSubmit = () => {
  const { deliverableId } = useParams();
  const navigate = useNavigate();
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Processing and success screens
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [extractedMetrics, setExtractedMetrics] = useState(null);

  // Screenshots state - separate for each platform
  const [instagramScreenshots, setInstagramScreenshots] = useState([]);
  const [tiktokScreenshots, setTiktokScreenshots] = useState([]);
  const [instagramPreviews, setInstagramPreviews] = useState([]);
  const [tiktokPreviews, setTiktokPreviews] = useState([]);
  
  // Upload progress
  const [uploadingInstagram, setUploadingInstagram] = useState(false);
  const [uploadingTiktok, setUploadingTiktok] = useState(false);

  // File input refs
  const instagramInputRef = useRef(null);
  const tiktokInputRef = useRef(null);

  // Manual input fallback
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        // Extract base64 without data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection for Instagram
  const handleInstagramFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - instagramScreenshots.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      setError(`Máximo ${MAX_IMAGES} imágenes permitidas para Instagram`);
      return;
    }

    setUploadingInstagram(true);
    setError('');

    try {
      const newScreenshots = [];
      const newPreviews = [];

      for (const file of filesToAdd) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Una imagen es muy grande. Máximo 10MB por imagen.');
          continue;
        }

        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        
        newScreenshots.push({
          base64,
          filename: file.name,
          type: file.type
        });
        newPreviews.push(previewUrl);
      }

      setInstagramScreenshots(prev => [...prev, ...newScreenshots]);
      setInstagramPreviews(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error al procesar las imágenes');
    } finally {
      setUploadingInstagram(false);
      // Reset input
      if (instagramInputRef.current) {
        instagramInputRef.current.value = '';
      }
    }
  };

  // Handle file selection for TikTok
  const handleTiktokFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - tiktokScreenshots.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      setError(`Máximo ${MAX_IMAGES} imágenes permitidas para TikTok`);
      return;
    }

    setUploadingTiktok(true);
    setError('');

    try {
      const newScreenshots = [];
      const newPreviews = [];

      for (const file of filesToAdd) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Una imagen es muy grande. Máximo 10MB por imagen.');
          continue;
        }

        const base64 = await fileToBase64(file);
        const previewUrl = URL.createObjectURL(file);
        
        newScreenshots.push({
          base64,
          filename: file.name,
          type: file.type
        });
        newPreviews.push(previewUrl);
      }

      setTiktokScreenshots(prev => [...prev, ...newScreenshots]);
      setTiktokPreviews(prev => [...prev, ...newPreviews]);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Error al procesar las imágenes');
    } finally {
      setUploadingTiktok(false);
      // Reset input
      if (tiktokInputRef.current) {
        tiktokInputRef.current.value = '';
      }
    }
  };

  // Remove screenshot
  const removeInstagramScreenshot = (index) => {
    setInstagramScreenshots(prev => prev.filter((_, i) => i !== index));
    setInstagramPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeTiktokScreenshot = (index) => {
    setTiktokScreenshots(prev => prev.filter((_, i) => i !== index));
    setTiktokPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    const hasInstagramUrl = !!deliverable?.instagram_url;
    const hasTiktokUrl = !!deliverable?.tiktok_url;
    const hasInstagramScreenshots = instagramScreenshots.length > 0;
    const hasTiktokScreenshots = tiktokScreenshots.length > 0;

    // Validate: must have screenshots for at least one platform that has URL
    if (hasInstagramUrl && !hasInstagramScreenshots && hasTiktokUrl && !hasTiktokScreenshots) {
      setError('Sube al menos un screenshot de Instagram o TikTok');
      return;
    }
    
    if (hasInstagramUrl && !hasInstagramScreenshots && !hasTiktokUrl) {
      setError('Sube al menos un screenshot de Instagram');
      return;
    }
    
    if (hasTiktokUrl && !hasTiktokScreenshots && !hasInstagramUrl) {
      setError('Sube al menos un screenshot de TikTok');
      return;
    }

    // If both URLs exist, need at least one screenshot from either platform
    if (hasInstagramUrl && hasTiktokUrl && !hasInstagramScreenshots && !hasTiktokScreenshots) {
      setError('Sube al menos un screenshot de Instagram o TikTok');
      return;
    }

    setSubmitting(true);
    setError('');
    setAiProcessing(true);
    setShowProcessing(true); // Show processing screen

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // Prepare screenshots data
      const instagramBase64List = instagramScreenshots.map(s => s.base64);
      const tiktokBase64List = tiktokScreenshots.map(s => s.base64);

      // Create AbortController for timeout (5 minutes for AI processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);

      const res = await fetch(`${API_URL}/api/ugc/metrics/submit-v2/${deliverableId}`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          instagram_screenshots: instagramBase64List,
          tiktok_screenshots: tiktokBase64List,
          // Manual metrics as fallback
          manual_metrics: useManualInput ? {
            views: metrics.views ? parseInt(metrics.views) : null,
            reach: metrics.reach ? parseInt(metrics.reach) : null,
            likes: metrics.likes ? parseInt(metrics.likes) : null,
            comments: metrics.comments ? parseInt(metrics.comments) : null,
            shares: metrics.shares ? parseInt(metrics.shares) : null,
            saves: metrics.saves ? parseInt(metrics.saves) : null,
            watch_time_seconds: metrics.watch_time_seconds ? parseInt(metrics.watch_time_seconds) : null,
            video_length_seconds: metrics.video_length_seconds ? parseInt(metrics.video_length_seconds) : null
          } : null
        })
      });

      clearTimeout(timeoutId);
      setAiProcessing(false);
      setShowProcessing(false); // Hide processing screen
      
      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
        
        // Extract metrics for success screen
        const extracted = data.extracted_data?.metrics || {};
        setExtractedMetrics(extracted);
        
        // Show success screen instead of just a message
        setShowSuccess(true);
      } else {
        // Clone response to read it safely
        const responseClone = res.clone();
        let errorMessage = 'Error al enviar métricas';
        try {
          const data = await res.json();
          errorMessage = data.detail || errorMessage;
        } catch {
          try {
            const text = await responseClone.text();
            if (text.includes('timeout') || text.includes('Timeout')) {
              errorMessage = 'El servidor tardó mucho. Por favor intentá de nuevo.';
            }
          } catch {
            // Ignore
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      setAiProcessing(false);
      setShowProcessing(false); // Hide processing screen on error
      // Better error handling for different error types
      let errorMessage = 'Error de conexión. Por favor intentá de nuevo.';
      if (err.name === 'AbortError') {
        errorMessage = 'El procesamiento tardó demasiado. Por favor intentá de nuevo.';
      } else if (err.message) {
        if (err.message.includes('network') || err.message.includes('Network') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
        } else if (err.message.includes('timeout') || err.message.includes('Timeout')) {
          errorMessage = 'Tiempo de espera agotado. Por favor intentá de nuevo.';
        }
      }
      console.error('Metrics submit error:', err);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle continue from success screen
  const handleSuccessContinue = () => {
    setShowSuccess(false);
    navigate('/ugc/creator/my-work');
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
          <Link to="/ugc/creator/my-work" className="text-[#d4a968] hover:underline mt-4 block">
            Volver a Mi Trabajo
          </Link>
        </div>
      </div>
    );
  }

  const windowStatus = getWindowStatus();
  const totalScreenshots = instagramScreenshots.length + tiktokScreenshots.length;

  return (
    <>
      {/* Processing Screen Overlay */}
      {showProcessing && (
        <ProcessingScreen 
          totalImages={totalScreenshots}
          instagramCount={instagramScreenshots.length}
          tiktokCount={tiktokScreenshots.length}
        />
      )}
      
      {/* Success Screen Overlay */}
      {showSuccess && (
        <SuccessScreen 
          onContinue={handleSuccessContinue}
          extractedData={extractedMetrics}
        />
      )}
      
      <div className="min-h-screen bg-black text-white" data-testid="metrics-submit-page">
        {/* Header */}
        <div className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/ugc/creator/my-work" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              Mi Trabajo
            </Link>
            <div className="flex items-center gap-3">
              {deliverable?.instagram_url && (
                <div className="flex items-center gap-1">
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-gray-400">{instagramScreenshots.length}</span>
                </div>
              )}
              {deliverable?.tiktok_url && (
                <div className="flex items-center gap-1">
                  <Music2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">{tiktokScreenshots.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Title */}
          <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">
            Subir <span className="text-[#d4a968] italic">Métricas</span>
          </h1>
          <p className="text-gray-400">
            Sube capturas de tus estadísticas de Instagram y/o TikTok
          </p>
        </div>

        {/* Window Status */}
        <div className={`p-4 rounded-xl mb-6 ${
          windowStatus.status === 'open' ? 'bg-green-500/10 border border-green-500/30' :
          windowStatus.status === 'urgent' ? 'bg-yellow-500/10 border border-yellow-500/30' :
          windowStatus.status === 'late' ? 'bg-orange-500/10 border border-orange-500/30' :
          'bg-green-500/10 border border-green-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${
              windowStatus.status === 'open' ? 'text-green-400' :
              windowStatus.status === 'urgent' ? 'text-yellow-400' :
              windowStatus.status === 'late' ? 'text-orange-400' :
              'text-green-400'
            }`} />
            <div>
              <p className={`font-medium ${
                windowStatus.status === 'open' ? 'text-green-400' :
                windowStatus.status === 'urgent' ? 'text-yellow-400' :
                windowStatus.status === 'late' ? 'text-orange-400' :
                'text-green-400'
              }`}>{windowStatus.message}</p>
              {windowStatus.date && (
                <p className="text-sm text-gray-400">Fecha límite: {windowStatus.date}</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Feature Banner */}
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-purple-400 font-medium">Extracción Automática con IA</p>
              <p className="text-sm text-gray-400 mt-1">
                Sube múltiples capturas por plataforma y nuestra IA extraerá todas las métricas 
                y datos demográficos automáticamente.
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
          {/* Instagram Upload - Only show if has Instagram URL */}
          {deliverable?.instagram_url ? (
            <ScreenshotUploadCard
              platform="Instagram"
              icon={Instagram}
              iconColor="text-pink-400"
              bgColor="bg-pink-500/20"
              borderColor="border-pink-500/30"
              screenshots={instagramScreenshots}
              previews={instagramPreviews}
              onFilesSelect={handleInstagramFiles}
              onRemove={removeInstagramScreenshot}
              inputRef={instagramInputRef}
              uploading={uploadingInstagram}
            />
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <Instagram className="w-5 h-5 text-pink-400/50" />
                </div>
                <div>
                  <p className="text-gray-400">Instagram no disponible</p>
                  <p className="text-xs text-gray-500">No subiste URL de Instagram para esta entrega</p>
                </div>
              </div>
            </div>
          )}

          {/* TikTok Upload - Only show if has TikTok URL */}
          {deliverable?.tiktok_url ? (
            <ScreenshotUploadCard
              platform="TikTok"
              icon={Music2}
              iconColor="text-cyan-400"
              bgColor="bg-cyan-500/20"
              borderColor="border-cyan-500/30"
              screenshots={tiktokScreenshots}
              previews={tiktokPreviews}
              onFilesSelect={handleTiktokFiles}
              onRemove={removeTiktokScreenshot}
              inputRef={tiktokInputRef}
              uploading={uploadingTiktok}
            />
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-cyan-400/50" />
                </div>
                <div>
                  <p className="text-gray-400">TikTok no disponible</p>
                  <p className="text-xs text-gray-500">No subiste URL de TikTok para esta entrega</p>
                </div>
              </div>
            </div>
          )}

          {/* No URLs message */}
          {!deliverable?.instagram_url && !deliverable?.tiktok_url && (
            <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-yellow-400 font-medium">No hay URLs de publicación</p>
                  <p className="text-sm text-gray-400">Primero debes subir el URL de tu publicación de Instagram y/o TikTok</p>
                </div>
              </div>
            </div>
          )}
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
          disabled={submitting || totalScreenshots === 0}
          className="w-full py-4 bg-[#d4a968] text-black font-semibold rounded-xl hover:bg-[#c49958] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="submit-metrics-btn"
        >
          {aiProcessing ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              Procesando {totalScreenshots} imágenes con IA...
            </>
          ) : submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Enviar Métricas ({totalScreenshots} {totalScreenshots === 1 ? 'imagen' : 'imágenes'})
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
            <div className="flex items-start gap-3">
              <Instagram className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">Instagram</p>
                <p>Ve a tu Reel/Post → Estadísticas → Toma capturas de: métricas generales, alcance, y audiencia (demografía). Podés subir varias capturas.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Music2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium mb-1">TikTok</p>
                <p>Ve a tu video → Estadísticas → Captura: views, engagement, y datos de audiencia. Múltiples capturas te dan métricas más completas.</p>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400">💡 Tip: Mientras más capturas subas, más datos podrá extraer la IA. Incluí capturas de métricas generales Y de demografía.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default MetricsSubmit;
