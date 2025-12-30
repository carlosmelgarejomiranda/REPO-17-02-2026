import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { ArrowLeft, MapPin, Store, Truck, CreditCard, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -25.2867,
  lng: -57.6474
};

export const CheckoutPage = ({ cart, setCart, user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [storeLocation, setStoreLocation] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [reference, setReference] = useState('');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    notes: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const geocoderRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_KEY
  });

  useEffect(() => {
    // Fetch store location
    fetch(`${API_URL}/api/shop/store-location`)
      .then(res => res.json())
      .then(data => {
        setStoreLocation({ lat: data.lat, lng: data.lng });
      })
      .catch(console.error);
  }, []);

  const calculateDelivery = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(`${API_URL}/api/shop/calculate-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      const data = await response.json();
      setDeliveryCost(data.delivery_cost);
      setDeliveryDistance(data.distance_km);
    } catch (err) {
      console.error('Error calculating delivery:', err);
    }
  }, []);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setSelectedLocation({ lat, lng });
    calculateDelivery(lat, lng);

    // Reverse geocode to get address
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  }, [calculateDelivery]);

  const onMapLoad = useCallback((map) => {
    geocoderRef.current = new window.google.maps.Geocoder();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + (deliveryType === 'delivery' ? deliveryCost : 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (deliveryType === 'delivery' && !selectedLocation) {
      alert('Por favor selecciona una ubicación de entrega en el mapa');
      return;
    }

    setLoading(true);

    try {
      const checkoutData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          image: item.image
        })),
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: address,
          reference: reference
        } : null,
        payment_method: paymentMethod,
        notes: formData.notes
      };

      const response = await fetch(`${API_URL}/api/shop/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });

      const data = await response.json();

      if (data.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.detail || 'Error al procesar el pago');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error al procesar el pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/shop/cart');
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/shop/cart')}
            className="p-2 rounded-full"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#d4a968' }} />
          </button>
          <h1 className="text-2xl font-light italic" style={{ color: '#d4a968' }}>
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#f5ede4' }}>
              Información de contacto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Teléfono/WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="+595..."
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                />
              </div>
            </div>
          </div>

          {/* Delivery Type */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#f5ede4' }}>
              Método de entrega
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  deliveryType === 'delivery' ? 'ring-2 ring-[#d4a968]' : ''
                }`}
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
              >
                <Truck className="w-6 h-6" style={{ color: deliveryType === 'delivery' ? '#d4a968' : '#666' }} />
                <span style={{ color: deliveryType === 'delivery' ? '#d4a968' : '#a8a8a8' }}>Delivery</span>
                <span className="text-xs" style={{ color: '#666' }}>2.500 Gs/km (mín. 15.000)</span>
              </button>
              
              <button
                type="button"
                onClick={() => { setDeliveryType('pickup'); setDeliveryCost(0); }}
                className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  deliveryType === 'pickup' ? 'ring-2 ring-[#d4a968]' : ''
                }`}
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
              >
                <Store className="w-6 h-6" style={{ color: deliveryType === 'pickup' ? '#d4a968' : '#666' }} />
                <span style={{ color: deliveryType === 'pickup' ? '#d4a968' : '#a8a8a8' }}>Retiro en tienda</span>
                <span className="text-xs" style={{ color: '#22c55e' }}>Gratis</span>
              </button>
            </div>

            {/* Map for delivery */}
            {deliveryType === 'delivery' && (
              <div className="mt-6 space-y-4">
                <p className="text-sm" style={{ color: '#a8a8a8' }}>
                  Haz clic en el mapa para seleccionar tu ubicación de entrega
                </p>
                
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={selectedLocation || storeLocation}
                    zoom={13}
                    onClick={onMapClick}
                    onLoad={onMapLoad}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d0d" }] },
                      ]
                    }}
                  >
                    {/* Store marker */}
                    <Marker
                      position={storeLocation}
                      icon={{
                        url: 'data:image/svg+xml,' + encodeURIComponent(`
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d4a968" width="32" height="32">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        `),
                        scaledSize: new window.google.maps.Size(32, 32)
                      }}
                      title="Avenue Store"
                    />
                    
                    {/* Delivery location marker */}
                    {selectedLocation && (
                      <Marker
                        position={selectedLocation}
                        icon={{
                          url: 'data:image/svg+xml,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="32" height="32">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(32, 32)
                        }}
                        title="Tu ubicación"
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="h-[300px] rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2a2a2a' }}>
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#d4a968' }} />
                  </div>
                )}

                {selectedLocation && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#2a2a2a' }}>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                      <div className="flex-1">
                        <p className="text-sm" style={{ color: '#f5ede4' }}>{address || 'Ubicación seleccionada'}</p>
                        <p className="text-xs mt-1" style={{ color: '#a8a8a8' }}>
                          Distancia: {deliveryDistance.toFixed(1)} km • Costo: {formatPrice(deliveryCost)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Referencia (opcional)</label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ej: Casa blanca, portón negro"
                        className="w-full px-3 py-2 rounded text-sm"
                        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#f5ede4' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#f5ede4' }}>
              Método de pago
            </h2>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`w-full p-4 rounded-lg flex items-center gap-4 transition-all ${
                  paymentMethod === 'stripe' ? 'ring-2 ring-[#d4a968]' : ''
                }`}
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
              >
                <CreditCard className="w-6 h-6" style={{ color: paymentMethod === 'stripe' ? '#d4a968' : '#666' }} />
                <div className="text-left">
                  <span style={{ color: paymentMethod === 'stripe' ? '#d4a968' : '#f5ede4' }}>
                    Tarjeta de crédito/débito
                  </span>
                  <p className="text-xs" style={{ color: '#666' }}>Visa, Mastercard, American Express</p>
                </div>
              </button>
              
              {/* Bancard - Coming soon */}
              <div
                className="w-full p-4 rounded-lg flex items-center gap-4 opacity-50 cursor-not-allowed"
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #333' }}
              >
                <CreditCard className="w-6 h-6" style={{ color: '#666' }} />
                <div className="text-left">
                  <span style={{ color: '#a8a8a8' }}>Bancard</span>
                  <p className="text-xs" style={{ color: '#666' }}>Próximamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#f5ede4' }}>
              Notas del pedido
            </h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instrucciones especiales, comentarios..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg resize-none"
              style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
            />
          </div>

          {/* Order Summary */}
          <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #d4a968' }}>
            <h2 className="text-lg font-medium mb-4" style={{ color: '#f5ede4' }}>
              Resumen del pedido
            </h2>
            
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span style={{ color: '#a8a8a8' }}>{item.name} x{item.quantity}</span>
                  <span style={{ color: '#f5ede4' }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 pt-4" style={{ borderTop: '1px solid #333' }}>
              <div className="flex justify-between">
                <span style={{ color: '#a8a8a8' }}>Subtotal</span>
                <span style={{ color: '#f5ede4' }}>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#a8a8a8' }}>Envío</span>
                <span style={{ color: deliveryType === 'pickup' ? '#22c55e' : '#f5ede4' }}>
                  {deliveryType === 'pickup' ? 'Gratis' : formatPrice(deliveryCost)}
                </span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #333' }}>
                <span className="text-lg font-medium" style={{ color: '#f5ede4' }}>Total</span>
                <span className="text-xl font-medium" style={{ color: '#d4a968' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || (deliveryType === 'delivery' && !selectedLocation)}
              className="w-full mt-6 py-3 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pagar {formatPrice(total)}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
