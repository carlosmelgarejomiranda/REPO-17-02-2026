import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Instagram, Music2, Calendar, Award,
  TrendingUp, Clock, Users, CheckCircle, Loader2, ExternalLink,
  BarChart3, Eye, Heart
} from 'lucide-react';

const API_URL = getApiUrl();

const CreatorProfile = () => {
  const { creatorId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [creatorId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/reputation/creator/${creatorId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError('Creator no encontrado');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      rookie: 'from-gray-500 to-gray-600',
      trusted: 'from-blue-500 to-blue-600',
      pro: 'from-purple-500 to-purple-600',
      elite: 'from-yellow-500 to-amber-600'
    };
    return colors[level] || colors.rookie;
  };

  const getLevelBadge = (level) => {
    const badges = {
      rookie: { icon: '🌱', name: 'Rookie' },
      trusted: { icon: '✅', name: 'Trusted' },
      pro: { icon: '💼', name: 'Pro' },
      elite: { icon: '👑', name: 'Elite' }
    };
    return badges[level] || badges.rookie;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl">{error || 'Creator no encontrado'}</p>
          <Link to="/ugc/creators" className="text-[#d4a968] hover:underline mt-4 block">
            Ver todos los creators
          </Link>
        </div>
      </div>
    );
  }

  const { profile: creator, reputation, performance, badges } = profile;
  const levelBadge = getLevelBadge(creator.level);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creators" className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            Creators
          </Link>
          <Link to="/ugc/leaderboard" className="text-[#d4a968] hover:underline text-sm">
            Ver Leaderboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Avatar & Level */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className={`w-32 h-32 rounded-2xl bg-gradient-to-br ${getLevelColor(creator.level)} p-1`}>
                <div className="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                  {creator.profile_image ? (
                    <img src={creator.profile_image} alt={creator.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-light text-white">{creator.name?.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r ${getLevelColor(creator.level)} text-white text-sm font-medium`}>
                {levelBadge.icon} {levelBadge.name}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-light mb-2">{creator.name}</h1>
            {creator.city && (
              <p className="text-gray-400 flex items-center gap-1 mb-3">
                <MapPin className="w-4 h-4" /> {creator.city}
              </p>
            )}
            {creator.bio && <p className="text-gray-300 mb-4">{creator.bio}</p>}
            
            {/* Categories */}
            {creator.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {creator.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Social Networks */}
            <div className="flex gap-3">
              {creator.social_networks?.map((sn, idx) => (
                <a
                  key={idx}
                  href={sn.profile_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    sn.platform === 'tiktok' ? 'bg-black border border-white/20' : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                  }`}
                >
                  {sn.platform === 'tiktok' ? <Music2 className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
                  <span className="text-sm">@{sn.username}</span>
                  <span className="text-xs text-gray-500">{formatNumber(sn.followers)}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              <Star className="w-5 h-5 fill-yellow-400" />
              <span className="text-2xl font-light">{reputation.avg_rating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-400">{reputation.total_ratings} reviews</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-2xl font-light text-white mb-1">{performance.total_collaborations}</p>
            <p className="text-sm text-gray-400">Colaboraciones</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-2xl font-light text-green-400 mb-1">{performance.on_time_rate}%</p>
            <p className="text-sm text-gray-400">A tiempo</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-2xl font-light text-purple-400 mb-1">
              {formatNumber(Object.values(performance.avg_views || {})[0] || 0)}
            </p>
            <p className="text-sm text-gray-400">Views promedio</p>
          </div>
        </div>

        {/* Badges */}
        {badges?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#d4a968]" /> Insignias
            </h2>
            <div className="flex flex-wrap gap-3">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl"
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{badge.name}</p>
                    <p className="text-xs text-gray-500">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating Breakdown */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#d4a968]" /> Calificaciones
          </h2>
          <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reputation.rating_breakdown[stars] || 0;
                const percent = reputation.total_ratings > 0 ? (count / reputation.total_ratings) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-12">{stars} ⭐</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        {reputation.recent_reviews?.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4">Reviews recientes</h2>
            <div className="space-y-4">
              {reputation.recent_reviews.map((review, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.brand_name}</span>
                  </div>
                  {review.comment && <p className="text-gray-300 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Level Progress */}
        <div className="mt-8 p-5 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Progreso de nivel</h3>
            <span className="text-sm text-gray-400">{creator.level_progress}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getLevelColor(creator.level)} rounded-full transition-all duration-500`}
              style={{ width: `${creator.level_progress}%` }}
            />
          </div>
          {creator.level !== 'elite' && (
            <p className="text-xs text-gray-500 mt-2">
              Completa más colaboraciones para subir de nivel
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
