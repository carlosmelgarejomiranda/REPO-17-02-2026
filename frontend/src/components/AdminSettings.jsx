import React, { useState, useEffect } from 'react';
import { Settings, CreditCard, Image, Phone, Save, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';

export const AdminSettings = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    payment_gateway_enabled: false,
    show_only_products_with_images: false,
    whatsapp_commercial: '+595973666000'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/settings`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setSuccess(null);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setOriginalSettings(data);
        setSuccess('Configuración guardada correctamente');
        setHasChanges(false);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const err = await response.json();
        setError(err.detail || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const canChangeSettings = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Configuración del Sistema</h2>
          <p className="text-gray-400 text-sm mt-1">Ajusta las opciones generales de la tienda</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={resetChanges} className="border-neutral-600">
              <RefreshCw className="w-4 h-4 mr-1" />
              Descartar
            </Button>
          )}
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving || !canChangeSettings}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-200">{success}</span>
        </div>
      )}

      {/* Settings Cards */}
      <div className="grid gap-6">
        {/* Payment Gateway */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Pasarela de Pago (Bancard)</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-lg">
                  Activa o desactiva la pasarela de pago. Cuando está desactivada, los pedidos se procesan como "Solicitudes" 
                  y se envía notificación por WhatsApp al comercial para confirmación manual.
                </p>
                <div className="mt-3 p-3 bg-neutral-700/50 rounded-lg text-sm">
                  <p className="text-amber-400 font-medium">Estado actual: {settings.payment_gateway_enabled ? 'Activo' : 'Desactivado'}</p>
                  <p className="text-gray-400 mt-1">
                    {settings.payment_gateway_enabled 
                      ? '• Los clientes podrán pagar directamente con tarjeta'
                      : '• Los pedidos se envían como solicitud por WhatsApp'}
                  </p>
                </div>
              </div>
            </div>
            <Switch
              checked={settings.payment_gateway_enabled}
              onCheckedChange={(checked) => handleChange('payment_gateway_enabled', checked)}
              disabled={!canChangeSettings}
            />
          </div>
        </div>

        {/* Products with Images Only */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Image className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Mostrar Solo Productos con Fotos</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-lg">
                  Cuando está activado, solo se muestran los productos que tienen imágenes asignadas en la tienda. 
                  Los productos sin fotos quedan ocultos hasta que se les agregue una imagen.
                </p>
                <div className="mt-3 p-3 bg-neutral-700/50 rounded-lg text-sm">
                  <p className="text-amber-400 font-medium">Estado actual: {settings.show_only_products_with_images ? 'Activo' : 'Desactivado'}</p>
                  <p className="text-gray-400 mt-1">
                    {settings.show_only_products_with_images 
                      ? '• Solo productos con imagen son visibles'
                      : '• Todos los productos son visibles (con o sin imagen)'}
                  </p>
                </div>
              </div>
            </div>
            <Switch
              checked={settings.show_only_products_with_images}
              onCheckedChange={(checked) => handleChange('show_only_products_with_images', checked)}
              disabled={!canChangeSettings}
            />
          </div>
        </div>

        {/* WhatsApp Commercial */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Phone className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">WhatsApp Comercial</h3>
              <p className="text-gray-400 text-sm mt-1">
                Número de WhatsApp donde se recibirán las notificaciones de pedidos, solicitudes de compra y reservas.
              </p>
              <div className="mt-3">
                <label className="block text-sm text-gray-400 mb-1">Número de WhatsApp</label>
                <input
                  type="text"
                  value={settings.whatsapp_commercial}
                  onChange={(e) => handleChange('whatsapp_commercial', e.target.value)}
                  placeholder="+595973666000"
                  disabled={!canChangeSettings}
                  className="w-full max-w-xs px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                />
                <p className="text-gray-500 text-xs mt-1">Formato: +595XXXXXXXXX (incluir código de país)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Info */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Settings className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Estados de Pedidos</h3>
              <p className="text-gray-400 text-sm mt-1 mb-4">
                Flujo de estados según la configuración de la pasarela de pago
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-neutral-700/50 rounded-lg p-4">
                  <h4 className="text-amber-400 font-medium mb-2">Sin Pasarela de Pago</h4>
                  <ol className="text-sm space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs">1</span>
                      <span><strong>Solicitud</strong> - Cliente envía pedido</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">2</span>
                      <span><strong>Facturado</strong> - Admin confirma y factura</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">3</span>
                      <span><strong>Entregado</strong> - Pedido completado</span>
                    </li>
                  </ol>
                </div>
                <div className="bg-neutral-700/50 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-2">Con Pasarela de Pago</h4>
                  <ol className="text-sm space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">1</span>
                      <span><strong>Pagado</strong> - Pago exitoso en Bancard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs">2</span>
                      <span><strong>Facturado</strong> - Admin factura el pedido</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs">3</span>
                      <span><strong>Entregado</strong> - Pedido completado</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!canChangeSettings && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-center">
          <p className="text-amber-400 text-sm">
            Solo los administradores pueden modificar la configuración del sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
