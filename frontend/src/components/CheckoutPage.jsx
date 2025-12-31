import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { ArrowLeft, MapPin, Store, Truck, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || '';

const mapContainerStyle = {
  width: '100%',
  height: '300px'
};

const defaultCenter = {
  lat: -25.2867,
  lng: -57.6474
};

// Helper to resolve image URLs
const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/api/')) {
    return `${API_URL}${imageUrl}`;
  }
  return imageUrl;
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
  const geocoderRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_KEY
  });

  useEffect(() => {
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

    if (!formData.name || !formData.email || !formData.phone) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      const checkoutData = {
        items: cart.map(item => ({
          product_id: item.product_id || item.cart_item_id,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          size: item.size || null,
          image: item.image,
          sku: item.sku || ''
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
        payment_method: 'stripe',
        notes: formData.notes
      };

      const response = await fetch(`${API_URL}/api/shop/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutData)
      });

      const data = await response.json();

      if (data.checkout_url) {
        setCart([]);
        localStorage.removeItem('avenue_cart');
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
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/shop/cart')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="tracking-[0.1em] uppercase">Volver al carrito</span>
          </button>
          <h1 className="text-2xl font-normal text-gray-900">Checkout</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* Contact Info */}
              <section className="bg-white p-8">
                <h2 className="text-xs tracking-[0.2em] uppercase text-gray-900 mb-6">
                  Información de contacto
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Nombre completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Teléfono/WhatsApp *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+595..."
                        className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Delivery Method */}
              <section className="bg-white p-8">
                <h2 className="text-xs tracking-[0.2em] uppercase text-gray-900 mb-6">
                  Método de entrega
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('delivery')}
                    className={`p-6 text-left transition-all border ${
                      deliveryType === 'delivery' 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck className={`w-5 h-5 mb-3 ${deliveryType === 'delivery' ? 'text-gray-900' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${deliveryType === 'delivery' ? 'text-gray-900' : 'text-gray-600'}`}>
                      Delivery
                    </p>
                    <p className="text-xs text-gray-400 mt-1">2.500 Gs/km (mín. 15.000)</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setDeliveryType('pickup'); setDeliveryCost(0); }}
                    className={`p-6 text-left transition-all border ${
                      deliveryType === 'pickup' 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Store className={`w-5 h-5 mb-3 ${deliveryType === 'pickup' ? 'text-gray-900' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${deliveryType === 'pickup' ? 'text-gray-900' : 'text-gray-600'}`}>
                      Retiro en tienda
                    </p>
                    <p className="text-xs text-green-600 mt-1">Gratis</p>
                  </button>
                </div>

                {/* Map for delivery */}
                {deliveryType === 'delivery' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Selecciona tu ubicación de entrega en el mapa
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
                            { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                            { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                            { featureType: "water", elementType: "geometry", stylers: [{ color: "#e9e9e9" }] },
                          ]
                        }}
                      >
                        <Marker
                          position={storeLocation}
                          icon={{
                            url: 'data:image/svg+xml,' + encodeURIComponent(`
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000" width="32" height="32">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                            `),
                            scaledSize: new window.google.maps.Size(32, 32)
                          }}
                          title="Avenue Store"
                        />
                        
                        {selectedLocation && (
                          <Marker
                            position={selectedLocation}
                            icon={{
                              url: 'data:image/svg+xml,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" width="32" height="32">
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
                      <div className="h-[300px] bg-gray-100 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      </div>
                    )}

                    {selectedLocation && (
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{address || 'Ubicación seleccionada'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Distancia: {deliveryDistance.toFixed(1)} km • Costo: {formatPrice(deliveryCost)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Referencia (opcional): Casa blanca, portón negro..."
                            className="w-full px-4 py-3 bg-white border-0 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {deliveryType === 'pickup' && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Store className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">Avenue Store</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Paseo Los Árboles, Av. San Martín, Asunción
                        </p>
                        <p className="text-xs text-gray-500">
                          Lunes a Sábado: 10:00 - 20:00
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Notes */}
              <section className="bg-white p-8">
                <h2 className="text-xs tracking-[0.2em] uppercase text-gray-900 mb-6">
                  Notas adicionales
                </h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instrucciones especiales para tu pedido..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-0 text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-gray-200"
                />
              </section>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 sticky top-8">
                <h2 className="text-xs tracking-[0.2em] uppercase text-gray-900 mb-6">
                  Resumen del pedido
                </h2>

                {/* Cart Items */}
                <div className="space-y-4 pb-6 border-b border-gray-100">
                  {cart.map(item => (
                    <div key={item.cart_item_id} className="flex gap-4">
                      <div className="w-16 h-20 bg-gray-100 flex-shrink-0">
                        {resolveImageUrl(item.image) ? (
                          <img
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            Sin img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{item.name}</p>
                        {item.size && (
                          <p className="text-xs text-gray-500">Talla: {item.size}</p>
                        )}
                        <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 py-6 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Envío</span>
                    <span className="text-gray-900">
                      {deliveryType === 'pickup' ? 'Gratis' : formatPrice(deliveryCost)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between py-6">
                  <span className="text-sm text-gray-900">Total</span>
                  <span className="text-lg text-gray-900">{formatPrice(total)}</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || (deliveryType === 'delivery' && !selectedLocation)}
                  className="w-full py-4 bg-gray-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Pagar con Stripe'
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-6">
                  Al realizar el pedido, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
