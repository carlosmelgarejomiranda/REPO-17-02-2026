import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ChevronLeft, Upload, Check,
  Edit3, Loader2, Image, Images, ChevronRight
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
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState(null);
  const [carouselImages, setCarouselImages] = useState([]);
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

  // Handle single image change from modal
  const handleImageChange = useCallback((newUrl) => {
    if (mediaTarget && iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      if (mediaTarget.type === 'img') {
        const img = iframeDoc.querySelector(`[data-edit-id="${mediaTarget.editId}"]`);
        if (img) {
          img.src = newUrl;
        }
      } else if (mediaTarget.type === 'background') {
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

  // Handle carousel images change
  const handleCarouselChange = useCallback((newImages) => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      
      // Update all carousel images in the DOM
      newImages.forEach((url, index) => {
        const img = iframeDoc.querySelector(`[data-carousel-index="${index}"]`);
        if (img) {
          img.src = url;
        }
      });
      
      // Save modifications
      setPageModifications(prev => ({
        ...prev,
        'carousel:hero': JSON.stringify(newImages)
      }));
      setHasChanges(true);
    }
    setShowCarouselModal(false);
    setCarouselImages([]);
  }, []);

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
        transition: all 0.2s ease !important;
        position: relative !important;
      }
      [data-editable="true"]:hover {
        outline: 2px dashed #d4a968 !important;
        outline-offset: 2px !important;
        background: rgba(212, 169, 104, 0.1) !important;
      }
      [data-editable="true"].editing {
        outline: 2px solid #d4a968 !important;
        outline-offset: 2px !important;
        background: rgba(212, 169, 104, 0.2) !important;
      }

      /* Image editing button */
      .builder-img-btn {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: #d4a968 !important;
        color: black !important;
        padding: 12px 24px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        display: none !important;
        align-items: center !important;
        gap: 8px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        z-index: 99999 !important;
        cursor: pointer !important;
        border: none !important;
        white-space: nowrap !important;
      }
      .builder-img-btn:hover {
        background: #c49958 !important;
        transform: translate(-50%, -50%) scale(1.05) !important;
      }
      [data-builder-img]:hover .builder-img-btn {
        display: flex !important;
      }
      [data-builder-img] {
        position: relative !important;
      }
      [data-builder-img]::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: rgba(0,0,0,0) !important;
        transition: background 0.2s ease !important;
        pointer-events: none !important;
        z-index: 99998 !important;
      }
      [data-builder-img]:hover::after {
        background: rgba(0,0,0,0.6) !important;
      }

      /* Carousel edit button - special for hero slideshow */
      .builder-carousel-btn {
        position: absolute !important;
        top: 20px !important;
        right: 20px !important;
        background: #d4a968 !important;
        color: black !important;
        padding: 14px 24px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
        z-index: 99999 !important;
        cursor: pointer !important;
        border: none !important;
        white-space: nowrap !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
      }
      .builder-carousel-btn:hover {
        background: #c49958 !important;
      }
      [data-carousel-container]:hover .builder-carousel-btn {
        opacity: 1 !important;
      }

      /* Background image edit button */
      .builder-bg-btn {
        position: absolute !important;
        top: 16px !important;
        right: 16px !important;
        background: #d4a968 !important;
        color: black !important;
        padding: 12px 20px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        cursor: pointer !important;
        z-index: 99999 !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        border: none !important;
      }
      [data-has-bg="true"]:hover .builder-bg-btn {
        opacity: 1 !important;
      }
      .builder-bg-btn:hover {
        background: #c49958 !important;
      }

      /* Edit popup styles */
      .edit-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0,0,0,0.7) !important;
        z-index: 99998 !important;
      }
      .edit-popup {
        position: fixed !important;
        z-index: 99999 !important;
        background: #1a1a1a !important;
        border: 2px solid #d4a968 !important;
        border-radius: 12px !important;
        padding: 20px !important;
        box-shadow: 0 20px 60px rgba(0,0,0,0.7) !important;
        max-width: 90vw !important;
      }
      .edit-input {
        width: 350px !important;
        max-width: 100% !important;
        padding: 12px 16px !important;
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
        padding: 12px 24px !important;
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
        margin-left: 10px !important;
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
      // ==========================================
      // MARK ALL TEXT ELEMENTS
      // ==========================================
      const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, div';
      const textElements = iframeDoc.querySelectorAll(textSelectors);
      let textIndex = 0;
      
      textElements.forEach((el) => {
        // Skip if already processed or is part of builder UI
        if (el.hasAttribute('data-editable')) return;
        if (el.classList.contains('builder-img-btn')) return;
        if (el.classList.contains('builder-carousel-btn')) return;
        if (el.classList.contains('builder-bg-btn')) return;
        if (el.classList.contains('edit-popup')) return;
        if (el.closest('.edit-popup')) return;
        
        // Check if element has direct text content
        let hasDirectText = false;
        let textContent = '';
        
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            hasDirectText = true;
            textContent += node.textContent;
          }
        }
        
        // Also check for elements with only inline children (span, strong, em, etc)
        if (!hasDirectText) {
          const inlineTags = ['SPAN', 'STRONG', 'EM', 'B', 'I', 'A', 'BR'];
          const hasOnlyInline = Array.from(el.children).every(child => 
            inlineTags.includes(child.tagName) || child.nodeType === Node.TEXT_NODE
          );
          if (hasOnlyInline && el.textContent.trim()) {
            hasDirectText = true;
            textContent = el.textContent;
          }
        }
        
        if (hasDirectText && textContent.trim().length > 0 && textContent.trim().length < 500) {
          const editId = `text-${selectedPage.id}-${textIndex++}`;
          el.setAttribute('data-editable', 'true');
          el.setAttribute('data-edit-id', editId);
        }
      });

      // ==========================================
      // DETECT AND MARK CAROUSEL/SLIDESHOW IMAGES
      // ==========================================
      // Look for container with multiple absolute positioned images (typical carousel pattern)
      const potentialCarousels = iframeDoc.querySelectorAll('div');
      potentialCarousels.forEach((container) => {
        const absoluteImages = container.querySelectorAll(':scope > img[class*="absolute"], :scope > img[class*="inset"]');
        
        if (absoluteImages.length >= 2) {
          // This looks like a carousel
          container.setAttribute('data-carousel-container', 'true');
          
          const carouselUrls = [];
          absoluteImages.forEach((img, idx) => {
            img.setAttribute('data-carousel-index', idx);
            img.setAttribute('data-carousel-group', 'hero');
            carouselUrls.push(img.src);
          });
          
          // Add carousel edit button if not exists
          if (!container.querySelector('.builder-carousel-btn')) {
            const carouselBtn = iframeDoc.createElement('button');
            carouselBtn.className = 'builder-carousel-btn';
            carouselBtn.innerHTML = \`
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="2"/>
                <path d="m9 9 3-3 3 3"/>
                <path d="m9 15 3 3 3-3"/>
              </svg>
              Editar \${absoluteImages.length} fotos del carrusel
            \`;
            
            carouselBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({
                type: 'openCarouselModal',
                data: { images: carouselUrls, group: 'hero' }
              }, '*');
            };
            
            container.appendChild(carouselBtn);
          }
        }
      });

      // ==========================================
      // MARK ALL REGULAR <IMG> ELEMENTS
      // ==========================================
      const images = iframeDoc.querySelectorAll('img');
      images.forEach((img, index) => {
        // Skip carousel images (they have their own editor)
        if (img.hasAttribute('data-carousel-index')) return;
        if (img.hasAttribute('data-builder-img')) return;
        if (img.closest('.builder-img-btn')) return;
        if (img.closest('.builder-carousel-btn')) return;
        
        const editId = \`img-\${selectedPage.id}-\${index}\`;
        img.setAttribute('data-edit-id', editId);
        img.setAttribute('data-builder-img', 'true');
        
        // Get parent and ensure it's positioned
        const parent = img.parentElement;
        if (parent) {
          const parentStyle = window.getComputedStyle(parent);
          if (parentStyle.position === 'static') {
            parent.style.position = 'relative';
          }
          parent.setAttribute('data-builder-img', 'true');
          
          // Add edit button if not exists
          if (!parent.querySelector('.builder-img-btn')) {
            const editBtn = iframeDoc.createElement('button');
            editBtn.className = 'builder-img-btn';
            editBtn.innerHTML = \`
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              Cambiar imagen
            \`;
            
            editBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({
                type: 'openImageModal',
                data: { currentUrl: img.src, editId, imageType: 'img' }
              }, '*');
            };
            
            parent.appendChild(editBtn);
          }
        }
      });

      // ==========================================
      // MARK ELEMENTS WITH CSS BACKGROUND IMAGES
      // ==========================================
      const allElements = iframeDoc.querySelectorAll('*');
      let bgIndex = 0;
      allElements.forEach((el) => {
        if (el.hasAttribute('data-has-bg')) return;
        if (el.classList.contains('builder-bg-btn')) return;
        
        if (hasBackgroundImage(el)) {
          const editId = \`bg-\${selectedPage.id}-\${bgIndex++}\`;
          el.setAttribute('data-has-bg', 'true');
          el.setAttribute('data-bg-edit-id', editId);
          
          const style = window.getComputedStyle(el);
          if (style.position === 'static') {
            el.style.position = 'relative';
          }
          
          // Add background edit button
          if (!el.querySelector('.builder-bg-btn')) {
            const editBtn = iframeDoc.createElement('button');
            editBtn.className = 'builder-bg-btn';
            editBtn.innerHTML = \`
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
              Cambiar fondo
            \`;
            
            editBtn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const currentUrl = getBackgroundImageUrl(el);
              window.parent.postMessage({
                type: 'openImageModal',
                data: { currentUrl, editId, imageType: 'background' }
              }, '*');
            };
            
            el.appendChild(editBtn);
          }
        }
      });

      // Log summary
      const textCount = iframeDoc.querySelectorAll('[data-editable="true"]').length;
      const imgCount = iframeDoc.querySelectorAll('[data-builder-img]').length;
      const carouselCount = iframeDoc.querySelectorAll('[data-carousel-container]').length;
      const bgCount = iframeDoc.querySelectorAll('[data-has-bg]').length;
      console.log(\`Builder: \${textCount} textos, \${imgCount} imágenes, \${carouselCount} carruseles, \${bgCount} fondos editables\`);
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
      iframeDoc.querySelectorAll('.edit-popup, .edit-overlay').forEach(el => el.remove());
      
      target.classList.add('editing');
      
      // Create edit popup
      const overlay = iframeDoc.createElement('div');
      overlay.className = 'edit-overlay';
      
      const popup = iframeDoc.createElement('div');
      popup.className = 'edit-popup';
      
      // Position popup
      let top = Math.min(rect.bottom + 10, iframeDoc.documentElement.clientHeight - 180);
      let left = Math.max(10, Math.min(rect.left, iframeDoc.documentElement.clientWidth - 400));
      
      popup.style.top = \`\${top}px\`;
      popup.style.left = \`\${left}px\`;
      
      const isMultiline = target.tagName === 'P' || currentText.length > 80;
      
      popup.innerHTML = \`
        <div style="color: #d4a968; font-size: 12px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
          ✏️ Editar texto
        </div>
        \${isMultiline 
          ? \`<textarea class="edit-input" style="height: 120px; resize: vertical;">\${currentText}</textarea>\`
          : \`<input type="text" class="edit-input" value="\${currentText.replace(/"/g, '&quot;')}" />\`
        }
        <div style="display: flex; gap: 10px; margin-top: 16px;">
          <button class="edit-btn save-btn">✓ Guardar</button>
          <button class="edit-btn edit-btn-cancel cancel-btn">Cancelar</button>
        </div>
      \`;
      
      iframeDoc.body.appendChild(overlay);
      iframeDoc.body.appendChild(popup);
      
      const input = popup.querySelector('.edit-input');
      input.focus();
      if (!isMultiline) input.select();
      
      const saveEdit = () => {
        const newValue = input.value;
        target.textContent = newValue;
        target.classList.remove('editing');
        
        window.parent.postMessage({
          type: 'saveTextEdit',
          data: { editId, value: newValue }
        }, '*');
        
        popup.remove();
        overlay.remove();
      };
      
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

    // Add click listener
    iframeDoc.addEventListener('click', handleTextClick, true);
    
    // Mark all editable elements after a delay
    setTimeout(markEditableElements, 800);

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
      } else if (event.data.type === 'openCarouselModal') {
        setCarouselImages(event.data.data.images);
        setShowCarouselModal(true);
      } else if (event.data.type === 'saveTextEdit') {
        setPageModifications(prev => ({
          ...prev,
          [\`text:\${event.data.data.editId}\`]: event.data.data.value
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
      setTimeout(setupIframeEditing, 1200);
    }
  };

  // Save modifications
  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(\`\${API_URL}/api/builder/modifications/\${selectedPage.id}\`, {
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
    return \`\${baseUrl}\${selectedPage.path}?builder=true&t=\${Date.now()}\`;
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
              className={\`p-2 rounded transition-colors \${previewDevice === 'mobile' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}\`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={\`p-2 rounded transition-colors \${previewDevice === 'desktop' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}\`}
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          {/* Edit/Preview Toggle */}
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              if (iframeRef.current) {
                iframeRef.current.src = getIframeUrl();
              }
            }}
            className={\`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors \${
              isEditing 
                ? 'bg-[#d4a968] text-black' 
                : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
            }\`}
          >
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isEditing ? 'Editando' : 'Preview'}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={\`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors \${
              hasChanges ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }\`}
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
            💡 <strong>Modo Edición:</strong> Haz clic en textos para editarlos • Pasa el cursor sobre imágenes para cambiarlas • Los carruseles muestran botón para editar todas las fotos
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

      {/* Single Image Modal */}
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

      {/* Carousel Modal */}
      {showCarouselModal && (
        <CarouselModal
          onClose={() => {
            setShowCarouselModal(false);
            setCarouselImages([]);
          }}
          onSave={handleCarouselChange}
          images={carouselImages}
        />
      )}
    </div>
  );
};

// Single Image Modal
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
      const response = await fetch(\`\${API_URL}/api/builder/upload-media\`, {
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
          <h3 className="text-xl text-white font-medium flex items-center gap-2">
            <Image className="w-5 h-5 text-[#d4a968]" />
            {type === 'background' ? 'Cambiar Fondo' : 'Cambiar Imagen'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {url && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black/50 border border-white/10">
            <img src={url} alt="Preview" className="w-full h-48 object-cover" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2 mb-4"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {uploading ? 'Subiendo...' : 'Subir imagen'}
        </button>

        <div className="space-y-3">
          <label className="text-sm text-gray-400">O pega una URL:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
            />
            <button
              onClick={() => url && onSelect(url)}
              disabled={!url}
              className="px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm text-gray-400 mb-3 block">Sugerencias:</label>
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

// Carousel Modal - For editing multiple images
const CarouselModal = ({ onClose, onSave, images }) => {
  const [editedImages, setEditedImages] = useState([...images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const updateImage = (index, newUrl) => {
    const updated = [...editedImages];
    updated[index] = newUrl;
    setEditedImages(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(\`\${API_URL}/api/builder/upload-media\`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        updateImage(activeIndex, data.url);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl text-white font-medium flex items-center gap-2">
            <Images className="w-5 h-5 text-[#d4a968]" />
            Editar {images.length} fotos del carrusel
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image thumbnails */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {editedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={\`flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 transition-all \${
                activeIndex === idx ? 'border-[#d4a968] ring-2 ring-[#d4a968]/30' : 'border-white/10 hover:border-white/30'
              }\`}
            >
              <img src={img} alt={\`Slide \${idx + 1}\`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
                {idx + 1}
              </div>
            </button>
          ))}
        </div>

        {/* Active image editor */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="text-sm text-[#d4a968] mb-3 font-medium">
            Foto {activeIndex + 1} de {editedImages.length}
          </div>
          
          <div className="aspect-video rounded-lg overflow-hidden bg-black/50 mb-4">
            <img 
              src={editedImages[activeIndex]} 
              alt={\`Preview \${activeIndex + 1}\`} 
              className="w-full h-full object-cover"
            />
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 p-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Subiendo...' : 'Subir nueva'}
            </button>
            
            <input
              type="text"
              value={editedImages[activeIndex]}
              onChange={(e) => updateImage(activeIndex, e.target.value)}
              placeholder="URL de imagen..."
              className="flex-[2] p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
            />
          </div>
        </div>

        {/* Navigation between images */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <div className="flex gap-2">
            {editedImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={\`w-3 h-3 rounded-full transition-colors \${
                  activeIndex === idx ? 'bg-[#d4a968]' : 'bg-white/20'
                }\`}
              />
            ))}
          </div>
          <button
            onClick={() => setActiveIndex(Math.min(editedImages.length - 1, activeIndex + 1))}
            disabled={activeIndex === editedImages.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Save button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(editedImages)}
            className="flex-1 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
          >
            Guardar {images.length} fotos
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
