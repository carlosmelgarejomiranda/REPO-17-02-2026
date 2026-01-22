import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';
import { Upload, Image, Check, X, AlertCircle, Loader2, ChevronLeft, Undo2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = getApiUrl();

export const BatchImageAssignment = ({ onClose }) => {
  // State for brand/category selection
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loadingBrands, setLoadingBrands] = useState(true);
  
  // State for products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [totalProductsWithoutImage, setTotalProductsWithoutImage] = useState(0);
  
  // State for batch images
  const [batchId, setBatchId] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [uploadingBatch, setUploadingBatch] = useState(false);
  
  // State for selection
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  
  // State for progress
  const [assignedCount, setAssignedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [resetting, setResetting] = useState(false);
  
  // State for undo history (recent assignments in this session)
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [undoing, setUndoing] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Reset all product images
  const handleResetAllImages = async () => {
    if (!window.confirm('⚠️ ADVERTENCIA: Esto eliminará TODAS las imágenes de TODOS los productos. ¿Estás seguro?')) {
      return;
    }
    if (!window.confirm('¿Realmente quieres continuar? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setResetting(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/reset-all-product-images`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✓ Reset completado!\n\nProductos afectados: ${data.products_affected}\nImágenes eliminadas: ${data.images_deleted}`);
        // Refresh products list
        fetchProducts();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'No se pudo resetear'));
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Fetch brands/categories
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`${API_URL}/api/shop/admin/brands-categories`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setBrands(data.brands || []);
        }
      } catch (err) {
        console.error('Error fetching brands:', err);
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, []);

  // Fetch products without images when brand changes
  const fetchProducts = useCallback(async () => {
    if (!selectedBrand) {
      setProducts([]);
      return;
    }
    
    setLoadingProducts(true);
    try {
      const response = await fetch(
        `${API_URL}/api/shop/admin/products-without-images?brand=${encodeURIComponent(selectedBrand)}&limit=200`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalProductsWithoutImage(data.total || 0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle batch file upload
  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingBatch(true);
    setMessage(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/upload-batch-temp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatchId(data.batch_id);
        
        // Transform relative URLs to absolute URLs using API_URL
        const imagesWithFullUrls = (data.images || []).map(img => ({
          ...img,
          url: img.url.startsWith('/') ? `${API_URL}${img.url}` : img.url
        }));
        
        setBatchImages(imagesWithFullUrls);
        
        if (data.errors > 0) {
          setMessage({
            type: 'warning',
            text: `${data.uploaded} imágenes subidas. ${data.errors} errores: ${data.error_details?.join(', ')}`
          });
        } else {
          setMessage({
            type: 'success',
            text: `${data.uploaded} imágenes subidas correctamente`
          });
        }
      } else {
        let errorText = `Error ${response.status}: `;
        try {
          const errorData = await response.json();
          errorText += errorData.detail || JSON.stringify(errorData);
        } catch {
          errorText += response.statusText || 'Error desconocido';
        }
        setMessage({ type: 'error', text: errorText });
      }
    } catch (err) {
      console.error('Error uploading batch:', err);
      setMessage({ type: 'error', text: `Error de conexión: ${err.message}` });
    } finally {
      setUploadingBatch(false);
    }
  };

  // Handle product selection
  const handleProductClick = (product) => {
    if (selectedProduct?.grouped_id === product.grouped_id) {
      // Deselect product
      setSelectedProduct(null);
      setSelectedImages([]);
    } else if (selectedImages.length > 0) {
      // Can't select another product while images are selected
      setMessage({ type: 'warning', text: 'Confirma o deselecciona las imágenes antes de cambiar de producto' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      // Select new product - show alert with product info
      setSelectedProduct(product);
      setMessage({ 
        type: 'success', 
        text: `Producto seleccionado: ${product.base_model} (ID: ${product.grouped_id})` 
      });
    }
  };

  // Handle image selection
  const handleImageClick = (image) => {
    if (!selectedProduct) {
      setMessage({ type: 'warning', text: 'Primero selecciona un producto' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    
    const isSelected = selectedImages.some(img => img.id === image.id);
    
    if (isSelected) {
      // Deselect image
      setSelectedImages(prev => prev.filter(img => img.id !== image.id));
    } else if (selectedImages.length >= 3) {
      // Max 3 images
      setMessage({ type: 'warning', text: 'Máximo 3 imágenes por producto' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      // Select image
      setSelectedImages(prev => [...prev, image]);
    }
  };

  // Confirm assignment with explicit confirmation
  const handleConfirmAssignment = async () => {
    if (!selectedProduct || selectedImages.length === 0) return;
    
    // STEP 1: Show explicit confirmation with product details
    const confirmMessage = `¿CONFIRMAR ASIGNACIÓN?\n\n` +
      `📦 PRODUCTO: ${selectedProduct.base_model}\n` +
      `🔑 ID: ${selectedProduct.grouped_id}\n` +
      `🏷️ MARCA: ${selectedProduct.brand || selectedProduct.category || 'Sin marca'}\n\n` +
      `📷 IMÁGENES: ${selectedImages.length}\n\n` +
      `¿Es correcto este producto?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    // Store product info at this exact moment to prevent any race conditions
    const productToAssign = {
      id: selectedProduct.grouped_id,
      name: selectedProduct.base_model,
      brand: selectedProduct.brand || selectedProduct.category
    };
    
    const payload = {
      product_id: productToAssign.id,
      image_ids: selectedImages.map(img => img.id),
      batch_id: batchId
    };
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/assign-images`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Verify the backend assigned to the correct product
        console.log('Assignment response:', data);
        
        // Save to history for undo
        setAssignmentHistory(prev => [{
          product: selectedProduct,
          images: selectedImages,
          assignedImages: data.assigned_images,
          timestamp: new Date()
        }, ...prev].slice(0, 20)); // Keep last 20
        
        // Remove assigned product and images from lists
        setProducts(prev => prev.filter(p => p.grouped_id !== selectedProduct.grouped_id));
        setBatchImages(prev => prev.filter(img => !selectedImages.some(sel => sel.id === img.id)));
        
        // Reset selection
        setSelectedProduct(null);
        setSelectedImages([]);
        setAssignedCount(prev => prev + 1);
        
        // Show detailed success message with product name from server - ALERT for debugging
        const confirmMsg = `✓ IMAGEN ASIGNADA\n\nProducto seleccionado: ${selectedProduct.base_model}\nID enviado: ${selectedProduct.grouped_id}\n\nProducto confirmado por servidor: ${data.product_name}\nID confirmado: ${data.product_id}`;
        alert(confirmMsg);
        
        setMessage({ 
          type: 'success', 
          text: `✓ Asignado a: ${data.product_name} (ID: ${data.product_id})` 
        }); 
        setTimeout(() => setMessage(null), 10000); // 10 seconds
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Error al asignar imágenes' });
      }
    } catch (err) {
      console.error('Error assigning images:', err);
      setMessage({ type: 'error', text: 'Error al asignar imágenes' });
    } finally {
      setSaving(false);
    }
  };

  // Undo last assignment
  const handleUndoAssignment = async (historyItem, index) => {
    setUndoing(true);
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/unlink-images/${historyItem.product.grouped_id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        // Add product back to list
        setProducts(prev => [historyItem.product, ...prev]);
        
        // Add images back to batch images list (if they were stored)
        if (historyItem.images && historyItem.images.length > 0) {
          setBatchImages(prev => [...historyItem.images, ...prev]);
        }
        
        // Remove from history
        setAssignmentHistory(prev => prev.filter((_, i) => i !== index));
        setAssignedCount(prev => Math.max(0, prev - 1));
        
        setMessage({ 
          type: 'success', 
          text: `✓ Desvinculado: ${historyItem.product.base_model}` 
        });
        setTimeout(() => setMessage(null), 2000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.detail || 'Error al desvincular' });
      }
    } catch (err) {
      console.error('Error undoing assignment:', err);
      setMessage({ type: 'error', text: 'Error al desvincular' });
    } finally {
      setUndoing(false);
    }
  };

  // Clean up batch on close
  const handleClose = async () => {
    if (batchId && batchImages.length > 0) {
      // Ask confirmation if there are unassigned images
      if (!window.confirm(`Hay ${batchImages.length} imágenes sin asignar. ¿Deseas salir y eliminarlas?`)) {
        return;
      }
      
      try {
        await fetch(`${API_URL}/api/shop/admin/temp-batch/${batchId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.error('Error cleaning up batch:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleClose} className="text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-light text-white">
                Asignar <span className="italic text-[#d4a968]">Imágenes</span> por Lote
              </h1>
              <p className="text-gray-500 text-sm">
                Vinculación visual de imágenes a productos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Reset button */}
            <button
              onClick={handleResetAllImages}
              disabled={resetting}
              className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm hover:bg-red-900/50 disabled:opacity-50 flex items-center gap-2"
            >
              {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Reset Todas
            </button>
            
            {/* Brand selector */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Marca/Categoría:</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={loadingBrands}
                className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-[#d4a968] focus:outline-none min-w-[200px]"
              >
                <option value="">Seleccionar...</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                Asignados: <span className="text-[#d4a968] font-medium">{assignedCount}</span>
              </span>
              {selectedBrand && (
                <span className="text-gray-400">
                  Sin imagen: <span className="text-white font-medium">{products.length}</span>
                </span>
              )}
            </div>
          </div>
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

      {/* Main content - Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Products list (compact) */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-neutral-900/50">
            <h2 className="text-sm font-medium text-[#d4a968] uppercase tracking-wider">
              Productos sin Imagen
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#d4a968] animate-spin" />
              </div>
            ) : !selectedBrand ? (
              <div className="text-center py-12 text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una marca/categoría</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p>¡Todos los productos tienen imagen!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {products.map(product => {
                  const isSelected = selectedProduct?.grouped_id === product.grouped_id;
                  const isBlocked = selectedProduct && !isSelected && selectedImages.length > 0;
                  
                  return (
                    <div
                      key={product.grouped_id}
                      onClick={() => !isBlocked && handleProductClick(product)}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#d4a968]/20 border-2 border-[#d4a968]' 
                          : isBlocked
                            ? 'bg-neutral-800/30 opacity-50 cursor-not-allowed'
                            : 'bg-neutral-800/50 border-2 border-transparent hover:bg-neutral-800'
                      }`}
                    >
                      {/* Product name - 2 lines max, smaller font */}
                      <div className="font-medium text-white text-xs leading-tight line-clamp-2 min-h-[2.5em]">
                        {product.base_model}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500 truncate max-w-[60%]">
                          {product.category || product.brand}
                        </span>
                        <span className="text-[10px] text-[#d4a968] font-medium">
                          {product.price?.toLocaleString()} Gs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Images (large preview) */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-white/10 bg-neutral-900/50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#d4a968] uppercase tracking-wider">
              Imágenes del Lote
            </h2>
            
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#d4a968] text-black text-sm font-medium cursor-pointer hover:bg-[#c49958] transition-colors">
                <Upload className="w-4 h-4" />
                {uploadingBatch ? 'Subiendo...' : 'Subir Imágenes'}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,image/bmp,image/tiff,.jpg,.jpeg,.png,.gif,.webp,.avif,.bmp,.tiff,.heic,.heif"
                  className="hidden"
                  onChange={handleBatchUpload}
                  disabled={uploadingBatch || !selectedBrand}
                />
              </label>
              
              {/* Confirm button */}
              {selectedProduct && selectedImages.length > 0 && (
                <Button
                  onClick={handleConfirmAssignment}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Confirmar ({selectedImages.length})
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedBrand ? (
              <div className="text-center py-12 text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una marca para comenzar</p>
              </div>
            ) : batchImages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sube las imágenes del lote para {selectedBrand}</p>
                <p className="text-sm mt-2">Arrastra o haz clic en &quot;Subir Imágenes&quot;</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {batchImages.map(image => {
                  const isSelected = selectedImages.some(img => img.id === image.id);
                  const isBlocked = selectedImages.length >= 3 && !isSelected;
                  
                  return (
                    <div
                      key={image.id}
                      onClick={() => !isBlocked && handleImageClick(image)}
                      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected 
                          ? 'ring-3 ring-[#d4a968] ring-offset-1 ring-offset-[#0a0a0a]' 
                          : isBlocked
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:ring-2 hover:ring-white/30'
                      }`}
                    >
                      {/* Image - smaller aspect ratio */}
                      <div className="aspect-square bg-neutral-900">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Selected overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#d4a968]/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-[#d4a968] flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                        </div>
                      )}
                      
                      {/* Filename */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                        <p className="text-white text-xs truncate">{image.filename}</p>
                      </div>
                      
                      {/* Selection number */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#d4a968] text-black text-sm font-bold flex items-center justify-center">
                          {selectedImages.findIndex(img => img.id === image.id) + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Selection status and Undo history */}
      <footer className="flex-shrink-0 border-t border-white/10 bg-neutral-900/50">
        {/* Selection status bar */}
        {selectedProduct && (
          <div className="px-6 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Producto:</span>
                <span className="text-white font-medium text-sm">{selectedProduct.base_model}</span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-400 text-sm">Imágenes:</span>
                <span className="text-[#d4a968] font-medium">{selectedImages.length}/3</span>
              </div>
              
              <div className="text-xs text-gray-500">
                Click en producto o imagen para deseleccionar
              </div>
            </div>
          </div>
        )}
        
        {/* Undo history bar */}
        {assignmentHistory.length > 0 && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Undo2 className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Deshacer:</span>
              </div>
              
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                {assignmentHistory.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleUndoAssignment(item, index)}
                    disabled={undoing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-xs whitespace-nowrap disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="max-w-[150px] truncate">{item.product.base_model}</span>
                  </button>
                ))}
              </div>
              
              {assignmentHistory.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{assignmentHistory.length - 5} más
                </span>
              )}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default BatchImageAssignment;
