import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, MessageSquare, Calendar, Loader2, 
  AlertCircle, Building2, CheckCircle, Clock
} from 'lucide-react';

const API_URL = getApiUrl();

const CreatorFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ avgRating: 0, totalRatings: 0 });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_URL}/api/ugc/creators/me/feedback`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
        setStats({
          avgRating: data.avg_rating || 0,
          totalRatings: data.total_ratings || 0
        });
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Error al cargar feedback');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white" data-testid="creator-feedback-page">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creator/workspace" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Mi Workspace
          </Link>
          <span className="text-[#d4a968] italic">Mis Calificaciones</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">
            Mi <span className="text-[#d4a968] italic">Feedback</span>
          </h1>
          <p className="text-gray-400">Comentarios y calificaciones de las marcas sobre tus entregas</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <span className="text-3xl font-light text-white">{stats.avgRating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-400">Calificación Promedio</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-6 h-6 text-purple-400" />
              <span className="text-3xl font-light text-white">{stats.totalRatings}</span>
            </div>
            <p className="text-sm text-gray-400">Total Calificaciones</p>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Sin feedback todavía</h3>
            <p className="text-gray-400 mb-6">
              Las marcas podrán calificarte cuando apruebes entregas
            </p>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
            >
              Ver campañas disponibles
            </Link>
          </div>
        ) : (
          <div className="space-y-4" data-testid="feedback-list">
            {feedback.map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                data-testid={`feedback-item-${idx}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#d4a968]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{item.brand_name || 'Marca'}</p>
                      <p className="text-sm text-gray-500">{item.campaign_name || 'Campaña'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(item.rating)}
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.rated_at)}
                    </p>
                  </div>
                </div>

                {/* Private Comment */}
                {item.comment ? (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-xs text-[#d4a968] mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Comentario privado de la marca
                    </p>
                    <p className="text-gray-300 text-sm">{item.comment}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-gray-500 text-sm italic">Sin comentario adicional</p>
                  </div>
                )}

                {/* Deliverable Status */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  Entrega aprobada
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorFeedback;
