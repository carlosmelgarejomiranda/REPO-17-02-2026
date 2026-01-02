import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ChevronLeft, Upload, Check,
  Undo, Redo, Image, Video, Edit3, Loader2
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
  const [editingElement, setEditingElement] = useState(null);
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

  // Apply modifications to iframe content
  const applyModifications = useCallback(() => {
    if (!iframeRef.current) return;
    
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    if (!iframeDoc) return;

    // Apply text modifications
    Object.entries(pageModifications).forEach(([selector, value]) => {
      try {
        if (selector.startsWith('text:')) {
          const elementId = selector.replace('text:', '');
          const element = iframeDoc.querySelector(`[data-edit-id="${elementId}"]`);
          if (element) {
            element.textContent = value;
          }
        } else if (selector.startsWith('img:')) {
          const elementId = selector.replace('img:', '');
          const element = iframeDoc.querySelector(`[data-edit-id="${elementId}"]`);
          if (element) {
            element.src = value;
          }
        }
      } catch (err) {
        console.error('Error applying modification:', err);
      }
    });
  }, [pageModifications]);

  // Setup editing capabilities on iframe load
  const setupIframeEditing = useCallback(() => {
    if (!iframeRef.current) return;
    
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    if (!iframeDoc) return;

    // Add editing styles
    const style = iframeDoc.createElement('style');
    style.textContent = `
      [data-editable="true"] {
        cursor: pointer;
        transition: outline 0.2s ease;
      }
      [data-editable="true"]:hover {
        outline: 2px dashed #d4a968 !important;
        outline-offset: 4px;
      }
      [data-editable="true"].editing {
        outline: 2px solid #d4a968 !important;
        outline-offset: 4px;
        background: rgba(212, 169, 104, 0.1);
      }
      .edit-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
      }
      .edit-popup {
        position: fixed;
        z-index: 9999;
        background: #1a1a1a;
        border: 1px solid #d4a968;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      .edit-input {
        width: 300px;
        padding: 8px 12px;
        background: #0a0a0a;
        border: 1px solid #333;
        border-radius: 6px;
        color: white;
        font-size: 14px;
      }
      .edit-input:focus {
        outline: none;
        border-color: #d4a968;
      }
      .edit-btn {
        padding: 8px 16px;
        background: #d4a968;
        border: none;
        border-radius: 6px;
        color: black;
        font-weight: 500;
        cursor: pointer;
        margin-top: 8px;
      }
      .edit-btn:hover {
        background: #c49958;
      }
      .edit-btn-cancel {
        background: transparent;
        border: 1px solid #666;
        color: white;
        margin-left: 8px;
      }
      .edit-btn-cancel:hover {
        background: #333;
      }
      .img-edit-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
        cursor: pointer;
      }
      [data-editable-img="true"]:hover .img-edit-overlay {
        opacity: 1;
      }
      .img-edit-btn {
        background: #d4a968;
        color: black;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      body.builder-editing {
        cursor: default;
      }
    `;
    iframeDoc.head.appendChild(style);

    // Mark editable elements
    const markEditableElements = () => {
      // Mark all text elements that can be edited
      const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, p, span, a, button, label');
      textElements.forEach((el, index) => {
        if (el.children.length === 0 || el.childNodes.length === 1) {
          const editId = `text-${selectedPage.id}-${index}`;
          el.setAttribute('data-editable', 'true');
          el.setAttribute('data-edit-id', editId);
          el.setAttribute('data-edit-type', 'text');
        }
      });

      // Mark all images
      const images = iframeDoc.querySelectorAll('img');
      images.forEach((img, index) => {
        const editId = `img-${selectedPage.id}-${index}`;
        img.setAttribute('data-edit-id', editId);
        img.setAttribute('data-edit-type', 'image');
        
        // Wrap image if not already wrapped
        if (!img.parentElement.classList.contains('img-edit-wrapper')) {
          const wrapper = iframeDoc.createElement('div');
          wrapper.className = 'img-edit-wrapper';
          wrapper.style.position = 'relative';
          wrapper.style.display = 'inline-block';
          wrapper.setAttribute('data-editable-img', 'true');
          
          const overlay = iframeDoc.createElement('div');
          overlay.className = 'img-edit-overlay';
          overlay.innerHTML = '<div class="img-edit-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> Cambiar imagen</div>';
          
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
          wrapper.appendChild(overlay);
          
          overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleImageClick(img, editId);
          });
        }
      });
    };

    // Handle text element clicks
    const handleTextClick = (e) => {
      if (!isEditing) return;
      
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
      popup.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 150)}px`;
      popup.style.left = `${Math.max(10, rect.left)}px`;
      
      const isMultiline = target.tagName === 'P' || currentText.length > 50;
      
      popup.innerHTML = `
        <div style="color: #d4a968; font-size: 12px; margin-bottom: 8px; font-weight: 500;">
          Editar texto
        </div>
        ${isMultiline 
          ? `<textarea class="edit-input" style="height: 100px; resize: vertical;">${currentText}</textarea>`
          : `<input type="text" class="edit-input" value="${currentText}" />`
        }
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="edit-btn save-btn">Guardar</button>
          <button class="edit-btn edit-btn-cancel cancel-btn">Cancelar</button>
        </div>
      `;
      
      iframeDoc.body.appendChild(overlay);
      iframeDoc.body.appendChild(popup);
      
      const input = popup.querySelector('.edit-input');
      input.focus();
      input.select();
      
      // Save handler
      const saveEdit = () => {
        const newValue = input.value;
        target.textContent = newValue;
        target.classList.remove('editing');
        
        // Save modification
        setPageModifications(prev => ({
          ...prev,
          [`text:${editId}`]: newValue
        }));
        setHasChanges(true);
        
        popup.remove();
        overlay.remove();
      };
      
      // Cancel handler
      const cancelEdit = () => {
        target.classList.remove('editing');
        popup.remove();
        overlay.remove();
      };
      
      popup.querySelector('.save-btn').addEventListener('click', saveEdit);
      popup.querySelector('.cancel-btn').addEventListener('click', cancelEdit);
      overlay.addEventListener('click', cancelEdit);
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isMultiline) {
          saveEdit();
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });
    };

    // Handle image click
    const handleImageClick = (img, editId) => {
      setMediaTarget({ element: img, editId });
      setShowMediaModal(true);
    };

    // Add click listeners
    iframeDoc.addEventListener('click', handleTextClick, true);
    
    // Mark elements
    markEditableElements();
    
    // Apply any saved modifications
    applyModifications();
    
    // Add body class
    iframeDoc.body.classList.add('builder-editing');

  }, [isEditing, selectedPage, applyModifications]);

  // Handle iframe load
  const handleIframeLoad = () => {
    if (isEditing) {
      setupIframeEditing();
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

  // Handle image change from modal
  const handleImageChange = (newUrl) => {
    if (mediaTarget && iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      const img = iframeDoc.querySelector(`[data-edit-id="${mediaTarget.editId}"]`);
      if (img) {
        img.src = newUrl;
        setPageModifications(prev => ({
          ...prev,
          [`img:${mediaTarget.editId}`]: newUrl
        }));
        setHasChanges(true);
      }
    }
    setShowMediaModal(false);
    setMediaTarget(null);
  };

  // Get iframe URL
  const getIframeUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${selectedPage.path}?builder=true`;
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
            💡 <strong>Modo Edición:</strong> Haz clic en cualquier texto para editarlo • Pasa el cursor sobre las imágenes para cambiarlas
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
          currentUrl={mediaTarget?.element?.src}
        />
      )}
    </div>
  );
};

// Media Modal Component
const MediaModal = ({ onClose, onSelect, currentUrl }) => {
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
          <h3 className="text-xl text-white font-medium">Cambiar Imagen</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview */}
        {url && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black/50">
            <img src={url} alt="Preview" className="w-full h-48 object-cover" />
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
          {uploading ? 'Subiendo...' : 'Subir desde tu dispositivo'}
        </button>

        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="O pega una URL de imagen..."
            className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
          />
          <button
            onClick={() => url && onSelect(url)}
            className="px-4 py-2 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
