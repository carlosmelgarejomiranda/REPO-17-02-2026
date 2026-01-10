import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, CreditCard, 
  Truck, Save, Loader2, CheckCircle, AlertCircle, Plus,
  Trash2, Edit2, Package, Calendar, Building2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MyProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');
  
  // Profile data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    city: ''
  });
  
  // Billing data
  const [billing, setBilling] = useState({
    razon_social: '',
    ruc: '',
    direccion_fiscal: '',
    telefono_factura: ''
  });
  
  // Shipping addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    alias: '',
    direccion: '',
    ciudad: '',
    referencia: '',
    is_default: false
  });
  
  // Order history
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || ''
        });
        setBilling(data.billing_info || {
          razon_social: '',
          ruc: '',
          direccion_fiscal: '',
          telefono_factura: ''
        });
        setAddresses(data.shipping_addresses || []);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/user/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          city: profile.city,
          billing_info: billing
        })
      });
      
      if (res.ok) {
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.alias || !newAddress.direccion || !newAddress.ciudad) {
      setError('Completa los campos obligatorios');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/user/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      });
      
      if (res.ok) {
        const data = await res.json();
        setAddresses([...addresses, data.address]);
        setNewAddress({ alias: '', direccion: '', ciudad: '', referencia: '', is_default: false });
        setShowAddressForm(false);
        setSuccess('Dirección agregada');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error al guardar dirección');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_URL}/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setAddresses(addresses.filter(a => a.id !== addressId));
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: User },
    { id: 'billing', label: 'Facturación', icon: CreditCard },
    { id: 'addresses', label: 'Direcciones', icon: Truck },
    { id: 'orders', label: 'Mis Pedidos', icon: Package }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="my-profile-page">
      {/* Header */}
      <div className="bg-black text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <h1 className="text-3xl font-light">
            Mi <span className="text-[#d4a968] italic">Perfil</span>
          </h1>
          <p className="text-gray-400 mt-2">{profile.email}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Personal Data Tab */}
        {activeTab === 'personal' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[#d4a968]" />
              Datos Personales
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  placeholder="+595 9XX XXX XXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Ciudad</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({...profile, city: e.target.value})}
                  placeholder="Asunción"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#d4a968]" />
              Datos de Facturación
            </h2>
            
            <p className="text-sm text-gray-500 mb-6">
              Estos datos se usarán para generar tus facturas en compras y reservas.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Razón Social</label>
                <input
                  type="text"
                  value={billing.razon_social}
                  onChange={(e) => setBilling({...billing, razon_social: e.target.value})}
                  placeholder="Nombre o empresa"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">RUC / CI</label>
                <input
                  type="text"
                  value={billing.ruc}
                  onChange={(e) => setBilling({...billing, ruc: e.target.value})}
                  placeholder="XXXXXXXX-X"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-2">Dirección Fiscal</label>
                <input
                  type="text"
                  value={billing.direccion_fiscal}
                  onChange={(e) => setBilling({...billing, direccion_fiscal: e.target.value})}
                  placeholder="Calle, número, barrio"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2">Teléfono de facturación</label>
                <input
                  type="tel"
                  value={billing.telefono_factura}
                  onChange={(e) => setBilling({...billing, telefono_factura: e.target.value})}
                  placeholder="+595 21 XXX XXX"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-6 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#d4a968]" />
                Direcciones de Envío
              </h2>
              <button
                onClick={() => setShowAddressForm(true)}
                className="px-4 py-2 bg-[#d4a968] text-black text-sm rounded-lg hover:bg-[#c49958] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            
            {addresses.length === 0 && !showAddressForm ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes direcciones guardadas</p>
                <p className="text-sm mt-2">Agrega una para acelerar tus próximas compras</p>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    className={`p-4 border rounded-lg ${addr.is_default ? 'border-[#d4a968] bg-[#d4a968]/5' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{addr.alias}</p>
                          {addr.is_default && (
                            <span className="text-xs bg-[#d4a968] text-black px-2 py-0.5 rounded">Principal</span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{addr.direccion}</p>
                        <p className="text-gray-500 text-sm">{addr.ciudad}</p>
                        {addr.referencia && (
                          <p className="text-gray-400 text-sm mt-1">Ref: {addr.referencia}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add Address Form */}
            {showAddressForm && (
              <div className="mt-6 p-4 border border-[#d4a968] rounded-lg bg-[#d4a968]/5">
                <h3 className="font-medium mb-4">Nueva Dirección</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Alias *</label>
                    <input
                      type="text"
                      value={newAddress.alias}
                      onChange={(e) => setNewAddress({...newAddress, alias: e.target.value})}
                      placeholder="Ej: Casa, Oficina"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Ciudad *</label>
                    <input
                      type="text"
                      value={newAddress.ciudad}
                      onChange={(e) => setNewAddress({...newAddress, ciudad: e.target.value})}
                      placeholder="Asunción"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={newAddress.direccion}
                      onChange={(e) => setNewAddress({...newAddress, direccion: e.target.value})}
                      placeholder="Calle, número, barrio"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 mb-1">Referencia</label>
                    <input
                      type="text"
                      value={newAddress.referencia}
                      onChange={(e) => setNewAddress({...newAddress, referencia: e.target.value})}
                      placeholder="Cerca de..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({...newAddress, is_default: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm">Usar como dirección principal</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAddAddress}
                    disabled={saving}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#d4a968]" />
              Mis Pedidos
            </h2>
            
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#d4a968]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tienes pedidos todavía</p>
                <a href="/shop" className="text-[#d4a968] hover:underline mt-2 inline-block">
                  Explorar tienda
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Pedido #{order.order_number || order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'completed' ? 'Completado' :
                           order.status === 'pending' ? 'Pendiente' : order.status}
                        </span>
                      </div>
                    </div>
                    {order.items && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
