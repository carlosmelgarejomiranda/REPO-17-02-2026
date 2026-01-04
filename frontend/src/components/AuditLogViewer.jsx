import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Calendar, User, Globe, Monitor, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Action labels in Spanish
const ACTION_LABELS = {
  login_success: { label: 'Login exitoso', color: 'text-green-400', bg: 'bg-green-500/10' },
  login_failed: { label: 'Login fallido', color: 'text-red-400', bg: 'bg-red-500/10' },
  logout: { label: 'Logout', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  mfa_enabled: { label: 'MFA activado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  mfa_disabled: { label: 'MFA desactivado', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  mfa_verified: { label: 'MFA verificado', color: 'text-green-400', bg: 'bg-green-500/10' },
  mfa_failed: { label: 'MFA fallido', color: 'text-red-400', bg: 'bg-red-500/10' },
  password_changed: { label: 'Contraseña cambiada', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  password_reset_requested: { label: 'Reset de contraseña', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  user_created: { label: 'Usuario creado', color: 'text-green-400', bg: 'bg-green-500/10' },
  user_updated: { label: 'Usuario actualizado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  user_role_changed: { label: 'Rol cambiado', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  user_deleted: { label: 'Usuario eliminado', color: 'text-red-400', bg: 'bg-red-500/10' },
  order_status_changed: { label: 'Estado de pedido', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  order_cancelled: { label: 'Pedido cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
  refund_processed: { label: 'Reembolso procesado', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  price_changed: { label: 'Precio modificado', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  stock_changed: { label: 'Stock modificado', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  coupon_created: { label: 'Cupón creado', color: 'text-green-400', bg: 'bg-green-500/10' },
  coupon_deleted: { label: 'Cupón eliminado', color: 'text-red-400', bg: 'bg-red-500/10' },
  reservation_status_changed: { label: 'Estado de reserva', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  reservation_cancelled: { label: 'Reserva cancelada', color: 'text-red-400', bg: 'bg-red-500/10' },
  settings_changed: { label: 'Configuración', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  integration_changed: { label: 'Integración modificada', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  data_exported: { label: 'Datos exportados', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

export const AuditLogViewer = ({ token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [actionTypes, setActionTypes] = useState([]);
  
  // Filters
  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const LIMIT = 20;

  useEffect(() => {
    fetchActionTypes();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, filterEmail, filterStartDate, filterEndDate]);

  const fetchActionTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/audit-logs/actions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setActionTypes(data.actions || []);
    } catch (err) {
      console.error('Error fetching action types:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: LIMIT,
        skip: page * LIMIT
      });
      
      if (filterAction) params.append('action', filterAction);
      if (filterEmail) params.append('user_email', filterEmail);
      if (filterStartDate) params.append('start_date', filterStartDate);
      if (filterEndDate) params.append('end_date', filterEndDate);
      
      const response = await fetch(`${API_URL}/api/admin/audit-logs?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionStyle = (action) => {
    return ACTION_LABELS[action] || { label: action, color: 'text-gray-400', bg: 'bg-gray-500/10' };
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('es-PY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#d4a968]" />
          <h2 className="text-xl font-medium text-white">Registro de Auditoría</h2>
        </div>
        <span className="text-sm text-gray-400">{total} registros</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Tipo de acción</label>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#d4a968] focus:outline-none"
          >
            <option value="">Todas las acciones</option>
            {actionTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email del usuario</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={filterEmail}
              onChange={(e) => { setFilterEmail(e.target.value); setPage(0); }}
              placeholder="Buscar email..."
              className="w-full bg-white/5 border border-white/20 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:border-[#d4a968] focus:outline-none"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha desde</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(0); }}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#d4a968] focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha hasta</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(0); }}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-[#d4a968] focus:outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No hay registros que mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha/Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Acción</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">IP</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => {
                  const actionStyle = getActionStyle(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${actionStyle.bg} ${actionStyle.color}`}>
                          {actionStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm text-white">{log.user_email || 'N/A'}</p>
                            {log.user_role && (
                              <p className="text-xs text-gray-500">{log.user_role}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Globe className="w-4 h-4" />
                          {log.ip_address || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">
                        {log.details && Object.keys(log.details).length > 0 
                          ? JSON.stringify(log.details) 
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Mostrando {page * LIMIT + 1}-{Math.min((page + 1) * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
