import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, Star, MapPin, Filter, Search, Loader2, ChevronRight,
  Instagram, Music2, TrendingUp, Clock, Medal
} from 'lucide-react';

const API_URL = getApiUrl();

const Leaderboard = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', city: '', platform: '' });

  useEffect(() => {
    fetchLeaderboard();
  }, [filters]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let query = new URLSearchParams();
      if (filters.category) query.append('category', filters.category);
      if (filters.city) query.append('city', filters.city);
      if (filters.platform) query.append('platform', filters.platform);
      
      const res = await fetch(`${API_URL}/api/ugc/reputation/leaderboard?${query}`);
      if (res.ok) {
        const data = await res.json();
        setCreators(data.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      rookie: 'text-gray-400',
      trusted: 'text-blue-400',
      pro: 'text-purple-400',
      elite: 'text-yellow-400'
    };
    return colors[level] || colors.rookie;
  };

  const getLevelIcon = (level) => {
    const icons = { rookie: '🌱', trusted: '✅', pro: '💼', elite: '👑' };
    return icons[level] || icons.rookie;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50';
    return 'bg-white/5 border-white/10';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-500" />;
    return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-medium">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/ugc/creators" className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> Creators
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/ugc/campaigns" className="text-gray-400 hover:text-white">Campañas</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 text-sm">Top Creators</span>
          </div>
          <h1 className="text-4xl font-light mb-2">
            <span className="text-[#d4a968] italic">Leaderboard</span>
          </h1>
          <p className="text-gray-400">Los mejores creators de nuestra plataforma</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            <option value="fashion">Fashion</option>
            <option value="beauty">Beauty</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="food">Food</option>
            <option value="fitness">Fitness</option>
            <option value="tech">Tech</option>
          </select>
          <select
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
          >
            <option value="">Todas las ciudades</option>
            <option value="Asunción">Asunción</option>
            <option value="Ciudad del Este">Ciudad del Este</option>
            <option value="Encarnación">Encarnación</option>
          </select>
          <select
            value={filters.platform}
            onChange={(e) => setFilters({...filters, platform: e.target.value})}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
          >
            <option value="">Todas las plataformas</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No hay creators que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creators.map((creator) => (
              <Link
                key={creator.creator_id}
                to={`/ugc/creator/${creator.creator_id}`}
                className={`block p-4 border rounded-xl transition-all hover:scale-[1.01] ${getRankStyle(creator.rank)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {getRankBadge(creator.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                    {creator.profile_image ? (
                      <img src={creator.profile_image} alt={creator.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-light">{creator.name?.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate">{creator.name}</h3>
                      <span className={getLevelColor(creator.level)}>
                        {getLevelIcon(creator.level)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      {creator.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {creator.city}
                        </span>
                      )}
                      {creator.primary_platform && (
                        <span className="flex items-center gap-1">
                          {creator.primary_platform === 'tiktok' ? <Music2 className="w-3 h-3" /> : <Instagram className="w-3 h-3" />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-yellow-400" />
                        <span className="font-medium">{creator.avg_rating.toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-gray-500">Rating</span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-white">{creator.total_completed}</p>
                      <span className="text-xs text-gray-500">Colaboraciones</span>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="font-medium text-green-400">{creator.on_time_rate}%</p>
                      <span className="text-xs text-gray-500">A tiempo</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Level Legend */}
        <div className="mt-12 p-5 bg-white/5 border border-white/10 rounded-xl">
          <h3 className="font-medium mb-4">Niveles de Creator</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { level: 'rookie', name: 'Rookie', icon: '🌱', desc: 'Nuevo creator' },
              { level: 'trusted', name: 'Trusted', icon: '✅', desc: '5+ colaboraciones' },
              { level: 'pro', name: 'Pro', icon: '💼', desc: '15+ colaboraciones, 4.0+ rating' },
              { level: 'elite', name: 'Elite', icon: '👑', desc: '30+ colaboraciones, 4.5+ rating' }
            ].map(l => (
              <div key={l.level} className="text-center p-3 bg-black/30 rounded-lg">
                <span className="text-2xl">{l.icon}</span>
                <p className={`font-medium ${getLevelColor(l.level)}`}>{l.name}</p>
                <p className="text-xs text-gray-500">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
