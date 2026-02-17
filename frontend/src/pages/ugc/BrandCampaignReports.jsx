import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, BarChart3, Users, Globe, Filter, Calendar, Instagram, 
  Music2, Eye, Heart, MessageCircle, Share2, Bookmark, Clock, 
  TrendingUp, Star, Loader2, ChevronDown, Award, AlertCircle,
  CheckCircle, XCircle, FileCheck, ClipboardList, ExternalLink,
  MapPin, User, Percent
} from 'lucide-react';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

// Helper: obtener URL del post (fallback a instagram_url o tiktok_url)
const getPostUrl = (item) => {
  return item?.post_url || item?.instagram_url || item?.tiktok_url || null;
};

const BrandCampaignReports = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('metricas');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [metrics, setMetrics] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [demographics, setDemographics] = useState(null);

  useEffect(() => {
    fetchCampaign();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    if (campaign) {
      if (activeReport === 'metricas') fetchMetrics();
      if (activeReport === 'postulantes') fetchApplicants();
      if (activeReport === 'demografia') fetchDemographics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, activeReport, platformFilter, monthFilter]);

  const fetchCampaign = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/campaigns/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      let url = `${API_URL}/api/ugc/metrics/campaign/${campaignId}/detailed`;
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (monthFilter !== 'all') params.append('month', monthFilter);
      if (params.toString()) url += `?${params}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplicants = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      let url = `${API_URL}/api/ugc/campaigns/${campaignId}/applicants-report`;
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (monthFilter !== 'all') params.append('month', monthFilter);
      if (params.toString()) url += `?${params}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDemographics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      let url = `${API_URL}/api/ugc/metrics/campaign/${campaignId}/demographics`;
      const params = new URLSearchParams();
      if (platformFilter !== 'all') params.append('platform', platformFilter);
      if (monthFilter !== 'all') params.append('month', monthFilter);
      if (params.toString()) url += `?${params}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDemographics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '-';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatPercent = (num) => {
    if (!num && num !== 0) return '-';
    return num.toFixed(1) + '%';
  };

  const formatDays = (num) => {
    if (!num && num !== 0) return '-';
    return num.toFixed(1) + ' días';
  };

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('es-PY', { month: 'long', year: 'numeric' })
      });
    }
    return months;
  };

  const metricsTotals = metrics.reduce((acc, m) => ({
    views: acc.views + (m.views || 0),
    reach: acc.reach + (m.reach || 0),
    likes: acc.likes + (m.likes || 0),
    comments: acc.comments + (m.comments || 0),
    shares: acc.shares + (m.shares || 0),
    saves: acc.saves + (m.saves || 0),
    watch_time: acc.watch_time + (m.watch_time || 0)
  }), { views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, watch_time: 0 });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <UGCNavbar type="brand" />

      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        {/* Campaign Title */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light mb-2">{campaign?.name}</h1>
            <p className="text-gray-400">{campaign?.category} • {campaign?.city}</p>
          </div>
          <div className="flex gap-3">
            <Link
              to={`/ugc/brand/deliverables/${campaignId}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              Entregas
            </Link>
            <Link
              to={`/ugc/brand/campaigns/${campaignId}/applications`}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Ver Aplicaciones
            </Link>
          </div>
        </div>

        {/* Report Type Buttons */}
        <div className="flex gap-3 mb-6">
          {[
            { id: 'metricas', label: 'Métricas', icon: BarChart3 },
            { id: 'demografia', label: 'Demografía', icon: Globe },
            { id: 'postulantes', label: 'Postulantes', icon: Users }
          ].map(report => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                activeReport === report.id
                  ? 'bg-[#d4a968] text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <report.icon className="w-5 h-5" />
              {report.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="relative">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none cursor-pointer"
            >
              <option value="all">TikTok + Instagram</option>
              <option value="instagram">Solo Instagram</option>
              <option value="tiktok">Solo TikTok</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none cursor-pointer"
            >
              <option value="all">Histórico Total</option>
              {getMonthOptions().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Report Content */}
        {activeReport === 'metricas' && (
          <MetricsReport metrics={metrics} totals={metricsTotals} formatNumber={formatNumber} formatPercent={formatPercent} />
        )}

        {activeReport === 'demografia' && (
          <DemographicsReport demographics={demographics} />
        )}

        {activeReport === 'postulantes' && (
          <ApplicantsReport applicants={applicants} formatNumber={formatNumber} formatPercent={formatPercent} formatDays={formatDays} />
        )}
      </div>
    </div>
  );
};

// Metrics Report Component
const MetricsReport = ({ metrics, totals, formatNumber, formatPercent }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl">
          <Eye className="w-6 h-6 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatNumber(totals.views)}</p>
          <p className="text-xs text-gray-400">Visualizaciones</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl">
          <Users className="w-6 h-6 text-blue-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatNumber(totals.reach)}</p>
          <p className="text-xs text-gray-400">Alcance</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-xl">
          <Heart className="w-6 h-6 text-pink-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatNumber(totals.likes)}</p>
          <p className="text-xs text-gray-400">Likes</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl">
          <Share2 className="w-6 h-6 text-green-400 mb-2" />
          <p className="text-2xl font-bold text-white">{formatNumber(totals.shares)}</p>
          <p className="text-xs text-gray-400">Compartidos</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-[#d4a968]/20 to-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl">
          <Clock className="w-6 h-6 text-[#d4a968] mb-2" />
          <p className="text-2xl font-bold text-white">{formatNumber(totals.watch_time)}s</p>
          <p className="text-xs text-gray-400">Tiempo Reproducción</p>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Métricas de Contenido</h3>
          <p className="text-sm text-gray-400">Métricas de los contenidos subidos por los creadores</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creador</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Plataforma</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Alcance</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Likes</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Comentarios</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Compartidos</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Guardados</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Interacción</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Posteo</th>
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No hay métricas para mostrar
                  </td>
                </tr>
              ) : (
                metrics.map((m, idx) => {
                  const totalInteractions = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
                  const interactionRate = m.reach > 0 ? (totalInteractions / m.reach) * 100 : 0;
                  
                  return (
                    <tr key={m.id || idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-sm font-medium">
                              {m.creator?.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <p className="text-white font-medium">{m.creator?.name || 'Creator'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {m.platform === 'tiktok' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black border border-white/20 rounded-full">
                            <Music2 className="w-4 h-4 text-white" />
                            <span className="text-xs font-medium text-white">TikTok</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full">
                            <Instagram className="w-4 h-4 text-white" />
                            <span className="text-xs font-medium text-white">Instagram</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right text-white font-medium">{formatNumber(m.views)}</td>
                      <td className="p-4 text-right text-gray-300">{formatNumber(m.reach)}</td>
                      <td className="p-4 text-right text-pink-400">{formatNumber(m.likes)}</td>
                      <td className="p-4 text-right text-blue-400">{formatNumber(m.comments)}</td>
                      <td className="p-4 text-right text-green-400">{formatNumber((m.shares || 0) + (m.reposts || 0))}</td>
                      <td className="p-4 text-right text-yellow-400">{formatNumber(m.saves)}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          interactionRate >= 10 ? 'text-green-400' :
                          interactionRate >= 5 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {interactionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {m.post_url ? (
                          <a
                            href={m.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#d4a968]/20 text-[#d4a968] rounded-lg hover:bg-[#d4a968]/30 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-xs font-medium">Ver</span>
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==================== PROFESSIONAL DEMOGRAPHICS CHARTS ====================

// Animated Circular Progress Component
const CircularProgress = ({ value, size = 120, strokeWidth = 10, color, label, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon className="w-5 h-5 mb-1" style={{ color }} />}
          <span className="text-2xl font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="mt-3 text-sm text-gray-400">{label}</span>
    </div>
  );
};

// Horizontal Bar Chart Component
const HorizontalBarChart = ({ data, maxValue, colorGradient }) => {
  return (
    <div className="space-y-4">
      {data.map((item, idx) => {
        const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={idx} className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">{item.label}</span>
              <span className="text-sm font-bold text-white">{item.value}%</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${colorGradient}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Donut Chart Component
const DonutChart = ({ data, size = 200 }) => {
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  let cumulativePercent = 0;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, idx) => {
          const offset = circumference - (item.value / 100) * circumference;
          const rotation = (cumulativePercent / 100) * 360;
          cumulativePercent += item.value;
          
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${(item.value / 100) * circumference} ${circumference}`}
              strokeLinecap="round"
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
              className="transition-all duration-1000 ease-out"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Percent className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500">Distribución</span>
        </div>
      </div>
    </div>
  );
};

// Demographics Report Component with Pro Charts
const DemographicsReport = ({ demographics }) => {
  if (!demographics) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  const hasDataFlag = demographics.has_data === true;
  const hasGenderData = demographics.gender && (demographics.gender.male > 0 || demographics.gender.female > 0 || demographics.gender.other > 0);
  const hasAgeData = demographics.age_ranges && demographics.age_ranges.length > 0 && demographics.age_ranges.some(a => a.percent > 0);
  const hasCountryData = demographics.countries && demographics.countries.length > 0 && demographics.countries.some(c => c.percent > 0);
  const hasAnyData = hasDataFlag || hasGenderData || hasAgeData || hasCountryData;

  if (!hasAnyData) {
    return (
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <Users className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-xl text-white mb-2">Sin datos demográficos</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Los datos demográficos aparecerán cuando los creadores suban sus métricas con capturas de audiencia.
        </p>
      </div>
    );
  }

  const genderData = demographics.gender || { male: 0, female: 0, other: 0 };
  const ageData = demographics.age_ranges || [];
  const countryData = demographics.countries || [];

  // Prepare gender donut data
  const genderDonutData = [
    { value: genderData.female || 0, color: '#ec4899', label: 'Femenino' },
    { value: genderData.male || 0, color: '#3b82f6', label: 'Masculino' },
    { value: genderData.other || 0, color: '#8b5cf6', label: 'Otro' }
  ].filter(d => d.value > 0);

  // Prepare age bar data
  const ageBarData = ageData.map(a => ({
    label: a.range,
    value: a.percent || 0
  }));
  const maxAge = Math.max(...ageBarData.map(a => a.value), 1);

  // Country colors
  const countryColors = ['#d4a968', '#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-8">
      {/* Gender Distribution - Pro Design */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-blue-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Distribución por Género</h3>
            <p className="text-sm text-gray-500">Audiencia alcanzada por género</p>
          </div>
        </div>
        
        <div className="flex items-center justify-around">
          {/* Donut Chart */}
          <DonutChart data={genderDonutData} size={180} />
          
          {/* Circular Progress for each gender */}
          <div className="flex gap-8">
            <CircularProgress 
              value={genderData.female || 0} 
              color="#ec4899" 
              label="Femenino"
              size={100}
              strokeWidth={8}
            />
            <CircularProgress 
              value={genderData.male || 0} 
              color="#3b82f6" 
              label="Masculino"
              size={100}
              strokeWidth={8}
            />
            {genderData.other > 0 && (
              <CircularProgress 
                value={genderData.other} 
                color="#8b5cf6" 
                label="Otro"
                size={100}
                strokeWidth={8}
              />
            )}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-white/5">
          {genderDonutData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm font-bold text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Age Distribution - Pro Design */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a968]/20 to-orange-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#d4a968]" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Distribución por Edad</h3>
            <p className="text-sm text-gray-500">Rangos etarios de la audiencia</p>
          </div>
        </div>
        
        <div className="max-w-2xl">
          <HorizontalBarChart 
            data={ageBarData} 
            maxValue={maxAge}
            colorGradient="bg-gradient-to-r from-[#d4a968] to-[#e8c078]"
          />
        </div>
      </div>

      {/* Country Distribution - Pro Design */}
      {countryData.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Distribución Geográfica</h3>
              <p className="text-sm text-gray-500">Top países de la audiencia</p>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-6">
            {countryData.slice(0, 5).map((item, idx) => (
              <div key={idx} className="text-center group">
                <CircularProgress 
                  value={item.percent || 0}
                  size={100}
                  strokeWidth={8}
                  color={countryColors[idx]}
                  label={item.country}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Applicants Report Component
const ApplicantsReport = ({ applicants, formatNumber, formatPercent, formatDays }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Reporte de Postulantes</h3>
          <p className="text-sm text-gray-400">Métricas promedio de los creadores que han participado</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Nombre del Creador</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Alcance Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Interacción Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">T. Rep. Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Int. Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Tasa Ret. Prom.</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Calificación</th>
                <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Nivel</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">DOT%</th>
                <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Retraso Prom.</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No hay postulantes para mostrar
                  </td>
                </tr>
              ) : (
                applicants.map((a, idx) => {
                  const levelConfig = {
                    rookie: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Rookie' },
                    trusted: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Trusted' },
                    pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Pro' },
                    elite: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Elite' }
                  };
                  const level = levelConfig[a.level] || levelConfig.rookie;
                  
                  return (
                    <tr key={a.id || idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <span className="text-purple-400 text-sm font-medium">
                              {a.name?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <span className="text-white font-medium">{a.name || 'Creator'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-white">{formatNumber(a.avg_views)}</td>
                      <td className="p-4 text-right text-gray-300">{formatNumber(a.avg_reach)}</td>
                      <td className="p-4 text-right text-gray-300">{formatNumber(a.avg_interactions)}</td>
                      <td className="p-4 text-right text-gray-300">{formatNumber(a.avg_watch_time)}s</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          a.avg_interaction_rate >= 10 ? 'text-green-400' :
                          a.avg_interaction_rate >= 5 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {formatPercent(a.avg_interaction_rate)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          a.avg_retention_rate >= 70 ? 'text-green-400' :
                          a.avg_retention_rate >= 40 ? 'text-yellow-400' :
                          'text-orange-400'
                        }`}>
                          {formatPercent(a.avg_retention_rate)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-medium">{(a.avg_rating || 0).toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs ${level.bg} ${level.text}`}>
                          {level.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${
                          a.dot_percent >= 90 ? 'text-green-400' :
                          a.dot_percent >= 70 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {formatPercent(a.dot_percent)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className={`${
                          a.avg_delay <= 0 ? 'text-green-400' :
                          a.avg_delay <= 1 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {a.avg_delay <= 0 ? 'A tiempo' : formatDays(a.avg_delay)}
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
    </div>
  );
};

export default BrandCampaignReports;
