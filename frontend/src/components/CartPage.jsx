import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';

export const CartPage = ({ cart, setCart }) => {
  const navigate = useNavigate();

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#0d0d0d' }}>
        <ShoppingBag className="w-16 h-16 mb-4" style={{ color: '#333' }} />
        <h2 className="text-2xl font-light mb-2" style={{ color: '#f5ede4' }}>
          Tu carrito está vacío
        </h2>
        <p className="mb-6" style={{ color: '#a8a8a8' }}>
          Explora nuestra tienda y encuentra productos increíbles
        </p>
        <Button
          onClick={() => navigate('/shop')}
          style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
        >
          Ir a la tienda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/shop')}
            className="p-2 rounded-full"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#d4a968' }} />
          </button>
          <h1 className="text-2xl font-light italic" style={{ color: '#d4a968' }}>
            Mi Carrito
          </h1>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {cart.map((item) => (
            <div
              key={item.product_id}
              className="flex gap-4 p-4 rounded-lg"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
            >
              {/* Image */}
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#2a2a2a' }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span style={{ color: '#666' }}>Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium line-clamp-2 mb-1" style={{ color: '#f5ede4' }}>
                  {item.name}
                </h3>
                <p className="text-lg" style={{ color: '#d4a968' }}>
                  {formatPrice(item.price)}
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    className="p-1 rounded"
                    style={{ backgroundColor: '#2a2a2a' }}
                  >
                    <Minus className="w-4 h-4" style={{ color: '#a8a8a8' }} />
                  </button>
                  <span style={{ color: '#f5ede4' }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    className="p-1 rounded"
                    style={{ backgroundColor: '#2a2a2a' }}
                  >
                    <Plus className="w-4 h-4" style={{ color: '#a8a8a8' }} />
                  </button>
                </div>
              </div>

              {/* Subtotal & Remove */}
              <div className="flex flex-col items-end justify-between">
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="p-2 rounded"
                  style={{ color: '#666' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <p className="font-medium" style={{ color: '#f5ede4' }}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #d4a968' }}>
          <div className="flex justify-between items-center mb-4">
            <span style={{ color: '#a8a8a8' }}>Subtotal</span>
            <span style={{ color: '#f5ede4' }}>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid #333' }}>
            <span style={{ color: '#a8a8a8' }}>Envío</span>
            <span style={{ color: '#a8a8a8' }}>Calculado en checkout</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-lg font-medium" style={{ color: '#f5ede4' }}>Total</span>
            <span className="text-xl font-medium" style={{ color: '#d4a968' }}>{formatPrice(subtotal)}</span>
          </div>

          <Button
            onClick={() => navigate('/shop/checkout')}
            className="w-full py-3"
            style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
          >
            Proceder al pago
          </Button>
          
          <button
            onClick={() => navigate('/shop')}
            className="w-full mt-3 py-2 text-center"
            style={{ color: '#a8a8a8' }}
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
