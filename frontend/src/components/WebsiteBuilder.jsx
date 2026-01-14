import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ChevronLeft, Upload, Check,
  Edit3, Loader2, Image, Images, ChevronRight, Move
} from 'lucide-react';

const API_URL = getApiUrl();

// Error Boundary to catch any React errors
class WebsiteBuilderErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WebsiteBuilder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col items-center justify-center">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
            <h2 className="text-xl text-white mb-4">Error en el Editor</h2>
            <p className="text-gray-400 mb-4">
              Ocurrió un error inesperado. Por favor, recarga la página.
            </p>
            <p className="text-red-400 text-sm mb-4">
              {this.state.error?.message || 'Error desconocido'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-[#d4a968] text-black rounded-lg font-medium"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const EDITABLE_PAGES = [
  { id: 'main-landing', name: 'Página Principal', path: '/' },
  { id: 'studio-landing', name: 'Avenue Studio', path: '/studio' },
  { id: 'tu-marca', name: 'Tu Marca en Avenue', path: '/tu-marca' },
  { id: 'ugc', name: 'UGC Creators', path: '/studio/ugc/avenue' },
  { id: 'booking', name: 'Reservas Studio', path: '/studio/reservar' },
];

const WebsiteBuilderContent = ({ onClose }) => {
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

  // Load saved modifications
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

  // Apply saved modifications to iframe
  const applyModifications = useCallback((iframeDoc, mods) => {
    if (!iframeDoc || !mods) return;
    
    // Helper to check if URL is video
    const isVideoUrl = (url) => {
      if (!url) return false;
      const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.m4v'];
      const lowerUrl = url.toLowerCase();
      if (url.startsWith('data:video/')) return true;
      return videoExtensions.some(ext => lowerUrl.includes(ext));
    };
    
    Object.entries(mods).forEach(([key, value]) => {
      try {
        if (key.startsWith('text:')) {
          const editId = key.replace('text:', '');
          const el = iframeDoc.querySelector(`[data-edit-id="${editId}"]`);
          if (el) el.textContent = value;
        } else if (key.startsWith('img:')) {
          const editId = key.replace('img:', '');
          const el = iframeDoc.querySelector(`[data-edit-id="${editId}"]`);
          if (el) {
            // Check if the value is actually a video URL
            if (isVideoUrl(value)) {
              // Need to replace img with video
              const parent = el.parentElement;
              if (parent) {
                const newEl = iframeDoc.createElement('video');
                newEl.setAttribute('muted', '');
                newEl.setAttribute('loop', '');
                newEl.setAttribute('playsinline', '');
                newEl.setAttribute('preload', 'metadata');
                newEl.muted = true;
                newEl.className = el.className;
                newEl.setAttribute('data-edit-id', editId);
                newEl.src = value;
                parent.replaceChild(newEl, el);
              }
            } else {
              el.src = value;
            }
          }
        } else if (key.startsWith('video:')) {
          const editId = key.replace('video:', '');
          let el = iframeDoc.querySelector(`[data-edit-id="${editId}"]`);
          if (el) {
            // If element is an img, replace it with video
            if (el.tagName === 'IMG') {
              const parent = el.parentElement;
              if (parent) {
                const newEl = iframeDoc.createElement('video');
                newEl.setAttribute('muted', '');
                newEl.setAttribute('loop', '');
                newEl.setAttribute('playsinline', '');
                newEl.setAttribute('preload', 'metadata');
                newEl.muted = true;
                newEl.className = el.className;
                newEl.setAttribute('data-edit-id', editId);
                newEl.src = value;
                parent.replaceChild(newEl, el);
              }
            } else {
              el.src = value;
            }
          }
        } else if (key.startsWith('imgpos:')) {
          const editId = key.replace('imgpos:', '');
          const el = iframeDoc.querySelector(`[data-edit-id="${editId}"]`);
          if (el) el.style.objectPosition = value;
        } else if (key.startsWith('background:')) {
          const editId = key.replace('background:', '');
          const el = iframeDoc.querySelector(`[data-bg-edit-id="${editId}"]`);
          if (el) el.style.backgroundImage = `url('${value}')`;
        } else if (key === 'carousel:hero') {
          const urls = JSON.parse(value);
          urls.forEach((url, idx) => {
            const img = iframeDoc.querySelector(`[data-carousel-index="${idx}"]`);
            if (img) img.src = url;
          });
        }
      } catch (err) {
        console.error('Error applying modification:', key, err);
      }
    });
  }, []);

  // Simple function without useCallback to avoid React closure issues
  const handleImageChange = (newUrl, position) => {
    console.log('=== HANDLE IMAGE CHANGE CALLED ===');
    console.log('newUrl:', newUrl?.substring(0, 100));
    
    // Capture current mediaTarget in local variable immediately
    const currentTarget = mediaTarget;
    
    // Close modal FIRST
    setShowMediaModal(false);
    setMediaTarget(null);
    
    // Validate inputs
    if (!newUrl || !currentTarget) {
      console.error('Missing newUrl or currentTarget');
      return;
    }
    
    // Helper to check if URL is video
    const isVideo = (url) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      if (url.startsWith('data:video/')) return true;
      return ['.mp4', '.mov', '.webm', '.avi', '.m4v'].some(ext => lowerUrl.includes(ext));
    };

    const isNewUrlVideo = isVideo(newUrl);
    console.log('Is video:', isNewUrlVideo);
    
    // IMPORTANT: For videos, DON'T update iframe preview immediately
    // This prevents browser issues with large video files
    // The video will be applied when user saves and page reloads
    if (!isNewUrlVideo) {
      // Only update iframe for images (not videos)
      try {
        if (iframeRef.current) {
          const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
          if (iframeDoc && (currentTarget.type === 'img' || currentTarget.type === 'video')) {
            const el = iframeDoc.querySelector(`[data-edit-id="${currentTarget.editId}"]`);
            if (el && el.tagName === 'IMG') {
              console.log('Updating image preview');
              el.src = newUrl;
              if (position) el.style.objectPosition = position;
            }
          } else if (iframeDoc && currentTarget.type === 'background') {
            const el = iframeDoc.querySelector(`[data-bg-edit-id="${currentTarget.editId}"]`);
            if (el) el.style.backgroundImage = `url('${newUrl}')`;
          }
        }
      } catch (e) {
        console.warn('Could not update iframe preview:', e.message);
      }
    } else {
      console.log('Video detected - skipping iframe preview update to prevent browser issues');
    }
    
    // Save the modification - this is the important part
    const modType = isNewUrlVideo ? 'video' : (currentTarget.type === 'background' ? 'background' : 'img');
    const modKey = `${modType}:${currentTarget.editId}`;
    
    setPageModifications(prev => {
      const updated = { ...prev, [modKey]: newUrl };
      if (position && !isNewUrlVideo) updated[`imgpos:${currentTarget.editId}`] = position;
      console.log('Modifications saved:', modKey);
      return updated;
    });
    
    setHasChanges(true);
    console.log('=== HANDLE IMAGE CHANGE COMPLETE ===');
  };

  const handleCarouselChange = useCallback((newImages) => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      newImages.forEach((url, index) => {
        const img = iframeDoc.querySelector(`[data-carousel-index="${index}"]`);
        if (img) img.src = url;
      });
      
      setPageModifications(prev => ({
        ...prev,
        'carousel:hero': JSON.stringify(newImages)
      }));
      setHasChanges(true);
    }
    setShowCarouselModal(false);
    setCarouselImages([]);
  }, []);

  const setupIframeEditing = useCallback(() => {
    if (!iframeRef.current) return;
    const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
    if (!iframeDoc) return;

    const style = iframeDoc.createElement('style');
    style.id = 'builder-styles';
    style.textContent = `
      [data-editable="true"] {
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      }
      [data-editable="true"]:hover {
        outline: 2px dashed #d4a968 !important;
        outline-offset: 2px !important;
        background: rgba(212, 169, 104, 0.1) !important;
      }
      [data-editable="true"].editing {
        outline: 2px solid #d4a968 !important;
        background: rgba(212, 169, 104, 0.2) !important;
      }
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
      }
      .builder-img-btn:hover { background: #c49958 !important; }
      [data-builder-img]:hover .builder-img-btn { display: flex !important; }
      [data-builder-img] { position: relative !important; }
      [data-builder-img]::after {
        content: '' !important;
        position: absolute !important;
        inset: 0 !important;
        background: rgba(0,0,0,0) !important;
        transition: background 0.2s ease !important;
        pointer-events: none !important;
        z-index: 99998 !important;
      }
      [data-builder-img]:hover::after { background: rgba(0,0,0,0.6) !important; }
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
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
      }
      [data-carousel-container]:hover .builder-carousel-btn { opacity: 1 !important; }
      .builder-bg-btn {
        position: absolute !important;
        top: 16px !important;
        right: 16px !important;
        background: #d4a968 !important;
        color: black !important;
        padding: 12px 20px !important;
        border-radius: 10px !important;
        font-weight: 600 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        z-index: 99999 !important;
        opacity: 0 !important;
        transition: opacity 0.3s ease !important;
        border: none !important;
        cursor: pointer !important;
      }
      [data-has-bg="true"]:hover .builder-bg-btn { opacity: 1 !important; }
      .edit-overlay {
        position: fixed !important;
        inset: 0 !important;
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
      }
      .edit-input {
        width: 350px !important;
        padding: 12px 16px !important;
        background: #0a0a0a !important;
        border: 1px solid #333 !important;
        border-radius: 8px !important;
        color: white !important;
        font-size: 14px !important;
      }
      .edit-input:focus { outline: none !important; border-color: #d4a968 !important; }
      .edit-btn {
        padding: 12px 24px !important;
        background: #d4a968 !important;
        border: none !important;
        border-radius: 8px !important;
        color: black !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }
      .edit-btn:hover { background: #c49958 !important; }
      .edit-btn-cancel {
        background: transparent !important;
        border: 1px solid #555 !important;
        color: white !important;
        margin-left: 10px !important;
      }
    `;
    
    const existingStyle = iframeDoc.getElementById('builder-styles');
    if (existingStyle) existingStyle.remove();
    iframeDoc.head.appendChild(style);

    const hasBackgroundImage = (el) => {
      const s = window.getComputedStyle(el);
      return s.backgroundImage && s.backgroundImage !== 'none' && s.backgroundImage.includes('url');
    };

    const getBackgroundImageUrl = (el) => {
      const s = window.getComputedStyle(el);
      const match = s.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      return match ? match[1] : '';
    };

    const markEditableElements = () => {
      let textIndex = 0;
      
      // Helper: Check if element should be skipped
      const shouldSkipElement = (el) => {
        if (!el || !el.tagName) return true;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'svg', 'path', 'iframe', 'head', 'meta', 'link'].includes(tag)) return true;
        if (el.classList && (el.classList.contains('builder-img-btn') || 
            el.classList.contains('builder-carousel-btn') || 
            el.classList.contains('builder-bg-btn') ||
            el.classList.contains('edit-popup') ||
            el.classList.contains('edit-overlay'))) return true;
        if (el.closest && el.closest('.edit-popup, .edit-overlay, script, style, svg')) return true;
        return false;
      };

      // Helper: Find all text nodes in the document using TreeWalker
      const findAllTextNodes = () => {
        const textNodes = [];
        const walker = iframeDoc.createTreeWalker(
          iframeDoc.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const text = node.textContent.trim();
              if (!text || text.length === 0) return NodeFilter.FILTER_REJECT;
              if (text.length > 500) return NodeFilter.FILTER_REJECT;
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              if (shouldSkipElement(parent)) return NodeFilter.FILTER_REJECT;
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );
        
        while (walker.nextNode()) {
          textNodes.push(walker.currentNode);
        }
        return textNodes;
      };

      // Process all text nodes
      const textNodes = findAllTextNodes();
      const processedParents = new Set();
      
      textNodes.forEach((textNode) => {
        const parent = textNode.parentElement;
        if (!parent || processedParents.has(parent)) return;
        if (parent.hasAttribute('data-editable')) return;
        
        // Check if parent has mostly text content (not complex nested elements)
        const parentText = parent.textContent.trim();
        const directTextContent = Array.from(parent.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent.trim())
          .join('');
        
        // If the parent is a leaf node or has significant direct text
        const isLeafOrTextNode = parent.children.length === 0 || 
          (directTextContent.length > 0 && directTextContent.length >= parentText.length * 0.3);
        
        if (isLeafOrTextNode && parentText.length > 0 && parentText.length < 500) {
          parent.setAttribute('data-editable', 'true');
          parent.setAttribute('data-edit-id', `text-${selectedPage.id}-${textIndex++}`);
          processedParents.add(parent);
        }
      });

      // Also process common text containers (backup for styled elements)
      const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span, a, button, label, li, td, th, dt, dd, figcaption, blockquote, cite, em, strong, b, i, mark, small, sub, sup, time, address';
      iframeDoc.querySelectorAll(textSelectors).forEach((el) => {
        if (el.hasAttribute('data-editable')) return;
        if (shouldSkipElement(el)) return;
        
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 500) {
          // Check if it has direct text or is a leaf node
          const hasDirectText = Array.from(el.childNodes).some(n => 
            n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
          );
          
          if (hasDirectText || el.children.length === 0) {
            el.setAttribute('data-editable', 'true');
            el.setAttribute('data-edit-id', `text-${selectedPage.id}-${textIndex++}`);
          }
        }
      });

      // Find text in divs that act as text containers (no child elements, just text)
      iframeDoc.querySelectorAll('div').forEach((el) => {
        if (el.hasAttribute('data-editable')) return;
        if (shouldSkipElement(el)) return;
        if (el.children.length > 0) return; // Skip divs with child elements
        
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 500) {
          el.setAttribute('data-editable', 'true');
          el.setAttribute('data-edit-id', `text-${selectedPage.id}-${textIndex++}`);
        }
      });

      // Carousel detection
      iframeDoc.querySelectorAll('div').forEach((container) => {
        const absImgs = container.querySelectorAll(':scope > img[class*="absolute"]');
        if (absImgs.length >= 2 && !container.hasAttribute('data-carousel-container')) {
          container.setAttribute('data-carousel-container', 'true');
          const urls = [];
          absImgs.forEach((img, idx) => {
            img.setAttribute('data-carousel-index', idx);
            urls.push(img.src);
          });
          
          const btn = iframeDoc.createElement('button');
          btn.className = 'builder-carousel-btn';
          btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/></svg> Editar ' + absImgs.length + ' fotos';
          btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({ type: 'openCarouselModal', data: { images: urls } }, '*');
          };
          container.appendChild(btn);
        }
      });

      // Regular images
      iframeDoc.querySelectorAll('img').forEach((img, index) => {
        if (img.hasAttribute('data-carousel-index')) return;
        if (img.hasAttribute('data-builder-img')) return;
        
        const editId = `img-${selectedPage.id}-${index}`;
        img.setAttribute('data-edit-id', editId);
        img.setAttribute('data-builder-img', 'true');
        
        const parent = img.parentElement;
        if (parent) {
          const ps = window.getComputedStyle(parent);
          if (ps.position === 'static') parent.style.position = 'relative';
          parent.setAttribute('data-builder-img', 'true');
          
          if (!parent.querySelector('.builder-img-btn')) {
            const btn = iframeDoc.createElement('button');
            btn.className = 'builder-img-btn';
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> Cambiar';
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const currentPos = img.style.objectPosition || '50% 50%';
              window.parent.postMessage({ 
                type: 'openImageModal', 
                data: { 
                  currentUrl: img.src, 
                  editId: editId, 
                  imageType: 'img',
                  currentPosition: currentPos
                } 
              }, '*');
            };
            parent.appendChild(btn);
          }
        }
      });

      // Video elements
      iframeDoc.querySelectorAll('video').forEach((video, index) => {
        if (video.hasAttribute('data-builder-video')) return;
        
        const editId = `video-${selectedPage.id}-${index}`;
        video.setAttribute('data-edit-id', editId);
        video.setAttribute('data-builder-video', 'true');
        
        const parent = video.parentElement;
        if (parent) {
          const ps = window.getComputedStyle(parent);
          if (ps.position === 'static') parent.style.position = 'relative';
          parent.setAttribute('data-builder-video', 'true');
          
          if (!parent.querySelector('.builder-video-btn')) {
            const btn = iframeDoc.createElement('button');
            btn.className = 'builder-img-btn builder-video-btn';
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Cambiar video';
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({ 
                type: 'openImageModal', 
                data: { 
                  currentUrl: video.src, 
                  editId: editId, 
                  imageType: 'video',
                  currentPosition: '50% 50%'
                } 
              }, '*');
            };
            parent.appendChild(btn);
          }
        }
      });

      // Background images
      let bgIndex = 0;
      iframeDoc.querySelectorAll('*').forEach((el) => {
        if (el.hasAttribute('data-has-bg')) return;
        if (hasBackgroundImage(el)) {
          el.setAttribute('data-has-bg', 'true');
          el.setAttribute('data-bg-edit-id', `bg-${selectedPage.id}-${bgIndex++}`);
          const s = window.getComputedStyle(el);
          if (s.position === 'static') el.style.position = 'relative';
          
          if (!el.querySelector('.builder-bg-btn')) {
            const btn = iframeDoc.createElement('button');
            btn.className = 'builder-bg-btn';
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Cambiar fondo';
            btn.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              window.parent.postMessage({ type: 'openImageModal', data: { currentUrl: getBackgroundImageUrl(el), editId: el.getAttribute('data-bg-edit-id'), imageType: 'background' } }, '*');
            };
            el.appendChild(btn);
          }
        }
      });

      // Apply saved modifications AFTER marking elements
      applyModifications(iframeDoc, pageModifications);
      
      console.log('Builder ready:', iframeDoc.querySelectorAll('[data-editable]').length, 'texts,', iframeDoc.querySelectorAll('[data-builder-img]').length, 'images');
    };

    const handleTextClick = (e) => {
      const target = e.target;
      if (target.getAttribute('data-editable') !== 'true') return;
      e.preventDefault();
      e.stopPropagation();
      
      const editId = target.getAttribute('data-edit-id');
      const currentText = target.textContent;
      const rect = target.getBoundingClientRect();
      
      iframeDoc.querySelectorAll('.edit-popup, .edit-overlay').forEach(el => el.remove());
      target.classList.add('editing');
      
      const overlay = iframeDoc.createElement('div');
      overlay.className = 'edit-overlay';
      
      const popup = iframeDoc.createElement('div');
      popup.className = 'edit-popup';
      popup.style.top = Math.min(rect.bottom + 10, iframeDoc.documentElement.clientHeight - 180) + 'px';
      popup.style.left = Math.max(10, rect.left) + 'px';
      
      const isMultiline = target.tagName === 'P' || currentText.length > 80;
      popup.innerHTML = `<div style="color: #d4a968; font-size: 12px; margin-bottom: 12px; font-weight: 600;">✏️ Editar texto</div>${isMultiline ? '<textarea class="edit-input" style="height: 120px;">' + currentText + '</textarea>' : '<input type="text" class="edit-input" value="' + currentText.replace(/"/g, '&quot;') + '" />'}<div style="display: flex; gap: 10px; margin-top: 16px;"><button class="edit-btn save-btn">✓ Guardar</button><button class="edit-btn edit-btn-cancel cancel-btn">Cancelar</button></div>`;
      
      iframeDoc.body.appendChild(overlay);
      iframeDoc.body.appendChild(popup);
      
      const input = popup.querySelector('.edit-input');
      input.focus();
      
      const saveEdit = () => {
        target.textContent = input.value;
        target.classList.remove('editing');
        window.parent.postMessage({ type: 'saveTextEdit', data: { editId, value: input.value } }, '*');
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
      input.onkeydown = (e) => { if (e.key === 'Enter' && !isMultiline) saveEdit(); if (e.key === 'Escape') cancelEdit(); };
    };

    iframeDoc.addEventListener('click', handleTextClick, true);
    setTimeout(markEditableElements, 800);
  }, [selectedPage, pageModifications, applyModifications]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'openImageModal') {
        setMediaTarget({ 
          currentUrl: event.data.data.currentUrl, 
          editId: event.data.data.editId, 
          type: event.data.data.imageType,
          currentPosition: event.data.data.currentPosition || '50% 50%'
        });
        setShowMediaModal(true);
      } else if (event.data.type === 'openCarouselModal') {
        setCarouselImages(event.data.data.images);
        setShowCarouselModal(true);
      } else if (event.data.type === 'saveTextEdit') {
        setPageModifications(prev => ({ ...prev, [`text:${event.data.data.editId}`]: event.data.data.value }));
        setHasChanges(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => { if (isEditing) setTimeout(setupIframeEditing, 1200); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/builder/modifications/${selectedPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modifications: pageModifications })
      });
      if (response.ok) {
        setHasChanges(false);
        alert('¡Cambios guardados correctamente!');
      } else {
        alert('Error al guardar');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const getIframeUrl = () => `${window.location.origin}${selectedPage.path}?builder=true&t=${Date.now()}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /><span>Volver</span></button>
          <div className="h-6 w-px bg-white/20" />
          <select value={selectedPage.id} onChange={(e) => { const p = EDITABLE_PAGES.find(x => x.id === e.target.value); if (p) setSelectedPage(p); }} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none">
            {EDITABLE_PAGES.map(page => <option key={page.id} value={page.id} className="bg-[#1a1a1a]">{page.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /></button>
            <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}><Monitor className="w-4 h-4" /></button>
          </div>
          <button onClick={() => { setIsEditing(!isEditing); if (iframeRef.current) iframeRef.current.src = getIframeUrl(); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isEditing ? 'bg-[#d4a968] text-black' : 'bg-white/5 border border-white/10 text-white'}`}>
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{isEditing ? 'Editando' : 'Preview'}
          </button>
          <button onClick={handleSave} disabled={!hasChanges || saving} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${hasChanges ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
      {isEditing && <div className="bg-[#d4a968]/10 border-b border-[#d4a968]/30 px-4 py-2 text-center"><p className="text-[#d4a968] text-sm">💡 <strong>Modo Edición:</strong> Clic en textos para editar • Hover sobre imágenes para cambiarlas • Arrastra para encuadrar</p></div>}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ width: previewDevice === 'mobile' ? '375px' : '100%', maxWidth: previewDevice === 'desktop' ? '1400px' : '375px', height: 'calc(100vh - 160px)' }}>
          <iframe ref={iframeRef} src={getIframeUrl()} className="w-full h-full border-0" title="Preview" onLoad={handleIframeLoad} />
        </div>
      </div>
      {showMediaModal && <MediaModal onClose={() => { setShowMediaModal(false); setMediaTarget(null); }} onSelect={handleImageChange} currentUrl={mediaTarget?.currentUrl} currentPosition={mediaTarget?.currentPosition} type={mediaTarget?.type} />}
      {showCarouselModal && <CarouselModal onClose={() => { setShowCarouselModal(false); setCarouselImages([]); }} onSave={handleCarouselChange} images={carouselImages} />}
    </div>
  );
};

