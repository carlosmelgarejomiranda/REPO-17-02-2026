import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, X, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const ShopPage = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/shop/products?page=${currentPage}&limit=12`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (priceRange.min) url += `&min_price=${priceRange.min}`;
      if (priceRange.max) url += `&max_price=${priceRange.max}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setProducts(data.products || []);
      setTotalPages(data.total_pages || 1);
      setTotalProducts(data.total || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      }];
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #333' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light italic" style={{ color: '#d4a968' }}>
              Avenue Online
            </h1>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-4 py-2 rounded-lg pr-10"
                    style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#f5ede4' }}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
                </div>
              </form>

              {/* Filter button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                className="flex items-center gap-2"
                style={{ color: '#a8a8a8' }}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline">Filtros</span>
              </Button>

              {/* Cart button */}
              <Button
                onClick={() => navigate('/shop/cart')}
                className="flex items-center gap-2 relative"
                style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}>
                    {cartCount}
                  </span>
                )}
                <span className="hidden md:inline">{formatPrice(cartTotal)}</span>
              </Button>
            </div>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mt-4 md:hidden">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg pr-10"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#f5ede4' }}
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
            </div>
          </form>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Precio mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-32 px-3 py-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Precio máximo</label>
                  <input
                    type="number"
                    placeholder="999999999"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-32 px-3 py-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                  />
                </div>
                <Button
                  onClick={() => { setCurrentPage(1); fetchProducts(); }}
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                >
                  Aplicar filtros
                </Button>
                <Button
                  onClick={() => { setPriceRange({ min: '', max: '' }); setSearchTerm(''); setCurrentPage(1); }}
                  variant="ghost"
                  style={{ color: '#a8a8a8' }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="mb-6" style={{ color: '#a8a8a8' }}>
          {totalProducts} productos encontrados
        </p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-lg overflow-hidden animate-pulse" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="aspect-square" style={{ backgroundColor: '#2a2a2a' }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded" style={{ backgroundColor: '#2a2a2a' }} />
                  <div className="h-4 w-1/2 rounded" style={{ backgroundColor: '#2a2a2a' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: '#a8a8a8' }}>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCart(product)}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="ghost"
              style={{ color: currentPage === 1 ? '#666' : '#d4a968' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <span style={{ color: '#f5ede4' }}>
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="ghost"
              style={{ color: currentPage === totalPages ? '#666' : '#d4a968' }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, formatPrice }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div 
      className="rounded-lg overflow-hidden group transition-all hover:scale-[1.02]"
      style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
    >
      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ color: '#666' }}>Sin imagen</span>
          </div>
        )}
        
        {product.discount > 0 && (
          <span 
            className="absolute top-2 left-2 px-2 py-1 text-xs rounded"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            -{product.discount}%
          </span>
        )}
        
        <button
          onClick={onAddToCart}
          className="absolute bottom-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="text-sm font-medium line-clamp-2 mb-2" style={{ color: '#f5ede4' }}>
          {product.name}
        </h3>
        <p className="text-lg font-light" style={{ color: '#d4a968' }}>
          {formatPrice(product.price)}
        </p>
        {product.stock < 5 && product.stock > 0 && (
          <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>
            ¡Últimas {Math.floor(product.stock)} unidades!
          </p>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
