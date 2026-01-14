import React, { useState } from 'react';
import { getApiUrl } from '../utils/api';
import { X, Minus, Plus, Check } from 'lucide-react';

const API_URL = getApiUrl();

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

export const ProductDetailModal = ({ product, onClose, onAddToCart, formatPrice }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const sizes = product.available_sizes || [];
  const imageUrl = resolveImageUrl(product.image);

  const handleAddToCart = () => {
    if (!selectedSize && sizes.length > 0) {
      return;
    }
    onAddToCart(product, selectedSize, quantity);
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
      onClose();
    }, 1200);
  };

  // Get selected size info for stock check
  const selectedSizeInfo = selectedSize 
    ? sizes.find(s => s.size === selectedSize)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div 
            className="relative bg-white w-full max-w-5xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Image Section */}
              <div className="aspect-[3/4] md:aspect-auto md:min-h-[600px] bg-[#F5F5F5] relative">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400 tracking-[0.1em] uppercase">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-8 md:p-12 flex flex-col">
                {/* Brand/Category */}
                {product.brand && (
                  <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-2">
                    {product.brand}
                  </p>
                )}

                {/* Name */}
                <h2 className="text-2xl font-normal text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h2>

                {/* Price */}
                <p className="text-lg text-gray-900 mb-8">
                  {formatPrice(product.price)}
                </p>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">
                    {product.description}
                  </p>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs tracking-[0.15em] uppercase text-gray-900">
                        Seleccionar talla
                      </span>
                      {!selectedSize && (
                        <span className="text-xs text-red-500">Requerido</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((sizeInfo) => {
                        const isAvailable = sizeInfo.stock > 0;
                        const isSelected = selectedSize === sizeInfo.size;
                        return (
                          <button
                            key={sizeInfo.size}
                            onClick={() => isAvailable && setSelectedSize(sizeInfo.size)}
                            disabled={!isAvailable}
                            className={`min-w-[50px] h-12 px-4 text-sm border transition-all duration-200 ${
                              isSelected
                                ? 'bg-gray-900 text-white border-gray-900'
                                : isAvailable
                                  ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                                  : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through'
                            }`}
                          >
                            {sizeInfo.size}
                          </button>
                        );
                      })}
                    </div>
                    {selectedSizeInfo && (
                      <p className="text-xs text-gray-400 mt-3">
                        {selectedSizeInfo.stock} {selectedSizeInfo.stock === 1 ? 'disponible' : 'disponibles'}
                      </p>
                    )}
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-8">
                  <span className="text-xs tracking-[0.15em] uppercase text-gray-900 block mb-4">
                    Cantidad
                  </span>
                  <div className="flex items-center border border-gray-200 w-fit">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 h-12 flex items-center justify-center text-sm text-gray-900 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-12 h-12 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={sizes.length > 0 && !selectedSize}
                  className={`w-full py-4 text-sm tracking-[0.15em] uppercase transition-all duration-300 ${
                    addedToCart
                      ? 'bg-green-600 text-white'
                      : sizes.length > 0 && !selectedSize
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {addedToCart ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Agregado
                    </span>
                  ) : (
                    'Agregar al carrito'
                  )}
                </button>

                {/* Additional Info */}
                <div className="mt-auto pt-8 border-t border-gray-100 space-y-4">
                  {product.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Categoría</span>
                      <span className="text-gray-900">{product.category}</span>
                    </div>
                  )}
                  {product.variant_count > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Variantes</span>
                      <span className="text-gray-900">{product.variant_count} opciones</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
