import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Users, Search, Filter, Star, TrendingUp, Clock, Award,
  Instagram, Music2, Loader2, RefreshCw, Download, Eye,
  ChevronLeft, ExternalLink, BarChart2, Hash
} from 'lucide-react';
import { Button } from './ui/button';

const API_URL = getApiUrl();

export const AdminCreatorsReport = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [viewMode, setViewMode] = useState('averages'); // 'averages' or 'totals'
  const [hasAiVerified, setHasAiVerified] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Detail view state
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [creatorDetail, setCreatorDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailPlatformFilter, setDetailPlatformFilter] = useState('all');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchCreators = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/ugc/admin/creators-report`;
      const params = new URLSearchParams();
      if (levelFilter) params.append('level', levelFilter);
      if (searchTerm) params.append('search', searchTerm);
      if (platformFilter && platformFilter !== 'all') params.append('platform', platformFilter);
      if (params.toString()) url += `?${params}`;
      
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorDetail = async (creatorId) => {
    setLoadingDetail(true);
    try {
      let url = `${API_URL}/api/ugc/admin/creators/${creatorId}/metrics-detail`;
      if (detailPlatformFilter && detailPlatformFilter !== 'all') {
        url += `?platform=${detailPlatformFilter}`;
      }
      
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCreatorDetail(data);
      }
    } catch (err) {
      console.error('Error fetching creator detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [levelFilter, platformFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCreators();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedCreator) {
      fetchCreatorDetail(selectedCreator.id);
    }
  }, [selectedCreator, detailPlatformFilter]);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toLocaleString();
  };

  const formatPercent = (num) => {
    if (num === null || num === undefined) return '-';
    return num.toFixed(1) + '%';
  };

  const formatDays = (days) => {
    if (!days || days <= 0) return 'A tiempo';
    return `+${days.toFixed(1)}d`;
  };

  const levelConfig = {
    rookie: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '🌱', label: 'Rookie' },
    trusted: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '✅', label: 'Trusted' },
    pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '💼', label: 'Pro' },
    elite: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '👑', label: 'Elite' }
  };

  const exportCSV = () => {
    const prefix = viewMode === 'totals' ? 'total_' : 'avg_';
    const headers = [
      'Nombre', 'Instagram', 'TikTok', 'Nivel', 'Campañas', 
      'Views', 'Alcance', 'Likes', 'Comentarios', 'Compartidos', 'Guardados',
      'Interacciones', 'T. Rep.', 'Tasa Int.', 'Calificación', 'DOT%'
    ];
    
    const rows = creators.map(c => [
      c.name,
      c.instagram_handle || '-',
      c.tiktok_handle || '-',
      c.level,
      c.campaigns_count,
      viewMode === 'totals' ? c.total_views : c.avg_views,
      viewMode === 'totals' ? c.total_reach : c.avg_reach,
      viewMode === 'totals' ? c.total_likes : c.avg_likes,
      viewMode === 'totals' ? c.total_comments : c.avg_comments,
      viewMode === 'totals' ? c.total_shares : c.avg_shares,
      viewMode === 'totals' ? c.total_saves : c.avg_saves,
      viewMode === 'totals' ? c.total_interactions : c.avg_interactions,
      viewMode === 'totals' ? c.total_watch_time : c.avg_watch_time,
      viewMode === 'totals' ? c.total_interaction_rate : c.avg_interaction_rate,
      c.avg_rating,
      c.dot_percent
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_creadores_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // If viewing creator detail
  if (selectedCreator) {
    return (
      <CreatorDetailView 
        creator={selectedCreator}
        detail={creatorDetail}
        loading={loadingDetail}
        platformFilter={detailPlatformFilter}
        setPlatformFilter={setDetailPlatformFilter}
        onBack={() => { setSelectedCreator(null); setCreatorDetail(null); }}
        formatNumber={formatNumber}
        formatPercent={formatPercent}
        levelConfig={levelConfig}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-white">
            Reporte de <span className="text-[#d4a968] italic">Creadores</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Métricas de rendimiento de todos los creadores
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchCreators}
            disabled={loading}
            variant="outline"
            className="border-white/20 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={exportCSV}
            disabled={creators.length === 0}
            className="bg-[#d4a968] text-black hover:bg-[#c49858]"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <span className="text-gray-400 text-sm mr-2">Ver datos:</span>
        <button
          onClick={() => setViewMode('averages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'averages' 
              ? 'bg-[#d4a968] text-black' 
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4 inline mr-2" />
          Promedios
        </button>
        <button
          onClick={() => setViewMode('totals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'totals' 
              ? 'bg-[#d4a968] text-black' 
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4 inline mr-2" />
          Totales Acumulados
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o @handle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
          />
        </div>
        
        {/* Level filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
          >
            <option value="">Todos los niveles</option>
            <option value="rookie">🌱 Rookie</option>
            <option value="trusted">✅ Trusted</option>
            <option value="pro">💼 Pro</option>
            <option value="elite">👑 Elite</option>
          </select>
        </div>
        
        {/* Platform filter */}
        <div className="flex items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
          >
            <option value="all">📱 Todas las plataformas</option>
            <option value="instagram">📸 Instagram</option>
            <option value="tiktok">🎵 TikTok</option>
          </select>
        </div>
        
        {/* Stats */}
        <div className="text-gray-400 text-sm">
          {creators.length} creadores
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creador</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Redes</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Nivel</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Campañas</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Alcance</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Likes</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Comentarios</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Compartidos</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Guardados</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">T. Rep.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Int.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Calificación</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">DOT%</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#d4a968] animate-spin" />
                  </td>
                </tr>
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No hay creadores para mostrar
                  </td>
                </tr>
              ) : (
                creators.map((c, idx) => {
                  const level = levelConfig[c.level] || levelConfig.rookie;
                  const prefix = viewMode === 'totals' ? 'total_' : 'avg_';
                  
                  return (
                    <tr key={c.id || idx} className="border-b border-white/5 hover:bg-white/5">
                      {/* Creator Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 font-medium">
                              {c.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white font-medium block">{c.name || 'Creator'}</span>
                            {!c.is_active && (
                              <span className="text-xs text-red-400">Inactivo</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Social handles */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {c.instagram_handle && (
                            <a href={`https://instagram.com/${c.instagram_handle.replace('@', '')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300" title={c.instagram_handle}>
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {c.tiktok_handle && (
                            <a href={`https://tiktok.com/@${c.tiktok_handle.replace('@', '')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300" title={c.tiktok_handle}>
                              <Music2 className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      
                      {/* Level */}
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs ${level.bg} ${level.text}`}>
                          {level.icon} {level.label}
                        </span>
                      </td>
                      
                      {/* Campaigns */}
                      <td className="p-4 text-right text-white font-bold">{c.campaigns_count || 0}</td>
                      
                      {/* Views */}
                      <td className="p-4 text-right text-white">{formatNumber(c[`${prefix}views`])}</td>
                      
                      {/* Reach */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c[`${prefix}reach`])}</td>
                      
                      {/* Likes */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c[`${prefix}likes`])}</td>
                      
                      {/* Comments */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c[`${prefix}comments`])}</td>
                      
                      {/* Shares */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c[`${prefix}shares`])}</td>
                      
                      {/* Saves */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c[`${prefix}saves`])}</td>
                      
                      {/* Watch Time */}
                      <td className="p-4 text-right text-gray-300">{c[`${prefix}watch_time`]}s</td>
                      
                      {/* Interaction Rate */}
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          c[`${prefix}interaction_rate`] >= 10 ? 'text-green-400' :
                          c[`${prefix}interaction_rate`] >= 5 ? 'text-yellow-400' : 'text-orange-400'
                        }`}>
                          {formatPercent(c[`${prefix}interaction_rate`])}
                        </span>
                      </td>
                      
                      {/* Rating */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-medium">{(c.avg_rating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      
                      {/* DOT% */}
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          c.dot_percent >= 90 ? 'text-green-400' :
                          c.dot_percent >= 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {formatPercent(c.dot_percent)}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedCreator(c)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-sm flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-4 h-4" />
                          Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span><strong className="text-[#d4a968]">T. Rep.</strong> = Tiempo de reproducción</span>
        <span><strong className="text-[#d4a968]">Tasa Int.</strong> = Interacciones / Alcance</span>
        <span><strong className="text-[#d4a968]">DOT%</strong> = Delivery On Time (entregas a tiempo)</span>
      </div>
    </div>
  );
};

// Creator Detail View Component
const CreatorDetailView = ({ 
  creator, detail, loading, platformFilter, setPlatformFilter, onBack, 
  formatNumber, formatPercent, levelConfig 
}) => {
  const level = levelConfig[creator.level] || levelConfig.rookie;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
            <span className="text-purple-400 font-bold text-xl">
              {creator.name?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-light text-white">{creator.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs ${level.bg} ${level.text}`}>
                {level.icon} {level.label}
              </span>
              {creator.instagram_handle && (
                <a href={`https://instagram.com/${creator.instagram_handle.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 text-sm flex items-center gap-1">
                  <Instagram className="w-4 h-4" /> {creator.instagram_handle}
                </a>
              )}
              {creator.tiktok_handle && (
                <a href={`https://tiktok.com/@${creator.tiktok_handle.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1">
                  <Music2 className="w-4 h-4" /> {creator.tiktok_handle}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm">Filtrar por plataforma:</span>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
        >
          <option value="all">📱 Todas las plataformas</option>
          <option value="instagram">📸 Instagram</option>
          <option value="tiktok">🎵 TikTok</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
        </div>
      ) : detail ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Totals */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-[#d4a968] font-medium mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5" /> Totales Acumulados
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Views</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.totals?.views)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Alcance</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.totals?.reach)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Interacciones</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.totals?.interactions)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Likes</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.totals?.likes)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Comentarios</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.totals?.comments)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Guardados</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.totals?.saves)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">T. Reproducción</p>
                  <p className="text-gray-300 text-lg">{detail.totals?.watch_time}s</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Tasa Interacción</p>
                  <p className="text-green-400 text-lg font-medium">{formatPercent(detail.totals?.interaction_rate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Campañas</p>
                  <p className="text-[#d4a968] text-lg font-bold">{detail.campaigns_count}</p>
                </div>
              </div>
            </div>

            {/* Averages */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-[#d4a968] font-medium mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" /> Promedios por Campaña
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Views</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.averages?.views)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Alcance</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.averages?.reach)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Interacciones</p>
                  <p className="text-white text-xl font-light">{formatNumber(detail.averages?.interactions)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Likes</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.averages?.likes)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Comentarios</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.averages?.comments)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Guardados</p>
                  <p className="text-gray-300 text-lg">{formatNumber(detail.averages?.saves)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">T. Reproducción</p>
                  <p className="text-gray-300 text-lg">{detail.averages?.watch_time}s</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Tasa Interacción</p>
                  <p className="text-green-400 text-lg font-medium">{formatPercent(detail.averages?.interaction_rate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Métricas</p>
                  <p className="text-[#d4a968] text-lg font-bold">{detail.metrics_count}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics per Campaign Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium">Métricas por Campaña</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Campaña</th>
                    <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Marca</th>
                    <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Plataforma</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Alcance</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Likes</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Comentarios</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Guardados</th>
                    <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Int.</th>
                    <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Post</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.metrics?.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-500">
                        No hay métricas registradas
                      </td>
                    </tr>
                  ) : (
                    detail.metrics?.map((m, idx) => (
                      <tr key={m.metric_id || idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-white">{m.campaign_title}</td>
                        <td className="p-4 text-gray-400">{m.brand_name}</td>
                        <td className="p-4 text-center">
                          {m.platform === 'instagram' ? (
                            <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs">
                              <Instagram className="w-3 h-3 inline mr-1" /> IG
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                              <Music2 className="w-3 h-3 inline mr-1" /> TT
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right text-white">{formatNumber(m.views)}</td>
                        <td className="p-4 text-right text-gray-300">{formatNumber(m.reach)}</td>
                        <td className="p-4 text-right text-gray-300">{formatNumber(m.likes)}</td>
                        <td className="p-4 text-right text-gray-300">{formatNumber(m.comments)}</td>
                        <td className="p-4 text-right text-gray-300">{formatNumber(m.saves)}</td>
                        <td className="p-4 text-right">
                          <span className={`font-bold ${
                            m.interaction_rate >= 10 ? 'text-green-400' :
                            m.interaction_rate >= 5 ? 'text-yellow-400' : 'text-orange-400'
                          }`}>
                            {formatPercent(m.interaction_rate)}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {m.post_url ? (
                            <a href={m.post_url} target="_blank" rel="noopener noreferrer"
                              className="text-[#d4a968] hover:text-[#c49858]">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          No se pudieron cargar los datos
        </div>
      )}
    </div>
  );
};

export default AdminCreatorsReport;
