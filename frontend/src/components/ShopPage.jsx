import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, X, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';

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

// Filter Section Component - Moved outside to prevent re-creation on every render
const FilterSection = ({ title, name, options, selectedValue, onChange, expanded, onToggle }) => (
  <div className="border-b border-gray-200">
    <button
      onClick={() => onToggle(name)}
      className="w-full py-4 flex items-center justify-between text-left"
    >
      <span className="text-xs tracking-[0.2em] uppercase font-medium text-gray-900">{title}</span>
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
    {expanded && (
      <div className="pb-4 space-y-2">
        <button
          onClick={() => onChange('')}
          className={`block w-full text-left py-1.5 text-sm transition-colors ${
            !selectedValue ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Todos
        </button>
        {options.map(option => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`block w-full text-left py-1.5 text-sm transition-colors ${
              selectedValue === option ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    )}
  </div>
);

export const ShopPage = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    gender: false,
    size: false,
    price: false
  });
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

  // Fetch filter options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shop/filters`);
        const data = await response.json();
        // Extract names/values from objects if needed
        const categories = (data.categories || []).map(c => typeof c === 'object' ? c.name : c);
        const genders = (data.genders || []).map(g => typeof g === 'object' ? g.label || g.value : g);
        const sizes = (data.sizes || []).map(s => typeof s === 'object' ? s.name || s.value : s);
        
        setFilterOptions({
          categories,
          genders,
          sizes
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
      let url = `${API_URL}/api/shop/products?page=${currentPage}&limit=16`;
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

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
    setSearchOpen(false);
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

  const toggleFilter = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const hasActiveFilters = filters.category || filters.gender || filters.size || filters.minPrice || filters.maxPrice || searchTerm;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Menu & Filters */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>

            {/* Logo */}
            <a href="/shop" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-xl tracking-[0.3em] uppercase font-light text-gray-900">
                Avenue
              </h1>
            </a>

            {/* Actions */}
            <div className="flex items-center gap-5">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <button
                onClick={() => navigate('/shop/cart')}
                className="text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - Expandable */}
          {searchOpen && (
            <div className="border-t border-gray-100 px-6 py-4">
              <form onSubmit={handleSearch} className="max-w-xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full py-3 px-4 bg-gray-50 border-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Category Navigation */}
          <nav className="flex items-center justify-center gap-8 px-6 py-3 border-t border-gray-100 overflow-x-auto">
            <button
              onClick={() => { setFilters({...filters, category: ''}); setCurrentPage(1); }}
              className={`text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
                !filters.category ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Todo
            </button>
            {filterOptions.categories.slice(0, 8).map(cat => (
              <button
                key={cat}
                onClick={() => { setFilters({...filters, category: cat}); setCurrentPage(1); }}
                className={`text-xs tracking-[0.15em] uppercase whitespace-nowrap transition-colors ${
                  filters.category === cat ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto">
        <div className="flex">
          {/* Sidebar Filters */}
          <aside
            className={`fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-white transform transition-transform duration-300 ease-in-out lg:transform-none ${
              showFilters ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
            }`}
            style={{ top: '120px' }}
          >
            <div className="h-full overflow-y-auto px-6 py-6 lg:sticky lg:top-[140px]">
              {/* Close button - mobile */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <span className="text-xs tracking-[0.2em] uppercase font-medium">Filtros</span>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mb-6 text-xs tracking-[0.1em] uppercase text-gray-500 hover:text-gray-900 underline"
                >
                  Limpiar filtros
                </button>
              )}

              {/* Filter Sections */}
              <FilterSection
                title="Categoría"
                name="category"
                options={filterOptions.categories}
                selectedValue={filters.category}
                onChange={(val) => { setFilters({...filters, category: val}); setCurrentPage(1); }}
                expanded={expandedFilters.category}
                onToggle={toggleFilter}
              />

              <FilterSection
                title="Género"
                name="gender"
                options={filterOptions.genders}
                selectedValue={filters.gender}
                onChange={(val) => { setFilters({...filters, gender: val}); setCurrentPage(1); }}
                expanded={expandedFilters.gender}
                onToggle={toggleFilter}
              />

              <FilterSection
                title="Talla"
                name="size"
                options={filterOptions.sizes}
                selectedValue={filters.size}
                onChange={(val) => { setFilters({...filters, size: val}); setCurrentPage(1); }}
                expanded={expandedFilters.size}
                onToggle={toggleFilter}
              />

              {/* Price Range */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleFilter('price')}
                  className="w-full py-4 flex items-center justify-between text-left"
                >
                  <span className="text-xs tracking-[0.2em] uppercase font-medium text-gray-900">Precio</span>
                  {expandedFilters.price ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {expandedFilters.price && (
                  <div className="pb-4 space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border-0 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="w-full px-3 py-2 text-sm bg-gray-50 border-0 focus:outline-none focus:ring-1 focus:ring-gray-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Overlay for mobile filters */}
          {showFilters && (
            <div
              className="fixed inset-0 bg-black/30 z-30 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
          )}

          {/* Products Grid */}
          <div className="flex-1 px-4 lg:px-8 py-8">
            {/* Results count */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs tracking-[0.1em] uppercase text-gray-500">
                {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs tracking-[0.1em] uppercase text-gray-500 hover:text-gray-900 underline lg:hidden"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-100 mb-4"></div>
                    <div className="h-4 bg-gray-100 mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-100 w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 text-sm">No se encontraron productos</p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-xs tracking-[0.1em] uppercase text-gray-900 underline"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onProductClick={() => setSelectedProduct(product)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-16">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <span className="text-xs text-gray-400">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
};

// Minimal Product Card
const ProductCard = ({ product, onProductClick, formatPrice }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const imageUrl = resolveImageUrl(product.image);
  
  return (
    <div
      className="group cursor-pointer"
      onClick={onProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="aspect-[3/4] bg-[#F5F5F5] mb-4 overflow-hidden relative">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isHovered ? 'scale-105' : 'scale-100'
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-gray-400 tracking-[0.1em] uppercase">Sin imagen</span>
          </div>
        )}
        
        {/* Quick view overlay */}
        <div className={`absolute inset-0 bg-black/0 flex items-end justify-center pb-6 transition-all duration-300 ${
          isHovered ? 'bg-black/10' : ''
        }`}>
          <span className={`text-xs tracking-[0.15em] uppercase text-white bg-black/80 px-4 py-2 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}>
            Vista rápida
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="text-sm text-gray-900 font-normal leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500">
          {formatPrice(product.price)}
        </p>
        {/* Available sizes preview */}
        {product.sizes_list && product.sizes_list.length > 0 && (
          <p className="text-xs text-gray-400">
            {product.sizes_list.slice(0, 5).join(' / ')}
            {product.sizes_list.length > 5 && ' ...'}
          </p>
        )}
      </div>
    </div>
  );
};
