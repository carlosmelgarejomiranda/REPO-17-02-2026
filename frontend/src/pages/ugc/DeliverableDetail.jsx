import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Instagram, Music2, ExternalLink, Upload, CheckCircle,
  Clock, AlertCircle, Send, Loader2, Star, Sparkles, XCircle, HelpCircle,
  Copy, Smartphone
} from 'lucide-react';

const API_URL = getApiUrl();

// ==================== URL VALIDATION SYSTEM ====================

const validateInstagramUrl = (url) => {
  if (!url || !url.trim()) {
    return { valid: false, error: null }; // Empty is ok, not an error
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Check if it's a TikTok URL (wrong platform)
  if (trimmedUrl.includes('tiktok.com')) {
    return {
      valid: false,
      error: {
        type: 'wrong_platform',
        title: '¡Ups! Ese es un link de TikTok',
        message: 'Parece que pegaste un link de TikTok en el campo de Instagram.',
        help: 'Copiá el link de TikTok en el campo de abajo, y buscá tu publicación de Instagram para este campo.',
        icon: 'swap'
      }
    };
  }

  // Check if it's not Instagram at all
  if (!trimmedUrl.includes('instagram.com')) {
    return {
      valid: false,
      error: {
        type: 'wrong_site',
        title: 'Este link no es de Instagram',
        message: 'Solo podés subir links de publicaciones de Instagram aquí.',
        help: 'Abrí tu publicación en Instagram, tocá los 3 puntitos (⋯) y seleccioná "Copiar enlace".',
        icon: 'help'
      }
    };
  }

  // Check if it's a profile URL (not a post)
  const profilePatterns = [
    /instagram\.com\/[^\/]+\/?$/,  // instagram.com/username
    /instagram\.com\/[^\/]+\/\?/,  // instagram.com/username/?...
  ];
  
  const isProfile = profilePatterns.some(pattern => pattern.test(trimmedUrl)) && 
    !trimmedUrl.includes('/p/') && 
    !trimmedUrl.includes('/reel/') && 
    !trimmedUrl.includes('/tv/');

  if (isProfile) {
    return {
      valid: false,
      error: {
        type: 'profile_url',
        title: 'Este es el link de tu perfil, no de tu publicación',
        message: 'Necesitamos el link específico del post o reel que hiciste para la campaña.',
        help: 'Andá a tu publicación, tocá los 3 puntitos (⋯) arriba a la derecha y seleccioná "Copiar enlace".',
        example: 'El link correcto se ve así: instagram.com/p/ABC123... o instagram.com/reel/ABC123...',
        icon: 'profile'
      }
    };
  }

  // Check if it's a story (temporary content)
  if (trimmedUrl.includes('/stories/')) {
    return {
      valid: false,
      error: {
        type: 'story_url',
        title: 'Los stories no se pueden usar',
        message: 'Las historias de Instagram son temporales y desaparecen en 24 horas.',
        help: 'Necesitamos el link de un Post o Reel permanente. Si subiste el contenido como historia, también publicalo como Reel para que quede guardado.',
        icon: 'time'
      }
    };
  }

  // Check for valid post patterns
  const validPatterns = [
    /instagram\.com\/p\/[\w-]+/,      // Post: instagram.com/p/ABC123
    /instagram\.com\/reel\/[\w-]+/,   // Reel: instagram.com/reel/ABC123
    /instagram\.com\/tv\/[\w-]+/,     // IGTV: instagram.com/tv/ABC123
  ];

  const isValidPost = validPatterns.some(pattern => pattern.test(trimmedUrl));

  if (!isValidPost) {
    return {
      valid: false,
      error: {
        type: 'invalid_format',
        title: 'El formato del link no es correcto',
        message: 'No pudimos reconocer este link como una publicación de Instagram.',
        help: 'Asegurate de copiar el link completo desde la app de Instagram: tocá los 3 puntitos (⋯) en tu publicación y seleccioná "Copiar enlace".',
        example: 'Debería verse algo así: https://www.instagram.com/reel/ABC123xyz/',
        icon: 'help'
      }
    };
  }

  return { valid: true, error: null };
};

const validateTiktokUrl = (url) => {
  if (!url || !url.trim()) {
    return { valid: false, error: null }; // Empty is ok
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Check if it's an Instagram URL (wrong platform)
  if (trimmedUrl.includes('instagram.com')) {
    return {
      valid: false,
      error: {
        type: 'wrong_platform',
        title: '¡Ups! Ese es un link de Instagram',
        message: 'Parece que pegaste un link de Instagram en el campo de TikTok.',
        help: 'Copiá el link de Instagram en el campo de arriba, y buscá tu video de TikTok para este campo.',
        icon: 'swap'
      }
    };
  }

  // Check if it's not TikTok at all
  if (!trimmedUrl.includes('tiktok.com')) {
    return {
      valid: false,
      error: {
        type: 'wrong_site',
        title: 'Este link no es de TikTok',
        message: 'Solo podés subir links de videos de TikTok aquí.',
        help: 'Abrí tu video en TikTok, tocá "Compartir" y luego "Copiar enlace".',
        icon: 'help'
      }
    };
  }

  // Check if it's a profile URL (not a video)
  const isProfile = (
    trimmedUrl.match(/tiktok\.com\/@[\w.-]+\/?$/) ||
    trimmedUrl.match(/tiktok\.com\/@[\w.-]+\?/)
  ) && !trimmedUrl.includes('/video/');

  if (isProfile) {
    return {
      valid: false,
      error: {
        type: 'profile_url',
        title: 'Este es el link de tu perfil, no de tu video',
        message: 'Necesitamos el link específico del video que hiciste para la campaña.',
        help: 'Andá a tu video, tocá "Compartir" (la flecha) y seleccioná "Copiar enlace".',
        example: 'El link correcto se ve así: tiktok.com/@tuusuario/video/123456789...',
        icon: 'profile'
      }
    };
  }

  // Check for valid video pattern
  const validPattern = /tiktok\.com\/@[\w.-]+\/video\/\d+/;
  const isValidVideo = validPattern.test(trimmedUrl);

  // Also accept short links like vm.tiktok.com
  const isShortLink = trimmedUrl.includes('vm.tiktok.com') || trimmedUrl.includes('vt.tiktok.com');

  if (!isValidVideo && !isShortLink) {
    return {
      valid: false,
      error: {
        type: 'invalid_format',
        title: 'El formato del link no es correcto',
        message: 'No pudimos reconocer este link como un video de TikTok.',
        help: 'Asegurate de copiar el link completo desde la app de TikTok: tocá "Compartir" en tu video y luego "Copiar enlace".',
        example: 'Debería verse algo así: https://www.tiktok.com/@usuario/video/7123456789...',
        icon: 'help'
      }
    };
  }

  return { valid: true, error: null };
};

// Error display component with friendly messages
const UrlErrorMessage = ({ error, platform }) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.icon) {
      case 'swap':
        return <Music2 className="w-5 h-5" />;
      case 'profile':
        return <Smartphone className="w-5 h-5" />;
      case 'time':
        return <Clock className="w-5 h-5" />;
      default:
        return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-400 text-sm">{error.title}</p>
          <p className="text-gray-300 text-sm mt-1">{error.message}</p>
          <div className="mt-3 p-3 bg-black/30 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">💡 ¿Cómo solucionarlo?</p>
            <p className="text-sm text-gray-300">{error.help}</p>
          </div>
          {error.example && (
            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-400 font-mono break-all">{error.example}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Valid URL indicator
const UrlValidIndicator = ({ platform }) => (
  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-green-400" />
    <div>
      <p className="text-green-400 text-sm font-medium">¡Link válido!</p>
      <p className="text-gray-400 text-xs">El formato del link de {platform} es correcto</p>
    </div>
  </div>
);

// ==================== MAIN COMPONENT ====================

const DeliverableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states - separate URLs for each platform
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  
  // Validation states
  const [instagramValidation, setInstagramValidation] = useState({ valid: false, error: null });
  const [tiktokValidation, setTiktokValidation] = useState({ valid: false, error: null });

  useEffect(() => {
    fetchDeliverable();
  }, [id]);

  // Validate Instagram URL on change
  useEffect(() => {
    const result = validateInstagramUrl(instagramUrl);
    setInstagramValidation(result);
  }, [instagramUrl]);

  // Validate TikTok URL on change
  useEffect(() => {
    const result = validateTiktokUrl(tiktokUrl);
    setTiktokValidation(result);
  }, [tiktokUrl]);

  const fetchDeliverable = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${id}`, { 
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        setDeliverable(data);
        // Load existing URLs
        if (data.instagram_url) setInstagramUrl(data.instagram_url);
        if (data.tiktok_url) setTiktokUrl(data.tiktok_url);
        // Legacy support
        if (data.post_url) {
          if (data.post_url.includes('instagram')) setInstagramUrl(data.post_url);
          else if (data.post_url.includes('tiktok')) setTiktokUrl(data.post_url);
        }
      } else {
        setError('No se pudo cargar la entrega');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrls = async () => {
    // Use existing URLs if available, or new input
    const finalInstagramUrl = deliverable.instagram_url || instagramUrl.trim();
    const finalTiktokUrl = deliverable.tiktok_url || tiktokUrl.trim();
    
    // Validate at least one URL (new or existing)
    if (!finalInstagramUrl && !finalTiktokUrl) {
      setError('Debes ingresar al menos una URL (Instagram o TikTok)');
      return;
    }

    // Check validations for new URLs
    if (instagramUrl.trim() && !deliverable.instagram_url) {
      const igValidation = validateInstagramUrl(instagramUrl);
      if (!igValidation.valid && igValidation.error) {
        setError('Corregí el link de Instagram antes de continuar');
        return;
      }
    }
    
    if (tiktokUrl.trim() && !deliverable.tiktok_url) {
      const ttValidation = validateTiktokUrl(tiktokUrl);
      if (!ttValidation.valid && ttValidation.error) {
        setError('Corregí el link de TikTok antes de continuar');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      // Build post_url combining both
      const urls = [];
      if (finalInstagramUrl) urls.push(finalInstagramUrl);
      if (finalTiktokUrl) urls.push(finalTiktokUrl);
      const combinedUrl = urls.join(' | ');

      const res = await fetch(`${API_URL}/api/ugc/deliverables/${id}/publish?post_url=${encodeURIComponent(combinedUrl)}&instagram_url=${encodeURIComponent(finalInstagramUrl || '')}&tiktok_url=${encodeURIComponent(finalTiktokUrl || '')}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (res.ok) {
        setSuccess('¡URL registrada con éxito!');
        fetchDeliverable();
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al registrar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      awaiting_publish: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Por Publicar' },
      published: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Publicado' },
      submitted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'En Revisión' },
      resubmitted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Reenviado' },
      changes_requested: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Cambios Solicitados' },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Aprobado' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rechazado' },
      metrics_pending: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Métricas Pendientes' },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completado' }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-PY', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    });
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
      <div className="min-h-screen bg-black flex items-center justify-center text-white px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg mb-4">Entrega no encontrada</p>
          <Link to="/ugc/creator/workspace" className="text-[#d4a968] hover:underline">
            ← Volver al workspace
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(deliverable.status);
  
  // Can submit if awaiting_publish, changes_requested, OR if still missing one URL
  const hasInstagram = !!deliverable.instagram_url;
  const hasTiktok = !!deliverable.tiktok_url;
  const canAddMoreUrls = !hasInstagram || !hasTiktok;
  const canSubmit = ['awaiting_publish', 'changes_requested'].includes(deliverable.status) || 
    (['published', 'submitted', 'resubmitted', 'approved', 'metrics_pending'].includes(deliverable.status) && canAddMoreUrls);
  
  const hasUrls = instagramUrl || tiktokUrl;
  const hasBothUrls = instagramUrl && tiktokUrl;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - Compact for mobile */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-white/10">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/ugc/creator/workspace" className="flex items-center gap-2 text-gray-400">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <span className={`px-3 py-1 rounded-full text-xs border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Campaign Card - Clean design */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{deliverable.campaign?.name}</h1>
              <p className="text-sm text-gray-400">{deliverable.brand?.company_name}</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Changes Requested Feedback */}
        {deliverable.status === 'changes_requested' && deliverable.review_notes?.length > 0 && (
          <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
            <p className="font-medium text-orange-400 text-sm mb-1">Feedback:</p>
            <p className="text-gray-300 text-sm">
              {deliverable.review_notes[deliverable.review_notes.length - 1]?.note || 'Revisá tu contenido'}
            </p>
          </div>
        )}

        {/* URL Submission Form */}
        {canSubmit && (
          <div className="space-y-4">
            {/* Instagram URL - Show if no Instagram URL exists */}
            {!hasInstagram && (
              <div className={`p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border rounded-xl transition-colors ${
                instagramValidation.error ? 'border-red-500/50' : 
                instagramValidation.valid ? 'border-green-500/50' : 'border-purple-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">Instagram</p>
                    <p className="text-xs text-gray-400">Reels o Post</p>
                  </div>
                  {instagramValidation.valid && (
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  )}
                  {instagramValidation.error && (
                    <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                  )}
                </div>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/..."
                  className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none transition-colors ${
                    instagramValidation.error ? 'border-red-500/50 focus:border-red-500' :
                    instagramValidation.valid ? 'border-green-500/50 focus:border-green-500' :
                    'border-white/10 focus:border-pink-500'
                  }`}
                />
                
                {/* Validation feedback */}
                {instagramValidation.error && (
                  <UrlErrorMessage error={instagramValidation.error} platform="Instagram" />
                )}
                {instagramValidation.valid && (
                  <UrlValidIndicator platform="Instagram" />
                )}
              </div>
            )}

            {/* Instagram Already Submitted */}
            {hasInstagram && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">Instagram</p>
                    <p className="text-xs text-green-400">✓ URL registrada</p>
                  </div>
                  <a
                    href={deliverable.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* TikTok URL - Show if no TikTok URL exists */}
            {!hasTiktok && (
              <div className={`p-4 bg-gradient-to-br from-cyan-500/10 to-black/30 border rounded-xl transition-colors ${
                tiktokValidation.error ? 'border-red-500/50' : 
                tiktokValidation.valid ? 'border-green-500/50' : 'border-cyan-500/20'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">TikTok</p>
                    <p className="text-xs text-gray-400">Video</p>
                  </div>
                  {tiktokValidation.valid && (
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  )}
                  {tiktokValidation.error && (
                    <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                  )}
                </div>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@usuario/video/..."
                  className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none transition-colors ${
                    tiktokValidation.error ? 'border-red-500/50 focus:border-red-500' :
                    tiktokValidation.valid ? 'border-green-500/50 focus:border-green-500' :
                    'border-white/10 focus:border-cyan-500'
                  }`}
                />
                
                {/* Validation feedback */}
                {tiktokValidation.error && (
                  <UrlErrorMessage error={tiktokValidation.error} platform="TikTok" />
                )}
                {tiktokValidation.valid && (
                  <UrlValidIndicator platform="TikTok" />
                )}
              </div>
            )}

            {/* TikTok Already Submitted */}
            {hasTiktok && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black border border-white/20 flex items-center justify-center">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">TikTok</p>
                    <p className="text-xs text-green-400">✓ URL registrada</p>
                  </div>
                  <a
                    href={deliverable.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Incentive Message */}
            {(hasUrls || hasInstagram || hasTiktok) && !(hasBothUrls || (hasInstagram && hasTiktok)) && (
              <div className="p-3 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl flex items-start gap-3">
                <Star className="w-5 h-5 text-[#d4a968] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  <span className="text-[#d4a968] font-medium">¡Tip!</span> Subir en ambas plataformas mejora tu rating y aumenta tus chances de ser seleccionado en futuras campañas.
                </p>
              </div>
            )}

            {(hasBothUrls || (hasInstagram && hasTiktok)) && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-400 font-medium">
                  ¡Excelente! Contenido en ambas plataformas 🎉
                </p>
              </div>
            )}

            {/* Submit Button - Only if there's a new URL to submit */}
            {((!hasInstagram && instagramUrl) || (!hasTiktok && tiktokUrl)) && (
              <>
                <button
                  onClick={handleSubmitUrls}
                  disabled={submitting || !hasUrls}
                  className="w-full py-4 bg-gradient-to-r from-[#d4a968] to-[#c49958] text-black rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#d4a968]/20"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {hasInstagram || hasTiktok ? 'Agregar URL' : 'Registrar Publicación'}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  {hasInstagram || hasTiktok ? 'Podés agregar la otra plataforma' : 'Al menos una plataforma es requerida'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Read-only view for submitted content */}
        {!canSubmit && (deliverable.post_url || deliverable.instagram_url || deliverable.tiktok_url) && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-400">Tu publicación</h2>
            
            {(deliverable.instagram_url || deliverable.post_url?.includes('instagram')) && (
              <a
                href={deliverable.instagram_url || deliverable.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl"
              >
                <Instagram className="w-5 h-5 text-pink-400" />
                <span className="flex-1 text-sm text-gray-300 truncate">Instagram</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            )}
            
            {(deliverable.tiktok_url || deliverable.post_url?.includes('tiktok')) && (
              <a
                href={deliverable.tiktok_url || deliverable.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl"
              >
                <Music2 className="w-5 h-5 text-cyan-400" />
                <span className="flex-1 text-sm text-gray-300 truncate">TikTok</span>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </div>
        )}

        {/* Metrics Upload Section - Available immediately after publishing URL */}
        {['published', 'submitted', 'resubmitted', 'under_review', 'approved', 'metrics_pending', 'metrics_submitted', 'completed'].includes(deliverable.status) && (
          <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-cyan-400 text-sm">Métricas de Rendimiento</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {deliverable.status === 'metrics_submitted' || deliverable.status === 'completed'
                    ? '✓ Métricas enviadas'
                    : deliverable.metrics_window_closes
                    ? `Fecha límite: ${new Date(deliverable.metrics_window_closes).toLocaleDateString('es-PY')}`
                    : 'Subí capturas de tus estadísticas'}
                </p>
              </div>
              {!['metrics_submitted', 'completed', 'metrics_verified'].includes(deliverable.status) && (
                <Link
                  to={`/ugc/creator/metrics/${id}`}
                  className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm font-medium hover:bg-cyan-400 transition-colors"
                  data-testid="upload-metrics-btn"
                >
                  Subir Métricas
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Campaign Requirements - Collapsible */}
        {deliverable.campaign?.requirements && (
          <details className="mt-6 group">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 list-none flex items-center justify-between">
              <span>Ver requisitos de la campaña</span>
              <span className="text-gray-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-sm">
              {deliverable.campaign.requirements.mandatory_tag && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Hashtag:</span> #{deliverable.campaign.requirements.mandatory_tag}
                </p>
              )}
              {deliverable.campaign.requirements.mandatory_mention && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Mención:</span> @{deliverable.campaign.requirements.mandatory_mention}
                </p>
              )}
              {deliverable.campaign.requirements.content_format && (
                <p className="text-gray-300">
                  <span className="text-gray-500">Formato:</span> {deliverable.campaign.requirements.content_format}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default DeliverableDetail;
