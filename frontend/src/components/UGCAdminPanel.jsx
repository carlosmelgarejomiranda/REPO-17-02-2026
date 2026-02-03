import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Users, Building2, Briefcase, Package, BarChart3, 
  TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Eye,
  Star, Award, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw,
  Filter, Search, ChevronDown, MoreVertical, ExternalLink, Heart,
  Settings, Database, Shield, Download
} from 'lucide-react';
import AdminCampaignManager from './AdminCampaignManager';
import AdminStatsDashboard from './AdminStatsDashboard';
import AdminCreatorsTab from './admin/AdminCreatorsTab';
import AdminBrandsTab from './admin/AdminBrandsTab';
import AdminCampaignsTab from './admin/AdminCampaignsTab';

const API_URL = getApiUrl();

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

// Stat Card Component - kept for other parts of the panel
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

const UGCAdminPanel = ({ getAuthHeaders, initialSubTab = 'overview', onSubTabChange }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [creators, setCreators] = useState([]);
  const [creatorsTotal, setCreatorsTotal] = useState(0);
  const [creatorsPage, setCreatorsPage] = useState(0);
  const [loadingMoreCreators, setLoadingMoreCreators] = useState(false);
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  
  // Sync with parent when initialSubTab changes (only on mount or when parent forces change)
  useEffect(() => {
    setActiveSubTab(initialSubTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSubTab]);
  
  // Notify parent of sub-tab changes
  const handleSubTabChange = (newTab) => {
    setActiveSubTab(newTab);
    if (onSubTabChange) {
      onSubTabChange(newTab);
    }
  };
  
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
  }, [activeSubTab]);

  const fetchDashboard = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      console.log('Fetching UGC dashboard with token:', token ? 'present' : 'missing');
      
      const res = await fetch(`${API_URL}/api/ugc/admin/dashboard`, {
        method: 'GET',
        headers: headers
      });
      
      console.log('UGC dashboard response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('UGC dashboard data:', data);
        setDashboard(data);
      } else if (res.status === 403) {
        setError('No tienes permisos para acceder al panel UGC');
      } else if (res.status === 401) {
        setError('Sesión expirada. Por favor vuelve a iniciar sesión.');
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

  const fetchCreators = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMoreCreators(true);
      }
      
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const pageToFetch = loadMore ? creatorsPage + 1 : 0;
      const CREATORS_PER_PAGE = 100;
      
      let query = new URLSearchParams();
      query.append('skip', pageToFetch * CREATORS_PER_PAGE);
      query.append('limit', CREATORS_PER_PAGE);
      if (creatorFilter.level) query.append('level', creatorFilter.level);
      if (creatorFilter.city) query.append('city', creatorFilter.city);
      
      const res = await fetch(`${API_URL}/api/ugc/admin/creators?${query}`, {
        headers: headers
      });
      if (res.ok) {
        const data = await res.json();
        if (loadMore) {
          setCreators(prev => [...prev, ...(data.creators || [])]);
          setCreatorsPage(pageToFetch);
        } else {
          setCreators(data.creators || []);
          setCreatorsPage(0);
        }
        setCreatorsTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoadingMoreCreators(false);
    }
  };
  
  const loadMoreCreators = () => {
    fetchCreators(true);
  };

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const res = await fetch(`${API_URL}/api/ugc/admin/brands`, {
        headers: headers
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
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      let query = new URLSearchParams();
      if (campaignFilter.status) query.append('status', campaignFilter.status);
      
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns?${query}`, {
        headers: headers
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const subTabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'campaign-manager', label: 'Gestión Campañas', icon: Settings },
    { id: 'creators', label: 'Creators', icon: Users },
    { id: 'brands', label: 'Marcas', icon: Building2 },
    { id: 'campaigns', label: 'Campañas', icon: Briefcase },
    { id: 'metrics', label: 'Métricas', icon: TrendingUp },
    { id: 'system', label: 'Sistema', icon: Shield }
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
              onClick={() => handleSubTabChange(tab.id)}
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
        <AdminStatsDashboard dashboardData={dashboard} />
      )}

      {/* Campaign Manager Tab */}
      {activeSubTab === 'campaign-manager' && (
        <AdminCampaignManager getAuthHeaders={getHeaders} />
      )}

      {/* Creators Tab */}
      {activeSubTab === 'creators' && (
        <AdminCreatorsTab
          creators={creators}
          creatorsTotal={creatorsTotal}
          creatorFilter={creatorFilter}
          setCreatorFilter={setCreatorFilter}
          fetchCreators={() => fetchCreators(false)}
          loadMoreCreators={loadMoreCreators}
          loadingMoreCreators={loadingMoreCreators}
          handleVerifyCreator={async (id) => {
            try {
              const token = localStorage.getItem('auth_token');
              const res = await fetch(`${API_URL}/api/ugc/admin/creators/${id}/verify`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
              });
              if (res.ok) fetchCreators();
            } catch (err) {
              console.error(err);
            }
          }}
          handleToggleCreatorStatus={async (id, status) => {
            try {
              const token = localStorage.getItem('auth_token');
              const res = await fetch(`${API_URL}/api/ugc/admin/creators/${id}/status`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ is_active: status })
              });
              if (res.ok) fetchCreators();
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* Brands Tab */}
      {activeSubTab === 'brands' && (
        <AdminBrandsTab
          brands={brands}
          fetchBrands={fetchBrands}
        />
      )}

      {/* Campaigns Tab */}
      {activeSubTab === 'campaigns' && (
        <AdminCampaignsTab
          campaigns={campaigns}
          campaignFilter={campaignFilter}
          setCampaignFilter={setCampaignFilter}
          fetchCampaigns={fetchCampaigns}
        />
      )}

      {/* Metrics Tab */}
      {activeSubTab === 'metrics' && (
        <MetricsPanel />
      )}

      {/* System Tab */}
      {activeSubTab === 'system' && (
        <SystemPanel getAuthHeaders={getHeaders} />
      )}
    </div>
  );
};

// System Panel Component - Database backup and system utilities
const SystemPanel = ({ getAuthHeaders }) => {
  const [backupLoading, setBackupLoading] = useState(false);
  const [fullBackupLoading, setFullBackupLoading] = useState(false);
  const [collectionsCheckLoading, setCollectionsCheckLoading] = useState(false);
  const [backupResult, setBackupResult] = useState(null);
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [collectionsData, setCollectionsData] = useState(null);
  
  // Excel Export State
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collectionFields, setCollectionFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  // Backup Verification State
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [currentDbState, setCurrentDbState] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [backupFileInput, setBackupFileInput] = useState('');

  // Fetch current DB state for verification
  const fetchCurrentDbState = async () => {
    setVerifyLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/backup/verify-current`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCurrentDbState(data);
      }
    } catch (err) {
      console.error('Error fetching DB state:', err);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Verify backup against current DB
  const handleVerifyBackup = async () => {
    if (!backupFileInput) {
      alert('Ingresa los datos del backup (JSON con conteo de colecciones)');
      return;
    }
    
    setVerifyLoading(true);
    try {
      const backupData = JSON.parse(backupFileInput);
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/backup/verify-file`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: backupData })
      });
      
      if (res.ok) {
        const result = await res.json();
        setVerificationResult(result);
      }
    } catch (err) {
      console.error('Verification error:', err);
      alert('Error al verificar. Asegúrate de que el JSON sea válido.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Fetch collections list on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_URL}/api/admin/export/collections`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCollections(data.collections || []);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      }
    };
    fetchCollections();
  }, []);

  // Fetch fields when collection changes
  useEffect(() => {
    if (!selectedCollection) {
      setCollectionFields([]);
      setSelectedFields([]);
      return;
    }
    
    const fetchFields = async () => {
      setFieldsLoading(true);
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_URL}/api/admin/export/collections/${selectedCollection}/fields`, { headers });
        if (res.ok) {
          const data = await res.json();
          setCollectionFields(data.fields || []);
          setSelectedFields([]); // Reset selected fields
        }
      } catch (err) {
        console.error('Error fetching fields:', err);
      } finally {
        setFieldsLoading(false);
      }
    };
    fetchFields();
  }, [selectedCollection]);

  const handleExportExcel = async () => {
    if (!selectedCollection) return;
    
    setExportLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/export/download`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          collection: selectedCollection,
          fields: selectedFields.length > 0 ? selectedFields : []
        })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCollection}_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al exportar');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error de conexión');
    } finally {
      setExportLoading(false);
    }
  };

  const toggleField = (field) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const selectAllFields = () => {
    setSelectedFields(collectionFields);
  };

  const clearAllFields = () => {
    setSelectedFields([]);
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/trigger-backup`, {
        method: 'POST',
        headers
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setBackupResult({ success: true, message: data.message });
        setLastBackupTime(new Date().toLocaleString('es-PY'));
      } else {
        setBackupResult({ success: false, message: data.detail || 'Error al crear backup' });
      }
    } catch (err) {
      setBackupResult({ success: false, message: 'Error de conexión' });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFullBackup = async () => {
    setFullBackupLoading(true);
    setBackupResult(null);
    
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/trigger-full-backup`, {
        method: 'POST',
        headers
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setBackupResult({ success: true, message: `Full backup completado: ${data.file}` });
        setLastBackupTime(new Date().toLocaleString('es-PY'));
      } else {
        setBackupResult({ success: false, message: data.detail || 'Error al crear full backup' });
      }
    } catch (err) {
      setBackupResult({ success: false, message: 'Error de conexión' });
    } finally {
      setFullBackupLoading(false);
    }
  };

  const handleCollectionsCheck = async () => {
    setCollectionsCheckLoading(true);
    setCollectionsData(null);
    
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_URL}/api/admin/debug/collections-check`, {
        headers
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setCollectionsData(data);
      } else {
        setCollectionsData({ error: data.detail || 'Error al verificar colecciones' });
      }
    } catch (err) {
      setCollectionsData({ error: 'Error de conexión' });
    } finally {
      setCollectionsCheckLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-white">Configuración del Sistema</h2>
          <p className="text-sm text-gray-500 mt-1">Herramientas de mantenimiento y seguridad</p>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Backup de Base de Datos</h3>
            <p className="text-sm text-gray-400 mt-1">
              Crea una copia de seguridad de toda la base de datos y la sube a Cloudinary.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <Clock className="w-3 h-3 inline mr-1" />
              Backup automático: todos los días a las 3:00 AM
            </p>
            
            {lastBackupTime && (
              <p className="text-xs text-green-400 mt-1">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Último backup manual: {lastBackupTime}
              </p>
            )}

            {backupResult && (
              <div className={`mt-3 p-3 rounded-lg ${backupResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {backupResult.success ? (
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                )}
                {backupResult.message}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleBackup}
                disabled={backupLoading || fullBackupLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {backupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Backup Rápido
                  </>
                )}
              </button>
              
              <button
                onClick={handleFullBackup}
                disabled={backupLoading || fullBackupLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {fullBackupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando Full...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Full Backup (incluye vacías)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Collections Section */}
      <div className="bg-white/5 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Eye className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Debug: Verificar TODAS las Colecciones</h3>
            <p className="text-sm text-gray-400 mt-1">
              Inspecciona colecciones críticas y potencialmente vacías para verificar integridad del backup
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Colecciones inspeccionadas: ugc_ratings, ugc_notifications, page_content, notifications, 
              image_assignment_logs, ugc_audit_logs, ugc_reviews, payment_transactions, migration_backups
            </p>

            <button
              onClick={handleCollectionsCheck}
              disabled={collectionsCheckLoading}
              className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {collectionsCheckLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Consultando BD...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Ejecutar Query Completo
                </>
              )}
            </button>

            {collectionsData && (
              <div className="mt-4 space-y-4">
                {collectionsData.error ? (
                  <div className="p-3 bg-red-500/20 text-red-400 rounded-lg">
                    Error: {collectionsData.error}
                  </div>
                ) : (
                  <>
                    {/* Summary */}
                    {collectionsData.summary && (
                      <div className="bg-black/50 rounded-lg p-4 border border-amber-500/50">
                        <h4 className="text-sm font-medium text-amber-400 mb-3">📊 RESUMEN</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-white">{collectionsData.summary.total_collections}</p>
                            <p className="text-xs text-gray-400">Total Colecciones</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-400">{collectionsData.summary.collections_with_data?.length || 0}</p>
                            <p className="text-xs text-gray-400">Con Datos</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-red-400">{collectionsData.summary.empty_collections?.length || 0}</p>
                            <p className="text-xs text-gray-400">Vacías</p>
                          </div>
                        </div>
                        {collectionsData.summary.empty_collections?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-red-400">
                              ⚠️ Vacías: {collectionsData.summary.empty_collections.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inspected Collections */}
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-400 mb-3">🔍 COLECCIONES INSPECCIONADAS</h4>
                      <div className="space-y-3">
                        {Object.entries(collectionsData.inspected_collections || {}).map(([name, data]) => (
                          <div key={name} className="border border-white/10 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-white flex items-center gap-2">
                                {data.status === 'empty' ? (
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                ) : data.status === 'error' ? (
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                )}
                                {name}
                              </h5>
                              <span className={`text-xs px-2 py-1 rounded ${
                                data.status === 'empty' ? 'bg-red-500/20 text-red-400' :
                                data.status === 'error' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {data.count} registros
                              </span>
                            </div>
                            {data.error ? (
                              <p className="text-xs text-yellow-400">Error: {data.error}</p>
                            ) : data.count === 0 ? (
                              <p className="text-xs text-gray-500 italic">Colección vacía - sin documentos</p>
                            ) : (
                              <pre className="text-xs text-gray-300 overflow-auto max-h-32 bg-black/50 p-2 rounded">
                                {JSON.stringify(data.documents, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All collections count */}
                    <div className="bg-black/30 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-400 mb-3">📁 TODAS LAS COLECCIONES (Conteo)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(collectionsData.all_collections || {}).map(([name, count]) => (
                          <div key={name} className={`text-xs p-2 rounded ${count === 0 ? 'bg-red-500/10' : 'bg-white/5'}`}>
                            <span className={count === 0 ? 'text-red-400' : 'text-gray-400'}>{name}:</span>
                            <span className={`ml-1 font-medium ${count === 0 ? 'text-red-400' : 'text-white'}`}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Info Section */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[#d4a968]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Estado del Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Monitoreo de Errores</p>
                <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Sentry Activo
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Monitoreo de Uptime</p>
                <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> UptimeRobot Activo
                </p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-500">Backup Automático</p>
                <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3" /> Diario 3:00 AM
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Excel Export Section */}
      <div className="bg-white/5 border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Exportar a Excel</h3>
            <p className="text-sm text-gray-400 mt-1">
              Descarga datos de cualquier colección en formato XLSX
            </p>

            <div className="mt-4 space-y-4">
              {/* Collection Select */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Seleccionar Colección</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {collections.map(coll => (
                    <option key={coll} value={coll}>{coll}</option>
                  ))}
                </select>
              </div>

              {/* Fields Multi-select */}
              {selectedCollection && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">
                      Seleccionar Campos {selectedFields.length > 0 && `(${selectedFields.length} seleccionados)`}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllFields}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Seleccionar todos
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={clearAllFields}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  
                  {fieldsLoading ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando campos...
                    </div>
                  ) : (
                    <div className="bg-black/30 border border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {collectionFields.map(field => (
                          <label
                            key={field}
                            className={`flex items-center gap-2 text-xs p-2 rounded cursor-pointer transition-colors ${
                              selectedFields.includes(field) 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFields.includes(field)}
                              onChange={() => toggleField(field)}
                              className="w-3 h-3 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-black/50"
                            />
                            <span className="truncate">{field}</span>
                          </label>
                        ))}
                      </div>
                      {collectionFields.length === 0 && (
                        <p className="text-xs text-gray-500 italic">No hay campos en esta colección</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Si no seleccionas campos, se exportarán todos
                  </p>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={handleExportExcel}
                disabled={!selectedCollection || exportLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Verification Section */}
      <div className="bg-white/5 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Verificar Integridad de Backup</h3>
            <p className="text-sm text-gray-400 mt-1">
              Compara un backup contra el estado actual de la BD para detectar colecciones o registros faltantes
            </p>

            <div className="mt-4 space-y-4">
              {/* Step 1: Get current DB state */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Paso 1: Estado Actual de la BD</h4>
                <button
                  onClick={fetchCurrentDbState}
                  disabled={verifyLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {verifyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  Obtener Estado Actual
                </button>

                {currentDbState && (
                  <div className="mt-3 p-3 bg-black/50 rounded-lg">
                    <div className="flex gap-4 text-sm mb-2">
                      <span className="text-gray-400">Colecciones: <strong className="text-white">{currentDbState.total_collections}</strong></span>
                      <span className="text-gray-400">Documentos: <strong className="text-white">{currentDbState.total_documents?.toLocaleString()}</strong></span>
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-400 hover:text-blue-300">Ver detalle por colección</summary>
                      <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-40 text-gray-300">
                        {JSON.stringify(currentDbState.collections, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>

              {/* Step 2: Input backup data */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Paso 2: Datos del Backup a Verificar</h4>
                <p className="text-xs text-gray-500 mb-2">
                  Pega aquí el JSON con el conteo de colecciones del backup (ej: {`{"users": 381, "ugc_creators": 270, ...}`})
                </p>
                <textarea
                  value={backupFileInput}
                  onChange={(e) => setBackupFileInput(e.target.value)}
                  placeholder='{"users": 381, "ugc_creators": 270, ...}'
                  className="w-full h-32 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Step 3: Verify */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">Paso 3: Ejecutar Verificación</h4>
                <button
                  onClick={handleVerifyBackup}
                  disabled={verifyLoading || !backupFileInput}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {verifyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Verificar Backup
                </button>

                {verificationResult && (
                  <div className="mt-4">
                    {/* Summary */}
                    <div className={`p-3 rounded-lg mb-3 ${verificationResult.is_complete ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'}`}>
                      <div className="flex items-center gap-2">
                        {verificationResult.is_complete ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-medium ${verificationResult.is_complete ? 'text-green-400' : 'text-red-400'}`}>
                          {verificationResult.is_complete ? '✅ Backup COMPLETO' : '❌ Backup INCOMPLETO'}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-300">
                        <span className="mr-4">BD: {verificationResult.summary?.collections_in_db} colecciones</span>
                        <span className="mr-4">Backup: {verificationResult.summary?.collections_in_backup} colecciones</span>
                        <span>Problemas: {verificationResult.summary?.issues_count}</span>
                      </div>
                    </div>

                    {/* Issues */}
                    {verificationResult.issues?.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-red-400 mb-2">⚠️ Problemas encontrados:</h5>
                        <div className="space-y-1">
                          {verificationResult.issues.map((issue, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded ${
                              issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                              issue.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              <strong>[{issue.severity}]</strong> {issue.type}: {issue.collection}
                              {issue.db_count !== undefined && ` (BD: ${issue.db_count}, Backup: ${issue.backup_count || 0})`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing collections */}
                    {verificationResult.summary?.missing_in_backup?.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium text-red-400 mb-2">❌ Colecciones faltantes en backup:</h5>
                        <div className="flex flex-wrap gap-1">
                          {verificationResult.summary.missing_in_backup.map(coll => (
                            <span key={coll} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                              {coll}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metrics Panel Component
const MetricsPanel = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState(null);
  
  useEffect(() => {
    fetchAllMetrics();
  }, []);
  
  const fetchAllMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      // Fetch all metrics
      const res = await fetch(`${API_URL}/api/ugc/metrics/all`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || []);
        
        // Calculate stats
        const totalViews = data.metrics?.reduce((sum, m) => sum + (m.views || 0), 0) || 0;
        const totalLikes = data.metrics?.reduce((sum, m) => sum + (m.likes || 0), 0) || 0;
        const totalEngagement = data.metrics?.reduce((sum, m) => sum + (m.total_interactions || 0), 0) || 0;
        const avgEngRate = data.metrics?.length > 0 
          ? data.metrics.reduce((sum, m) => sum + (m.engagement_rate || 0), 0) / data.metrics.length 
          : 0;
        
        setCampaignStats({
          totalViews,
          totalLikes,
          totalEngagement,
          avgEngRate: avgEngRate.toFixed(2),
          count: data.metrics?.length || 0
        });
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {campaignStats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl text-center">
            <Eye className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatNumber(campaignStats.totalViews)}</p>
            <p className="text-xs text-gray-400">Total Views</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/30 rounded-xl text-center">
            <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatNumber(campaignStats.totalLikes)}</p>
            <p className="text-xs text-gray-400">Total Likes</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl text-center">
            <TrendingUp className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{formatNumber(campaignStats.totalEngagement)}</p>
            <p className="text-xs text-gray-400">Interacciones</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl text-center">
            <BarChart3 className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{campaignStats.avgEngRate}%</p>
            <p className="text-xs text-gray-400">Eng. Rate Prom.</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-[#d4a968]/20 to-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl text-center">
            <CheckCircle className="w-6 h-6 text-[#d4a968] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{campaignStats.count}</p>
            <p className="text-xs text-gray-400">Entregas c/ Métricas</p>
          </div>
        </div>
      )}
      
      {/* Metrics Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">Métricas de Entregas</h3>
          <p className="text-sm text-gray-400">Todas las métricas reportadas por creators</p>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creator</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Campaña</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Views</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Reach</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Likes</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Comments</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Shares</th>
              <th className="text-right p-4 text-[#d4a968] text-sm font-medium">Eng. Rate</th>
              <th className="text-center p-4 text-[#d4a968] text-sm font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No hay métricas registradas aún
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={metric.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 text-sm">{metric.creator?.name?.charAt(0) || 'C'}</span>
                      </div>
                      <span className="text-white">{metric.creator?.name || 'Creator'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 text-sm">{metric.campaign?.name || '-'}</td>
                  <td className="p-4 text-right text-white font-medium">{formatNumber(metric.views)}</td>
                  <td className="p-4 text-right text-gray-300">{formatNumber(metric.reach)}</td>
                  <td className="p-4 text-right text-pink-400">{formatNumber(metric.likes)}</td>
                  <td className="p-4 text-right text-blue-400">{formatNumber(metric.comments)}</td>
                  <td className="p-4 text-right text-green-400">{formatNumber(metric.shares)}</td>
                  <td className="p-4 text-right">
                    <span className={`font-bold ${
                      metric.engagement_rate >= 8 ? 'text-green-400' :
                      metric.engagement_rate >= 5 ? 'text-yellow-400' :
                      'text-orange-400'
                    }`}>
                      {metric.engagement_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {metric.manually_verified ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">Verificado</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">AI</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UGCAdminPanel;
