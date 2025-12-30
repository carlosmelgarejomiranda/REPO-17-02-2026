import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const OrderSuccessPage = ({ setCart }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Clear cart on success
    setCart([]);
    
    // Fetch order details
    if (orderId) {
      fetch(`${API_URL}/api/shop/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching order:', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId, setCart]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#d4a968' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-3xl font-light italic mb-2" style={{ color: '#d4a968' }}>
            ¡Pedido confirmado!
          </h1>
          <p style={{ color: '#a8a8a8' }}>
            Gracias por tu compra. Te hemos enviado un email con los detalles.
          </p>
        </div>

        {order && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-5 h-5" style={{ color: '#d4a968' }} />
                <h2 className="text-lg font-medium" style={{ color: '#f5ede4' }}>
                  Pedido #{order.order_id}
                </h2>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#a8a8a8' }}>Estado</span>
                  <span className="px-2 py-1 rounded text-xs" style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                    color: '#22c55e' 
                  }}>
                    {order.order_status === 'confirmed' ? 'Confirmado' : order.order_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#a8a8a8' }}>Fecha</span>
                  <span style={{ color: '#f5ede4' }}>
                    {new Date(order.created_at).toLocaleDateString('es-PY', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <h3 className="font-medium mb-4" style={{ color: '#f5ede4' }}>Productos</h3>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span style={{ color: '#a8a8a8' }}>{item.name} x{item.quantity}</span>
                    <span style={{ color: '#f5ede4' }}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid #333' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#a8a8a8' }}>Subtotal</span>
                  <span style={{ color: '#f5ede4' }}>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#a8a8a8' }}>Envío</span>
                  <span style={{ color: '#f5ede4' }}>{formatPrice(order.delivery_cost || 0)}</span>
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #333' }}>
                  <span className="font-medium" style={{ color: '#f5ede4' }}>Total</span>
                  <span className="font-medium" style={{ color: '#d4a968' }}>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <h3 className="font-medium mb-4" style={{ color: '#f5ede4' }}>
                {order.delivery_type === 'delivery' ? 'Dirección de entrega' : 'Retiro en tienda'}
              </h3>
              
              {order.delivery_type === 'delivery' && order.delivery_address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#d4a968' }} />
                  <div>
                    <p style={{ color: '#f5ede4' }}>{order.delivery_address.address}</p>
                    {order.delivery_address.reference && (
                      <p className="text-sm mt-1" style={{ color: '#a8a8a8' }}>
                        Ref: {order.delivery_address.reference}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#d4a968' }} />
                  <div>
                    <p style={{ color: '#f5ede4' }}>Avenue Store</p>
                    <p className="text-sm" style={{ color: '#a8a8a8' }}>
                      Paseo Los Árboles, Av. San Martín, Asunción
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <h3 className="font-medium mb-4" style={{ color: '#f5ede4' }}>Información de contacto</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" style={{ color: '#a8a8a8' }} />
                  <span style={{ color: '#f5ede4' }}>{order.customer_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4" style={{ color: '#a8a8a8' }} />
                  <span style={{ color: '#f5ede4' }}>{order.customer_phone}</span>
                </div>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: '#1a1a1a', border: '1px solid #d4a968' }}>
              <p className="mb-4" style={{ color: '#a8a8a8' }}>
                ¿Tienes alguna pregunta sobre tu pedido?
              </p>
              <a
                href="https://wa.me/595973666000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg"
                style={{ backgroundColor: '#25D366', color: 'white' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            onClick={() => navigate('/shop')}
            className="flex-1 py-3"
            style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
          >
            Seguir comprando
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="flex-1 py-3"
            style={{ color: '#a8a8a8', border: '1px solid #333' }}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
