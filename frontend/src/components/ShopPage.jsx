import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, X } from 'lucide-react';
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

// Brand categories mapping
const BRAND_CATEGORIES = {
  indumentaria: {
    title: 'Indumentaria',
    brands: ['AGUARA', 'AVENUE OUTLET', 'BODY SCULPT', 'BRAVISIMA', 'BRO FITWEAR', 'CORALTHEIA', 'DAVID SANDOVAL', 'EFIMERA', 'FILA', 'KARLA', 'OKI', 'SANTAL', 'SEROTONINA', 'SKYLINE', 'UNDISTURBED', 'WUARANI']
  },
  calzados: {
    title: 'Calzados',
    brands: ['CRISTALINE', 'HUNTER', 'PREMIATA', 'SPERRY', 'SUN68', 'UGG']
  },
  joyas: {
    title: 'Joyas & Accesorios',
    brands: ['KAESE', 'OLIVIA', 'SARELLY', 'THULA']
  },
  cosmetica: {
    title: 'Cosmética',
    brands: ['IMMORTAL', 'MALVA', 'MARIA E MAKE UP']
  },
  otros: {
    title: 'Otros',
    brands: []
  }
};

// Brands to merge into AVENUE OUTLET (case insensitive patterns)
const OUTLET_PATTERNS = [
  'AVENUE', 'AVENUE AK', 'BDA FACTORY', 'FRAME', 'GOOD AMERICAN',
  'JAZMIN CHEBAR', 'JUICY', 'KOSIUKO', 'LACOSTE', 'MARIA CHER',
  'MERSEA', 'QUIKSILVER', 'QUICKSILVER', 'RICARDO ALMEIDA', 'ROTUNDA', 'RUSTY',
  'TOP DESIGN', 'VOYAGEUR', 'VITAMINA', 'HOWICK', 'EST1985', 'EST 1985', 'SANTAL/US'
];

// Brands to merge into SUN68
const SUN_PATTERNS = ['SUN68', 'SUN69', 'SUN70', 'SUN71', 'SUN72'];

// Brands to merge into BODY SCULPT
const BODY_SCULPT_PATTERNS = ['BODY SCULPT', 'BODYCULPT'];

// Brands to merge into UNDISTURBED
const UNDISTURBED_PATTERNS = ['UNDISTURB3D', 'UNDISTURBED'];

// Brands to merge into MARIA E MAKE UP
const MARIA_MAKEUP_PATTERNS = ['MARIA E MAKEUP', 'MARIA E MAKE UP'];

// All known brands organized by category for display
const DISPLAY_BRANDS = {
  indumentaria: ['AGUARA', 'AVENUE OUTLET', 'BODY SCULPT', 'BRAVISIMA', 'BRO FITWEAR', 'CORALTHEIA', 'DAVID SANDOVAL', 'EFIMERA', 'FILA', 'KARLA', 'OKI', 'SANTAL', 'SEROTONINA', 'SKYLINE', 'UNDISTURBED', 'WUARANI'],
  calzados: ['CRISTALINE', 'HUNTER', 'PREMIATA', 'SPERRY', 'SUN68', 'UGG'],
  joyas: ['KAESE', 'OLIVIA', 'SARELLY', 'THULA'],
  cosmetica: ['IMMORTAL', 'MALVA', 'MARIA E MAKE UP'],
  otros: []
};

// Normalize brand name for comparison
const normalizeBrand = (brand) => {
  if (!brand) return '';
  const upper = brand.toUpperCase().trim();
  
  // Check if it's an outlet brand
  if (OUTLET_PATTERNS.some(ob => upper === ob || upper.includes(ob))) {
    return 'AVENUE OUTLET';
  }
  
  // Check if it's a SUN brand
  if (SUN_PATTERNS.some(sb => upper === sb)) {
    return 'SUN68';
  }
  
  // Check if it's BODY SCULPT
  if (BODY_SCULPT_PATTERNS.some(bs => upper === bs)) {
    return 'BODY SCULPT';
  }
  
  // Check if it's UNDISTURBED
  if (UNDISTURBED_PATTERNS.some(ud => upper === ud)) {
    return 'UNDISTURBED';
  }
  
  // Check if it's MARIA E MAKE UP
  if (MARIA_MAKEUP_PATTERNS.some(mm => upper === mm)) {
    return 'MARIA E MAKE UP';
  }
  
  // Check if it's DS (David Sandoval)
  if (upper === 'DS') {
    return 'DAVID SANDOVAL';
  }
  
  // Check if it's AGUARA FITWEAR
  if (upper === 'AGUARA FITWEAR') {
    return 'AGUARA';
  }
  
  // Check if it's KARLA RUIZ
  if (upper === 'KARLA RUIZ') {
    return 'KARLA';
  }
  
  return upper;
};

