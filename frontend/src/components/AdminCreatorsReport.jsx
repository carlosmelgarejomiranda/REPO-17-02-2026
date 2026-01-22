import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Users, Search, Filter, Star, TrendingUp, Clock, Award,
  Instagram, Music2, Loader2, RefreshCw, Download
} from 'lucide-react';
import { Button } from './ui/button';

const API_URL = getApiUrl();

export const AdminCreatorsReport = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

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

  useEffect(() => {
    fetchCreators();
  }, [levelFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCreators();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    const headers = [
      'Nombre', 'Instagram', 'TikTok', 'Nivel', 'Campañas', 
      'Views Prom', 'Alcance Prom', 'Interacciones Prom', 'T. Rep. Prom',
      'Tasa Int.', 'Tasa Ret.', 'Calificación', 'DOT%', 'Retraso Prom'
    ];
    
    const rows = creators.map(c => [
      c.name,
      c.instagram_handle || '-',
      c.tiktok_handle || '-',
      c.level,
      c.campaigns_count,
      c.avg_views,
      c.avg_reach,
      c.avg_interactions,
      c.avg_watch_time,
      c.avg_interaction_rate,
      c.avg_retention_rate,
      c.avg_rating,
      c.dot_percent,
      c.avg_delay
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_creadores_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-white">
            Reporte de <span className="text-[#d4a968] italic">Creadores</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Métricas promedio de rendimiento de todos los creadores
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

      {/* Filters */}
      <div className="flex items-center gap-4">
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
        
        {/* Stats */}
        <div className="text-gray-400 text-sm">
          {creators.length} creadores
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creador</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Redes</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Nivel</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Campañas</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Alcance Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Interacciones</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">T. Rep. Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Int.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Ret.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Calificación</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">DOT%</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Retraso</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center">
                    <Loader2 className="w-8 h-8 mx-auto text-[#d4a968] animate-spin" />
                  </td>
                </tr>
              ) : creators.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No hay creadores para mostrar
                  </td>
                </tr>
              ) : (
                creators.map((c, idx) => {
                  const level = levelConfig[c.level] || levelConfig.rookie;
                  
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
                            <a 
                              href={`https://instagram.com/${c.instagram_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-300"
                              title={c.instagram_handle}
                            >
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {c.tiktok_handle && (
                            <a 
                              href={`https://tiktok.com/@${c.tiktok_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300"
                              title={c.tiktok_handle}
                            >
                              <Music2 className="w-4 h-4" />
                            </a>
                          )}
                          {!c.instagram_handle && !c.tiktok_handle && (
                            <span className="text-gray-600">-</span>
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
                      <td className="p-4 text-right text-white font-medium">
                        {c.campaigns_count || 0}
                      </td>
                      
                      {/* Avg Views */}
                      <td className="p-4 text-right text-white">{formatNumber(c.avg_views)}</td>
                      
                      {/* Avg Reach */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c.avg_reach)}</td>
                      
                      {/* Avg Interactions */}
                      <td className="p-4 text-right text-gray-300">{formatNumber(c.avg_interactions)}</td>
                      
                      {/* Avg Watch Time */}
                      <td className="p-4 text-right text-gray-300">{c.avg_watch_time}s</td>
                      
                      {/* Interaction Rate */}
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          c.avg_interaction_rate >= 10 ? 'text-green-400' :
                          c.avg_interaction_rate >= 5 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {formatPercent(c.avg_interaction_rate)}
                        </span>
                      </td>
                      
                      {/* Retention Rate */}
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          c.avg_retention_rate >= 70 ? 'text-green-400' :
                          c.avg_retention_rate >= 40 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {formatPercent(c.avg_retention_rate)}
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
                          c.dot_percent >= 70 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {formatPercent(c.dot_percent)}
                        </span>
                      </td>
                      
                      {/* Avg Delay */}
                      <td className="p-4 text-right">
                        <span className={`${
                          c.avg_delay <= 0 ? 'text-green-400' :
                          c.avg_delay <= 1 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {formatDays(c.avg_delay)}
                        </span>
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
        <span><strong className="text-[#d4a968]">Views Prom.</strong> = Vistas promedio por campaña</span>
        <span><strong className="text-[#d4a968]">Tasa Int.</strong> = Interacciones / Alcance</span>
        <span><strong className="text-[#d4a968]">Tasa Ret.</strong> = Tiempo reproducción / Duración video</span>
        <span><strong className="text-[#d4a968]">DOT%</strong> = Delivery On Time (entregas a tiempo)</span>
      </div>
    </div>
  );
};

export default AdminCreatorsReport;
