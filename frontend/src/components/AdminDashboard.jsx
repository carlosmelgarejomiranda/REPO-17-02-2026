import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit, Trash2, Check, X, Filter, Instagram, MessageCircle, ShoppingBag, Image, ChevronLeft, Settings, BarChart3, Mail, Palette, Shield, UserCog, AlertCircle, Phone, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { OrdersManagement } from './OrdersManagement';
import { ProductImagesManager } from './ProductImagesManager';
import { WebsiteBuilder } from './WebsiteBuilder';
import { UserRolesManager } from './UserRolesManager';
import { AdminSettings } from './AdminSettings';

// Permission helper based on role
const hasPermission = (role, permission) => {
  const permissions = {
    superadmin: ['all', 'users', 'settings', 'website', 'orders', 'reservations', 'ugc', 'images', 'analytics'],
    admin: ['settings', 'website', 'orders', 'reservations', 'ugc', 'images', 'analytics'],
    staff: ['orders', 'reservations', 'ugc', 'analytics'],
    designer: ['website', 'images'],
    user: []
  };
  return permissions[role]?.includes('all') || permissions[role]?.includes(permission);
};

export const AdminDashboard = ({ user }) => {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [ugcApplications, setUgcApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    if (user?.role === 'designer') return 'builder';
    return 'orders';
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [ugcFilterStatus, setUgcFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [userPermissions, setUserPermissions] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';
  const userRole = user?.role || 'user';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  // Fetch user permissions on load
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/permissions`, { headers: getAuthHeaders() });
        if (response.ok) {
          const data = await response.json();
          setUserPermissions(data.permissions);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
      }
    };
    fetchPermissions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterDate, filterStatus, ugcFilterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = '';
      if (filterDate) query += `?date=${filterDate}`;
      if (filterStatus) query += `${query ? '&' : '?'}status=${filterStatus}`;
      let ugcQuery = ugcFilterStatus ? `?status=${ugcFilterStatus}` : '';

      const [resResponse, usersResponse, ugcResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/reservations${query}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/ugc${ugcQuery}`, { headers: getAuthHeaders() })
      ]);

      if (resResponse.ok) setReservations(await resResponse.json());
      if (usersResponse.ok) setUsers(await usersResponse.json());
      if (ugcResponse.ok) setUgcApplications(await ugcResponse.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/test-email`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setTestEmailStatus(response.ok 
        ? { type: 'success', message: data.message }
        : { type: 'error', message: data.detail || 'Error al enviar email' }
      );
    } catch (err) {
      setTestEmailStatus({ type: 'error', message: 'Error de conexión' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error updating reservation:', err);
    }
  };

  // Confirm pending reservation (sends WhatsApp notification to client)
  const confirmReservation = async (reservationId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchData();
        alert('Reserva confirmada. Se envió notificación por WhatsApp al cliente.');
      }
    } catch (err) {
      console.error('Error confirming reservation:', err);
    }
  };

  const deleteReservation = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error deleting reservation:', err);
    }
  };

  const updateUgcStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ugc/${applicationId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error updating UGC application:', err);
    }
  };

  const deleteUgcApplication = async (applicationId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta aplicación?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/ugc/${applicationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) fetchData();
    } catch (err) {
      console.error('Error deleting UGC application:', err);
    }
  };

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    pending: reservations.filter(r => r.status === 'pending').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: reservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.price, 0),
    ugcTotal: ugcApplications.length,
    ugcPending: ugcApplications.filter(a => a.status === 'pending').length,
    ugcApproved: ugcApplications.filter(a => a.status === 'approved').length
  };

  // Tabs filtered by user role permissions
  const allTabs = [
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag, permission: 'orders' },
    { id: 'images', label: 'Imágenes', icon: Image, permission: 'images' },
    { id: 'reservations', label: 'Reservas', icon: Calendar, permission: 'reservations' },
    { id: 'ugc', label: 'UGC', icon: Instagram, permission: 'ugc' },
    { id: 'users', label: 'Usuarios', icon: Shield, permission: 'users' },
    { id: 'settings', label: 'Configuración', icon: Settings, permission: 'settings' }
  ];

  const tabs = allTabs.filter(tab => hasPermission(userRole, tab.permission));

  // Role badge colors
  const getRoleBadge = (role) => {
    const badges = {
      superadmin: 'bg-red-500/20 text-red-400 border-red-500/30',
      admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      staff: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      designer: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return badges[role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getRoleLabel = (role) => {
    const labels = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      staff: 'Staff',
      designer: 'Diseñador'
    };
    return labels[role] || 'Usuario';
  };

  // Show Website Builder
  if (showBuilder) {
    return <WebsiteBuilder onClose={() => setShowBuilder(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-gray-500 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </a>
              <div>
                <h1 className="text-2xl font-light text-white">
                  Panel de <span className="italic text-[#d4a968]">Administración</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500 text-sm">{user?.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadge(userRole)}`}>
                    {getRoleLabel(userRole)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Website Builder Button - Only for designers, admins, superadmin */}
              {hasPermission(userRole, 'website') && (
                <button
                  onClick={() => setShowBuilder(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4a968] to-[#c49958] text-black font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden md:inline">Editar Web</span>
                </button>
              )}
              
              {/* Admin-only buttons */}
              {hasPermission(userRole, 'settings') && (
                <button
                  onClick={sendTestEmail}
                  disabled={sendingTestEmail}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden md:inline">{sendingTestEmail ? 'Enviando...' : 'Test Email'}</span>
                </button>
              )}
              
              {hasPermission(userRole, 'reservations') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline">Nueva Reserva</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Test Email Status */}
        {testEmailStatus && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            testEmailStatus.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            <span>{testEmailStatus.message}</span>
            <button onClick={() => setTestEmailStatus(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Reservas', value: stats.total, color: 'text-[#d4a968]' },
            { label: 'Confirmadas', value: stats.confirmed, color: 'text-green-400' },
            { label: 'Ingresos', value: `${stats.totalRevenue.toLocaleString()} Gs`, color: 'text-[#d4a968]' },
            { label: 'UGC Total', value: stats.ugcTotal, color: 'text-[#d4a968]' },
            { label: 'UGC Pendientes', value: stats.ugcPending, color: 'text-yellow-400' },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className={`text-2xl font-light ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#d4a968] text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && <OrdersManagement />}

        {/* Images Tab */}
        {activeTab === 'images' && <ProductImagesManager />}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-light text-white">Reservas <span className="italic text-[#d4a968]">Studio</span></h2>
                <div className="flex gap-3 flex-wrap">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none"
                  >
                    <option value="" className="bg-[#1a1a1a]">Todos</option>
                    <option value="pending" className="bg-[#1a1a1a]">Solicitudes</option>
                    <option value="confirmed" className="bg-[#1a1a1a]">Confirmadas</option>
                    <option value="cancelled" className="bg-[#1a1a1a]">Canceladas</option>
                  </select>
                  <button
                    onClick={() => { setFilterDate(''); setFilterStatus(''); }}
                    className="px-4 py-2 rounded-lg text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
            
            {/* Pending Reservations Alert */}
            {stats.pending > 0 && (
              <div className="mx-6 mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-amber-400">
                  <strong>{stats.pending}</strong> solicitud(es) de reserva pendiente(s) de aprobación
                </span>
              </div>
            )}
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No hay reservas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Fecha</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Horario</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Cliente</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Contacto</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Precio</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Estado</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((res) => {
                        const statusColors = {
                          pending: 'bg-amber-500/20 text-amber-400',
                          confirmed: 'bg-green-500/20 text-green-400',
                          cancelled: 'bg-red-500/20 text-red-400'
                        };
                        const statusLabels = {
                          pending: 'Solicitud',
                          confirmed: 'Confirmada',
                          cancelled: 'Cancelada'
                        };
                        
                        return (
                        <tr key={res.reservation_id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${res.status === 'pending' ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-4 text-white">{res.date}</td>
                          <td className="p-4 text-white">{res.start_time} - {res.end_time}</td>
                          <td className="p-4">
                            <div className="text-white">{res.name}</div>
                            {res.company && <div className="text-gray-500 text-sm">{res.company}</div>}
                          </td>
                          <td className="p-4">
                            <div className="text-white">{res.phone}</div>
                            <div className="text-gray-500 text-sm">{res.email}</div>
                          </td>
                          <td className="p-4 text-[#d4a968] font-medium">{res.price?.toLocaleString() || 0} Gs</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[res.status] || statusColors.pending}`}>
                              {statusLabels[res.status] || res.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {res.status === 'pending' && (
                                <button
                                  onClick={() => confirmReservation(res.reservation_id)}
                                  className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="Aprobar solicitud"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {res.status === 'confirmed' && (
                                <button
                                  onClick={() => updateReservationStatus(res.reservation_id, 'cancelled')}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              {res.status === 'cancelled' && (
                                <button
                                  onClick={() => updateReservationStatus(res.reservation_id, 'confirmed')}
                                  className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="Confirmar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteReservation(res.reservation_id)}
                                className="p-2 rounded-lg bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UGC Tab */}
        {activeTab === 'ugc' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-light text-white">UGC <span className="italic text-[#d4a968]">Creators</span></h2>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={ugcFilterStatus}
                    onChange={(e) => setUgcFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none"
                  >
                    <option value="" className="bg-[#1a1a1a]">Todos</option>
                    <option value="pending" className="bg-[#1a1a1a]">Pendientes</option>
                    <option value="approved" className="bg-[#1a1a1a]">Aprobadas</option>
                    <option value="rejected" className="bg-[#1a1a1a]">Rechazadas</option>
                  </select>
                  <button
                    onClick={() => setUgcFilterStatus('')}
                    className="px-4 py-2 rounded-lg text-gray-500 hover:text-white transition-colors text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando...</p>
                </div>
              ) : ugcApplications.length === 0 ? (
                <div className="text-center py-12">
                  <Instagram className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No hay aplicaciones UGC</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Nombre</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Contacto</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Instagram</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">TikTok</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Videos</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Estado</th>
                        <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ugcApplications.map((app) => {
                        const instagramHandle = app.instagram_url?.startsWith('@') ? app.instagram_url.slice(1) : app.instagram_url;
                        const tiktokHandle = app.tiktok_url?.startsWith('@') ? app.tiktok_url.slice(1) : app.tiktok_url;
                        
                        const getStatusInfo = (status) => {
                          switch(status) {
                            case 'approved': return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Aprobada' };
                            case 'rejected': return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rechazada' };
                            case 'pending': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pendiente' };
                            case 'no_elegible': return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'No elegible' };
                            default: return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: status };
                          }
                        };
                        const statusInfo = getStatusInfo(app.status);

                        return (
                          <tr key={app.application_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="text-white">{app.nombre} {app.apellido}</div>
                              <div className="text-gray-500 text-sm">{app.ciudad}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-white text-sm">{app.email}</div>
                              <a 
                                href={`https://wa.me/${app.whatsapp?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 text-sm flex items-center gap-1 hover:underline"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </a>
                            </td>
                            <td className="p-4">
                              {instagramHandle ? (
                                <a
                                  href={`https://instagram.com/${instagramHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-pink-400 hover:underline flex items-center gap-1"
                                >
                                  <Instagram className="w-3 h-3" />
                                  @{instagramHandle}
                                </a>
                              ) : <span className="text-gray-600">-</span>}
                            </td>
                            <td className="p-4">
                              {tiktokHandle ? (
                                <a
                                  href={`https://tiktok.com/@${tiktokHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:underline"
                                >
                                  @{tiktokHandle}
                                </a>
                              ) : <span className="text-gray-600">-</span>}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {app.video_link_1 && (
                                  <a href={app.video_link_1} target="_blank" rel="noopener noreferrer" 
                                    className="px-2 py-1 rounded bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
                                    Video 1
                                  </a>
                                )}
                                {app.video_link_2 && (
                                  <a href={app.video_link_2} target="_blank" rel="noopener noreferrer"
                                    className="px-2 py-1 rounded bg-white/10 text-white text-xs hover:bg-white/20 transition-colors">
                                    Video 2
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {app.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => updateUgcStatus(app.application_id, 'approved')}
                                      className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                      title="Aprobar"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => updateUgcStatus(app.application_id, 'rejected')}
                                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                      title="Rechazar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => deleteUgcApplication(app.application_id)}
                                  className="p-2 rounded-lg bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab - Role Management */}
        {activeTab === 'users' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-6">
            <UserRolesManager currentUser={user} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-6">
            <AdminSettings currentUser={user} />
          </div>
        )}
      </div>
    </div>
  );
};
