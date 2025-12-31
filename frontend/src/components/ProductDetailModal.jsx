import React, { useState } from 'react';
import { X, ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to resolve image URLs - handles both relative and absolute URLs
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

export const ProductDetailModal = ({ product, onClose, onAddToCart, formatPrice }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const availableSizes = product.available_sizes || [];
  const sizesList = product.sizes_list || [];

  const handleAddToCart = () => {
    if (!selectedSize && availableSizes.length > 0) {
      return; // Don't add if no size selected
    }
    
    onAddToCart(product, selectedSize, quantity);
    setAddedToCart(true);
    
    // Reset after animation
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  const getSelectedSizeStock = () => {
    if (!selectedSize) return 0;
    const sizeInfo = availableSizes.find(s => s.size === selectedSize);
    return sizeInfo ? sizeInfo.stock : 0;
  };

  const selectedStock = getSelectedSizeStock();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full z-10 transition-colors hover:bg-black/20"
          style={{ color: '#a8a8a8' }}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div 
            className="aspect-square md:aspect-auto md:min-h-[500px] relative"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {product.image && !imageError ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <span className="text-6xl mb-4 block" style={{ color: '#333' }}>
                    📷
                  </span>
                  <span style={{ color: '#666' }}>Imagen no disponible</span>
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.discount > 0 && (
                <span 
                  className="px-3 py-1 text-sm rounded-full"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  -{product.discount}%
                </span>
              )}
              {product.variant_count > 1 && (
                <span 
                  className="px-3 py-1 text-sm rounded-full"
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                >
                  {product.variant_count} variantes
                </span>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Brand/Category */}
            <p className="text-sm tracking-wide mb-2" style={{ color: '#d4a968' }}>
              {product.brand || product.category}
            </p>

            {/* Product Name */}
            <h2 className="text-2xl md:text-3xl font-light mb-4" style={{ color: '#f5ede4' }}>
              {product.name}
            </h2>

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-light" style={{ color: '#d4a968' }}>
                {formatPrice(product.price)}
              </p>
              {product.max_price && product.max_price !== product.price && (
                <p className="text-sm mt-1" style={{ color: '#666' }}>
                  Hasta {formatPrice(product.max_price)}
                </p>
              )}
            </div>

            {/* Size Selection */}
            {sizesList.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: '#f5ede4' }}>
                    Seleccionar Talle
                  </p>
                  {selectedSize && (
                    <p className="text-xs" style={{ color: '#a8a8a8' }}>
                      {selectedStock > 0 ? `${selectedStock} disponibles` : 'Sin stock'}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sizeInfo) => {
                    const isSelected = selectedSize === sizeInfo.size;
                    const hasStock = sizeInfo.stock > 0;
                    
                    return (
                      <button
                        key={sizeInfo.size}
                        onClick={() => hasStock && setSelectedSize(sizeInfo.size)}
                        disabled={!hasStock}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${!hasStock ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer hover:scale-105'}
                        `}
                        style={{ 
                          backgroundColor: isSelected ? '#d4a968' : '#2a2a2a',
                          color: isSelected ? '#0d0d0d' : '#f5ede4',
                          border: isSelected ? '2px solid #d4a968' : '1px solid #444'
                        }}
                      >
                        {sizeInfo.size}
                      </button>
                    );
                  })}
                </div>
                {!selectedSize && availableSizes.length > 0 && (
                  <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
                    * Selecciona un talle para continuar
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {selectedSize && selectedStock > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3" style={{ color: '#f5ede4' }}>
                  Cantidad
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4' }}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center" style={{ color: '#f5ede4' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(selectedStock, q + 1))}
                    disabled={quantity >= selectedStock}
                    className="p-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#2a2a2a', color: '#f5ede4' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Stock info */}
            {product.stock <= 5 && product.stock > 0 && (
              <p className="text-sm mb-4" style={{ color: '#ef4444' }}>
                ¡Últimas {Math.floor(product.stock)} unidades!
              </p>
            )}

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={availableSizes.length > 0 && !selectedSize}
              className={`
                w-full py-4 text-lg font-medium rounded-lg flex items-center justify-center gap-3
                transition-all
                ${addedToCart ? 'scale-95' : ''}
              `}
              style={{ 
                backgroundColor: addedToCart ? '#22c55e' : '#d4a968', 
                color: '#0d0d0d',
                opacity: (availableSizes.length > 0 && !selectedSize) ? 0.5 : 1
              }}
            >
              {addedToCart ? (
                <>
                  <Check className="w-5 h-5" />
                  ¡Agregado al carrito!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Agregar al Carrito
                  {selectedSize && quantity > 1 && ` (${quantity})`}
                </>
              )}
            </Button>

            {/* Subtotal */}
            {selectedSize && (
              <p className="text-center mt-3 text-sm" style={{ color: '#a8a8a8' }}>
                Subtotal: {formatPrice(product.price * quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