export const ShopPage = ({ cart, setCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showBrandsMenu, setShowBrandsMenu] = useState(false);
  const [organizedBrands, setOrganizedBrands] = useState({
    indumentaria: [],
    calzados: [],
    joyas: [],
    cosmetica: [],
    otros: []
  });
  const navigate = useNavigate();

  // Fetch and organize brands
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shop/filters`);
        const data = await response.json();
        
        // Extract brand names from API
        const rawBrands = (data.categories || []).map(c => 
          typeof c === 'object' ? c.name : c
        ).map(b => b.toUpperCase().trim());
        
        // Use predefined display lists, but only show brands that exist in API
        const organized = {
          indumentaria: DISPLAY_BRANDS.indumentaria.filter(brand => 
            rawBrands.some(rb => {
              const normalized = normalizeBrand(rb);
              return normalized === brand || rb.includes(brand) || brand.includes(rb);
            }) || brand === 'AVENUE OUTLET' || brand === 'DAVID SANDOVAL' || brand === 'SUN68'
          ),
          calzados: DISPLAY_BRANDS.calzados.filter(brand => 
            rawBrands.some(rb => {
              const normalized = normalizeBrand(rb);
              return normalized === brand || rb.includes(brand) || brand.includes(rb);
            }) || brand === 'SUN68'
          ),
          joyas: DISPLAY_BRANDS.joyas.filter(brand => 
            rawBrands.some(rb => rb.includes(brand) || brand.includes(rb))
          ),
          cosmetica: DISPLAY_BRANDS.cosmetica.filter(brand => 
            rawBrands.some(rb => rb.includes(brand) || brand.includes(rb))
          ),
          otros: []
        };
        
        // Add remaining brands to "otros" - exclude known unified brands
        const allUnifiedBrands = [
          ...DISPLAY_BRANDS.indumentaria,
          ...DISPLAY_BRANDS.calzados,
          ...DISPLAY_BRANDS.joyas,
          ...DISPLAY_BRANDS.cosmetica,
          ...OUTLET_PATTERNS,
          ...SUN_PATTERNS,
          ...BODY_SCULPT_PATTERNS,
          ...UNDISTURBED_PATTERNS,
          ...MARIA_MAKEUP_PATTERNS,
          'DS', 'AGUARA FITWEAR', 'KARLA RUIZ'
        ];
        
        rawBrands.forEach(brand => {
          const normalized = normalizeBrand(brand);
          // Check if this brand is not already categorized
          const isAlreadyCategorized = allUnifiedBrands.some(cb => {
            const cbUpper = cb.toUpperCase();
            return normalized === cbUpper || brand.toUpperCase() === cbUpper;
          });
          
          if (!isAlreadyCategorized && !organized.otros.includes(normalized)) {
            organized.otros.push(normalized);
          }
        });
        
        // Sort each category
        Object.keys(organized).forEach(key => {
          organized[key] = [...new Set(organized[key])].sort();
        });
        
        setOrganizedBrands(organized);
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
      if (selectedBrand) {
        // Map display name to actual ERP category name
        const brandQuery = BRAND_TO_CATEGORY_MAP[selectedBrand] || selectedBrand;
        url += `&brand=${encodeURIComponent(brandQuery)}`;
      }
      
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
  }, [currentPage, searchTerm, selectedBrand]);

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

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    setCurrentPage(1);
    setShowBrandsMenu(false);
  };

  const clearBrandFilter = () => {
    setSelectedBrand('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-8 py-5">
            {/* Brands Menu Trigger */}
            <div 
              className="relative"
              onMouseEnter={() => setShowBrandsMenu(true)}
              onMouseLeave={() => setShowBrandsMenu(false)}
            >
              <button className="text-xs tracking-[0.2em] uppercase text-gray-900 hover:text-gray-600 transition-colors font-medium py-2 pb-6">
                Brands
              </button>
              {/* Invisible bridge to prevent hover gap */}
              {showBrandsMenu && (
                <div className="absolute left-0 w-32 h-8 top-full" />
              )}
            </div>

            {/* Logo */}
            <a href="/shop" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-xl tracking-[0.3em] uppercase font-light text-gray-900">
                Avenue
              </h1>
            </a>

            {/* Actions */}
            <div className="flex items-center gap-6">
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
            <div className="border-t border-gray-100 px-8 py-4">
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
        </div>
        
        {/* Mega Menu Dropdown - Full Width */}
        {showBrandsMenu && (
          <div 
            className="absolute left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50"
            onMouseEnter={() => setShowBrandsMenu(true)}
            onMouseLeave={() => setShowBrandsMenu(false)}
          >
            <div className="max-w-[1400px] mx-auto px-8 py-8">
              <div className="grid grid-cols-5 gap-6">
                {/* Indumentaria - 2 columns span */}
                <div className="col-span-2">
                  {/* Title centered across both columns */}
                  <h3 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 text-center">
                    {BRAND_CATEGORIES.indumentaria.title}
                  </h3>
                  {/* Two column grid for brands */}
                  <div className="grid grid-cols-2 gap-x-6">
                    <ul className="space-y-2">
                      {organizedBrands.indumentaria.slice(0, 8).map(brand => (
                        <li key={brand}>
                          <button
                            onClick={() => handleBrandSelect(brand)}
                            className={`text-[11px] transition-colors hover:text-gray-900 ${
                              selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                            }`}
                          >
                            {brand}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2">
                      {organizedBrands.indumentaria.slice(8).map(brand => (
                        <li key={brand}>
                          <button
                            onClick={() => handleBrandSelect(brand)}
                            className={`text-[11px] transition-colors hover:text-gray-900 ${
                              selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                            }`}
                          >
                            {brand}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Calzados */}
                <div>
                  <h3 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {BRAND_CATEGORIES.calzados.title}
                  </h3>
                  <ul className="space-y-2">
                    {organizedBrands.calzados.map(brand => (
                      <li key={brand}>
                        <button
                          onClick={() => handleBrandSelect(brand)}
                          className={`text-[11px] transition-colors hover:text-gray-900 ${
                            selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {brand}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Joyas & Accesorios */}
                <div>
                  <h3 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {BRAND_CATEGORIES.joyas.title}
                  </h3>
                  <ul className="space-y-2">
                    {organizedBrands.joyas.map(brand => (
                      <li key={brand}>
                        <button
                          onClick={() => handleBrandSelect(brand)}
                          className={`text-[11px] transition-colors hover:text-gray-900 ${
                            selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {brand}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cosmética */}
                <div>
                  <h3 className="text-[10px] tracking-[0.2em] uppercase font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {BRAND_CATEGORIES.cosmetica.title}
                  </h3>
                  <ul className="space-y-2">
                    {organizedBrands.cosmetica.map(brand => (
                      <li key={brand}>
                        <button
                          onClick={() => handleBrandSelect(brand)}
                          className={`text-[11px] transition-colors hover:text-gray-900 ${
                            selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                          }`}
                        >
                          {brand}
                        </button>
                      </li>
                    ))}
                    {/* Include "Otros" brands at the end of Cosmética */}
                    {organizedBrands.otros.length > 0 && (
                      <>
                        <li className="pt-3 mt-3 border-t border-gray-100">
                          <span className="text-[9px] tracking-[0.15em] uppercase text-gray-400">Otros</span>
                        </li>
                        {organizedBrands.otros.slice(0, 5).map(brand => (
                          <li key={brand}>
                            <button
                              onClick={() => handleBrandSelect(brand)}
                              className={`text-[11px] transition-colors hover:text-gray-900 ${
                                selectedBrand === brand ? 'text-gray-900 font-medium' : 'text-gray-500'
                              }`}
                            >
                              {brand}
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* View All */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setSelectedBrand(''); setShowBrandsMenu(false); }}
                  className="text-[10px] tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Ver todas las marcas →
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 lg:px-8 py-8">
        {/* Results header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <p className="text-xs tracking-[0.1em] uppercase text-gray-500">
              {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
            </p>
            {selectedBrand && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs tracking-[0.1em] uppercase text-gray-900 font-medium">
                  {selectedBrand}
                </span>
                <button
                  onClick={clearBrandFilter}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
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
            {(selectedBrand || searchTerm) && (
              <button
                onClick={() => { setSelectedBrand(''); setSearchTerm(''); setCurrentPage(1); }}
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
