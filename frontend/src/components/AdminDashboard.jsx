import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import { 
  Calendar, Users, Plus, Edit, Trash2, Check, X, Filter, ShoppingBag, 
  Image, ChevronLeft, ChevronDown, Settings, BarChart3, Mail, Palette, Shield, UserCog, 
  AlertCircle, Phone, CheckCircle, Building, Download, FileSpreadsheet, Tag, 
  Percent, Loader2, FileText, Sparkles, Search, Bell, ChevronRight, RefreshCw,
  TrendingUp, Package, Camera, Clock, ArrowRight, Command, Eye,
  LayoutDashboard, Zap, Activity, Star, ExternalLink, MoreHorizontal, Briefcase, Database
} from 'lucide-react';
import { Button } from './ui/button';
import { OrdersManagement } from './OrdersManagement';
import { ProductImagesManager } from './ProductImagesManager';
import { WebsiteBuilder } from './WebsiteBuilder';
import { UserRolesManager } from './UserRolesManager';
import { AdminSettings } from './AdminSettings';
import { MFASettings } from './MFAComponents';
import { AuditLogViewer } from './AuditLogViewer';
import UGCAdminPanel from './UGCAdminPanel';
import { AdminCreatorsReport } from './AdminCreatorsReport';
import SystemNotifications from './SystemNotifications';

const API_URL = getApiUrl();

// Permission helper
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

