import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Briefcase, Package, FileCheck, BarChart3, 
  TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Eye,
  Star, Award, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw,
  Filter, Search, ChevronDown, MoreVertical, ExternalLink
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Format currency
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, trend, trendUp, color = 'text-[#d4a968]' }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-lg ${color.replace('text-', 'bg-')}/20 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}%
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

// Level Badge Component
const LevelBadge = ({ level }) => {
  const config = {
    rookie: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Rookie' },
    trusted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Trusted' },
    pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Pro' },
    elite: { bg: 'bg-[#d4a968]/20', text: 'text-[#d4a968]', label: 'Elite' }
  };
  const c = config[level] || config.rookie;
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status, type = 'campaign' }) => {
  const configs = {
    campaign: {
      draft: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
      live: { bg: 'bg-green-500/20', text: 'text-green-400' },
      in_production: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      completed: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      paused: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' }
    },
    application: {
      applied: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      selected: { bg: 'bg-green-500/20', text: 'text-green-400' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400' },
      completed: { bg: 'bg-purple-500/20', text: 'text-purple-400' }
    },
    deliverable: {
      awaiting_publish: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
      submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      approved: { bg: 'bg-green-500/20', text: 'text-green-400' },
      changes_requested: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
      completed: { bg: 'bg-purple-500/20', text: 'text-purple-400' }
    }
  };
  const c = configs[type]?.[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${c.bg} ${c.text} capitalize`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
};

const UGCAdminPanel = ({ getAuthHeaders }) => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [creators, setCreators] = useState([]);
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  
  // Filters
  const [creatorFilter, setCreatorFilter] = useState({ level: '', city: '', search: '' });
  const [campaignFilter, setCampaignFilter] = useState({ status: '', search: '' });

  // Get auth headers with fallback
  const getHeaders = () => {
    if (getAuthHeaders) {
      return getAuthHeaders();
    }
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'creators') fetchCreators();
    if (activeSubTab === 'brands') fetchBrands();
    if (activeSubTab === 'campaigns') fetchCampaigns();
    if (activeSubTab === 'deliverables') fetchDeliverables();
  }, [activeSubTab]);

  const fetchDashboard = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/dashboard`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      } else if (res.status === 403) {
        setError('No tienes permisos para acceder al panel UGC');
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.detail || 'Error al cargar el dashboard');
      }
    } catch (err) {
      console.error('Error fetching UGC dashboard:', err);
      setError('Error de conexión al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      let query = new URLSearchParams();
      if (creatorFilter.level) query.append('level', creatorFilter.level);
      if (creatorFilter.city) query.append('city', creatorFilter.city);
      
      const res = await fetch(`${API_URL}/api/ugc/admin/creators?${query}`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCreators(data.creators || []);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/brands`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setBrands(data.brands || []);
      }
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      let query = new URLSearchParams();
      if (campaignFilter.status) query.append('status', campaignFilter.status);
      
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns?${query}`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const fetchDeliverables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/deliverables?status=pending_review`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data.deliverables || []);
      }
    } catch (err) {
      console.error('Error fetching deliverables:', err);
    }
  };

  const subTabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'creators', label: 'Creators', icon: Users },
    { id: 'brands', label: 'Marcas', icon: Building2 },
    { id: 'campaigns', label: 'Campañas', icon: Briefcase },
    { id: 'deliverables', label: 'Entregas', icon: FileCheck },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg mb-2">Error</p>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {subTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#d4a968] text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={Users}
              label="Creators Activos"
              value={dashboard?.users?.active_creators || 0}
              subValue={`${dashboard?.users?.total_creators || 0} total`}
              color="text-purple-400"
            />
            <StatCard 
              icon={Building2}
              label="Marcas Activas"
              value={dashboard?.users?.active_brands || 0}
              subValue={`${dashboard?.users?.total_brands || 0} total`}
              color="text-blue-400"
            />
            <StatCard 
              icon={Briefcase}
              label="Campañas Live"
              value={dashboard?.campaigns?.live || 0}
              subValue={`${dashboard?.campaigns?.in_production || 0} en producción`}
              color="text-green-400"
            />
            <StatCard 
              icon={DollarSign}
              label="Ingresos del Mes"
              value={formatPrice(dashboard?.revenue?.monthly || 0)}
              subValue={`${formatPrice(dashboard?.revenue?.total || 0)} total`}
              color="text-[#d4a968]"
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={FileCheck}
              label="Entregas Completadas"
              value={dashboard?.deliverables?.completed || 0}
              subValue={`${dashboard?.deliverables?.total || 0} total`}
              color="text-cyan-400"
            />
            <StatCard 
              icon={Clock}
              label="Pendientes Revisión"
              value={dashboard?.deliverables?.pending_review || 0}
              color="text-yellow-400"
            />
            <StatCard 
              icon={AlertCircle}
              label="Métricas por Verificar"
              value={dashboard?.pending_actions?.metrics_verification || 0}
              color="text-orange-400"
            />
            <StatCard 
              icon={Star}
              label="Aplicaciones Pendientes"
              value={dashboard?.applications?.pending || 0}
              subValue={`${dashboard?.applications?.total || 0} total`}
              color="text-pink-400"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setActiveSubTab('deliverables')}
                className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-left hover:border-yellow-500/50 transition-all"
              >
                <Clock className="w-6 h-6 text-yellow-400 mb-2" />
                <p className="text-white font-medium">Revisar Entregas</p>
                <p className="text-xs text-yellow-400 mt-1">{dashboard?.deliverables?.pending_review || 0} pendientes</p>
              </button>
              <button 
                onClick={() => setActiveSubTab('metrics')}
                className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-left hover:border-orange-500/50 transition-all"
              >
                <Eye className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-white font-medium">Verificar Métricas</p>
                <p className="text-xs text-orange-400 mt-1">{dashboard?.pending_actions?.metrics_verification || 0} por verificar</p>
              </button>
              <button 
                onClick={() => setActiveSubTab('creators')}
                className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-left hover:border-purple-500/50 transition-all"
              >
                <Users className="w-6 h-6 text-purple-400 mb-2" />
                <p className="text-white font-medium">Gestionar Creators</p>
                <p className="text-xs text-purple-400 mt-1">{dashboard?.users?.total_creators || 0} creators</p>
              </button>
              <button 
                onClick={() => setActiveSubTab('campaigns')}
                className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-left hover:border-green-500/50 transition-all"
              >
                <Briefcase className="w-6 h-6 text-green-400 mb-2" />
                <p className="text-white font-medium">Ver Campañas</p>
                <p className="text-xs text-green-400 mt-1">{dashboard?.campaigns?.total || 0} campañas</p>
              </button>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Ingresos por Paquetes</h3>
              <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
              </select>
            </div>
            <div className="h-48 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Gráfico de ingresos</p>
                <p className="text-xs text-gray-600">Datos disponibles cuando hay ventas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creators Tab */}
      {activeSubTab === 'creators' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar creator..."
                value={creatorFilter.search}
                onChange={(e) => setCreatorFilter({...creatorFilter, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none"
              />
            </div>
            <select
              value={creatorFilter.level}
              onChange={(e) => { setCreatorFilter({...creatorFilter, level: e.target.value}); fetchCreators(); }}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">Todos los niveles</option>
              <option value="rookie">Rookie</option>
              <option value="trusted">Trusted</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
            <button 
              onClick={fetchCreators}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Creators Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creator</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Nivel</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Ciudad</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Rating</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Campañas</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Registro</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {creators.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      No hay creators registrados
                    </td>
                  </tr>
                ) : (
                  creators.map((creator) => (
                    <tr key={creator.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 font-medium">
                              {creator.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{creator.name}</p>
                            <p className="text-gray-500 text-xs">{creator.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <LevelBadge level={creator.level} />
                      </td>
                      <td className="p-4 text-gray-300">{creator.city}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#d4a968]" />
                          <span className="text-white">{creator.reputation?.avg_rating?.toFixed(1) || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{creator.reputation?.total_campaigns || 0}</td>
                      <td className="p-4 text-gray-500 text-sm">{formatDate(creator.created_at)}</td>
                      <td className="p-4">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {activeSubTab === 'brands' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Marcas Registradas</h3>
            <button 
              onClick={fetchBrands}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Empresa</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Rubro</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Ciudad</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Paquete</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Créditos</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      No hay marcas registradas
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#d4a968]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{brand.company_name}</p>
                            <p className="text-gray-500 text-xs">{brand.contact_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{brand.industry}</td>
                      <td className="p-4 text-gray-300">{brand.city}</td>
                      <td className="p-4">
                        {brand.active_package ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                            {brand.active_package.type}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Sin paquete</span>
                        )}
                      </td>
                      <td className="p-4 text-white">{brand.remaining_credits || 0}</td>
                      <td className="p-4 text-gray-500 text-sm">{formatDate(brand.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              <select
                value={campaignFilter.status}
                onChange={(e) => { setCampaignFilter({...campaignFilter, status: e.target.value}); fetchCampaigns(); }}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="live">Live</option>
                <option value="in_production">En Producción</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
            <button 
              onClick={fetchCampaigns}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Campaña</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Marca</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Estado</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Slots</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Valor Canje</th>
                  <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creación</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      No hay campañas creadas
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-gray-500 text-xs">{campaign.category}</p>
                      </td>
                      <td className="p-4 text-gray-300">{campaign.brand?.company_name}</td>
                      <td className="p-4">
                        <StatusBadge status={campaign.status} type="campaign" />
                      </td>
                      <td className="p-4 text-gray-300">
                        {campaign.slots_filled || 0}/{campaign.slots}
                      </td>
                      <td className="p-4 text-white">{formatPrice(campaign.canje?.value || 0)}</td>
                      <td className="p-4 text-gray-500 text-sm">{formatDate(campaign.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deliverables Tab */}
      {activeSubTab === 'deliverables' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Entregas Pendientes de Revisión</h3>
            <button 
              onClick={fetchDeliverables}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {deliverables.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl text-white mb-2">Todo al día</h4>
              <p className="text-gray-500">No hay entregas pendientes de revisión</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {deliverables.map((del) => (
                <div key={del.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={del.status} type="deliverable" />
                        <span className="text-gray-500 text-sm">Ronda {del.revision_round}</span>
                      </div>
                      <h4 className="text-white font-medium mb-1">{del.campaign?.name}</h4>
                      <p className="text-gray-400 text-sm">Creator: {del.creator?.name}</p>
                    </div>
                    <div className="flex gap-2">
                      {del.post_url && (
                        <a 
                          href={del.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                      <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm">
                        Aprobar
                      </button>
                      <button className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 text-sm">
                        Solicitar cambios
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metrics Tab */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <TrendingUp className="w-16 h-16 text-[#d4a968] mx-auto mb-4" />
            <h4 className="text-xl text-white mb-2">Verificación de Métricas</h4>
            <p className="text-gray-500 mb-4">
              Aquí podrás verificar las métricas subidas por los creators via screenshots
            </p>
            <p className="text-xs text-gray-600">
              {dashboard?.pending_actions?.metrics_verification || 0} métricas pendientes de verificación
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UGCAdminPanel;
