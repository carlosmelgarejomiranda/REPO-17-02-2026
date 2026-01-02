import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { ShopHeader } from './ShopHeader';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

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

export const CartPage = ({ cart, setCart, user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const navigate = useNavigate();

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cart_item_id === cartItemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cart_item_id !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <ShopHeader 
          cart={cart} 
          user={user} 
          onLoginClick={onLoginClick} 
          onLogout={onLogout}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
        <div className="flex flex-col items-center justify-center px-4 py-24">
          <ShoppingBag className="w-16 h-16 mb-6 text-gray-300" />
          <h2 className="text-2xl font-normal text-gray-900 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-500 mb-8">
            Explora nuestra tienda y encuentra productos increíbles
          </p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-4 bg-gray-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors"
          >
            Continuar comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <ShopHeader 
        cart={cart} 
        user={user} 
        onLoginClick={onLoginClick} 
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      {/* Page Title Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/shop')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="tracking-[0.1em] uppercase">Continuar comprando</span>
          </button>
          <h1 className="text-2xl font-normal text-gray-900">
            Carrito ({cart.length} {cart.length === 1 ? 'artículo' : 'artículos'})
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-0">
            {cart.map((item, index) => (
              <div 
                key={item.cart_item_id}
                className={`flex gap-6 py-8 ${index !== cart.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                {/* Product Image */}
                <div className="w-28 h-36 bg-[#F5F5F5] flex-shrink-0">
                  {resolveImageUrl(item.image) ? (
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm text-gray-900 mb-1 leading-tight">
                        {item.name}
                      </h3>
                      {item.size && (
                        <p className="text-sm text-gray-500">Talla: {item.size}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.cart_item_id)}
                      className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto flex items-end justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, -1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 h-10 flex items-center justify-center text-sm text-gray-900 border-x border-gray-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, 1)}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <p className="text-sm text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 sticky top-8">
              <h2 className="text-xs tracking-[0.2em] uppercase text-gray-900 mb-6">
                Resumen del pedido
              </h2>

              <div className="space-y-4 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="text-gray-400">Calculado en checkout</span>
                </div>
              </div>

              <div className="flex justify-between py-6 border-b border-gray-200">
                <span className="text-sm text-gray-900">Total</span>
                <span className="text-lg text-gray-900">{formatPrice(subtotal)}</span>
              </div>

              <button
                onClick={() => navigate('/shop/checkout')}
                className="w-full mt-6 py-4 bg-gray-900 text-white text-sm tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors"
              >
                Proceder al checkout
              </button>

              <p className="text-xs text-gray-400 text-center mt-6">
                Impuestos incluidos. Envío calculado en el checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
