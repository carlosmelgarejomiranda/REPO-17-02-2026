import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, BarChart3, Loader2, AlertCircle, Building2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

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
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/ugc/brand/packages" className="text-gray-400 hover:text-white transition-colors">
              Mi Paquete
            </Link>
            <div className="flex items-center gap-2 text-gray-400">
              <Building2 className="w-5 h-5" />
              {profile?.company_name}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-light mb-2">
            Mis <span className="text-[#d4a968] italic">Campañas</span>
          </h1>
          <p className="text-gray-400">Accede a los reportes y métricas de tus campañas</p>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
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
                <div className="space-y-2.5 mb-5">
                  {/* Aplicaciones */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Aplicaciones</span>
                    <span className="text-white font-medium">
                      {campaign.applications_count || 0}
                    </span>
                  </div>
                  
                  {/* Confirmados */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Confirmados</span>
                    <span className="text-white font-medium">
                      {campaign.confirmed_count || 0} / {campaign.total_deliverables || campaign.slots || 0}
                    </span>
                  </div>
                  
                  {/* Posteos */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Posteos</span>
                    <span className="text-white font-medium">
                      {campaign.posteos_count || 0} / {campaign.total_deliverables || campaign.slots || 0}
                    </span>
                  </div>
                  
                  {/* Métricas */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Métricas</span>
                    <span className="text-[#d4a968] font-medium">
                      {campaign.metrics_count || 0} / {campaign.total_deliverables || campaign.slots || 0}
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

export default BrandDashboard;
