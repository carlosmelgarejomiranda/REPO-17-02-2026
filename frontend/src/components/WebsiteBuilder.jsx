import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ChevronLeft, Upload, Check,
  Edit3, Loader2, Image
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Available pages for editing
const EDITABLE_PAGES = [
  { id: 'main-landing', name: 'Página Principal', path: '/' },
  { id: 'studio-landing', name: 'Avenue Studio', path: '/studio' },
  { id: 'tu-marca', name: 'Tu Marca en Avenue', path: '/tu-marca' },
  { id: 'ugc', name: 'UGC Creators', path: '/studio/ugc/avenue' },
  { id: 'booking', name: 'Reservas Studio', path: '/studio/reservar' },
];

export const WebsiteBuilder = ({ onClose }) => {
  const [selectedPage, setSelectedPage] = useState(EDITABLE_PAGES[0]);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [isEditing, setIsEditing] = useState(true);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageModifications, setPageModifications] = useState({});
  
  const iframeRef = useRef(null);

  // Load saved modifications for current page
  useEffect(() => {
    loadPageModifications(selectedPage.id);
  }, [selectedPage]);

  const loadPageModifications = async (pageId) => {
    try {
      const response = await fetch(`${API_URL}/api/builder/modifications/${pageId}`);
      if (response.ok) {
        const data = await response.json();
        setPageModifications(data.modifications || {});
      }
    } catch (err) {
      console.error('Error loading modifications:', err);
    }
  };

  // Handle image change from modal
  const handleImageChange = useCallback((newUrl) => {
    if (mediaTarget && iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      if (mediaTarget.type === 'img') {
        // Regular image tag
        const img = iframeDoc.querySelector(`[data-edit-id="${mediaTarget.editId}"]`);
        if (img) {
          img.src = newUrl;
        }
      } else if (mediaTarget.type === 'background') {
        // Background image
        const element = iframeDoc.querySelector(`[data-bg-edit-id="${mediaTarget.editId}"]`);
        if (element) {
          element.style.backgroundImage = `url('${newUrl}')`;
        }
      }
      
      setPageModifications(prev => ({
        ...prev,
        [`${mediaTarget.type}:${mediaTarget.editId}`]: newUrl
      }));
      setHasChanges(true);
    }
    setShowMediaModal(false);
    setMediaTarget(null);
  }, [mediaTarget]);

  // Setup editing capabilities on iframe load
  const setupIframeEditing = useCallback(() => {
    if (!iframeRef.current) return;
    
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    if (!iframeDoc) return;

    // Add editing styles
    const style = iframeDoc.createElement('style');
    style.id = 'builder-styles';
    style.textContent = `
      /* Text editing styles */
      [data-editable="true"] {
        cursor: pointer !important;
        transition: outline 0.2s ease, background 0.2s ease;
      }
      [data-editable="true"]:hover {
        outline: 2px dashed #d4a968 !important;
        outline-offset: 2px;
      }
      [data-editable="true"].editing {
        outline: 2px solid #d4a968 !important;
        outline-offset: 2px;
        background: rgba(212, 169, 104, 0.15) !important;
      }

      /* Image editing styles */
      .img-edit-wrapper {
        position: relative !important;
        display: inline-block;
      }
      .img-edit-overlay {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0,0,0,0.7) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        cursor: pointer !important;
        z-index: 100 !important;
      }
      .img-edit-wrapper:hover .img-edit-overlay {
        opacity: 1 !important;
      }
      .img-edit-btn {
        background: #d4a968 !important;
        color: black !important;
        padding: 12px 24px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      }

      /* Background image editing styles */
      .bg-edit-btn {
        position: absolute !important;
        top: 16px !important;
        right: 16px !important;
        background: #d4a968 !important;
        color: black !important;
        padding: 10px 18px !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        cursor: pointer !important;
        z-index: 1000 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        border: none !important;
      }
      [data-has-bg="true"]:hover .bg-edit-btn {
        opacity: 1 !important;
      }
      .bg-edit-btn:hover {
        background: #c49958 !important;
      }

      /* Edit popup styles */
      .edit-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0,0,0,0.6) !important;
        z-index: 9998 !important;
      }
      .edit-popup {
        position: fixed !important;
        z-index: 9999 !important;
        background: #1a1a1a !important;
        border: 2px solid #d4a968 !important;
        border-radius: 12px !important;
        padding: 16px !important;
        box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
        max-width: 90vw !important;
      }
      .edit-input {
        width: 320px !important;
        max-width: 100% !important;
        padding: 10px 14px !important;
        background: #0a0a0a !important;
        border: 1px solid #333 !important;
        border-radius: 8px !important;
        color: white !important;
        font-size: 14px !important;
      }
      .edit-input:focus {
        outline: none !important;
        border-color: #d4a968 !important;
      }
      .edit-btn {
        padding: 10px 20px !important;
        background: #d4a968 !important;
        border: none !important;
        border-radius: 8px !important;
        color: black !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        font-size: 14px !important;
      }
      .edit-btn:hover {
        background: #c49958 !important;
      }
      .edit-btn-cancel {
        background: transparent !important;
        border: 1px solid #555 !important;
        color: white !important;
        margin-left: 8px !important;
      }
      .edit-btn-cancel:hover {
        background: #333 !important;
      }
    `;
    
    // Remove existing styles if any
    const existingStyle = iframeDoc.getElementById('builder-styles');
    if (existingStyle) existingStyle.remove();
    
    iframeDoc.head.appendChild(style);

    // Function to check if element has background image
    const hasBackgroundImage = (el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      return bgImage && bgImage !== 'none' && bgImage.includes('url');
    };

    // Function to get background image URL
    const getBackgroundImageUrl = (el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;
      const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      return match ? match[1] : '';
    };

    // Mark editable elements
    const markEditableElements = () => {
      // Mark all text elements that can be edited
      const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, label, li');
      let textIndex = 0;
      textElements.forEach((el) => {
        // Only mark leaf text nodes (elements with mostly text content)
        const hasOnlyTextOrSmallChildren = Array.from(el.childNodes).every(
          node => node.nodeType === Node.TEXT_NODE || 
                  (node.nodeType === Node.ELEMENT_NODE && ['SPAN', 'STRONG', 'EM', 'B', 'I', 'BR'].includes(node.tagName))
        );
        
        if (hasOnlyTextOrSmallChildren && el.textContent.trim().length > 0) {
          const editId = `text-${selectedPage.id}-${textIndex++}`;
          el.setAttribute('data-editable', 'true');
          el.setAttribute('data-edit-id', editId);
        }
      });

      // Mark all <img> elements
      const images = iframeDoc.querySelectorAll('img');
      images.forEach((img, index) => {
        if (img.closest('.img-edit-wrapper')) return; // Already wrapped
        
        const editId = `img-${selectedPage.id}-${index}`;
        img.setAttribute('data-edit-id', editId);
        
        const wrapper = iframeDoc.createElement('div');
        wrapper.className = 'img-edit-wrapper';
        
        // Copy some styles from parent
        const imgStyle = window.getComputedStyle(img);
        if (imgStyle.display === 'block') {
          wrapper.style.display = 'block';
        }
        wrapper.style.width = 'fit-content';
        
        const overlay = iframeDoc.createElement('div');
        overlay.className = 'img-edit-overlay';
        overlay.innerHTML = `
          <div class="img-edit-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            Cambiar imagen
          </div>
        `;
        
        img.parentNode.insertBefore(wrapper, img);
        wrapper.appendChild(img);
        wrapper.appendChild(overlay);
        
        overlay.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          openImageModal(img.src, editId, 'img');
        };
      });

      // Mark all elements with background images
      const allElements = iframeDoc.querySelectorAll('*');
      let bgIndex = 0;
      allElements.forEach((el) => {
        if (hasBackgroundImage(el) && !el.querySelector('.bg-edit-btn')) {
          const editId = `bg-${selectedPage.id}-${bgIndex++}`;
          el.setAttribute('data-has-bg', 'true');
          el.setAttribute('data-bg-edit-id', editId);
          
          // Make sure element has position for absolute button
          const style = window.getComputedStyle(el);
          if (style.position === 'static') {
            el.style.position = 'relative';
          }
          
          const editBtn = iframeDoc.createElement('button');
          editBtn.className = 'bg-edit-btn';
          editBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="m21 15-5-5L5 21"/>
            </svg>
            Cambiar fondo
          `;
          
          editBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentUrl = getBackgroundImageUrl(el);
            openImageModal(currentUrl, editId, 'background');
          };
          
          el.appendChild(editBtn);
        }
      });
    };

    // Open image modal (communicate with parent)
    const openImageModal = (currentUrl, editId, type) => {
      // Use postMessage to communicate with parent
      window.parent.postMessage({
        type: 'openImageModal',
        data: { currentUrl, editId, imageType: type }
      }, '*');
    };

    // Handle text element clicks
    const handleTextClick = (e) => {
      const target = e.target;
      if (target.getAttribute('data-editable') !== 'true') return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const editId = target.getAttribute('data-edit-id');
      const currentText = target.textContent;
      const rect = target.getBoundingClientRect();
      
      // Remove any existing edit popups
      const existingPopup = iframeDoc.querySelector('.edit-popup');
      const existingOverlay = iframeDoc.querySelector('.edit-overlay');
      if (existingPopup) existingPopup.remove();
      if (existingOverlay) existingOverlay.remove();
      
      target.classList.add('editing');
      
      // Create edit popup
      const overlay = iframeDoc.createElement('div');
      overlay.className = 'edit-overlay';
      
      const popup = iframeDoc.createElement('div');
      popup.className = 'edit-popup';
      
      // Position popup
      const iframeRect = iframeRef.current.getBoundingClientRect();
      let top = rect.bottom + 10;
      let left = Math.max(10, rect.left);
      
      // Make sure popup is visible
      if (top + 150 > iframeDoc.documentElement.clientHeight) {
        top = Math.max(10, rect.top - 150);
      }
      
      popup.style.top = `${top}px`;
      popup.style.left = `${left}px`;
      
      const isMultiline = target.tagName === 'P' || currentText.length > 60;
      
      popup.innerHTML = `
        <div style="color: #d4a968; font-size: 12px; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          Editar texto
        </div>
        ${isMultiline 
          ? `<textarea class="edit-input" style="height: 120px; resize: vertical;">${currentText}</textarea>`
          : `<input type="text" class="edit-input" value="${currentText.replace(/"/g, '&quot;')}" />`
        }
        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <button class="edit-btn save-btn">Guardar</button>
          <button class="edit-btn edit-btn-cancel cancel-btn">Cancelar</button>
        </div>
      `;
      
      iframeDoc.body.appendChild(overlay);
      iframeDoc.body.appendChild(popup);
      
      const input = popup.querySelector('.edit-input');
      input.focus();
      if (!isMultiline) input.select();
      
      // Save handler
      const saveEdit = () => {
        const newValue = input.value;
        target.textContent = newValue;
        target.classList.remove('editing');
        
        // Save modification via postMessage
        window.parent.postMessage({
          type: 'saveTextEdit',
          data: { editId, value: newValue }
        }, '*');
        
        popup.remove();
        overlay.remove();
      };
      
      // Cancel handler
      const cancelEdit = () => {
        target.classList.remove('editing');
        popup.remove();
        overlay.remove();
      };
      
      popup.querySelector('.save-btn').onclick = saveEdit;
      popup.querySelector('.cancel-btn').onclick = cancelEdit;
      overlay.onclick = cancelEdit;
      
      input.onkeydown = (e) => {
        if (e.key === 'Enter' && !isMultiline) {
          e.preventDefault();
          saveEdit();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      };
    };

    // Add click listener for text editing
    iframeDoc.addEventListener('click', handleTextClick, true);
    
    // Mark all editable elements
    setTimeout(() => {
      markEditableElements();
    }, 500);

  }, [selectedPage]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'openImageModal') {
        setMediaTarget({
          currentUrl: event.data.data.currentUrl,
          editId: event.data.data.editId,
          type: event.data.data.imageType
        });
        setShowMediaModal(true);
      } else if (event.data.type === 'saveTextEdit') {
        setPageModifications(prev => ({
          ...prev,
          [`text:${event.data.data.editId}`]: event.data.data.value
        }));
        setHasChanges(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle iframe load
  const handleIframeLoad = () => {
    if (isEditing) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        setupIframeEditing();
      }, 1000);
    }
  };

  // Save modifications
  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/builder/modifications/${selectedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: pageModifications })
      });
      setHasChanges(false);
      alert('¡Cambios guardados correctamente!');
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // Get iframe URL
  const getIframeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${selectedPage.path}?builder=true&t=${Date.now()}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          
          <div className="h-6 w-px bg-white/20" />
          
          <select
            value={selectedPage.id}
            onChange={(e) => {
              const page = EDITABLE_PAGES.find(p => p.id === e.target.value);
              if (page) setSelectedPage(page);
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
          >
            {EDITABLE_PAGES.map(page => (
              <option key={page.id} value={page.id} className="bg-[#1a1a1a]">
                {page.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Device Preview Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Edit/Preview Toggle */}
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              // Reload iframe to apply/remove editing mode
              if (iframeRef.current) {
                iframeRef.current.src = getIframeUrl();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-[#d4a968] text-black' 
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }`}
          >
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isEditing ? 'Editando' : 'Preview'}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Help Banner */}
      {isEditing && (
        <div className="bg-[#d4a968]/10 border-b border-[#d4a968]/30 px-4 py-2 text-center">
          <p className="text-[#d4a968] text-sm">
            💡 <strong>Modo Edición:</strong> Haz clic en cualquier texto para editarlo • Pasa el cursor sobre imágenes o fondos para ver el botón "Cambiar"
          </p>
        </div>
      )}

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div 
          className="bg-white rounded-xl shadow-2xl transition-all duration-300 overflow-hidden"
          style={{ 
            width: previewDevice === 'mobile' ? '375px' : '100%',
            maxWidth: previewDevice === 'desktop' ? '1400px' : '375px',
            height: 'calc(100vh - 160px)'
          }}
        >
          <iframe
            ref={iframeRef}
            src={getIframeUrl()}
            className="w-full h-full border-0"
            title="Page Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>

      {/* Media Change Modal */}
      {showMediaModal && (
        <MediaModal
          onClose={() => {
            setShowMediaModal(false);
            setMediaTarget(null);
          }}
          onSelect={handleImageChange}
          currentUrl={mediaTarget?.currentUrl}
          type={mediaTarget?.type}
        />
      )}
    </div>
  );
};

// Media Modal Component
const MediaModal = ({ onClose, onSelect, currentUrl, type }) => {
  const [url, setUrl] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/builder/upload-media`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        onSelect(data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl text-white font-medium">
            {type === 'background' ? 'Cambiar Imagen de Fondo' : 'Cambiar Imagen'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview */}
        {url && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black/50 border border-white/10">
            <img src={url} alt="Preview" className="w-full h-48 object-cover" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          {uploading ? 'Subiendo...' : 'Subir imagen desde tu dispositivo'}
        </button>

        {/* URL Input */}
        <div className="space-y-3">
          <label className="text-sm text-gray-400">O pega una URL de imagen:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
            />
            <button
              onClick={() => url && onSelect(url)}
              disabled={!url}
              className="px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Aplicar
            </button>
          </div>
        </div>

        {/* Suggested images */}
        <div className="mt-6">
          <label className="text-sm text-gray-400 mb-3 block">Imágenes sugeridas:</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
              'https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=400',
              'https://images.unsplash.com/photo-1664277497095-424e085175e8?w=400',
              'https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?w=400',
            ].map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(imgUrl.replace('w=400', 'w=1920'))}
                className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#d4a968] transition-colors"
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
