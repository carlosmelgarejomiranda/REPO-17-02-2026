import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ArrowUp, ArrowDown, 
  Image, Video, GripVertical, ChevronLeft, Upload, Check,
  Undo, Redo, Settings, Trash2, Move, Edit3, Plus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Context for edit mode
const BuilderContext = createContext({
  isEditing: false,
  selectedElement: null,
  setSelectedElement: () => {},
  updateContent: () => {},
  pageContent: null
});

export const useBuilder = () => useContext(BuilderContext);

// Editable Text Component - Click to edit
export const EditableText = ({ 
  value, 
  onChange, 
  className = '', 
  as: Component = 'span',
  placeholder = 'Haz clic para editar...',
  style = {}
}) => {
  const { isEditing } = useBuilder();
  const [isActive, setIsActive] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isActive]);

  if (!isEditing) {
    return <Component className={className} style={style}>{value || placeholder}</Component>;
  }

  if (isActive) {
    const isMultiline = Component === 'p' || Component === 'div';
    
    if (isMultiline) {
      return (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => {
            setIsActive(false);
            if (localValue !== value) {
              onChange(localValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setLocalValue(value);
              setIsActive(false);
            }
          }}
          className={`${className} bg-transparent border-2 border-[#d4a968] outline-none resize-none`}
          style={{ ...style, minHeight: '60px' }}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          setIsActive(false);
          if (localValue !== value) {
            onChange(localValue);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            if (e.key === 'Escape') setLocalValue(value);
            setIsActive(false);
            if (e.key === 'Enter' && localValue !== value) {
              onChange(localValue);
            }
          }
        }}
        className={`${className} bg-transparent border-2 border-[#d4a968] outline-none`}
        style={style}
        placeholder={placeholder}
      />
    );
  }

  return (
    <Component 
      className={`${className} cursor-pointer hover:outline hover:outline-2 hover:outline-[#d4a968] hover:outline-dashed transition-all`}
      style={style}
      onClick={() => setIsActive(true)}
      title="Clic para editar"
    >
      {value || <span className="opacity-50">{placeholder}</span>}
    </Component>
  );
};

