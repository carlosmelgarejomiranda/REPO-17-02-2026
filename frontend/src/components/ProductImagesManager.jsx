import React, { useState, useEffect, useCallback } from 'react';
import { getApiUrl } from '../utils/api';
import { Upload, Image, Search, Check, X, AlertCircle, FileImage, Trash2, RefreshCw, Download, Layers, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BatchImageAssignment } from './BatchImageAssignment';
import { ImageManager } from './ImageManager';

const API_URL = getApiUrl();

// Single Upload Modal Component
const SingleUploadModal = ({ product, onClose, onUpload, uploading }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  const handleUpload = () => {
    if (selectedFile) {
      onUpload(product.grouped_id, selectedFile);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <Card className="w-full max-w-lg" style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: '#f5ede4' }}>Subir Imagen</CardTitle>
            <button onClick={onClose} style={{ color: '#666' }} className="text-2xl">×</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm mb-2" style={{ color: '#a8a8a8' }}>Producto:</p>
            <p style={{ color: '#f5ede4' }}>{product.base_model}</p>
          </div>
          
          {/* Current image */}
          <div className="mb-4">
            <p className="text-sm mb-2" style={{ color: '#a8a8a8' }}>Imagen actual:</p>
            <div className="w-32 h-32 rounded overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
              {(product.custom_image || product.image) ? (
                <img 
                  src={product.custom_image || product.image} 
                  alt={product.base_model}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileImage className="w-8 h-8" style={{ color: '#666' }} />
                </div>
              )}
            </div>
          </div>
          
          {/* Upload area */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-solid' : ''}`}
            style={{ 
              borderColor: dragOver ? '#d4a968' : '#333',
              backgroundColor: dragOver ? 'rgba(212, 169, 104, 0.1)' : 'transparent'
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('single-file-input').click()}
          >
            <input 
              id="single-file-input"
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={handleFileSelect}
            />
            
            {preview ? (
              <div>
                <img src={preview} alt="Preview" className="w-32 h-32 object-cover mx-auto rounded mb-4" />
                <p className="text-sm" style={{ color: '#22c55e' }}>{selectedFile?.name}</p>
                <p className="text-xs mt-1" style={{ color: '#a8a8a8' }}>
                  {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-4" style={{ color: '#666' }} />
                <p style={{ color: '#a8a8a8' }}>Arrastra una imagen o haz clic para seleccionar</p>
                <p className="text-sm mt-2" style={{ color: '#666' }}>Máximo 5MB • JPG, PNG, WEBP</p>
              </>
            )}
          </div>
          
          <div className="flex gap-2 mt-6">
            <Button
              onClick={onClose}
              className="flex-1"
              style={{ backgroundColor: '#2a2a2a', color: '#a8a8a8' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              {uploading ? 'Subiendo...' : 'Subir Imagen'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProductImagesManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadingProduct, setUploadingProduct] = useState(null);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [filterHasImage, setFilterHasImage] = useState('all'); // all, with, without
  const [stats, setStats] = useState({ total: 0, with_image: 0, without_image: 0 });
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Fetch products for image management
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/shop/admin/products-images?page=${currentPage}&limit=20`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (filterHasImage !== 'all') url += `&has_image=${filterHasImage === 'with'}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.total_pages || 1);
        setTotalProducts(data.total || 0);
        setStats(data.stats || { total: 0, with_image: 0, without_image: 0 });
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterHasImage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Show image manager panel
  if (showImageManager) {
    return (
      <ImageManager 
        onClose={() => {
          setShowImageManager(false);
          // Refresh products after managing images
          setTimeout(() => fetchProducts(), 100);
        }} 
      />
    );
  }

  // Show batch assignment panel
  if (showBatchAssignment) {
    return (
      <BatchImageAssignment 
        onClose={() => {
          setShowBatchAssignment(false);
          // Refresh products after batch assignment
          setTimeout(() => fetchProducts(), 100);
        }} 
      />
    );
  }

  // Handle single image upload
  const handleImageUpload = async (productId, file) => {
    setUploadingProduct(productId);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_id', productId);
    
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/upload-product-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update product in list
        setProducts(prev => prev.map(p => 
          p.grouped_id === productId ? { ...p, custom_image: data.image_url } : p
        ));
        setSelectedProduct(null);
        fetchProducts(); // Refresh stats
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al subir imagen');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error de conexión');
    } finally {
      setUploadingProduct(null);
    }
  };

  // Handle bulk files selection
  const handleBulkFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    setBulkFiles(files);
    setBulkResults(null);
  };

  // Execute bulk upload
  const executeBulkUpload = async () => {
    if (bulkFiles.length === 0) return;
    
    setBulkUploading(true);
    setBulkResults(null);
    
    const formData = new FormData();
    bulkFiles.forEach(file => {
      formData.append('files', file);
    });
    
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/bulk-upload-images`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setBulkResults(data);
        // Refresh product list
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error en carga masiva');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      alert('Error de conexión');
    } finally {
      setBulkUploading(false);
    }
  };

  // Delete custom image
  const deleteCustomImage = async (productId) => {
    if (!window.confirm('¿Eliminar imagen personalizada? Se usará la imagen del ERP.')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/shop/admin/delete-product-image/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setProducts(prev => prev.map(p => 
          p.grouped_id === productId ? { ...p, custom_image: null } : p
        ));
        fetchProducts(); // Refresh stats
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Download products report for image naming
  const downloadProductsReport = async (onlyWithoutImage = false) => {
    try {
      let url = `${API_URL}/api/shop/admin/export-products-for-images`;
      if (onlyWithoutImage) {
        url += '?has_image=false';
      }
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Convert to CSV
        const headers = data.columns.map(c => c.label);
        const keys = data.columns.map(c => c.key);
        
        let csv = headers.join(',') + '\n';
        
        data.products.forEach(product => {
          const row = keys.map(key => {
            const value = product[key] || '';
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csv += row.join(',') + '\n';
        });
        
        // Download CSV file
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `productos_para_imagenes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Error al descargar reporte');
    }
  };


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <CardContent className="p-4">
            <p className="text-sm" style={{ color: '#a8a8a8' }}>Total Productos</p>
            <p className="text-2xl font-light" style={{ color: '#d4a968' }}>{stats.total}</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <CardContent className="p-4">
            <p className="text-sm" style={{ color: '#a8a8a8' }}>Con Imagen Custom</p>
            <p className="text-2xl font-light" style={{ color: '#22c55e' }}>{stats.with_image}</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <CardContent className="p-4">
            <p className="text-sm" style={{ color: '#a8a8a8' }}>Sin Imagen Custom</p>
            <p className="text-2xl font-light" style={{ color: '#f59e0b' }}>{stats.without_image}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setBulkUploadMode(false)}
          style={{ 
            backgroundColor: !bulkUploadMode ? '#d4a968' : '#2a2a2a',
            color: !bulkUploadMode ? '#0d0d0d' : '#a8a8a8'
          }}
        >
          <Image className="w-4 h-4 mr-2" /> Gestión Individual
        </Button>
        <Button
          onClick={() => setBulkUploadMode(true)}
          style={{ 
            backgroundColor: bulkUploadMode ? '#d4a968' : '#2a2a2a',
            color: bulkUploadMode ? '#0d0d0d' : '#a8a8a8'
          }}
        >
          <Upload className="w-4 h-4 mr-2" /> Carga Masiva (Auto-match)
        </Button>
        <Button
          onClick={() => setShowBatchAssignment(true)}
          style={{ 
            backgroundColor: '#059669',
            color: '#ffffff'
          }}
        >
          <Layers className="w-4 h-4 mr-2" /> Asignación Visual por Lote
        </Button>
        <Button
          onClick={() => setShowImageManager(true)}
          style={{ 
            backgroundColor: '#7c3aed',
            color: '#ffffff'
          }}
        >
          <Settings className="w-4 h-4 mr-2" /> Editar/Eliminar Fotos
        </Button>
        
        {/* Download Reports */}
        <div className="ml-auto flex gap-2">
          <Button
            onClick={() => downloadProductsReport(false)}
            style={{ backgroundColor: '#2a2a2a', color: '#22c55e' }}
            title="Descargar todos los productos"
          >
            <Download className="w-4 h-4 mr-2" /> Todos los Productos
          </Button>
          <Button
            onClick={() => downloadProductsReport(true)}
            style={{ backgroundColor: '#2a2a2a', color: '#f59e0b' }}
            title="Descargar solo productos sin imagen"
          >
            <Download className="w-4 h-4 mr-2" /> Sin Imagen
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968', borderStyle: 'dashed' }}>
        <CardContent className="p-4">
          <p className="text-sm" style={{ color: '#d4a968' }}>
            <strong>Instrucciones para carga de imágenes:</strong>
          </p>
          <ol className="text-sm mt-2 space-y-1" style={{ color: '#a8a8a8' }}>
            <li>1. Descarga el reporte de productos (CSV)</li>
            <li>2. Copia el nombre de la columna <strong style={{ color: '#f5ede4' }}>&quot;Nombre para Imagen&quot;</strong></li>
            <li>3. Renombra tu imagen con ese nombre exacto (ej: <span style={{ color: '#22c55e' }}>CAMISA DAVID SANDOVAL.jpg</span>)</li>
            <li>4. Sube las imágenes usando <strong style={{ color: '#f5ede4' }}>&quot;Carga Masiva&quot;</strong></li>
          </ol>
        </CardContent>
      </Card>

      {/* Bulk Upload Mode */}
      {bulkUploadMode && (
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <CardHeader>
            <CardTitle style={{ color: '#f5ede4' }}>Carga Masiva de Imágenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-solid transition-all"
                style={{ borderColor: '#333' }}
                onClick={() => document.getElementById('bulk-file-input').click()}
              >
                <input 
                  id="bulk-file-input"
                  type="file" 
                  accept="image/*" 
                  multiple
                  className="hidden"
                  onChange={handleBulkFilesSelect}
                />
                <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: '#666' }} />
                <p style={{ color: '#f5ede4' }}>Haz clic para seleccionar múltiples imágenes</p>
                <p className="text-sm mt-2" style={{ color: '#a8a8a8' }}>
                  El nombre del archivo se vinculará con el título del producto
                </p>
                <p className="text-xs mt-1" style={{ color: '#666' }}>
                  Ejemplo: CAMISA DAVID SANDOVAL.jpg → Producto CAMISA DAVID SANDOVAL
                </p>
              </div>
              
              {/* Selected files preview */}
              {bulkFiles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p style={{ color: '#f5ede4' }}>{bulkFiles.length} archivos seleccionados</p>
                    <Button
                      onClick={() => { setBulkFiles([]); setBulkResults(null); }}
                      size="sm"
                      style={{ backgroundColor: '#2a2a2a', color: '#ef4444' }}
                    >
                      <X className="w-4 h-4 mr-1" /> Limpiar
                    </Button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    {bulkFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <FileImage className="w-4 h-4" style={{ color: '#666' }} />
                        <span style={{ color: '#f5ede4' }}>{file.name}</span>
                        <span style={{ color: '#666' }}>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={executeBulkUpload}
                    disabled={bulkUploading}
                    className="w-full mt-4"
                    style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                  >
                    {bulkUploading ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Iniciar Carga Masiva</>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Bulk results */}
              {bulkResults && (
                <div className="p-4 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                  <h4 className="font-medium mb-3" style={{ color: '#f5ede4' }}>Resultados de Carga</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl" style={{ color: '#22c55e' }}>{bulkResults.matched}</p>
                      <p className="text-sm" style={{ color: '#a8a8a8' }}>Vinculados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl" style={{ color: '#f59e0b' }}>{bulkResults.not_matched}</p>
                      <p className="text-sm" style={{ color: '#a8a8a8' }}>Sin coincidencia</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl" style={{ color: '#ef4444' }}>{bulkResults.errors}</p>
                      <p className="text-sm" style={{ color: '#a8a8a8' }}>Errores</p>
                    </div>
                  </div>
                  
                  {/* Matched files */}
                  {bulkResults.matched_details?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium mb-1" style={{ color: '#22c55e' }}>✓ Vinculados:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkResults.matched_details.map((item, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-2">
                            <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                            <span style={{ color: '#a8a8a8' }}>{item.filename} → {item.product}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Not matched files */}
                  {bulkResults.not_matched_details?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>⚠ Sin coincidencia:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {bulkResults.not_matched_details.map((item, idx) => (
                          <div key={idx} className="text-xs flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" style={{ color: '#f59e0b' }} />
                            <span style={{ color: '#a8a8a8' }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Management Mode */}
      {!bulkUploadMode && (
        <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle style={{ color: '#f5ede4' }}>Productos ({totalProducts})</CardTitle>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#666' }} />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 pr-4 py-2 rounded"
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                  />
                </div>
                <select
                  value={filterHasImage}
                  onChange={(e) => { setFilterHasImage(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 rounded"
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#f5ede4' }}
                >
                  <option value="all">Todos</option>
                  <option value="with">Con imagen custom</option>
                  <option value="without">Sin imagen custom</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin" style={{ color: '#d4a968' }} />
                <p className="mt-2" style={{ color: '#a8a8a8' }}>Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <p style={{ color: '#a8a8a8' }}>No se encontraron productos</p>
            ) : (
              <>
                {/* Products grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {products.map(product => (
                    <div 
                      key={product.grouped_id}
                      className="rounded-lg overflow-hidden group relative"
                      style={{ backgroundColor: '#2a2a2a' }}
                    >
                      {/* Image */}
                      <div className="aspect-square relative">
                        {(product.custom_image || product.image) ? (
                          <img 
                            src={product.custom_image || product.image}
                            alt={product.base_model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                            <FileImage className="w-12 h-12" style={{ color: '#333' }} />
                          </div>
                        )}
                        
                        {/* Custom image badge */}
                        {product.custom_image && (
                          <div 
                            className="absolute top-2 left-2 px-2 py-1 rounded text-xs"
                            style={{ backgroundColor: 'rgba(34, 197, 94, 0.9)', color: 'white' }}
                          >
                            Custom
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="p-2 rounded-full"
                            style={{ backgroundColor: '#d4a968' }}
                            title="Subir imagen"
                          >
                            <Upload className="w-5 h-5" style={{ color: '#0d0d0d' }} />
                          </button>
                          {product.custom_image && (
                            <button
                              onClick={() => deleteCustomImage(product.grouped_id)}
                              className="p-2 rounded-full"
                              style={{ backgroundColor: '#ef4444' }}
                              title="Eliminar imagen custom"
                            >
                              <Trash2 className="w-5 h-5" style={{ color: 'white' }} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Product info */}
                      <div className="p-3">
                        <p className="text-sm truncate" style={{ color: '#f5ede4' }} title={product.base_model}>
                          {product.base_model}
                        </p>
                        <p className="text-xs" style={{ color: '#666' }}>
                          {product.variant_count || 1} variantes
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      size="sm"
                      style={{ backgroundColor: '#2a2a2a', color: '#f5ede4' }}
                    >
                      Anterior
                    </Button>
                    <span style={{ color: '#a8a8a8' }}>
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      size="sm"
                      style={{ backgroundColor: '#2a2a2a', color: '#f5ede4' }}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Single Upload Modal */}
      {selectedProduct && (
        <SingleUploadModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onUpload={handleImageUpload}
          uploading={uploadingProduct === selectedProduct.grouped_id}
        />  
      )}
    </div>
  );
};
