import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Image, Trash2, Search, Filter, Check, X, Loader2, 
  ChevronLeft, AlertCircle, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';

const API_URL = getApiUrl();

export const ImageManager = ({ onClose }) => {
  // State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  
  // Selection
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Actions
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch products with images
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/products-with-images`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        
        // Extract unique brands
        const uniqueBrands = [...new Set(data.products.map(p => p.brand || p.category).filter(Boolean))];
        setBrands(uniqueBrands.sort());
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setMessage({ type: 'error', text: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.base_model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.grouped_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = !selectedBrand || 
      product.brand === selectedBrand || 
      product.category === selectedBrand;
    
    return matchesSearch && matchesBrand;
  });

  // Handle select all (only filtered)
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      const allFilteredIds = new Set(filteredProducts.map(p => p.grouped_id));
      setSelectedProducts(allFilteredIds);
      setSelectAll(true);
    }
  };

  // Handle individual selection
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === filteredProducts.length && filteredProducts.length > 0);
  };

  // Delete single product image
  const handleDeleteSingle = async (product) => {
    if (!window.confirm(`¿Eliminar imagen de "${product.base_model}"?`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/unlink-images/${product.grouped_id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setProducts(prev => prev.filter(p => p.grouped_id !== product.grouped_id));
        setSelectedProducts(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.grouped_id);
          return newSet;
        });
        setMessage({ type: 'success', text: `Imagen eliminada: ${product.base_model}` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Error al eliminar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setDeleting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Delete selected products
  const handleDeleteSelected = async () => {
    if (selectedProducts.size === 0) {
      setMessage({ type: 'warning', text: 'Selecciona al menos un producto' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    const count = selectedProducts.size;
    if (!window.confirm(`¿Eliminar imágenes de ${count} producto(s) seleccionado(s)?`)) {
      return;
    }
    
    setDeleting(true);
    let deleted = 0;
    let errors = 0;
    
    for (const productId of selectedProducts) {
      try {
        const response = await fetch(`${API_URL}/api/shop/admin/unlink-images/${productId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          deleted++;
        } else {
          errors++;
        }
      } catch (err) {
        errors++;
      }
    }
    
    // Refresh list
    await fetchProducts();
    setSelectedProducts(new Set());
    setSelectAll(false);
    
    if (errors === 0) {
      setMessage({ type: 'success', text: `${deleted} imagen(es) eliminada(s) correctamente` });
    } else {
      setMessage({ type: 'warning', text: `${deleted} eliminada(s), ${errors} error(es)` });
    }
    
    setDeleting(false);
    setTimeout(() => setMessage(null), 5000);
  };

  // Delete all (filtered or all)
  const handleDeleteAll = async (onlyFiltered = true) => {
    const targetProducts = onlyFiltered ? filteredProducts : products;
    const count = targetProducts.length;
    
    const confirmMsg = onlyFiltered 
      ? `¿Eliminar imágenes de los ${count} productos filtrados?`
      : `⚠️ ¿Eliminar TODAS las imágenes de los ${count} productos?`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }
    
    if (!onlyFiltered && !window.confirm('Esta acción no se puede deshacer. ¿Continuar?')) {
      return;
    }
    
    setDeleting(true);
    
    if (onlyFiltered) {
      // Delete filtered one by one
      let deleted = 0;
      for (const product of targetProducts) {
        try {
          const response = await fetch(`${API_URL}/api/shop/admin/unlink-images/${product.grouped_id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (response.ok) deleted++;
        } catch (err) {}
      }
      setMessage({ type: 'success', text: `${deleted} imagen(es) eliminada(s)` });
    } else {
      // Use bulk reset endpoint
      try {
        const response = await fetch(`${API_URL}/api/shop/admin/reset-all-product-images`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessage({ type: 'success', text: `Reset completo: ${data.products_affected} productos afectados` });
        } else {
          setMessage({ type: 'error', text: 'Error al resetear' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error de conexión' });
      }
    }
    
    await fetchProducts();
    setSelectedProducts(new Set());
    setSelectAll(false);
    setDeleting(false);
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-light text-white">
                Gestión de <span className="italic text-[#d4a968]">Imágenes</span>
              </h1>
              <p className="text-gray-500 text-sm">
                {products.length} productos con imagen • {selectedProducts.size} seleccionados
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-2 rounded-lg bg-neutral-800 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Delete selected */}
            {selectedProducts.size > 0 && (
              <Button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Eliminar ({selectedProducts.size})
              </Button>
            )}
            
            {/* Delete all filtered */}
            {filteredProducts.length > 0 && selectedProducts.size === 0 && (
              <Button
                onClick={() => handleDeleteAll(true)}
                disabled={deleting}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar Filtrados ({filteredProducts.length})
              </Button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
            />
          </div>
          
          {/* Brand filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:border-[#d4a968] focus:outline-none min-w-[200px]"
            >
              <option value="">Todas las marcas</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          {/* Select all */}
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-gray-300 hover:text-white hover:border-[#d4a968]"
          >
            {selectAll ? <CheckSquare className="w-4 h-4 text-[#d4a968]" /> : <Square className="w-4 h-4" />}
            Seleccionar todos
          </button>
          
          {/* Clear filters */}
          {(searchTerm || selectedBrand) && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedBrand(''); }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        
        {/* Message */}
        {message && (
          <div className={`mt-4 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
            message.type === 'warning' ? 'bg-amber-900/50 text-amber-400 border border-amber-500/30' :
            'bg-red-900/50 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No hay productos con imagen</p>
            {(searchTerm || selectedBrand) && (
              <p className="text-sm mt-2">Intenta cambiar los filtros</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const isSelected = selectedProducts.has(product.grouped_id);
              const imageUrl = product.custom_image?.startsWith('/') 
                ? `${API_URL}${product.custom_image}` 
                : product.custom_image;
              
              return (
                <div
                  key={product.grouped_id}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-[#d4a968] bg-[#d4a968]/10' 
                      : 'border-white/10 bg-neutral-900 hover:border-white/30'
                  }`}
                >
                  {/* Selection checkbox */}
                  <button
                    onClick={() => handleSelectProduct(product.grouped_id)}
                    className="absolute top-2 left-2 z-10 p-1 rounded bg-black/50 hover:bg-black/70"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#d4a968]" />
                    ) : (
                      <Square className="w-5 h-5 text-white/70" />
                    )}
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteSingle(product)}
                    disabled={deleting}
                    className="absolute top-2 right-2 z-10 p-1 rounded bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Image */}
                  <div className="aspect-square bg-neutral-800">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.base_model}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full items-center justify-center text-gray-600 hidden">
                      <Image className="w-12 h-12" />
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium line-clamp-2 leading-tight">
                      {product.base_model}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500 text-xs truncate">
                        {product.brand || product.category}
                      </span>
                      <span className="text-gray-600 text-xs">
                        {product.grouped_id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-white/10 px-6 py-3 flex items-center justify-between bg-neutral-900/50">
        <div className="text-gray-500 text-sm">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
        
        <div className="flex items-center gap-3">
          {/* Reset ALL button */}
          <button
            onClick={() => handleDeleteAll(false)}
            disabled={deleting || products.length === 0}
            className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm hover:bg-red-900/50 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Reset TODAS las Imágenes
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ImageManager;