// Export to Excel helper
const exportToExcel = (data, filename, columns) => {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(item =>
    columns.map(col => {
      let value = item[col.key] ?? '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
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

// ============== COUPONS MANAGER ==============
const CouponsManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '', discount_type: 'percentage', discount_value: '', min_purchase: '',
    max_uses: '', expires_at: '', is_active: true, description: ''
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

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => {
    setFormData({ code: '', discount_type: 'percentage', discount_value: '', min_purchase: '', max_uses: '', expires_at: '', is_active: true, description: '' });
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const url = editingCoupon ? `${API_URL}/api/shop/coupons/${editingCoupon.id}` : `${API_URL}/api/shop/coupons`;
    const method = editingCoupon ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, discount_value: parseFloat(formData.discount_value), min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : null, max_uses: formData.max_uses ? parseInt(formData.max_uses) : null, expires_at: formData.expires_at || null })
      });
      if (response.ok) { fetchCoupons(); setShowForm(false); resetForm(); }
    } catch (err) { console.error('Error saving coupon:', err); }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('¿Eliminar este cupón?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`${API_URL}/api/shop/coupons/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchCoupons();
    } catch (err) { console.error('Error deleting coupon:', err); }
  };

  const toggleCoupon = async (coupon) => {
    const token = localStorage.getItem('auth_token');
    try {
      await fetch(`${API_URL}/api/shop/coupons/${coupon.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...coupon, is_active: !coupon.is_active })
      });
      fetchCoupons();
    } catch (err) { console.error('Error toggling coupon:', err); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Cupones de Descuento</h3>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#d4a968] hover:bg-[#c49958] text-black">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Cupón
        </Button>
      </div>

      {showForm && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Código (ej: VERANO20)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30" required />
              <select value={formData.discount_type} onChange={(e) => setFormData({...formData, discount_type: e.target.value})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white">
                <option value="percentage" className="bg-[#1a1a1a]">Porcentaje (%)</option>
                <option value="fixed" className="bg-[#1a1a1a]">Monto Fijo (Gs)</option>
              </select>
              <input type="number" placeholder={formData.discount_type === 'percentage' ? 'Descuento (%)' : 'Descuento (Gs)'} value={formData.discount_value} onChange={(e) => setFormData({...formData, discount_value: e.target.value})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30" required />
              <input type="number" placeholder="Compra mínima (Gs)" value={formData.min_purchase} onChange={(e) => setFormData({...formData, min_purchase: e.target.value})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30" />
              <input type="number" placeholder="Usos máximos" value={formData.max_uses} onChange={(e) => setFormData({...formData, max_uses: e.target.value})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30" />
              <input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} className="p-3 rounded-lg bg-white/5 border border-white/10 text-white" />
            </div>
            <input type="text" placeholder="Descripción" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30" />
            <div className="flex gap-3">
              <Button type="submit" className="bg-[#d4a968] hover:bg-[#c49958] text-black">{editingCoupon ? 'Actualizar' : 'Crear'} Cupón</Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} className="border-white/20 text-white hover:bg-white/5">Cancelar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-3">
        {coupons.length === 0 ? (
          <div className="text-center py-12 text-white/40"><Tag className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No hay cupones creados</p></div>
        ) : coupons.map((coupon) => (
          <div key={coupon.id} className={`p-4 rounded-xl border ${coupon.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1.5 rounded-lg font-mono font-bold ${coupon.is_active ? 'bg-[#d4a968]/20 text-[#d4a968]' : 'bg-white/10 text-white/50'}`}>{coupon.code}</div>
                <div>
                  <p className="text-white font-medium">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `${coupon.discount_value.toLocaleString()} Gs OFF`}</p>
                  <p className="text-white/40 text-sm">{coupon.description || 'Sin descripción'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">{coupon.times_used || 0} usos</span>
                <button onClick={() => toggleCoupon(coupon)} className={`p-2 rounded-lg ${coupon.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>{coupon.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</button>
                <button onClick={() => { setEditingCoupon(coupon); setFormData({ ...coupon, expires_at: coupon.expires_at?.split('T')[0] || '' }); setShowForm(true); }} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10"><Edit className="w-4 h-4" /></button>
                <button onClick={() => deleteCoupon(coupon.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============== RESERVATIONS PANEL ==============
const ReservationsPanel = ({ reservations, loading, onRefresh, stats }) => {
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}) });

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/api/admin/reservations/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const deleteRes = async (id) => {
    if (!window.confirm('¿Eliminar reserva?')) return;
    try {
      await fetch(`${API_URL}/api/admin/reservations/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const filtered = reservations.filter(r => {
    if (filterDate && r.date !== filterDate) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const statusColors = { pending: 'bg-amber-500/20 text-amber-400', confirmed: 'bg-green-500/20 text-green-400', cancelled: 'bg-red-500/20 text-red-400' };
  const statusLabels = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm">
            <option value="" className="bg-[#1a1a1a]">Todos</option>
            <option value="pending" className="bg-[#1a1a1a]">Pendientes</option>
            <option value="confirmed" className="bg-[#1a1a1a]">Confirmadas</option>
            <option value="cancelled" className="bg-[#1a1a1a]">Canceladas</option>
          </select>
          {(filterDate || filterStatus) && <button onClick={() => { setFilterDate(''); setFilterStatus(''); }} className="text-white/40 hover:text-white text-sm">Limpiar</button>}
        </div>
        <Button onClick={() => exportToExcel(filtered, 'reservas', [{ key: 'date', label: 'Fecha' }, { key: 'start_time', label: 'Hora' }, { key: 'name', label: 'Cliente' }, { key: 'email', label: 'Email' }, { key: 'price', label: 'Precio' }, { key: 'status', label: 'Estado' }])} variant="outline" className="border-white/10 text-white/60 hover:bg-white/5">
          <Download className="w-4 h-4 mr-2" /> Exportar
        </Button>
      </div>

      {/* Alert */}
      {stats?.pending > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <span className="text-amber-400"><strong>{stats.pending}</strong> reserva(s) pendiente(s) de aprobación</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40"><Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No hay reservas</p></div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Fecha/Hora</th>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Cliente</th>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Contacto</th>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Precio</th>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Estado</th>
                <th className="text-left p-4 text-white/60 text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((res) => (
                <tr key={res.reservation_id} className={`border-t border-white/5 hover:bg-white/[0.02] ${res.status === 'pending' ? 'bg-amber-500/5' : ''}`}>
                  <td className="p-4"><div className="text-white">{res.date}</div><div className="text-white/40 text-sm">{res.start_time} - {res.end_time}</div></td>
                  <td className="p-4"><div className="text-white">{res.name}</div>{res.company && <div className="text-white/40 text-sm">{res.company}</div>}</td>
                  <td className="p-4"><div className="text-white/60 text-sm">{res.phone}</div><div className="text-white/40 text-sm">{res.email}</div></td>
                  <td className="p-4 text-[#d4a968] font-medium">{res.price?.toLocaleString()} Gs</td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[res.status]}`}>{statusLabels[res.status]}</span></td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {res.status === 'pending' && <button onClick={() => updateStatus(res.reservation_id, 'confirmed')} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"><Check className="w-4 h-4" /></button>}
                      {res.status === 'confirmed' && <button onClick={() => updateStatus(res.reservation_id, 'cancelled')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><X className="w-4 h-4" /></button>}
                      <button onClick={() => deleteRes(res.reservation_id)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============== BRANDS INQUIRIES PANEL ==============
const BrandsInquiriesPanel = ({ inquiries, loading, onRefresh }) => {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // null, 'first', or inquiry_id
  
  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` });

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_URL}/api/admin/brand-inquiries/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
      onRefresh();
    } catch (err) { console.error('Error updating status:', err); }
  };

  const deleteInquiry = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/brand-inquiries/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.ok) {
        setDeleteConfirm(null);
        onRefresh();
      } else {
        console.error('Delete failed:', await response.text());
      }
    } catch (err) { console.error('Error deleting:', err); }
  };

  const handleDeleteClick = (id, e) => {
    if (e) e.stopPropagation();
    if (deleteConfirm === id) {
      // Second click - confirm delete
      deleteInquiry(id);
    } else {
      // First click - show confirmation
      setDeleteConfirm(id);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(prev => prev === id ? null : prev), 3000);
    }
  };

  const statusColors = { 
    nuevo: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    contactado: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
    en_proceso: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cerrado: 'bg-green-500/20 text-green-400 border-green-500/30' 
  };
  
  const statusLabels = {
    nuevo: 'Nuevo',
    contactado: 'Contactado', 
    en_proceso: 'En Proceso',
    cerrado: 'Cerrado'
  };

  const filtered = filter ? inquiries.filter(i => i.status === filter) : inquiries;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatList = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-white">Consultas de Marcas</h2>
          <p className="text-white/50 text-sm">Leads recibidos desde los formularios de contacto</p>
        </div>
        <button onClick={onRefresh} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!filter ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
        >
          Todos ({inquiries.length})
        </button>
        <button 
          onClick={() => setFilter('nuevo')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'nuevo' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
        >
          Nuevos ({inquiries.filter(i => i.status === 'nuevo').length})
        </button>
        <button 
          onClick={() => setFilter('contactado')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'contactado' ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
        >
          Contactados ({inquiries.filter(i => i.status === 'contactado').length})
        </button>
        <button 
          onClick={() => setFilter('cerrado')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'cerrado' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
        >
          Cerrados ({inquiries.filter(i => i.status === 'cerrado').length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/40"><Building className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No hay consultas</p></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inquiry) => (
            <div key={inquiry.id || inquiry.inquiry_id} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
              {/* Header Row - Clickable to expand */}
              <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === (inquiry.id || inquiry.inquiry_id) ? null : (inquiry.id || inquiry.inquiry_id))}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-white font-medium">{inquiry.brand_name || inquiry.brand || 'Sin nombre'}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs border ${statusColors[inquiry.status] || statusColors.nuevo}`}>
                        {statusLabels[inquiry.status] || 'Nuevo'}
                      </span>
                      {inquiry.selected_plan && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#d4a968]/20 text-[#d4a968] border border-[#d4a968]/30">
                          {inquiry.selected_plan}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">{inquiry.contact_name || inquiry.name || '-'} • {inquiry.email}</p>
                    <p className="text-white/40 text-xs mt-1">{formatDate(inquiry.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Quick actions */}
                    {inquiry.phone && (
                      <a 
                        href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        title="Contactar por WhatsApp"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <a 
                      href={`mailto:${inquiry.email}`}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="Enviar email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    {/* Mark as contacted button */}
                    {inquiry.status === 'nuevo' && (
                      <button
                        onClick={() => updateStatus(inquiry.id || inquiry.inquiry_id, 'contactado')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-medium transition-colors"
                        title="Marcar como contactado"
                      >
                        Marcar contactado
                      </button>
                    )}
                    {/* Delete button with double confirmation */}
                    <button
                      onClick={(e) => handleDeleteClick(inquiry.inquiry_id || inquiry.id, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        deleteConfirm === (inquiry.inquiry_id || inquiry.id) 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                      title={deleteConfirm === (inquiry.inquiry_id || inquiry.id) ? 'Click de nuevo para confirmar' : 'Eliminar'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${expandedId === (inquiry.id || inquiry.inquiry_id) ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === (inquiry.id || inquiry.inquiry_id) && (
                <div className="border-t border-white/10 p-4 bg-black/20 space-y-4">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-white/40 text-xs mb-1">Contacto</p>
                      <p className="text-white text-sm">{inquiry.contact_name || inquiry.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Email</p>
                      <p className="text-white text-sm">{inquiry.email}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Teléfono</p>
                      <p className="text-white text-sm">{inquiry.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-1">Tipo Producto</p>
                      <p className="text-white text-sm">{inquiry.product_type || inquiry.interest || '-'}</p>
                    </div>
                  </div>

                  {/* Message */}
                  {inquiry.message && (
                    <div>
                      <p className="text-white/40 text-xs mb-1">Mensaje</p>
                      <p className="text-white/70 text-sm bg-white/5 rounded-lg p-3 italic">&quot;{inquiry.message}&quot;</p>
                    </div>
                  )}

                  {/* Questionnaire */}
                  {inquiry.questionnaire && Object.keys(inquiry.questionnaire).length > 0 && (
                    <div>
                      <p className="text-[#d4a968] text-xs font-medium uppercase tracking-wider mb-3">Respuestas del Cuestionario</p>
                      <div className="grid gap-3">
                        {inquiry.questionnaire.situacion && formatList(inquiry.questionnaire.situacion) && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">1) Situación actual</p>
                            <ul className="text-white/80 text-sm space-y-1">
                              {inquiry.questionnaire.situacion.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-[#d4a968]">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {inquiry.questionnaire.resultado && formatList(inquiry.questionnaire.resultado) && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">2) Resultado en 90 días</p>
                            <ul className="text-white/80 text-sm space-y-1">
                              {inquiry.questionnaire.resultado.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-[#d4a968]">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(inquiry.questionnaire.obstaculo || inquiry.questionnaire.frustracion) && formatList(inquiry.questionnaire.obstaculo || inquiry.questionnaire.frustracion) && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">3) Obstáculo/Frustración</p>
                            <ul className="text-white/80 text-sm space-y-1">
                              {(inquiry.questionnaire.obstaculo || inquiry.questionnaire.frustracion).map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-[#d4a968]">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(inquiry.questionnaire.prioridad || inquiry.questionnaire.solucion) && formatList(inquiry.questionnaire.prioridad || inquiry.questionnaire.solucion) && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">4) Prioridad/Solución preferida</p>
                            <ul className="text-white/80 text-sm space-y-1">
                              {(inquiry.questionnaire.prioridad || inquiry.questionnaire.solucion).map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-[#d4a968]">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {inquiry.questionnaire.inversion && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">5) Inversión mensual</p>
                            <p className="text-white/80 text-sm">{inquiry.questionnaire.inversion}</p>
                          </div>
                        )}
                        {inquiry.questionnaire.adicional && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <p className="text-white/50 text-xs mb-1">6) Información adicional</p>
                            <p className="text-white/80 text-sm">{inquiry.questionnaire.adicional}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Change */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">Estado:</span>
                      <select 
                        value={inquiry.status} 
                        onChange={(e) => updateStatus(inquiry.id || inquiry.inquiry_id, e.target.value)} 
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                      >
                        <option value="nuevo">Nuevo</option>
                        <option value="contactado">Contactado</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </div>
                    <p className="text-white/30 text-xs">ID: {inquiry.inquiry_id || inquiry.id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============== MAIN ADMIN DASHBOARD ==============
export const AdminDashboard = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial state from URL params
  const [activeModule, setActiveModule] = useState(searchParams.get('module') || null);
  const [activeSubTab, setActiveSubTab] = useState(searchParams.get('tab') || null);
  const [ugcSubTab, setUgcSubTab] = useState(searchParams.get('ugcTab') || 'overview');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sync URL params when state changes
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (activeModule) newParams.set('module', activeModule);
    if (activeSubTab) newParams.set('tab', activeSubTab);
    if (activeModule === 'ugc' && ugcSubTab) newParams.set('ugcTab', ugcSubTab);
    setSearchParams(newParams, { replace: true });
  }, [activeModule, activeSubTab, ugcSubTab, setSearchParams]);
  
  // Handle UGC sub-tab changes
  const handleUgcSubTabChange = (newTab) => {
    setUgcSubTab(newTab);
  };
  
  // Data states
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ugcData, setUgcData] = useState({ campaigns: 0, applications: 0, deliverables: 0 });
  const [brandInquiries, setBrandInquiries] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupDiagnostics, setBackupDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const userRole = user?.role || 'user';
  const getAuthHeaders = () => ({ 'Content-Type': 'application/json', ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}) });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, ordersRes, ugcRes, brandsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/reservations`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/orders`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/ugc/admin/dashboard`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/admin/brand-inquiries`, { headers: getAuthHeaders() })
      ]);

      if (resRes.ok) setReservations(await resRes.json());
      if (ordersRes.ok) { const d = await ordersRes.json(); setOrders(d.orders || []); }
      if (ugcRes.ok) setUgcData(await ugcRes.json());
      if (brandsRes.ok) setBrandInquiries(await brandsRes.json());

      // Build recent activity
      const activities = [];
      // Add more activity items from various sources here
      setRecentActivity(activities);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Keyboard shortcut for command bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(true);
      }
      if (e.key === 'Escape') setShowCommandBar(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Stats calculations
  const stats = {
    orders: { total: orders.length, pending: orders.filter(o => o.status === 'pendiente').length, revenue: orders.filter(o => o.status === 'entregado').reduce((s, o) => s + (o.total || 0), 0) },
    reservations: { total: reservations.length, pending: reservations.filter(r => r.status === 'pending').length, confirmed: reservations.filter(r => r.status === 'confirmed').length },
    ugc: { campaigns: ugcData.active_campaigns || 0, applications: ugcData.pending_applications || 0, deliverables: ugcData.pending_deliverables || 0 },
    brands: { total: brandInquiries.length, new: brandInquiries.filter(b => b.status === 'nuevo').length }
  };

  const pendingActions = stats.orders.pending + stats.reservations.pending + stats.ugc.applications + stats.brands.new;

  // Module definitions
  const modules = [
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, color: 'from-blue-500 to-blue-600', stats: [`${stats.orders.total} pedidos`, stats.orders.pending > 0 ? `${stats.orders.pending} pendientes` : null], permission: 'orders', subtabs: [
      { id: 'orders', label: 'Pedidos', icon: Package },
      { id: 'images', label: 'Imágenes', icon: Image },
      { id: 'coupons', label: 'Cupones', icon: Tag }
    ]},
    { id: 'ugc', label: 'UGC Platform', icon: Sparkles, color: 'from-purple-500 to-pink-500', stats: [`${stats.ugc.campaigns} campañas`, stats.ugc.applications > 0 ? `${stats.ugc.applications} aplicaciones` : null], permission: 'ugc', subtabs: [
      { id: 'overview', label: 'Panel UGC', icon: LayoutDashboard },
      { id: 'creators-report', label: 'Reporte Creadores', icon: BarChart3 }
    ]},
    { id: 'studio', label: 'Studio', icon: Camera, color: 'from-amber-500 to-orange-500', stats: [`${stats.reservations.total} reservas`, stats.reservations.pending > 0 ? `${stats.reservations.pending} pendientes` : null], permission: 'reservations', subtabs: [
      { id: 'reservations', label: 'Reservas', icon: Calendar }
    ]},
    { id: 'brands', label: 'Consultas de Marcas', icon: Building, color: 'from-emerald-500 to-teal-500', stats: [`${stats.brands.total} consultas`, stats.brands.new > 0 ? `${stats.brands.new} nuevas` : null], permission: 'brands', subtabs: [
      { id: 'inquiries', label: 'Consultas', icon: Mail }
    ]},
    { id: 'config', label: 'Configuración', icon: Settings, color: 'from-gray-500 to-gray-600', stats: ['Sistema', 'Usuarios'], permission: 'settings', subtabs: [
      { id: 'users', label: 'Usuarios', icon: UserCog },
      { id: 'terms', label: 'Términos y Condiciones', icon: FileText, link: '/admin/terms' },
      { id: 'security', label: 'Seguridad', icon: Shield },
      { id: 'audit', label: 'Auditoría', icon: FileText },
      { id: 'settings', label: 'Ajustes', icon: Settings }
    ]}
  ].filter(m => hasPermission(userRole, m.permission));

  // Quick actions
  // Handle backup - Python method to Cloudinary
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/backup/run`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        alert(`✅ Backup iniciado!\n\n${data.message}\n\nColecciones: ${data.collections}\nDocumentos: ${data.documents?.toLocaleString()}\n\nRecibirás un email cuando termine.`);
        
        // Start polling for status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_URL}/api/admin/backup/status`, {
              headers: getAuthHeaders()
            });
            const statusData = await statusRes.json();
            
            if (!statusData.running) {
              clearInterval(pollInterval);
              setBackupLoading(false);
              
              if (statusData.last_result === 'success') {
                alert(`✅ Backup completado!\n\nURL: ${statusData.cloudinary_url || 'Ver Cloudinary'}`);
              } else if (statusData.last_error) {
                alert(`❌ Error en backup: ${statusData.last_error}`);
              }
            }
          } catch (err) {
            console.error('Error polling status:', err);
          }
        }, 5000); // Poll every 5 seconds
        
        // Stop polling after 10 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setBackupLoading(false);
        }, 600000);
        
      } else {
        alert(`❌ Error: ${data.message || data.detail || 'Error al iniciar backup'}`);
        setBackupLoading(false);
      }
    } catch (err) {
      console.error('Backup error:', err);
      alert(`❌ Error de conexión: ${err.message}`);
      setBackupLoading(false);
    }
  };

  // Fetch backup diagnostics
  const fetchBackupDiagnostics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/backup/diagnostics`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBackupDiagnostics(data.diagnostics || []);
        setShowDiagnostics(true);
      }
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
    }
  };

  const quickActions = [
    { label: 'Nueva Campaña UGC', icon: Plus, action: () => { setActiveModule('ugc'); setActiveSubTab('overview'); }, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { label: 'Editar Web', icon: Palette, action: () => setShowBuilder(true), color: 'bg-[#d4a968]/20 text-[#d4a968] border-[#d4a968]/30' },
    { label: backupLoading ? 'Creando...' : 'Backup DB', icon: backupLoading ? Loader2 : Database, action: handleBackup, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', disabled: backupLoading, spin: backupLoading },
    { label: 'Ver Diagnósticos', icon: Search, action: fetchBackupDiagnostics, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    ...(pendingActions > 0 ? [{ label: `${pendingActions} Pendientes`, icon: Bell, action: () => {}, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }] : [])
  ];

  // Diagnostics Modal
  const DiagnosticsModal = () => {
    if (!showDiagnostics) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowDiagnostics(false)}>
        <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Diagnósticos de Backup</h2>
            <button onClick={() => setShowDiagnostics(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          {backupDiagnostics && backupDiagnostics.length > 0 ? (
            <div className="space-y-4">
              {backupDiagnostics.map((diag, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${diag.type === 'backup_success' ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${diag.type === 'backup_success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                      {diag.type}
                    </span>
                    <span className="text-xs text-gray-400">{diag.created_at}</span>
                  </div>
                  <pre className="text-xs text-gray-300 overflow-auto whitespace-pre-wrap bg-black/30 p-3 rounded mt-2">
                    {JSON.stringify(diag.diagnostics, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No hay diagnósticos disponibles. Intentá hacer un backup primero.</p>
          )}
        </div>
      </div>
    );
  };

  // Website Builder view
  if (showBuilder) {
    return <WebsiteBuilder onClose={() => setShowBuilder(false)} />;
  }

  // Module detail view
  if (activeModule) {
    const module = modules.find(m => m.id === activeModule);
    const currentSubTab = activeSubTab || module?.subtabs[0]?.id;

    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { setActiveModule(null); setActiveSubTab(null); }} className="p-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${module?.color}`}>
                    {module && <module.icon className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h1 className="text-xl font-medium text-white">{module?.label}</h1>
                    <p className="text-white/40 text-sm">Gestión y administración</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {module?.id === 'ugc' && (
                  <Button className="bg-[#d4a968] hover:bg-[#c49958] text-black text-sm">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Campaña
                  </Button>
                )}
              </div>
            </div>

            {/* Subtabs */}
            {module?.subtabs && module.subtabs.length > 1 && (
              <div className="flex gap-1 mt-4 -mb-4 pb-4">
                {module.subtabs.map((tab) => (
                  tab.link ? (
                    <a
                      key={tab.id}
                      href={tab.link}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white/40 hover:text-white/60 hover:bg-white/5"
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </a>
                  ) : (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentSubTab === tab.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* E-commerce */}
          {activeModule === 'ecommerce' && currentSubTab === 'orders' && <OrdersManagement />}
          {activeModule === 'ecommerce' && currentSubTab === 'images' && <ProductImagesManager />}
          {activeModule === 'ecommerce' && currentSubTab === 'coupons' && <CouponsManager />}

          {/* UGC */}
          {activeModule === 'ugc' && currentSubTab === 'overview' && (
            <UGCAdminPanel 
              initialSubTab={ugcSubTab} 
              onSubTabChange={handleUgcSubTabChange}
            />
          )}
          {activeModule === 'ugc' && currentSubTab === 'creators-report' && <AdminCreatorsReport />}

          {/* Studio */}
          {activeModule === 'studio' && <ReservationsPanel reservations={reservations} loading={loading} onRefresh={fetchData} stats={stats.reservations} />}

          {/* Brands */}
          {activeModule === 'brands' && <BrandsInquiriesPanel inquiries={brandInquiries} loading={loading} onRefresh={fetchData} />}

          {/* Config */}
          {activeModule === 'config' && currentSubTab === 'users' && <UserRolesManager currentUser={user} />}
          {activeModule === 'config' && currentSubTab === 'security' && <MFASettings user={user} />}
          {activeModule === 'config' && currentSubTab === 'audit' && <AuditLogViewer />}
          {activeModule === 'config' && currentSubTab === 'settings' && <AdminSettings currentUser={user} />}
        </div>
      </div>
    );
  }

  // ============== COMMAND CENTER (HOME) ==============
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Diagnostics Modal */}
      <DiagnosticsModal />
      
      {/* Command Bar Modal */}
      {showCommandBar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setShowCommandBar(false)}>
          <div className="w-full max-w-xl bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Buscar campañas, pedidos, usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none"
                autoFocus
              />
              <kbd className="px-2 py-1 rounded bg-white/10 text-white/40 text-xs">ESC</kbd>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => { setActiveModule(module.id); setShowCommandBar(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${module.color}`}>
                    <module.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{module.label}</p>
                    <p className="text-white/40 text-sm">{module.subtabs.map(t => t.label).join(', ')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a968] to-[#c49958] flex items-center justify-center">
                  <span className="text-black font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="text-lg font-medium text-white">Avenue <span className="text-[#d4a968]">Admin</span></h1>
                  <p className="text-white/40 text-xs">{user?.name} • {userRole}</p>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setShowCommandBar(true)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm hidden md:inline">Buscar...</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] hidden md:inline">⌘K</kbd>
              </button>

              {/* Notifications */}
              <SystemNotifications getAuthHeaders={() => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` })} />

              {/* Back to site */}
              <a href="/" className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all">
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-light text-white mb-2">
            Bienvenido, <span className="text-[#d4a968]">{user?.name?.split(' ')[0] || 'Admin'}</span>
          </h2>
          <p className="text-white/40">Panel de control de Avenue. Gestioná todo desde un solo lugar.</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              disabled={action.disabled}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-[1.02] ${action.color} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <action.icon className={`w-4 h-4 ${action.spin ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className="group p-6 rounded-2xl bg-[#111111] border border-white/5 hover:border-white/20 transition-all text-left hover:scale-[1.01] hover:shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color} shadow-lg`}>
                  <module.icon className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">{module.label}</h3>
              <div className="flex flex-wrap gap-2">
                {module.stats.filter(Boolean).map((stat, i) => (
                  <span key={i} className={`text-sm ${i === 0 ? 'text-white/60' : 'text-[#d4a968]'}`}>
                    {stat}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Ingresos E-comm', value: `${(stats.orders.revenue / 1000000).toFixed(1)}M`, subvalue: 'Gs este mes', icon: TrendingUp, color: 'text-green-400' },
            { label: 'Reservas Studio', value: stats.reservations.confirmed, subvalue: 'Confirmadas', icon: Calendar, color: 'text-blue-400' },
            { label: 'Campañas UGC', value: stats.ugc.campaigns, subvalue: 'Activas', icon: Sparkles, color: 'text-purple-400' },
            { label: 'Consultas Cerradas', value: brandInquiries.filter(b => b.status === 'cerrado').length, subvalue: 'Convertidos', icon: Building, color: 'text-emerald-400' }
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#111111] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-white/40 text-sm">{stat.label}</span>
              </div>
              <p className={`text-2xl font-light ${stat.color}`}>{stat.value}</p>
              <p className="text-white/30 text-sm">{stat.subvalue}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-[#111111] border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white">Actividad Reciente</h3>
            <button className="text-white/40 hover:text-white text-sm">Ver todo</button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" />
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.slice(0, 3).map((res, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Reserva de <span className="font-medium">{res.name}</span></p>
                    <p className="text-white/40 text-xs">{res.date} • {res.start_time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${res.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                    {res.status === 'pending' ? 'Pendiente' : 'Confirmada'}
                  </span>
                </div>
              ))}
              {orders.slice(0, 2).map((order, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Pedido <span className="font-medium">#{order.order_id?.slice(-6)}</span></p>
                    <p className="text-white/40 text-xs">{order.customer_name || 'Cliente'}</p>
                  </div>
                  <span className="text-[#d4a968] font-medium text-sm">{order.total?.toLocaleString()} Gs</span>
                </div>
              ))}
              {reservations.length === 0 && orders.length === 0 && (
                <div className="text-center py-8 text-white/30">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Sin actividad reciente</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
