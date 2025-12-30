import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit, Trash2, Check, X, Filter, Instagram, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export const AdminDashboard = ({ user }) => {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [ugcApplications, setUgcApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservations');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [ugcFilterStatus, setUgcFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchData();
  }, [filterDate, filterStatus, ugcFilterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query params
      let query = '';
      if (filterDate) query += `?date=${filterDate}`;
      if (filterStatus) query += `${query ? '&' : '?'}status=${filterStatus}`;

      let ugcQuery = ugcFilterStatus ? `?status=${ugcFilterStatus}` : '';

      const [resResponse, usersResponse, ugcResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/reservations${query}`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        }),
        fetch(`${API_URL}/api/admin/users`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        }),
        fetch(`${API_URL}/api/admin/ugc${ugcQuery}`, {
          headers: getAuthHeaders(),
          credentials: 'include'
        })
      ]);

      if (resResponse.ok) {
        const resData = await resResponse.json();
        setReservations(resData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      if (ugcResponse.ok) {
        const ugcData = await ugcResponse.json();
        setUgcApplications(ugcData);
      }
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
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setTestEmailStatus({ type: 'success', message: data.message });
      } else {
        setTestEmailStatus({ type: 'error', message: data.detail || 'Error al enviar email' });
      }
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
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
    }
  };

  const deleteReservation = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta reserva?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting reservation:', err);
    }
  };

  const updateUgcStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/ugc/${applicationId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchData();
      }
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
        credentials: 'include'
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting UGC application:', err);
    }
  };

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    totalRevenue: reservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.price, 0),
    ugcTotal: ugcApplications.length,
    ugcPending: ugcApplications.filter(a => a.status === 'pending').length,
    ugcApproved: ugcApplications.filter(a => a.status === 'approved').length
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-light italic" style={{ color: '#f5ede4' }}>
              Panel de Administración
            </h1>
            <p style={{ color: '#a8a8a8' }}>Bienvenido, {user?.name}</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              onClick={sendTestEmail}
              disabled={sendingTestEmail}
              className="flex items-center gap-2"
              style={{ backgroundColor: '#2a2a2a', color: '#d4a968', border: '1px solid #d4a968' }}
            >
              {sendingTestEmail ? 'Enviando...' : '📧 Probar Email'}
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              <Plus className="w-4 h-4" /> Nueva Reserva
            </Button>
          </div>
        </div>

        {/* Test Email Status */}
        {testEmailStatus && (
          <div 
            className="mb-6 p-4 rounded"
            style={{ 
              backgroundColor: testEmailStatus.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: testEmailStatus.type === 'success' ? '#22c55e' : '#ef4444',
              border: `1px solid ${testEmailStatus.type === 'success' ? '#22c55e' : '#ef4444'}`
            }}
          >
            {testEmailStatus.message}
            <button 
              onClick={() => setTestEmailStatus(null)} 
              className="ml-4 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: '#a8a8a8' }}>Reservas</p>
              <p className="text-2xl font-light" style={{ color: '#d4a968' }}>{stats.total}</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: '#a8a8a8' }}>Confirmadas</p>
              <p className="text-2xl font-light" style={{ color: '#22c55e' }}>{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: '#a8a8a8' }}>Ingresos</p>
              <p className="text-2xl font-light" style={{ color: '#d4a968' }}>
                {stats.totalRevenue.toLocaleString()} Gs
              </p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: '#a8a8a8' }}>UGC Aplicaciones</p>
              <p className="text-2xl font-light" style={{ color: '#d4a968' }}>{stats.ugcTotal}</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardContent className="p-4">
              <p className="text-sm" style={{ color: '#a8a8a8' }}>UGC Pendientes</p>
              <p className="text-2xl font-light" style={{ color: '#f59e0b' }}>{stats.ugcPending}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded transition-all flex items-center gap-2`}
            style={{
              backgroundColor: activeTab === 'reservations' ? '#d4a968' : '#2a2a2a',
              color: activeTab === 'reservations' ? '#0d0d0d' : '#a8a8a8'
            }}
          >
            <Calendar className="w-4 h-4" /> Reservas
          </button>
          <button
            onClick={() => setActiveTab('ugc')}
            className={`px-4 py-2 rounded transition-all flex items-center gap-2`}
            style={{
              backgroundColor: activeTab === 'ugc' ? '#d4a968' : '#2a2a2a',
              color: activeTab === 'ugc' ? '#0d0d0d' : '#a8a8a8'
            }}
          >
            <Instagram className="w-4 h-4" /> UGC Creators
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded transition-all flex items-center gap-2`}
            style={{
              backgroundColor: activeTab === 'users' ? '#d4a968' : '#2a2a2a',
              color: activeTab === 'users' ? '#0d0d0d' : '#a8a8a8'
            }}
          >
            <Users className="w-4 h-4" /> Usuarios
          </button>
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle style={{ color: '#f5ede4' }}>Reservas</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="p-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="p-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                  <Button
                    onClick={() => { setFilterDate(''); setFilterStatus(''); }}
                    variant="ghost"
                    style={{ color: '#a8a8a8' }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p style={{ color: '#a8a8a8' }}>Cargando...</p>
              ) : reservations.length === 0 ? (
                <p style={{ color: '#a8a8a8' }}>No hay reservas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Fecha</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Horario</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Cliente</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Contacto</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Precio</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Estado</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((res) => (
                        <tr key={res.reservation_id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <td className="p-3" style={{ color: '#f5ede4' }}>{res.date}</td>
                          <td className="p-3" style={{ color: '#f5ede4' }}>
                            {res.start_time} - {res.end_time}
                          </td>
                          <td className="p-3">
                            <div style={{ color: '#f5ede4' }}>{res.name}</div>
                            {res.company && (
                              <div className="text-sm" style={{ color: '#a8a8a8' }}>{res.company}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <div style={{ color: '#f5ede4' }}>{res.phone}</div>
                            <div className="text-sm" style={{ color: '#a8a8a8' }}>{res.email}</div>
                          </td>
                          <td className="p-3" style={{ color: '#d4a968' }}>
                            {res.price.toLocaleString()} Gs
                          </td>
                          <td className="p-3">
                            <span
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                backgroundColor: res.status === 'confirmed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: res.status === 'confirmed' ? '#22c55e' : '#ef4444'
                              }}
                            >
                              {res.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              {res.status === 'confirmed' && (
                                <button
                                  onClick={() => updateReservationStatus(res.reservation_id, 'cancelled')}
                                  className="p-1 rounded"
                                  style={{ color: '#ef4444' }}
                                  title="Cancelar"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                              {res.status === 'cancelled' && (
                                <button
                                  onClick={() => updateReservationStatus(res.reservation_id, 'confirmed')}
                                  className="p-1 rounded"
                                  style={{ color: '#22c55e' }}
                                  title="Confirmar"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteReservation(res.reservation_id)}
                                className="p-1 rounded"
                                style={{ color: '#666' }}
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
            </CardContent>
          </Card>
        )}

        {/* UGC Tab */}
        {activeTab === 'ugc' && (
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle style={{ color: '#f5ede4' }}>UGC Creator Applications</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={ugcFilterStatus}
                    onChange={(e) => setUgcFilterStatus(e.target.value)}
                    className="p-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobadas</option>
                    <option value="rejected">Rechazadas</option>
                  </select>
                  <Button
                    onClick={() => setUgcFilterStatus('')}
                    variant="ghost"
                    style={{ color: '#a8a8a8' }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p style={{ color: '#a8a8a8' }}>Cargando...</p>
              ) : ugcApplications.length === 0 ? (
                <p style={{ color: '#a8a8a8' }}>No hay aplicaciones UGC</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Nombre</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Contacto</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Instagram</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>TikTok</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Videos</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Estado</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Fecha</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ugcApplications.map((app) => {
                        const instagramHandle = app.instagram_url?.startsWith('@') 
                          ? app.instagram_url.slice(1) 
                          : app.instagram_url;
                        const tiktokHandle = app.tiktok_url?.startsWith('@') 
                          ? app.tiktok_url.slice(1) 
                          : app.tiktok_url;
                        
                        const getStatusInfo = (status) => {
                          switch(status) {
                            case 'approved':
                              return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', label: 'Aprobada' };
                            case 'rejected':
                              return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', label: 'Rechazada' };
                            case 'pending':
                              return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: 'Pendiente' };
                            case 'no_elegible':
                              return { bg: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af', label: 'No elegible' };
                            default:
                              return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', label: status };
                          }
                        };
                        const statusInfo = getStatusInfo(app.status);
                        
                        return (
                          <tr key={app.application_id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <td className="p-3">
                              <div style={{ color: '#f5ede4' }}>{app.nombre} {app.apellido}</div>
                              <div className="text-sm" style={{ color: '#a8a8a8' }}>{app.ciudad}</div>
                            </td>
                            <td className="p-3">
                              <div style={{ color: '#f5ede4' }}>{app.email}</div>
                              <a 
                                href={`https://wa.me/${app.whatsapp?.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm flex items-center gap-1"
                                style={{ color: '#25D366' }}
                              >
                                <MessageCircle className="w-3 h-3" />
                                {app.whatsapp}
                              </a>
                            </td>
                            <td className="p-3">
                              {app.instagram_url ? (
                                <a 
                                  href={`https://instagram.com/${instagramHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                  style={{ color: '#d4a968' }}
                                >
                                  <Instagram className="w-4 h-4" />
                                  {app.instagram_url}
                                </a>
                              ) : '-'}
                              <div className="text-sm" style={{ color: '#a8a8a8' }}>
                                {app.instagram_seguidores ? `${parseInt(app.instagram_seguidores).toLocaleString()} seg.` : ''}
                              </div>
                            </td>
                            <td className="p-3">
                              {app.tiktok_url ? (
                                <a 
                                  href={`https://tiktok.com/@${tiktokHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1"
                                  style={{ color: '#d4a968' }}
                                >
                                  {app.tiktok_url}
                                </a>
                              ) : '-'}
                              <div className="text-sm" style={{ color: '#a8a8a8' }}>
                                {app.tiktok_seguidores ? `${parseInt(app.tiktok_seguidores).toLocaleString()} seg.` : ''}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                {app.video_link_1 && (
                                  <a 
                                    href={app.video_link_1}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm"
                                    style={{ color: '#d4a968' }}
                                  >
                                    📹 Video 1
                                  </a>
                                )}
                                {app.video_link_2 && (
                                  <a 
                                    href={app.video_link_2}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm"
                                    style={{ color: '#d4a968' }}
                                  >
                                    📹 Video 2
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className="px-2 py-1 rounded text-sm"
                                style={{
                                  backgroundColor: statusInfo.bg,
                                  color: statusInfo.color
                                }}
                              >
                                {statusInfo.label}
                              </span>
                              {app.motivo_no_elegible && app.motivo_no_elegible.length > 0 && (
                                <div className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                                  {app.motivo_no_elegible.map(m => m.replace(/_/g, ' ')).join(', ')}
                                </div>
                              )}
                            </td>
                            <td className="p-3" style={{ color: '#a8a8a8' }}>
                              {new Date(app.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                {(app.status === 'pending' || app.status === 'no_elegible') && (
                                  <>
                                    <button
                                      onClick={() => updateUgcStatus(app.application_id, 'approved')}
                                      className="p-1 rounded hover:bg-green-900/30"
                                      style={{ color: '#22c55e' }}
                                      title="Aprobar"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => updateUgcStatus(app.application_id, 'rejected')}
                                      className="p-1 rounded hover:bg-red-900/30"
                                      style={{ color: '#ef4444' }}
                                      title="Rechazar"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {(app.status === 'approved' || app.status === 'rejected') && (
                                  <button
                                    onClick={() => updateUgcStatus(app.application_id, 'pending')}
                                    className="p-1 rounded hover:bg-yellow-900/30"
                                    style={{ color: '#f59e0b' }}
                                    title="Marcar como pendiente"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteUgcApplication(app.application_id)}
                                  className="p-1 rounded hover:bg-gray-900/30"
                                  style={{ color: '#666' }}
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
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
            <CardHeader>
              <CardTitle style={{ color: '#f5ede4' }}>Usuarios Registrados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p style={{ color: '#a8a8a8' }}>Cargando...</p>
              ) : users.length === 0 ? (
                <p style={{ color: '#a8a8a8' }}>No hay usuarios</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Nombre</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Email</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Teléfono</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Rol</th>
                        <th className="text-left p-3" style={{ color: '#d4a968' }}>Registro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                          <td className="p-3" style={{ color: '#f5ede4' }}>{u.name}</td>
                          <td className="p-3" style={{ color: '#f5ede4' }}>{u.email}</td>
                          <td className="p-3" style={{ color: '#a8a8a8' }}>{u.phone || '-'}</td>
                          <td className="p-3">
                            <span
                              className="px-2 py-1 rounded text-sm"
                              style={{
                                backgroundColor: u.role === 'admin' ? 'rgba(212, 169, 104, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                                color: u.role === 'admin' ? '#d4a968' : '#a8a8a8'
                              }}
                            >
                              {u.role === 'admin' ? 'Admin' : 'Usuario'}
                            </span>
                          </td>
                          <td className="p-3" style={{ color: '#a8a8a8' }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Reservation Modal */}
        {showCreateModal && (
          <CreateReservationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchData();
            }}
          />
        )}
      </div>
    </div>
  );
};

const CreateReservationModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '09:00',
    duration_hours: 2,
    name: '',
    phone: '',
    email: '',
    company: '',
    razon_social: '',
    ruc: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/admin/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al crear reserva');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: '#f5ede4' }}>Nueva Reserva Manual</CardTitle>
            <button onClick={onClose} style={{ color: '#666' }} className="text-2xl">×</button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Hora Inicio</label>
                <select
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                >
                  {Array.from({ length: 13 }, (_, i) => i + 9).map(hour => (
                    <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                      {hour.toString().padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Duración</label>
              <select
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
              >
                <option value={2}>2 horas - 250.000 Gs</option>
                <option value={4}>4 horas - 450.000 Gs</option>
                <option value={6}>6 horas - 650.000 Gs</option>
                <option value={8}>8 horas - 800.000 Gs</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
              />
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Empresa</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Razón Social</label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>RUC</label>
                <input
                  type="text"
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: '#2a2a2a', borderColor: '#333', color: '#f5ede4' }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1"
                style={{ backgroundColor: '#2a2a2a', color: '#a8a8a8' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
                style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
              >
                {loading ? 'Creando...' : 'Crear Reserva'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
