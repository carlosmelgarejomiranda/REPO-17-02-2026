import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Users, BarChart3, Loader2, AlertCircle, TrendingUp, Calendar
} from 'lucide-react';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const BrandCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/campaigns/me/all`, { 
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Borrador' },
      live: { color: 'bg-green-500/20 text-green-400', label: 'Activa' },
      closed: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Cerrada' },
      in_production: { color: 'bg-purple-500/20 text-purple-400', label: 'En Producción' },
      completed: { color: 'bg-blue-500/20 text-blue-400', label: 'Completada' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* UGC Navbar */}
      <UGCNavbar type="brand" />

      {/* Main Content */}
      <div className="pt-20 max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-light mb-2">
              Mis <span className="text-[#d4a968] italic">Campañas</span>
            </h1>
            <p className="text-gray-400">Accede a los reportes y métricas de tus campañas</p>
          </div>
          <Link
            to="/ugc/brand/campaigns/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors font-medium"
            data-testid="new-campaign-btn"
          >
            <Plus className="w-5 h-5" />
            Nueva Campaña
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-2xl text-center max-w-lg mx-auto">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No tenés campañas</h3>
            <p className="text-gray-400 mb-6">Creá tu primera campaña para empezar a trabajar con creadores UGC</p>
            <Link
              to="/ugc/brand/campaigns/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] font-medium"
            >
              <Plus className="w-5 h-5" /> Crear Campaña
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <Link
                key={campaign.id}
                to={`/ugc/brand/campaigns/${campaign.id}/reports`}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-[#d4a968]/50 hover:bg-white/[0.07] transition-all"
                data-testid={`campaign-card-${campaign.id}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-lg mb-1 truncate group-hover:text-[#d4a968] transition-colors">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-500">{campaign.category} • {campaign.city}</p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Creadores
                    </span>
                    <span className="text-white font-medium">
                      {campaign.slots_filled || 0} / {campaign.slots}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Aplicaciones
                    </span>
                    <span className="text-white font-medium">
                      {campaign.applications_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Creada
                    </span>
                    <span className="text-gray-300 text-xs">
                      {formatDate(campaign.created_at)}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-[#d4a968]/10 text-[#d4a968] text-sm font-medium group-hover:bg-[#d4a968]/20 transition-colors">
                    <BarChart3 className="w-4 h-4" />
                    Ver Reportes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandCampaigns;
