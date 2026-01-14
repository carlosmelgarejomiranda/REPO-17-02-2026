import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Briefcase, FileCheck, TrendingUp, DollarSign,
  Clock, CheckCircle, Star, Eye, Heart, BarChart3, Loader2,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_URL = getApiUrl();

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
};

const StatCard = ({ icon: Icon, label, value, subValue, color = 'text-[#d4a968]', trend }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-')}/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-2xl font-light text-white">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {subValue && <p className="text-xs text-gray-600 mt-1">{subValue}</p>}
    </div>
  </div>
);

const AdminStatsDashboard = ({ dashboardData }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchDetailedStats();
  }, [period]);

  const fetchDetailedStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_URL}/api/ugc/admin/stats?period=${period}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  // Use dashboardData as fallback if stats endpoint doesn't exist yet
  const data = stats || dashboardData || {};

  return (
    <div className="space-y-6" data-testid="admin-stats-dashboard">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Estadísticas de la Plataforma</h3>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="all">Todo el tiempo</option>
          </select>
          <button
            onClick={fetchDetailedStats}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Creators Totales"
          value={data.users?.total_creators || 0}
          subValue={`${data.users?.active_creators || 0} activos`}
          color="text-purple-400"
        />
        <StatCard
          icon={Building2}
          label="Marcas Totales"
          value={data.users?.total_brands || 0}
          subValue={`${data.users?.active_brands || 0} activas`}
          color="text-blue-400"
        />
        <StatCard
          icon={Briefcase}
          label="Campañas Totales"
          value={data.campaigns?.total || 0}
          subValue={`${data.campaigns?.live || 0} activas`}
          color="text-green-400"
        />
        <StatCard
          icon={FileCheck}
          label="Entregas Totales"
          value={data.deliverables?.total || 0}
          subValue={`${data.deliverables?.completed || 0} completadas`}
          color="text-cyan-400"
        />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={Eye}
          label="Views Totales"
          value={formatNumber(data.metrics?.total_views || 0)}
          color="text-purple-400"
        />
        <StatCard
          icon={Heart}
          label="Likes Totales"
          value={formatNumber(data.metrics?.total_likes || 0)}
          color="text-pink-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Engagement Prom."
          value={`${(data.metrics?.avg_engagement || 0).toFixed(1)}%`}
          color="text-green-400"
        />
        <StatCard
          icon={Star}
          label="Rating Promedio"
          value={(data.metrics?.avg_rating || 0).toFixed(1)}
          color="text-yellow-400"
        />
        <StatCard
          icon={Clock}
          label="Tasa Puntualidad"
          value={`${data.metrics?.on_time_rate || 0}%`}
          color="text-blue-400"
        />
      </div>

      {/* Application & Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications Summary */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#d4a968]" />
            Resumen de Aplicaciones
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total aplicaciones</span>
              <span className="text-white font-medium">{data.applications?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pendientes</span>
              <span className="text-yellow-400 font-medium">{data.applications?.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Confirmadas</span>
              <span className="text-green-400 font-medium">{data.applications?.confirmed || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Tasa de conversión</span>
              <span className="text-[#d4a968] font-medium">
                {data.applications?.total > 0 
                  ? ((data.applications?.confirmed / data.applications?.total) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#d4a968]" />
            Resumen de Ingresos
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ingresos del mes</span>
              <span className="text-white font-medium">{formatPrice(data.revenue?.monthly || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ingresos totales</span>
              <span className="text-[#d4a968] font-medium">{formatPrice(data.revenue?.total || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Paquetes vendidos</span>
              <span className="text-white font-medium">{data.revenue?.packages_sold || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Valor prom. por paquete</span>
              <span className="text-white font-medium">
                {formatPrice(data.revenue?.packages_sold > 0 
                  ? (data.revenue?.total || 0) / data.revenue.packages_sold 
                  : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables Breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#d4a968]" />
          Desglose de Entregas
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
            <p className="text-xl font-light text-yellow-400">{data.deliverables?.pending_review || 0}</p>
            <p className="text-xs text-gray-400">Por Revisar</p>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <p className="text-xl font-light text-blue-400">{data.deliverables?.submitted || 0}</p>
            <p className="text-xs text-gray-400">Enviadas</p>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <p className="text-xl font-light text-green-400">{data.deliverables?.approved || 0}</p>
            <p className="text-xs text-gray-400">Aprobadas</p>
          </div>
          <div className="text-center p-3 bg-orange-500/10 rounded-lg">
            <p className="text-xl font-light text-orange-400">{data.deliverables?.changes_requested || 0}</p>
            <p className="text-xs text-gray-400">Cambios</p>
          </div>
          <div className="text-center p-3 bg-purple-500/10 rounded-lg">
            <p className="text-xl font-light text-purple-400">{data.deliverables?.completed || 0}</p>
            <p className="text-xs text-gray-400">Completadas</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <p className="text-xl font-light text-red-400">{data.deliverables?.rejected || 0}</p>
            <p className="text-xs text-gray-400">Rechazadas</p>
          </div>
        </div>
      </div>

      {/* Creators by Level */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#d4a968]" />
          Creators por Nivel
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-500/10 border border-gray-500/30 rounded-lg">
            <p className="text-2xl font-light text-gray-400">{data.creators_by_level?.rookie || 0}</p>
            <p className="text-xs text-gray-500">🌱 Rookie</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-2xl font-light text-blue-400">{data.creators_by_level?.trusted || 0}</p>
            <p className="text-xs text-gray-500">✅ Trusted</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-2xl font-light text-purple-400">{data.creators_by_level?.pro || 0}</p>
            <p className="text-xs text-gray-500">💼 Pro</p>
          </div>
          <div className="text-center p-4 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-lg">
            <p className="text-2xl font-light text-[#d4a968]">{data.creators_by_level?.elite || 0}</p>
            <p className="text-xs text-gray-500">👑 Elite</p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {data.top_creators && data.top_creators.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#d4a968]" />
            Top Creators del Periodo
          </h4>
          <div className="space-y-3">
            {data.top_creators.slice(0, 5).map((creator, idx) => (
              <div key={creator.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-[#d4a968] font-bold">#{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 text-sm">{creator.name?.charAt(0) || 'C'}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{creator.name}</p>
                    <p className="text-gray-500 text-xs">{creator.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-yellow-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400" /> {creator.avg_rating?.toFixed(1) || '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">{creator.total_deliveries || 0} entregas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatsDashboard;
