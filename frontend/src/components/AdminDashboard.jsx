import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit, Trash2, Check, X, Filter, Instagram, MessageCircle, ShoppingBag, Image, ChevronLeft, Settings, BarChart3, Mail, Palette, Shield, UserCog, AlertCircle, Phone, CheckCircle, Building, Download, FileSpreadsheet, Tag, Percent, Loader2, FileText, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { OrdersManagement } from './OrdersManagement';
import { ProductImagesManager } from './ProductImagesManager';
import { WebsiteBuilder } from './WebsiteBuilder';
import { UserRolesManager } from './UserRolesManager';
import { AdminSettings } from './AdminSettings';
import { MFASettings } from './MFAComponents';
import { AuditLogViewer } from './AuditLogViewer';
import UGCAdminPanel from './UGCAdminPanel';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Permission helper based on role
const hasPermission = (role, permission) => {
  const permissions = {
    superadmin: ['all', 'users', 'settings', 'website', 'orders', 'reservations', 'ugc', 'images', 'analytics', 'brands', 'security', 'audit'],
    admin: ['settings', 'website', 'orders', 'reservations', 'ugc', 'images', 'analytics', 'brands', 'security'],
    staff: ['orders', 'reservations', 'ugc', 'analytics', 'brands'],
    designer: ['website', 'images'],
    user: []
  };
  return permissions[role]?.includes('all') || permissions[role]?.includes(permission);
};

