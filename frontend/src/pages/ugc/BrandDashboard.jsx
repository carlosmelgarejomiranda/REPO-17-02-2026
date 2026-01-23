import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Loader2, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UGCNavbar } from '../../components/UGCNavbar';

const API_URL = getApiUrl();

const BrandDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/brands/me/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  const campaigns = dashboard?.campaigns || [];
  const profile = dashboard?.profile;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* UGC Navbar */}
      <UGCNavbar type="brand" />

      {/* Main Content - with top padding for fixed navbar */}
      <div className="pt-20 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header - Mobile optimized */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-light mb-1">
            Mis <span className="text-[#d4a968] italic">Campañas</span>
          </h1>
          <p className="text-sm text-gray-400">Reportes y métricas de tus campañas</p>
        </div>

        {/* Campaigns Grid - Mobile optimized */}
        {campaigns.length === 0 ? (
          <div className="p-8 sm:p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium mb-2">No tenés campañas activas</h3>
            <p className="text-sm text-gray-400">Contactá con Avenue para activar tu primera campaña</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {campaigns.map(campaign => (
              <Link
                key={campaign.id}
                to={`/ugc/brand/campaigns/${campaign.id}/reports`}
                className="block p-4 sm:p-5 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/30 hover:bg-white/[0.07] active:scale-[0.99] transition-all"
                data-testid={`campaign-card-${campaign.id}`}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white text-base sm:text-lg leading-tight line-clamp-2">
                      {campaign.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{campaign.category} • {campaign.city}</p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Stats - Mobile optimized grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-2.5 bg-white/5 rounded-lg">
                    <p className="text-lg sm:text-xl font-semibold text-white">{campaign.applications_count || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Aplicaciones</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-lg">
                    <p className="text-lg sm:text-xl font-semibold text-white">
                      {campaign.confirmed_count || 0}<span className="text-gray-500 text-sm">/{campaign.slots || 0}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Confirmados</p>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-lg">
                    <p className="text-lg sm:text-xl font-semibold text-white">
                      {campaign.posteos_count || 0}<span className="text-gray-500 text-sm">/{campaign.slots || 0}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Posteos</p>
                  </div>
                  <div className="p-2.5 bg-[#d4a968]/10 rounded-lg">
                    <p className="text-lg sm:text-xl font-semibold text-[#d4a968]">
                      {campaign.metrics_count || 0}<span className="text-[#d4a968]/50 text-sm">/{campaign.slots || 0}</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#d4a968]/70">Métricas</p>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#d4a968]/10 text-[#d4a968] text-sm font-medium hover:bg-[#d4a968]/20 transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Ver Reportes
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;
