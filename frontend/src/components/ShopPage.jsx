import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Filter, X, Plus, Minus, ChevronLeft, ChevronRight, Tag, Users, Ruler } from 'lucide-react';
import { Button } from './ui/button';
import { ProductDetailModal } from './ProductDetailModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const ShopPage = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    gender: '',
    size: '',
    minPrice: '',
    maxPrice: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    genders: [],
    sizes: []
  });
  const navigate = useNavigate();

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shop/filters`);
        const data = await response.json();
        setFilterOptions({
          categories: data.categories || [],
          genders: data.genders || [],
          sizes: data.sizes || []
        });
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/shop/products?page=${currentPage}&limit=12`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filters.category) url += `&category=${encodeURIComponent(filters.category)}`;
      if (filters.gender) url += `&gender=${encodeURIComponent(filters.gender)}`;
      if (filters.size) url += `&size=${encodeURIComponent(filters.size)}`;
      if (filters.minPrice) url += `&min_price=${filters.minPrice}`;
      if (filters.maxPrice) url += `&max_price=${filters.maxPrice}`;
      
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
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addToCart = (product, selectedSize, quantity = 1) => {
    // Get the specific variant info if a size was selected
    const sizeInfo = selectedSize 
      ? (product.available_sizes || []).find(s => s.size === selectedSize)
      : null;
    
    const cartItemId = sizeInfo 
      ? `${product.id}_${selectedSize}` 
      : product.id;
    
    setCart(prev => {
      const existing = prev.find(item => item.cart_item_id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        cart_item_id: cartItemId,
        product_id: sizeInfo?.product_id || product.id,
        name: product.name,
        size: selectedSize || null,
        price: sizeInfo?.price || product.price,
        image: product.image,
        quantity: quantity,
        sku: sizeInfo?.sku || ''
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

  const clearFilters = () => {
    setFilters({
      category: '',
      gender: '',
      size: '',
      minPrice: '',
      maxPrice: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.category || filters.gender || filters.size || filters.minPrice || filters.maxPrice || searchTerm;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Header */}
      <div className="sticky top-[64px] z-30" style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #333' }}>
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

              {/* Filter toggle button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="ghost"
                className="flex items-center gap-2"
                style={{ color: showFilters ? '#d4a968' : '#a8a8a8' }}
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
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="sticky top-[140px] z-20" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #333' }}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-4 items-center">
              
              {/* Gender Filter */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: '#d4a968' }} />
                <select
                  value={filters.gender}
                  onChange={(e) => { setFilters({ ...filters, gender: e.target.value }); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                >
                  <option value="">Todos</option>
                  {filterOptions.genders.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label} ({g.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" style={{ color: '#d4a968' }} />
                <select
                  value={filters.category}
                  onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg text-sm max-w-[180px]"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                >
                  <option value="">Todas las categorías</option>
                  {filterOptions.categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter */}
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4" style={{ color: '#d4a968' }} />
                <select
                  value={filters.size}
                  onChange={(e) => { setFilters({ ...filters, size: e.target.value }); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                >
                  <option value="">Todos los talles</option>
                  {filterOptions.sizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: '#a8a8a8' }}>Precio:</span>
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="w-24 px-2 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                />
                <span style={{ color: '#666' }}>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="w-24 px-2 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  className="flex items-center gap-1 text-sm"
                  style={{ color: '#ef4444' }}
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.gender && (
                  <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}>
                    {filters.gender}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, gender: '' })} />
                  </span>
                )}
                {filters.category && (
                  <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}>
                    {filters.category}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, category: '' })} />
                  </span>
                )}
                {filters.size && (
                  <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}>
                    Talle: {filters.size}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, size: '' })} />
                  </span>
                )}
                {searchTerm && (
                  <span className="px-3 py-1 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}>
                    "{searchTerm}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchTerm('')} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                className="mt-4"
                style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
              >
                Limpiar filtros
              </Button>
            )}
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
  const [selectedSize, setSelectedSize] = useState(null);
  
  const availableSizes = product.available_sizes || [];
  const sizesList = product.sizes_list || [];
  
  const handleAddToCart = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      // Auto-select first available size
      setSelectedSize(availableSizes[0]);
    }
    onAddToCart(selectedSize || availableSizes[0]);
  };
  
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
        
        {/* Product badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discount > 0 && (
            <span 
              className="px-2 py-1 text-xs rounded"
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              -{product.discount}%
            </span>
          )}
          {product.variant_count > 1 && (
            <span 
              className="px-2 py-1 text-xs rounded"
              style={{ backgroundColor: 'rgba(212, 169, 104, 0.9)', color: '#0d0d0d' }}
            >
              {product.variant_count} talles
            </span>
          )}
        </div>
        
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        <p className="text-xs mb-1" style={{ color: '#d4a968' }}>
          {product.category || product.brand}
        </p>
        <h3 className="text-sm font-medium line-clamp-2 mb-2" style={{ color: '#f5ede4' }}>
          {product.name}
        </h3>
        
        {/* Available Sizes */}
        {sizesList.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {sizesList.slice(0, 6).map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 text-xs rounded"
                style={{ 
                  backgroundColor: '#2a2a2a', 
                  color: '#a8a8a8',
                  border: '1px solid #333'
                }}
              >
                {size}
              </span>
            ))}
            {sizesList.length > 6 && (
              <span className="text-xs" style={{ color: '#666' }}>
                +{sizesList.length - 6}
              </span>
            )}
          </div>
        )}
        
        <p className="text-lg font-light" style={{ color: '#d4a968' }}>
          {formatPrice(product.price)}
          {product.max_price && product.max_price !== product.price && (
            <span className="text-xs ml-1" style={{ color: '#666' }}>
              - {formatPrice(product.max_price)}
            </span>
          )}
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