// Coupons Manager Component
const CouponsManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_uses: '',
    expires_at: '',
    is_active: true,
    description: ''
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/shop/coupons`);
      const data = await res.json();
      setCoupons(data);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: '',
      max_uses: '',
      expires_at: '',
      is_active: true,
      description: ''
    });
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      discount_value: parseFloat(formData.discount_value) || 0,
      min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      expires_at: formData.expires_at || null
    };

    try {
      const url = editingCoupon 
        ? `${API_URL}/api/shop/coupons/${editingCoupon.id}`
        : `${API_URL}/api/shop/coupons`;
      
      const res = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchCoupons();
        setShowForm(false);
        resetForm();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al guardar cupón');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase?.toString() || '',
      max_uses: coupon.max_uses?.toString() || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
      is_active: coupon.is_active,
      description: coupon.description || ''
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('¿Eliminar este cupón?')) return;
    
    try {
      await fetch(`${API_URL}/api/shop/coupons/${couponId}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('es-PY').format(price) + ' Gs';

  if (loading) return <div className="text-white text-center py-8">Cargando cupones...</div>;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-light text-white">Gestión de <span className="italic text-[#d4a968]">Cupones</span></h2>
        <Button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-[#d4a968] text-black hover:bg-[#c99a58]"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cupón
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h3 className="text-lg text-white mb-4">{editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Código *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none uppercase"
                placeholder="Ej: DESCUENTO10"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo de Descuento *</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({...formData, discount_type: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo (Gs)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Valor del Descuento * {formData.discount_type === 'percentage' ? '(%)' : '(Gs)'}
              </label>
              <input
                type="number"
                required
                min="0"
                step={formData.discount_type === 'percentage' ? '1' : '1000'}
                value={formData.discount_value}
                onChange={(e) => setFormData({...formData, discount_value: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
                placeholder={formData.discount_type === 'percentage' ? 'Ej: 10' : 'Ej: 50000'}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Compra Mínima (Gs)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.min_purchase}
                onChange={(e) => setFormData({...formData, min_purchase: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
                placeholder="Opcional"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Límite de Usos</label>
              <input
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) => setFormData({...formData, max_uses: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
                placeholder="Sin límite"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fecha de Expiración</label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none"
                placeholder="Descripción interna del cupón"
              />
            </div>
            
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 rounded border-gray-600 text-[#d4a968] focus:ring-[#d4a968]"
                />
                <span className="text-sm text-gray-300">Cupón activo</span>
              </label>
            </div>
            
            <div className="md:col-span-2 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#d4a968] text-black hover:bg-[#c99a58]">
                {editingCoupon ? 'Actualizar' : 'Crear Cupón'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-white/10">
        {coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay cupones creados</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.is_active ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    {coupon.discount_type === 'percentage' ? (
                      <Percent className={`w-5 h-5 ${coupon.is_active ? 'text-green-400' : 'text-gray-400'}`} />
                    ) : (
                      <Tag className={`w-5 h-5 ${coupon.is_active ? 'text-green-400' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-medium">{coupon.code}</span>
                      {!coupon.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-500/30 text-gray-400">Inactivo</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}% de descuento`
                        : `${formatPrice(coupon.discount_value)} de descuento`}
                      {coupon.min_purchase && ` • Mín: ${formatPrice(coupon.min_purchase)}`}
                    </div>
                    {coupon.description && (
                      <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-gray-400">
                      Usos: {coupon.current_uses || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                    </div>
                    {coupon.expires_at && (
                      <div className="text-xs text-gray-500">
                        Expira: {new Date(coupon.expires_at).toLocaleDateString('es-PY')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(coupon)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button 
                      onClick={() => handleDelete(coupon.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Excel export helper function
const exportToExcel = (data, filename, columns) => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }
  
  // Create CSV content
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(item => 
    columns.map(col => {
      let value = col.getValue ? col.getValue(item) : item[col.key] || '';
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  
  // Add BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const AdminDashboard = ({ user }) => {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [ugcApplications, setUgcApplications] = useState([]);
  const [brandInquiries, setBrandInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on user role
    if (user?.role === 'designer') return 'builder';
    return 'orders';
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [ugcFilterStatus, setUgcFilterStatus] = useState('');
  const [brandFilterStatus, setBrandFilterStatus] = useState('');
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
  }, [filterDate, filterStatus, ugcFilterStatus, brandFilterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = '';
      if (filterDate) query += `?date=${filterDate}`;
      if (filterStatus) query += `${query ? '&' : '?'}status=${filterStatus}`;
      let ugcQuery = ugcFilterStatus ? `?status=${ugcFilterStatus}` : '';
      let brandQuery = brandFilterStatus ? `?status=${brandFilterStatus}` : '';

      const [resResponse, usersResponse, ugcResponse, brandResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/reservations${query}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/ugc${ugcQuery}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/brand-inquiries${brandQuery}`, { headers: getAuthHeaders() })
      ]);

      if (resResponse.ok) setReservations(await resResponse.json());
      if (usersResponse.ok) setUsers(await usersResponse.json());
      if (ugcResponse.ok) setUgcApplications(await ugcResponse.json());
      if (brandResponse.ok) setBrandInquiries(await brandResponse.json());
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
    ugcApproved: ugcApplications.filter(a => a.status === 'approved').length,
    brandTotal: brandInquiries.length,
    brandNew: brandInquiries.filter(b => b.status === 'nuevo').length
  };

  // Tabs filtered by user role permissions
  const allTabs = [
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag, permission: 'orders' },
    { id: 'images', label: 'Imágenes', icon: Image, permission: 'images' },
    { id: 'coupons', label: 'Cupones', icon: Tag, permission: 'orders' },
    { id: 'reservations', label: 'Reservas', icon: Calendar, permission: 'reservations' },
    { id: 'ugc', label: 'UGC', icon: Instagram, permission: 'ugc' },
    { id: 'brands', label: 'Marcas', icon: Building, permission: 'brands' },
    { id: 'security', label: 'Seguridad', icon: Shield, permission: 'security' },
    { id: 'audit', label: 'Auditoría', icon: FileText, permission: 'audit' },
    { id: 'users', label: 'Usuarios', icon: UserCog, permission: 'users' },
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

        {/* Coupons Tab */}
        {activeTab === 'coupons' && <CouponsManager />}

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
                  <Button
                    onClick={() => exportToExcel(reservations, 'reservas_studio', [
                      { key: 'reservation_id', label: 'ID' },
                      { key: 'date', label: 'Fecha' },
                      { key: 'time', label: 'Hora' },
                      { key: 'duration', label: 'Duración (h)' },
                      { key: 'name', label: 'Cliente' },
                      { key: 'email', label: 'Email' },
                      { key: 'phone', label: 'Teléfono' },
                      { key: 'purpose', label: 'Propósito' },
                      { key: 'price', label: 'Precio (Gs)' },
                      { key: 'status', label: 'Estado' }
                    ])}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
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
                      );
                    })}
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
                  <Button
                    onClick={() => exportToExcel(ugcApplications, 'ugc_creators', [
                      { key: 'nombre', label: 'Nombre' },
                      { key: 'apellido', label: 'Apellido' },
                      { key: 'email', label: 'Email' },
                      { key: 'whatsapp', label: 'WhatsApp' },
                      { key: 'ciudad', label: 'Ciudad' },
                      { key: 'sexo', label: 'Sexo' },
                      { key: 'instagram_url', label: 'Instagram' },
                      { key: 'instagram_seguidores', label: 'Seguidores IG' },
                      { key: 'tiktok_url', label: 'TikTok' },
                      { key: 'tiktok_seguidores', label: 'Seguidores TT' },
                      { key: 'video_link_1', label: 'Video 1' },
                      { key: 'video_link_2', label: 'Video 2' },
                      { key: 'status', label: 'Estado' },
                      { key: 'created_at', label: 'Fecha', getValue: (item) => item.created_at ? new Date(item.created_at).toLocaleDateString('es-PY') : '' }
                    ])}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
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

        {/* Brands Tab - Marcas Interesadas */}
        {activeTab === 'brands' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-light text-white">Marcas <span className="italic text-[#d4a968]">Interesadas</span></h2>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={brandFilterStatus}
                    onChange={(e) => setBrandFilterStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                  >
                    <option value="">Todos los estados</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="contactado">Contactado</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <Button
                    onClick={() => exportToExcel(brandInquiries, 'marcas_interesadas', [
                      { key: 'inquiry_id', label: 'ID' },
                      { key: 'brand_name', label: 'Marca' },
                      { key: 'contact_name', label: 'Contacto' },
                      { key: 'email', label: 'Email' },
                      { key: 'phone', label: 'Teléfono' },
                      { key: 'interest_label', label: 'Interés' },
                      { key: 'message', label: 'Mensaje' },
                      { key: 'status', label: 'Estado' },
                      { key: 'created_at', label: 'Fecha', getValue: (item) => new Date(item.created_at).toLocaleDateString('es-PY') }
                    ])}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-6">
              {brandInquiries.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No hay consultas de marcas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Marca</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Contacto</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Teléfono</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Interés</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Estado</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Fecha</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brandInquiries.map((inquiry) => (
                        <tr key={inquiry.inquiry_id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">{inquiry.brand_name}</div>
                            {inquiry.message && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={inquiry.message}>
                                {inquiry.message}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-300">{inquiry.contact_name}</td>
                          <td className="py-4 px-4">
                            <a href={`mailto:${inquiry.email}`} className="text-[#d4a968] hover:underline">
                              {inquiry.email}
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            {inquiry.phone ? (
                              <a href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {inquiry.phone}
                              </a>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-300 text-sm">{inquiry.interest_label}</td>
                          <td className="py-4 px-4">
                            <select
                              value={inquiry.status}
                              onChange={async (e) => {
                                try {
                                  await fetch(`${API_URL}/api/admin/brand-inquiries/${inquiry.inquiry_id}`, {
                                    method: 'PUT',
                                    headers: getAuthHeaders(),
                                    body: JSON.stringify({ status: e.target.value })
                                  });
                                  fetchData();
                                } catch (err) {
                                  console.error('Error updating status:', err);
                                }
                              }}
                              className={`px-2 py-1 rounded text-xs font-medium border ${
                                inquiry.status === 'nuevo' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                inquiry.status === 'contactado' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                inquiry.status === 'en_proceso' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="contactado">Contactado</option>
                              <option value="en_proceso">En Proceso</option>
                              <option value="cerrado">Cerrado</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-gray-400 text-sm">
                            {new Date(inquiry.created_at).toLocaleDateString('es-PY')}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={async () => {
                                if (window.confirm('¿Eliminar esta consulta?')) {
                                  try {
                                    await fetch(`${API_URL}/api/admin/brand-inquiries/${inquiry.inquiry_id}`, {
                                      method: 'DELETE',
                                      headers: getAuthHeaders()
                                    });
                                    fetchData();
                                  } catch (err) {
                                    console.error('Error deleting inquiry:', err);
                                  }
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

        {/* Users Tab - Role Management */}
        {activeTab === 'users' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-6">
            <UserRolesManager currentUser={user} />
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-medium text-white mb-6">Seguridad de la cuenta</h2>
              <MFASettings 
                user={user} 
                token={localStorage.getItem('auth_token')} 
                onUpdate={() => window.location.reload()}
              />
              
              {/* Security Tips */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-lg font-medium text-blue-400 mb-3">Recomendaciones de seguridad</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Activa MFA para proteger tu cuenta de administrador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Usa contraseñas únicas de al menos 12 caracteres</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Guarda tus códigos de recuperación en un lugar seguro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Revisa periódicamente el registro de auditoría</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden p-6">
            <AuditLogViewer token={localStorage.getItem('auth_token')} />
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
