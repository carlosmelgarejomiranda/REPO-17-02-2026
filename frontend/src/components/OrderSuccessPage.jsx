import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Phone, Mail, Loader2, AlertCircle, MessageCircle, Clock } from 'lucide-react';
import { ShopHeader } from './ShopHeader';

const API_URL = getApiUrl();

export const OrderSuccessPage = ({ setCart, user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [pollAttempts, setPollAttempts] = useState(0);

  const orderId = searchParams.get('order_id');
  const sessionId = searchParams.get('session_id');
  const orderType = searchParams.get('type'); // 'request', 'pending', or null for paid

  const pollPaymentStatus = useCallback(async (attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/shop/checkout/status/${sessionId}`);
      if (!response.ok) throw new Error('Failed to check status');
      
      const data = await response.json();
      
      if (data.payment_status === 'paid') {
        setPaymentStatus('paid');
        const orderRes = await fetch(`${API_URL}/api/shop/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
        }
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        return;
      }
      
      setPollAttempts(attempts + 1);
      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  }, [sessionId, orderId]);

  useEffect(() => {
    setCart([]);
    localStorage.removeItem('avenue_cart');
    
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Handle request type (payment gateway disabled)
    if (orderType === 'request') {
      setPaymentStatus('request');
    } else if (orderType === 'pending') {
      setPaymentStatus('pending_payment');
    }

    fetch(`${API_URL}/api/shop/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        setOrder(data);
        setLoading(false);
        
        // If we have a sessionId and no orderType, poll for payment status
        if (sessionId && !orderType && data.payment_status !== 'paid') {
          setPaymentStatus('checking');
          pollPaymentStatus(0);
        } else if (data.payment_status === 'paid' || data.order_status === 'pagado') {
          setPaymentStatus('paid');
        } else if (data.order_status === 'solicitud') {
          setPaymentStatus('request');
        }
      })
      .catch(err => {
        console.error('Error fetching order:', err);
        setLoading(false);
      });
  }, [orderId, sessionId, orderType, setCart, pollPaymentStatus]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <ShopHeader 
          cart={[]} 
          user={user} 
          onLoginClick={onLoginClick} 
          onLogout={onLogout}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // No order found
  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <ShopHeader 
          cart={[]} 
          user={user} 
          onLoginClick={onLoginClick} 
          onLogout={onLogout}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
        <div className="flex flex-col items-center justify-center px-6 py-24">
          <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
          <h1 className="text-xl text-gray-900 mb-2">Pedido no encontrado</h1>
          <p className="text-gray-500 mb-6">No pudimos encontrar los detalles de tu pedido.</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3 bg-gray-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors"
          >
            Ir a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <ShopHeader 
        cart={[]} 
        user={user} 
        onLoginClick={onLoginClick} 
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          {paymentStatus === 'checking' ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-6" />
              <h1 className="text-2xl font-normal text-gray-900 mb-2">
                Verificando pago...
              </h1>
              <p className="text-gray-500">
                Por favor espera mientras confirmamos tu pago
              </p>
            </>
          ) : paymentStatus === 'request' ? (
            <>
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">
                ¡Solicitud Enviada!
              </h1>
              <p className="text-gray-500 max-w-md mx-auto">
                Hemos recibido tu pedido. Te contactaremos por WhatsApp para confirmar los detalles y coordinar el pago.
              </p>
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Respuesta en menos de 24 horas</span>
                </div>
              </div>
            </>
          ) : paymentStatus === 'pending_payment' ? (
            <>
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-normal text-gray-900 mb-2">
                Pedido Registrado
              </h1>
              <p className="text-gray-500 max-w-md mx-auto">
                Tu pedido ha sido registrado. La pasarela de pago está temporalmente no disponible. 
                Te contactaremos por WhatsApp para coordinar el pago.
              </p>
            </>
          ) : paymentStatus === 'paid' ? (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-6" />
              <h1 className="text-2xl font-normal text-gray-900 mb-2">
                ¡Gracias por tu compra!
              </h1>
              <p className="text-gray-500">
                Tu pedido ha sido confirmado y está siendo procesado
              </p>
            </>
          ) : (
            <>
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-6" />
              <h1 className="text-2xl font-normal text-gray-900 mb-2">
                Pedido Recibido
              </h1>
              <p className="text-gray-500">
                {paymentStatus === 'timeout' 
                  ? 'No pudimos confirmar el pago. Por favor contacta soporte.'
                  : 'Tu pedido está pendiente de confirmación de pago.'}
              </p>
            </>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-white p-8 mb-6">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-1">Número de pedido</p>
              <p className="text-lg text-gray-900">{order.order_id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-1">Estado</p>
              <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                paymentStatus === 'paid' 
                  ? 'bg-green-50 text-green-700' 
                  : paymentStatus === 'request'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-yellow-50 text-yellow-700'
              }`}>
                {paymentStatus === 'paid' 
                  ? 'Confirmado' 
                  : paymentStatus === 'request'
                    ? 'Solicitud'
                    : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
            <p className="text-xs tracking-[0.15em] uppercase text-gray-500">Artículos</p>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-900">
                  {item.name} {item.size && `(${item.size})`} × {item.quantity}
                </span>
                <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-6 pb-6 border-b border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPrice(order.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Envío</span>
              <span className="text-gray-900">
                {order.delivery_type === 'pickup' ? 'Retiro en tienda' : formatPrice(order.delivery_cost || 0)}
              </span>
            </div>
            <div className="flex justify-between text-base pt-2">
              <span className="text-gray-900 font-medium">Total</span>
              <span className="text-gray-900 font-medium">{formatPrice(order.total || 0)}</span>
            </div>
          </div>

          {/* Customer & Delivery Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-3">Contacto</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{order.customer_name}</p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {order.customer_email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {order.customer_phone}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-xs tracking-[0.15em] uppercase text-gray-500 mb-3">Entrega</p>
              <div className="space-y-2 text-sm text-gray-600">
                {order.delivery_type === 'pickup' ? (
                  <p>Retiro en tienda</p>
                ) : order.delivery_address ? (
                  <>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {order.delivery_address.address}
                    </p>
                    {order.delivery_address.reference && (
                      <p className="text-gray-400 ml-6">{order.delivery_address.reference}</p>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation message */}
        <div className="text-center text-sm text-gray-500 mb-8">
          <p>Te hemos enviado un email de confirmación a</p>
          <p className="text-gray-900">{order.customer_email}</p>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-4 bg-gray-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
};