// Media Modal with Image/Video Positioning
const MediaModal = ({ onClose, onSelect, currentUrl, currentPosition, type }) => {
  const [url, setUrl] = useState(currentUrl || '');
  const [position, setPosition] = useState(currentPosition || '50% 50%');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 50, posY: 50 });
  const API_URL = getApiUrl();
  
  // Handle apply button click
  const handleApplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== APPLY BUTTON CLICKED ===');
    console.log('URL:', url?.substring(0, 80));
    
    if (!url) {
      console.error('No URL');
      return;
    }
    
    // Call onSelect directly - no try/catch to avoid masking errors
    onSelect(url, position);
    console.log('onSelect completed');
  };
  
  // Handle modal background click - only close if clicking on the background
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Check if URL is a video
  const isVideo = (src) => {
    if (!src) return false;
    const lowerSrc = src.toLowerCase();
    
    // Check for base64 video data URLs
    if (lowerSrc.startsWith('data:video/')) {
      return true;
    }
    
    // Check for video file extensions
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
    return videoExtensions.some(ext => lowerSrc.includes(ext));
  };

  const parsePosition = (pos) => {
    const match = pos.match(/(\d+)%\s+(\d+)%/);
    return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : { x: 50, y: 50 };
  };

  const handleMouseDown = (e) => {
    if (type === 'background' || isVideo(url)) return;
    e.preventDefault();
    const pos = parsePosition(position);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const sensitivity = 0.3;
    let newX = Math.max(0, Math.min(100, dragStartRef.current.posX - dx * sensitivity));
    let newY = Math.max(0, Math.min(100, dragStartRef.current.posY - dy * sensitivity));
    setPosition(`${Math.round(newX)}% ${Math.round(newY)}%`);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('=== UPLOAD START ===');
    console.log('File:', file.name, '-', (file.size / 1024 / 1024).toFixed(2), 'MB');
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_URL}/api/builder/upload-media`, { 
        method: 'POST', 
        body: formData 
      });
      
      if (res.ok) { 
        const data = await res.json(); 
        console.log('Upload SUCCESS:', data.url?.substring(0, 80));
        setUrl(data.url);
        // No alert - just update state
      } else {
        const errorText = await res.text();
        console.error('Upload FAILED:', res.status, errorText);
        // Show error inline instead of alert
      }
    } catch (err) { 
      console.error('Upload ERROR:', err.message);
    } finally {
      setUploading(false);
      console.log('=== UPLOAD END ===');
    }
  };

  const isCurrentVideo = isVideo(url);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={handleBackgroundClick}>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl text-white font-medium flex items-center gap-2"><Image className="w-5 h-5 text-[#d4a968]" />{type === 'background' ? 'Cambiar Fondo' : 'Cambiar Imagen o Video'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        
        {/* Media Preview with Draggable Positioning */}
        {url && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Vista previa {isCurrentVideo ? '(Video)' : '(Imagen)'}</span>
              {type !== 'background' && !isCurrentVideo && (
                <span className="text-xs text-[#d4a968] flex items-center gap-1">
                  <Move className="w-3 h-3" /> Arrastra para encuadrar
                </span>
              )}
            </div>
            <div 
              ref={containerRef}
              className={`relative rounded-lg overflow-hidden bg-black/50 border-2 ${isDragging ? 'border-[#d4a968]' : 'border-white/10'} ${type !== 'background' && !isCurrentVideo ? 'cursor-move' : ''}`}
              style={{ height: '250px' }}
              onMouseDown={handleMouseDown}
            >
              {isCurrentVideo ? (
                <video 
                  src={url} 
                  className="w-full h-full object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              ) : (
                <img 
                  ref={imageRef}
                  src={url} 
                  alt="Preview" 
                  className="w-full h-full object-cover select-none"
                  style={{ objectPosition: position }}
                  draggable={false}
                />
              )}
              {type !== 'background' && !isCurrentVideo && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Posición: {position}
                </div>
              )}
            </div>
          </div>
        )}
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*,video/mp4,video/quicktime,video/webm,video/x-msvideo,.mov,.mp4,.webm,.avi" 
          onChange={handleUpload} 
          className="hidden" 
        />
        
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] flex items-center justify-center gap-2 mb-4">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}{uploading ? 'Subiendo...' : 'Subir imagen o video (.mov, .mp4)'}
        </button>
        
        <div className="space-y-3 mb-6">
          <label className="text-sm text-gray-400">O pega URL de imagen o video:</label>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none" />
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10">Cancelar</button>
          <button onClick={handleApplyClick} disabled={!url} className="flex-1 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] disabled:opacity-50 flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Aplicar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// Carousel Modal
const CarouselModal = ({ onClose, onSave, images }) => {
  const [edited, setEdited] = useState([...images]);
  const [positions, setPositions] = useState(images.map(() => '50% 50%'));
  const [active, setActive] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 50, posY: 50 });

  const parsePosition = (pos) => {
    const match = pos.match(/(\d+)%\s+(\d+)%/);
    return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : { x: 50, y: 50 };
  };

  const updatePosition = useCallback((idx, newPos) => {
    setPositions(p => {
      const updated = [...p];
      updated[idx] = newPos;
      return updated;
    });
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = parsePosition(positions[active]);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const sensitivity = 0.3;
    let newX = Math.max(0, Math.min(100, dragStartRef.current.posX - dx * sensitivity));
    let newY = Math.max(0, Math.min(100, dragStartRef.current.posY - dy * sensitivity));
    updatePosition(active, `${Math.round(newX)}% ${Math.round(newY)}%`);
  }, [isDragging, active, updatePosition]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const update = (i, url) => { const u = [...edited]; u[i] = url; setEdited(u); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/api/builder/upload-media`, { method: 'POST', body: formData });
      if (res.ok) { const data = await res.json(); update(active, data.url); }
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl text-white font-medium flex items-center gap-2"><Images className="w-5 h-5 text-[#d4a968]" />Editar {images.length} fotos del carrusel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {edited.map((img, idx) => (
            <button key={idx} onClick={() => setActive(idx)} className={`flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden border-2 relative ${active === idx ? 'border-[#d4a968] ring-2 ring-[#d4a968]/30' : 'border-white/10 hover:border-white/30'}`}>
              <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" style={{ objectPosition: positions[idx] }} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white font-bold text-lg">{idx + 1}</div>
            </button>
          ))}
        </div>
        
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#d4a968] font-medium">Foto {active + 1} de {edited.length}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1"><Move className="w-3 h-3" /> Arrastra para encuadrar</span>
          </div>
          <div 
            className={`aspect-video rounded-lg overflow-hidden bg-black/50 mb-4 cursor-move border-2 ${isDragging ? 'border-[#d4a968]' : 'border-transparent'}`}
            onMouseDown={handleMouseDown}
          >
            <img src={edited[active]} alt="Preview" className="w-full h-full object-cover select-none" style={{ objectPosition: positions[active] }} draggable={false} />
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex-1 p-3 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] flex items-center justify-center gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{uploading ? 'Subiendo...' : 'Subir nueva'}
            </button>
            <input type="text" value={edited[active]} onChange={(e) => update(active, e.target.value)} className="flex-[2] p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none" placeholder="URL de imagen..." />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /> Anterior</button>
          <div className="flex gap-2">{edited.map((_, idx) => <button key={idx} onClick={() => setActive(idx)} className={`w-3 h-3 rounded-full ${active === idx ? 'bg-[#d4a968]' : 'bg-white/20'}`} />)}</div>
          <button onClick={() => setActive(Math.min(edited.length - 1, active + 1))} disabled={active === edited.length - 1} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30">Siguiente <ChevronRight className="w-4 h-4" /></button>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10">Cancelar</button>
          <button onClick={() => onSave(edited)} className="flex-1 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958]">Guardar {images.length} fotos</button>
        </div>
      </div>
    </div>
  );
};

// Export the component wrapped in Error Boundary
export const WebsiteBuilder = ({ onClose }) => (
  <WebsiteBuilderErrorBoundary>
    <WebsiteBuilderContent onClose={onClose} />
  </WebsiteBuilderErrorBoundary>
);

export default WebsiteBuilder;
