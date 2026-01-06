import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Instagram, Music2, ExternalLink, Upload, CheckCircle,
  Clock, AlertCircle, Send, Loader2, Camera, Image, Link as LinkIcon
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const DeliverableDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deliverable, setDeliverable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [postUrl, setPostUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState(['']);

  useEffect(() => {
    fetchDeliverable();
  }, [id]);

  const fetchDeliverable = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDeliverable(data);
        if (data.post_url) setPostUrl(data.post_url);
        if (data.file_url) setFileUrl(data.file_url);
        if (data.evidence_urls?.length) setEvidenceUrls(data.evidence_urls);
      } else {
        setError('No se pudo cargar la entrega');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPublished = async () => {
    if (!postUrl.trim()) {
      setError('Ingresa la URL de tu publicación');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${id}/publish?post_url=${encodeURIComponent(postUrl)}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        setSuccess('¡Publicación registrada! Ahora podes enviar tu entrega.');
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

  const handleSubmit = async () => {
    if (!postUrl.trim()) {
      setError('Ingresa la URL de tu publicación');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ugc/deliverables/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          post_url: postUrl,
          file_url: fileUrl || null,
          evidence_urls: evidenceUrls.filter(u => u.trim())
        })
      });

      if (res.ok) {
        setSuccess('¡Entrega enviada! La marca la revisará pronto.');
        fetchDeliverable();
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al enviar');
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
      submitted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Enviado para Revisión' },
      resubmitted: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Reenviado' },
      changes_requested: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Cambios Solicitados' },
      approved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Aprobado' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rechazado' },
      metrics_pending: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Métricas Pendientes' },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completado' }
    };
    return configs[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status };
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
          <p className="text-xl">Entrega no encontrada</p>
          <Link to="/ugc/creator/workspace" className="text-[#d4a968] hover:underline mt-4 block">
            Volver al workspace
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(deliverable.status);
  const canEdit = ['awaiting_publish', 'published', 'changes_requested'].includes(deliverable.status);
  const showSubmitButton = ['published', 'changes_requested'].includes(deliverable.status);
  const showPublishButton = deliverable.status === 'awaiting_publish';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creator/workspace" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Workspace
          </Link>
          <span className={`px-3 py-1 rounded-full border ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Campaign Info */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
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

        {/* Review Notes (if changes requested) */}
        {deliverable.status === 'changes_requested' && deliverable.review_notes?.length > 0 && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <h3 className="font-medium text-orange-400 mb-2">Feedback de la marca:</h3>
            <p className="text-gray-300">
              {deliverable.review_notes[deliverable.review_notes.length - 1]?.note || 'Sin comentarios específicos'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Ronda de revisión: {deliverable.review_round}
            </p>
          </div>
        )}

        {/* Campaign Requirements */}
        <div className="mb-8 p-5 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-lg font-medium mb-4">Requisitos de la campaña</h2>
          <div className="space-y-3 text-sm">
            {deliverable.campaign?.requirements?.mandatory_tag && (
              <p className="text-gray-300">
                <span className="text-gray-500">Hashtag obligatorio:</span> #{deliverable.campaign.requirements.mandatory_tag}
              </p>
            )}
            {deliverable.campaign?.requirements?.mandatory_mention && (
              <p className="text-gray-300">
                <span className="text-gray-500">Mención obligatoria:</span> @{deliverable.campaign.requirements.mandatory_mention}
              </p>
            )}
            {deliverable.campaign?.requirements?.content_format && (
              <p className="text-gray-300">
                <span className="text-gray-500">Formato:</span> {deliverable.campaign.requirements.content_format}
              </p>
            )}
            {deliverable.campaign?.requirements?.additional_rules?.length > 0 && (
              <div>
                <p className="text-gray-500 mb-2">Reglas adicionales:</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {deliverable.campaign.requirements.additional_rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Submission Form */}
        {canEdit && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Tu entrega</h2>

            {/* Post URL */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <LinkIcon className="w-4 h-4 inline mr-1" />
                URL de tu publicación *
              </label>
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                placeholder="https://instagram.com/p/... o https://tiktok.com/@.../video/..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
              />
            </div>

            {/* File URL (optional) */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                URL del archivo (opcional)
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="Link a Google Drive, Dropbox, etc."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
              />
            </div>

            {/* Evidence URLs */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                Screenshots de evidencia (opcional)
              </label>
              {evidenceUrls.map((url, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...evidenceUrls];
                      newUrls[idx] = e.target.value;
                      setEvidenceUrls(newUrls);
                    }}
                    placeholder="URL de screenshot"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                  {idx === evidenceUrls.length - 1 && (
                    <button
                      onClick={() => setEvidenceUrls([...evidenceUrls, ''])}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {showPublishButton && (
                <button
                  onClick={handleMarkPublished}
                  disabled={submitting || !postUrl.trim()}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><Upload className="w-5 h-5" /> Registrar Publicación</>
                  )}
                </button>
              )}

              {showSubmitButton && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !postUrl.trim()}
                  className="flex-1 py-4 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <><Send className="w-5 h-5" /> Enviar para Revisión</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Read-only view for submitted/approved */}
        {!canEdit && deliverable.post_url && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Tu entrega</h2>
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">URL de publicación:</p>
              <a
                href={deliverable.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#d4a968] hover:underline flex items-center gap-2"
              >
                {deliverable.post_url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Metrics Upload Section */}
        {['approved', 'metrics_pending', 'metrics_submitted', 'completed'].includes(deliverable.status) && (
          <div className="mt-8 p-5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-cyan-400 mb-1">Métricas de Rendimiento</h3>
                <p className="text-sm text-gray-400">
                  {deliverable.status === 'metrics_pending' 
                    ? 'Sube las métricas de tu publicación'
                    : deliverable.status === 'metrics_submitted'
                    ? 'Métricas enviadas - en revisión'
                    : 'Entrega completada'}
                </p>
              </div>
              {deliverable.status === 'metrics_pending' && (
                <Link
                  to={`/ugc/creator/metrics/${id}`}
                  className="px-4 py-2 bg-cyan-500 text-black rounded-lg text-sm hover:bg-cyan-400 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir Métricas
                </Link>
              )}
              {deliverable.status === 'metrics_submitted' && (
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                  ✓ Enviadas
                </span>
              )}
            </div>
          </div>
        )}

        {/* Timeline Info */}
        {deliverable.campaign?.timeline && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-lg">
            <h3 className="font-medium mb-3">Fechas importantes</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Publicar antes de:</p>
                <p className="text-white">{new Date(deliverable.campaign.timeline.publish_end).toLocaleDateString('es-PY')}</p>
              </div>
              <div>
                <p className="text-gray-500">SLA de entrega:</p>
                <p className="text-white">{deliverable.campaign.timeline.delivery_sla_hours}h después de publicar</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliverableDetail;