// Editable Image Component - Click to change
export const EditableImage = ({ 
  src, 
  onChange, 
  className = '', 
  alt = '',
  style = {},
  aspectRatio = 'auto'
}) => {
  const { isEditing } = useBuilder();
  const [showModal, setShowModal] = useState(false);
  const [imageUrl, setImageUrl] = useState(src);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImageUrl(src);
  }, [src]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/builder/upload-media`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        onChange(data.url);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error uploading:', err);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl && imageUrl !== src) {
      onChange(imageUrl);
    }
    setShowModal(false);
  };

  if (!isEditing) {
    return <img src={src} alt={alt} className={className} style={style} />;
  }

  return (
    <>
      <div 
        className={`${className} relative cursor-pointer group`}
        style={style}
        onClick={() => setShowModal(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-[#d4a968] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2">
            <Image className="w-5 h-5" />
            Cambiar imagen
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-[#d4a968] text-black p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit3 className="w-4 h-4" />
        </div>
      </div>

      {/* Image Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-white font-medium">Cambiar Imagen</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Preview" className="w-full h-48 object-cover" />
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
              className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Upload className="w-5 h-5" />
              Subir desde tu dispositivo
            </button>

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="O pega una URL de imagen..."
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
              />
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Editable Video/Image Background
export const EditableBackground = ({ 
  image, 
  video,
  onImageChange, 
  onVideoChange,
  children,
  className = '',
  overlay = true
}) => {
  const { isEditing } = useBuilder();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('image');
  const [imageUrl, setImageUrl] = useState(image);
  const [videoUrl, setVideoUrl] = useState(video);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImageUrl(image);
    setVideoUrl(video);
  }, [image, video]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/builder/upload-media`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'image') {
          onImageChange(data.url);
        } else {
          onVideoChange(data.url);
        }
        setShowModal(false);
      }
    } catch (err) {
      console.error('Error uploading:', err);
    }
  };

  const handleSubmit = () => {
    if (activeTab === 'image' && imageUrl !== image) {
      onImageChange(imageUrl);
    } else if (activeTab === 'video' && videoUrl !== video) {
      onVideoChange(videoUrl);
    }
    setShowModal(false);
  };

  return (
    <>
      <div className={`${className} relative`}>
        {/* Background Media */}
        {video ? (
          <video 
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover"
            src={video}
          />
        ) : image && (
          <img 
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {overlay && <div className="absolute inset-0 bg-black/50" />}
        
        {/* Edit Button */}
        {isEditing && (
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-4 right-4 z-20 bg-[#d4a968] text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-[#c49958] transition-colors shadow-lg"
          >
            <Image className="w-4 h-4" />
            Cambiar fondo
          </button>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>

      {/* Background Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-white font-medium">Cambiar Fondo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'image' ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Image className="w-4 h-4 inline mr-2" />
                Imagen
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'video' ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                <Video className="w-4 h-4 inline mr-2" />
                Video
              </button>
            </div>

            {/* Preview */}
            <div className="mb-6 rounded-lg overflow-hidden bg-black/50 h-40 flex items-center justify-center">
              {activeTab === 'image' && imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : activeTab === 'video' && videoUrl ? (
                <video src={videoUrl} className="w-full h-full object-cover" muted />
              ) : (
                <span className="text-gray-500">Sin {activeTab === 'image' ? 'imagen' : 'video'}</span>
              )}
            </div>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={activeTab === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Upload className="w-5 h-5" />
              Subir {activeTab === 'image' ? 'imagen' : 'video'}
            </button>

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={activeTab === 'image' ? imageUrl : videoUrl}
                onChange={(e) => activeTab === 'image' ? setImageUrl(e.target.value) : setVideoUrl(e.target.value)}
                placeholder={`URL de ${activeTab === 'image' ? 'imagen' : 'video'}...`}
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
              />
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>

            {/* Clear Video Button */}
            {activeTab === 'video' && videoUrl && (
              <button
                onClick={() => { onVideoChange(''); setVideoUrl(''); setShowModal(false); }}
                className="w-full mt-4 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Eliminar video (usar solo imagen)
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Section Wrapper - Makes sections movable
export const EditableSection = ({ 
  id, 
  children, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast,
  sectionName = 'Sección'
}) => {
  const { isEditing } = useBuilder();
  const [isHovered, setIsHovered] = useState(false);

  if (!isEditing) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Controls */}
      <div className={`absolute left-0 top-0 bottom-0 z-30 flex flex-col items-center justify-center transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="bg-[#1a1a1a] border border-white/20 rounded-r-xl py-2 px-1 flex flex-col gap-1 shadow-xl">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Mover arriba"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          
          <div className="p-2 text-gray-500 cursor-grab" title="Arrastrar">
            <GripVertical className="w-4 h-4" />
          </div>
          
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Mover abajo"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Label */}
      <div className={`absolute top-4 left-16 z-30 bg-[#d4a968] text-black px-3 py-1 rounded-lg text-sm font-medium shadow-lg transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        {sectionName}
      </div>

      {/* Section Border */}
      <div className={`absolute inset-0 border-2 border-dashed pointer-events-none transition-colors z-20 ${isHovered ? 'border-[#d4a968]' : 'border-transparent'}`} />

      {/* Content */}
      {children}
    </div>
  );
};

// Main Website Builder Component
export const WebsiteBuilder = ({ onClose }) => {
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('main-landing');
  const [pageContent, setPageContent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const iframeRef = useRef(null);

  // Fetch pages list
  useEffect(() => {
    fetchPages();
  }, []);

  // Fetch page content when page changes
  useEffect(() => {
    if (selectedPageId) {
      fetchPageContent(selectedPageId);
    }
  }, [selectedPageId]);

  const fetchPages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/builder/pages`);
      const data = await response.json();
      setPages(data);
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  };

  const fetchPageContent = async (pageId) => {
    try {
      const response = await fetch(`${API_URL}/api/builder/pages/${pageId}`);
      const data = await response.json();
      setPageContent(data);
      addToHistory(data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addToHistory = (content) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(content)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPageContent(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      setHasChanges(true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPageContent(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!pageContent) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/builder/pages/${selectedPageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: pageContent.sections })
      });
      if (response.ok) {
        setHasChanges(false);
        alert('¡Cambios guardados!');
      }
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (sectionId, updates) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const sectionIndex = newContent.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex !== -1) {
      newContent.sections[sectionIndex] = {
        ...newContent.sections[sectionIndex],
        ...updates
      };
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const updateSectionContent = (sectionId, contentKey, value) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const section = newContent.sections.find(s => s.id === sectionId);
    
    if (section) {
      section.content[contentKey] = value;
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const moveSectionUp = (sectionId) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const idx = newContent.sections.findIndex(s => s.id === sectionId);
    
    if (idx > 0) {
      [newContent.sections[idx - 1], newContent.sections[idx]] = 
      [newContent.sections[idx], newContent.sections[idx - 1]];
      newContent.sections.forEach((s, i) => { s.order = i + 1; });
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const moveSectionDown = (sectionId) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const idx = newContent.sections.findIndex(s => s.id === sectionId);
    
    if (idx < newContent.sections.length - 1) {
      [newContent.sections[idx], newContent.sections[idx + 1]] = 
      [newContent.sections[idx + 1], newContent.sections[idx]];
      newContent.sections.forEach((s, i) => { s.order = i + 1; });
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  // Context value
  const builderContextValue = {
    isEditing: !previewMode,
    pageContent,
    updateSection,
    updateSectionContent,
    moveSectionUp,
    moveSectionDown
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BuilderContext.Provider value={builderContextValue}>
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <div className="h-6 w-px bg-white/20" />
            
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
            >
              {pages.map(p => (
                <option key={p.page_id} value={p.page_id} className="bg-[#1a1a1a]">
                  {p.page_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-400 hover:text-white disabled:opacity-30">
              <Undo className="w-5 h-5" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-400 hover:text-white disabled:opacity-30">
              <Redo className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-white/20 mx-2" />

            {/* Device Preview Toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                previewMode 
                  ? 'bg-[#d4a968] text-black' 
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Eye className="w-4 h-4" />
              {previewMode ? 'Editando' : 'Preview'}
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                hasChanges ? 'bg-[#d4a968] text-black' : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Help Banner */}
        {!previewMode && (
          <div className="bg-[#d4a968]/10 border-b border-[#d4a968]/30 px-4 py-2 text-center">
            <p className="text-[#d4a968] text-sm">
              💡 <strong>Modo Edición:</strong> Haz clic en cualquier texto para editarlo • Haz clic en imágenes para cambiarlas • Usa las flechas a la izquierda para mover secciones
            </p>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8" style={{ backgroundColor: '#0d0d0d' }}>
          <div className="flex justify-center">
            <div 
              className="bg-[#0a0a0a] rounded-xl shadow-2xl transition-all duration-300"
              style={{ 
                width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%',
                maxWidth: previewDevice === 'desktop' ? '1400px' : undefined
              }}
            >
              {pageContent && (
                <PageRenderer 
                  pageId={selectedPageId}
                  sections={pageContent.sections}
                  onUpdateContent={updateSectionContent}
                  onMoveUp={moveSectionUp}
                  onMoveDown={moveSectionDown}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </BuilderContext.Provider>
  );
};

// Page Renderer - Renders actual page sections
const PageRenderer = ({ pageId, sections, onUpdateContent, onMoveUp, onMoveDown }) => {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      {sortedSections.map((section, index) => (
        <EditableSection
          key={section.id}
          id={section.id}
          sectionName={getSectionName(section.type)}
          onMoveUp={() => onMoveUp(section.id)}
          onMoveDown={() => onMoveDown(section.id)}
          isFirst={index === 0}
          isLast={index === sortedSections.length - 1}
        >
          <SectionRenderer 
            section={section}
            onUpdateContent={(key, value) => onUpdateContent(section.id, key, value)}
          />
        </EditableSection>
      ))}
    </div>
  );
};

// Get readable section name
const getSectionName = (type) => {
  const names = {
    'hero': 'Hero Principal',
    'hero-small': 'Hero Pequeño',
    'features': 'Características',
    'services': 'Servicios',
    'gallery': 'Galería',
    'cta': 'Call to Action',
    'testimonials': 'Testimonios',
    'contact': 'Contacto'
  };
  return names[type] || type;
};

// Section Renderer - Renders individual section types
const SectionRenderer = ({ section, onUpdateContent }) => {
  switch (section.type) {
    case 'hero':
    case 'hero-small':
      return (
        <EditableBackground
          image={section.content.backgroundImage}
          video={section.content.backgroundVideo}
          onImageChange={(url) => onUpdateContent('backgroundImage', url)}
          onVideoChange={(url) => onUpdateContent('backgroundVideo', url)}
          className={section.type === 'hero' ? 'min-h-[70vh]' : 'min-h-[40vh]'}
        >
          <div className={`flex flex-col items-center justify-center text-center ${section.type === 'hero' ? 'min-h-[70vh] py-20' : 'min-h-[40vh] py-12'} px-6`}>
            <EditableText
              value={section.content.title}
              onChange={(val) => onUpdateContent('title', val)}
              as="h1"
              className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4"
              placeholder="Título principal"
            />
            
            {section.content.subtitle !== undefined && (
              <EditableText
                value={section.content.subtitle}
                onChange={(val) => onUpdateContent('subtitle', val)}
                as="p"
                className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8"
                placeholder="Subtítulo o descripción"
              />
            )}
            
            {section.content.ctaText !== undefined && (
              <EditableText
                value={section.content.ctaText}
                onChange={(val) => onUpdateContent('ctaText', val)}
                className="inline-block px-8 py-3 bg-[#d4a968] text-black font-medium rounded-lg"
                placeholder="Texto del botón"
              />
            )}
          </div>
        </EditableBackground>
      );

    case 'features':
    case 'services':
      return (
        <div className="py-16 md:py-24 px-6" style={{ backgroundColor: section.styles?.backgroundColor || '#0a0a0a' }}>
          <EditableText
            value={section.content.title}
            onChange={(val) => onUpdateContent('title', val)}
            as="h2"
            className="text-3xl md:text-4xl font-light text-white text-center mb-12"
            placeholder="Título de sección"
          />
          
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {section.content.items?.map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-white/5 border border-white/10">
                <EditableText
                  value={item.title}
                  onChange={(val) => {
                    const newItems = [...section.content.items];
                    newItems[idx] = { ...newItems[idx], title: val };
                    onUpdateContent('items', newItems);
                  }}
                  as="h3"
                  className="text-lg text-white mb-2"
                  placeholder="Título"
                />
                <EditableText
                  value={item.description}
                  onChange={(val) => {
                    const newItems = [...section.content.items];
                    newItems[idx] = { ...newItems[idx], description: val };
                    onUpdateContent('items', newItems);
                  }}
                  as="p"
                  className="text-sm text-gray-400"
                  placeholder="Descripción"
                />
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return (
        <div className="py-16 px-6 text-center text-gray-500">
          <p>Sección: {section.type}</p>
          <p className="text-sm">Editor no disponible para este tipo</p>
        </div>
      );
  }
};

export default WebsiteBuilder;
