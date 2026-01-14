import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Package, TrendingUp, DollarSign, ShoppingCart, Truck, CheckCircle, 
  XCircle, Clock, Filter, Download, ChevronLeft, ChevronRight, Eye,
  BarChart3, Calendar, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const API_URL = getApiUrl();

// Status configurations
const ORDER_STATUSES = {
  pending: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'Confirmado', color: '#3b82f6', icon: CheckCircle },
  preparing: { label: 'Preparando', color: '#8b5cf6', icon: Package },
  shipped: { label: 'Enviado', color: '#06b6d4', icon: Truck },
  delivered: { label: 'Entregado', color: '#22c55e', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: '#ef4444', icon: XCircle }
};

const PAYMENT_STATUSES = {
  pending: { label: 'Pendiente', color: '#f59e0b' },
  paid: { label: 'Pagado', color: '#22c55e' },
  failed: { label: 'Fallido', color: '#ef4444' },
  cancelled: { label: 'Cancelado', color: '#6b7280' }
};

export const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    paymentStatus: '',
    dateFrom: '',
    dateTo: ''
  });
  const [exporting, setExporting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchOrders();
    fetchMetrics();
    fetchDailyMetrics();
    fetchTopProducts();
  }, [currentPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = `?page=${currentPage}&limit=15`;
      if (filters.status) query += `&status=${filters.status}`;
      if (filters.paymentStatus) query += `&payment_status=${filters.paymentStatus}`;
      if (filters.dateFrom) query += `&date_from=${filters.dateFrom}`;
      if (filters.dateTo) query += `&date_to=${filters.dateTo}`;

      const response = await fetch(`${API_URL}/api/shop/admin/orders${query}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      let query = '';
      if (filters.dateFrom) query += `?date_from=${filters.dateFrom}`;
      if (filters.dateTo) query += `${query ? '&' : '?'}date_to=${filters.dateTo}`;

      const response = await fetch(`${API_URL}/api/shop/admin/metrics/summary${query}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const fetchDailyMetrics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/metrics/daily?days=30`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setDailyMetrics(data.daily_metrics || []);
      }
    } catch (err) {
      console.error('Error fetching daily metrics:', err);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/metrics/top-products?limit=10`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setTopProducts(data.top_products || []);
      }
    } catch (err) {
      console.error('Error fetching top products:', err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchOrders();
        fetchMetrics();
        if (selectedOrder?.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, order_status: newStatus });
        }
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const exportReport = async () => {
    setExporting(true);
    try {
      let query = '';
      if (filters.status) query += `?status=${filters.status}`;
      if (filters.dateFrom) query += `${query ? '&' : '?'}date_from=${filters.dateFrom}`;
      if (filters.dateTo) query += `${query ? '&' : '?'}date_to=${filters.dateTo}`;

      const response = await fetch(`${API_URL}/api/shop/admin/reports/export${query}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Convert to CSV
        const headers = ['ID Pedido', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Items', 'Subtotal', 'Envío', 'Total', 'Tipo Entrega', 'Estado Pedido', 'Estado Pago', 'Método Pago'];
        const rows = data.report.map(r => [
          r.order_id,
          r.created_at?.slice(0, 19).replace('T', ' '),
          r.customer_name,
          r.customer_email,
          r.customer_phone,
          `"${r.items}"`,
          r.subtotal,
          r.delivery_cost,
          r.total,
          r.delivery_type,
          r.order_status,
          r.payment_status,
          r.payment_method
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
      }
    } catch (err) {
      console.error('Error exporting report:', err);
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price || 0) + ' Gs';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilters({ status: '', paymentStatus: '', dateFrom: '', dateTo: '' });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: '#333' }}>
        {[
          { id: 'orders', label: 'Pedidos', icon: Package },
          { id: 'metrics', label: 'Métricas', icon: BarChart3 },
          { id: 'reports', label: 'Reportes', icon: Download }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-current' : 'border-transparent'
            }`}
            style={{ 
              color: activeTab === tab.id ? '#d4a968' : '#a8a8a8',
              borderColor: activeTab === tab.id ? '#d4a968' : 'transparent'
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards - Always visible */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#22c55e20' }}>
                  <DollarSign className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#a8a8a8' }}>Ingresos Totales</p>
                  <p className="text-lg font-semibold" style={{ color: '#22c55e' }}>
                    {formatPrice(metrics.total_revenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#3b82f620' }}>
                  <ShoppingCart className="w-5 h-5" style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#a8a8a8' }}>Total Pedidos</p>
                  <p className="text-lg font-semibold" style={{ color: '#3b82f6' }}>
                    {metrics.total_orders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#d4a96820' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: '#d4a968' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#a8a8a8' }}>Ticket Promedio</p>
                  <p className="text-lg font-semibold" style={{ color: '#d4a968' }}>
                    {formatPrice(metrics.avg_order_value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#f59e0b20' }}>
                  <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#a8a8a8' }}>Pendientes</p>
                  <p className="text-lg font-semibold" style={{ color: '#f59e0b' }}>
                    {metrics.orders_by_status?.pending || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters */}
          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Estado</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                  >
                    <option value="">Todos</option>
                    {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Pago</label>
                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                  >
                    <option value="">Todos</option>
                    {Object.entries(PAYMENT_STATUSES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Desde</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Hasta</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                  />
                </div>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: '#444', color: '#a8a8a8' }}
                >
                  Limpiar
                </Button>

                <Button
                  onClick={fetchOrders}
                  className="text-sm"
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center" style={{ color: '#a8a8a8' }}>
                  Cargando pedidos...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center" style={{ color: '#a8a8a8' }}>
                  No hay pedidos
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333' }}>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Pedido</th>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Cliente</th>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Total</th>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Estado</th>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Pago</th>
                        <th className="text-left p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Fecha</th>
                        <th className="text-center p-4 text-xs font-medium" style={{ color: '#a8a8a8' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const statusConfig = ORDER_STATUSES[order.order_status] || ORDER_STATUSES.pending;
                        const paymentConfig = PAYMENT_STATUSES[order.payment_status] || PAYMENT_STATUSES.pending;
                        
                        return (
                          <tr 
                            key={order.order_id}
                            className="hover:bg-black/20 transition-colors"
                            style={{ borderBottom: '1px solid #2a2a2a' }}
                          >
                            <td className="p-4">
                              <span className="font-mono text-sm" style={{ color: '#d4a968' }}>
                                {order.order_id}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="text-sm" style={{ color: '#f5ede4' }}>{order.customer_name}</p>
                              <p className="text-xs" style={{ color: '#666' }}>{order.customer_email}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-medium" style={{ color: '#f5ede4' }}>
                                {formatPrice(order.total)}
                              </span>
                            </td>
                            <td className="p-4">
                              <select
                                value={order.order_status}
                                onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                                className="px-2 py-1 rounded text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${statusConfig.color}20`,
                                  color: statusConfig.color,
                                  border: `1px solid ${statusConfig.color}40`
                                }}
                              >
                                {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                                  <option key={key} value={key}>{val.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-4">
                              <span 
                                className="px-2 py-1 rounded text-xs"
                                style={{ 
                                  backgroundColor: `${paymentConfig.color}20`,
                                  color: paymentConfig.color
                                }}
                              >
                                {paymentConfig.label}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm" style={{ color: '#a8a8a8' }}>
                                {formatDate(order.created_at)}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrder(order)}
                                style={{ color: '#d4a968' }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
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
                <div className="flex items-center justify-between p-4" style={{ borderTop: '1px solid #333' }}>
                  <span className="text-sm" style={{ color: '#a8a8a8' }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ borderColor: '#444' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ borderColor: '#444' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Status Breakdown */}
          {metrics && (
            <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: '#f5ede4' }}>
                  Pedidos por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(ORDER_STATUSES).map(([key, config]) => {
                    const count = metrics.orders_by_status?.[key] || 0;
                    const StatusIcon = config.icon;
                    return (
                      <div 
                        key={key}
                        className="p-4 rounded-lg text-center"
                        style={{ backgroundColor: '#2a2a2a', border: `1px solid ${config.color}40` }}
                      >
                        <StatusIcon className="w-6 h-6 mx-auto mb-2" style={{ color: config.color }} />
                        <p className="text-2xl font-bold" style={{ color: config.color }}>{count}</p>
                        <p className="text-xs" style={{ color: '#a8a8a8' }}>{config.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Products */}
          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#f5ede4' }}>
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-center py-4" style={{ color: '#a8a8a8' }}>Sin datos de ventas</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: '#2a2a2a' }}
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ 
                            backgroundColor: idx < 3 ? '#d4a968' : '#444',
                            color: idx < 3 ? '#0d0d0d' : '#a8a8a8'
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm" style={{ color: '#f5ede4' }}>
                            {product.name}
                          </p>
                          {product.size && (
                            <p className="text-xs" style={{ color: '#666' }}>
                              Talle: {product.size}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" style={{ color: '#d4a968' }}>
                          {product.quantity} vendidos
                        </p>
                        <p className="text-xs" style={{ color: '#a8a8a8' }}>
                          {formatPrice(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Chart */}
          <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#f5ede4' }}>
                Ventas Últimos 30 Días
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyMetrics.length === 0 ? (
                <p className="text-center py-4" style={{ color: '#a8a8a8' }}>Sin datos</p>
              ) : (
                <div className="h-48 flex items-end gap-1">
                  {dailyMetrics.slice(-30).map((day, idx) => {
                    const maxRevenue = Math.max(...dailyMetrics.map(d => d.revenue), 1);
                    const height = (day.revenue / maxRevenue) * 100;
                    
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-t transition-all hover:opacity-80 cursor-pointer group relative"
                        style={{ 
                          height: `${Math.max(height, 2)}%`,
                          backgroundColor: day.revenue > 0 ? '#d4a968' : '#333'
                        }}
                        title={`${day.date}: ${formatPrice(day.revenue)} (${day.orders} pedidos)`}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: '#2a2a2a', color: '#f5ede4' }}>
                          {day.date.slice(5)}: {formatPrice(day.revenue)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: '#f5ede4' }}>
              Exportar Reporte de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm" style={{ color: '#a8a8a8' }}>
              Descarga un archivo CSV con todos los pedidos filtrados.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Desde</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Hasta</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                />
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                >
                  <option value="">Todos</option>
                  {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={exportReport}
              disabled={exporting}
              className="mt-4"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exportando...' : 'Descargar CSV'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-medium" style={{ color: '#d4a968' }}>
                    Pedido {selectedOrder.order_id}
                  </h2>
                  <p className="text-sm" style={{ color: '#a8a8a8' }}>
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-black/20"
                  style={{ color: '#a8a8a8' }}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                <h3 className="text-sm font-medium mb-2" style={{ color: '#f5ede4' }}>Cliente</h3>
                <p style={{ color: '#f5ede4' }}>{selectedOrder.customer_name}</p>
                <p className="text-sm" style={{ color: '#a8a8a8' }}>{selectedOrder.customer_email}</p>
                <p className="text-sm" style={{ color: '#a8a8a8' }}>{selectedOrder.customer_phone}</p>
              </div>

              {/* Delivery Info */}
              {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: '#f5ede4' }}>Dirección de Entrega</h3>
                  <p style={{ color: '#a8a8a8' }}>{selectedOrder.delivery_address.address}</p>
                </div>
              )}

              {/* Items */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3" style={{ color: '#f5ede4' }}>Productos</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-lg"
                      style={{ backgroundColor: '#2a2a2a' }}
                    >
                      <div>
                        <p className="text-sm" style={{ color: '#f5ede4' }}>{item.name}</p>
                        {item.size && (
                          <p className="text-xs" style={{ color: '#666' }}>Talle: {item.size}</p>
                        )}
                        <p className="text-xs" style={{ color: '#a8a8a8' }}>
                          {formatPrice(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium" style={{ color: '#d4a968' }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-lg space-y-2" style={{ backgroundColor: '#2a2a2a' }}>
                <div className="flex justify-between">
                  <span style={{ color: '#a8a8a8' }}>Subtotal</span>
                  <span style={{ color: '#f5ede4' }}>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.delivery_cost > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: '#a8a8a8' }}>Envío</span>
                    <span style={{ color: '#f5ede4' }}>{formatPrice(selectedOrder.delivery_cost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #444' }}>
                  <span className="font-medium" style={{ color: '#f5ede4' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: '#d4a968' }}>
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#f5ede4' }}>
                  Actualizar Estado
                </label>
                <select
                  value={selectedOrder.order_status}
                  onChange={(e) => {
                    updateOrderStatus(selectedOrder.order_id, e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-lg"
                  style={{ backgroundColor: '#2a2a2a', color: '#f5ede4', border: '1px solid #444' }}
                >
                  {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                  <h3 className="text-sm font-medium mb-2" style={{ color: '#f5ede4' }}>Notas</h3>
                  <p className="text-sm" style={{ color: '#a8a8a8' }}>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
