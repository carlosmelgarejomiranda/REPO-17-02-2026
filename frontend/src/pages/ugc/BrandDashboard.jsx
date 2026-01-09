import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Package, Users, FileCheck, BarChart3, Plus,
  ArrowRight, Clock, CheckCircle, AlertCircle, Loader2,
  Eye, TrendingUp, Globe
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

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
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ugc/brands/me/dashboard`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  const stats = dashboard?.stats || {};
  const activePackage = dashboard?.active_package;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </a>
          <div className="flex items-center gap-4">
            <Link to="/ugc/brand/campaigns" className="text-gray-400 hover:text-white transition-colors">
              Mis Campañas
            </Link>
            <Link to="/ugc/brand/profile" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <Building2 className="w-5 h-5" />
              {dashboard?.profile?.company_name}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-light mb-2">
              Hola, <span className="text-[#d4a968] italic">{dashboard?.profile?.contact_name || user?.name}</span>
            </h1>
            <p className="text-gray-400">Panel de control de {dashboard?.profile?.company_name}</p>
          </div>
          <Link
            to="/ugc/brand/campaigns/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-all"
          >
            <Plus className="w-5 h-5" />
            Nueva Campaña
          </Link>
        </div>

        {/* Package Alert */}
        {!activePackage && (
          <div className="mb-8 p-6 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-[#d4a968]" />
              <div>
                <p className="font-medium">No tenés un paquete activo</p>
                <p className="text-sm text-gray-400">Necesitás un paquete para crear campañas</p>
              </div>
            </div>
            <Link
              to="/ugc/brand/packages"
              className="px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958]"
            >
              Ver Paquetes
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-10">
          {/* Package Card */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-[#d4a968]/20 flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-[#d4a968]" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Entregas Disponibles</p>
            <p className="text-3xl font-medium">{stats.deliveries_remaining || 0}</p>
            {activePackage && (
              <p className="text-xs text-gray-500 mt-1">Paquete {activePackage.type}</p>
            )}
          </div>

          {/* Active Campaigns */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Campañas Activas</p>
            <p className="text-3xl font-medium">{stats.active_campaigns || 0}</p>
            <p className="text-xs text-gray-500 mt-1">de {stats.total_campaigns || 0} total</p>
          </div>

          {/* Pending Reviews */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Por Revisar</p>
            <p className="text-3xl font-medium">{stats.pending_reviews || 0}</p>
            <p className="text-xs text-gray-500 mt-1">entregas pendientes</p>
          </div>

          {/* Quick Action */}
          <Link
            to="/ugc/brand/deliverables"
            className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Revisar Entregas</p>
            <p className="text-lg font-medium group-hover:text-[#d4a968] transition-colors flex items-center gap-2">
              Ver todas <ArrowRight className="w-4 h-4" />
            </p>
          </Link>
        </div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium">Aplicaciones Recientes</h2>
              <Link to="/ugc/brand/campaigns" className="text-[#d4a968] text-sm hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {dashboard?.recent_applications?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recent_applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#d4a968]" />
                        </div>
                        <div>
                          <p className="font-medium">@{app.creator_username}</p>
                          <p className="text-sm text-gray-500">{app.creator_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#d4a968]">
                          {app.creator_followers?.toLocaleString() || 0} seg.
                        </p>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span className="text-xs">★</span>
                          <span className="text-xs">{app.creator_rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white/5 border border-white/10 rounded-xl text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay aplicaciones recientes</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-medium mb-6">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Link
                to="/ugc/brand/campaigns/new"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[#d4a968]" />
                  </div>
                  <span>Crear nueva campaña</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968]" />
              </Link>

              <Link
                to="/ugc/brand/deliverables"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-purple-500" />
                  </div>
                  <span>Revisar entregas</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968]" />
              </Link>

              <Link
                to="/ugc/brand/reports"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-500" />
                  </div>
                  <span>Ver reportes</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968]" />
              </Link>

              <Link
                to="/ugc/brand/packages"
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-green-500" />
                  </div>
                  <span>{activePackage ? 'Ver mi paquete' : 'Comprar paquete'}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDashboard;
