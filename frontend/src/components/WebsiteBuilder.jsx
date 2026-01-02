import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, Eye, Smartphone, Monitor, ArrowUp, ArrowDown, 
  Type, Image, Video, Palette, Move, Trash2, Plus, 
  Settings, Undo, Redo, Check, Upload, Link, ChevronLeft,
  Layout, Layers, Edit3, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, MousePointer2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Available icons for sections
const ICON_OPTIONS = ['Store', 'Camera', 'Users', 'Star', 'Heart', 'Zap', 'Gift', 'Award', 'Target', 'Sparkles'];

export const WebsiteBuilder = ({ onClose }) => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const previewRef = useRef(null);

  // Fetch all pages on mount
  useEffect(() => {
    fetchPages();
  }, []);

  // Fetch page content when page is selected
  useEffect(() => {
    if (selectedPage) {
      fetchPageContent(selectedPage);
    }
  }, [selectedPage]);

  const fetchPages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/builder/pages`);
      const data = await response.json();
      setPages(data);
      if (data.length > 0) {
        setSelectedPage(data[0].page_id);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pages:', err);
      setLoading(false);
    }
  };

  const fetchPageContent = async (pageId) => {
    try {
      const response = await fetch(`${API_URL}/api/builder/pages/${pageId}`);
      const data = await response.json();
      setPageContent(data);
      setSelectedSection(null);
      setSelectedElement(null);
      // Add to history
      addToHistory(data);
    } catch (err) {
      console.error('Error fetching page content:', err);
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
    if (!pageContent || !selectedPage) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/builder/pages/${selectedPage}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: pageContent.sections })
      });
      
      if (response.ok) {
        setHasChanges(false);
        // Show success notification
        alert('¡Cambios guardados exitosamente!');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const updateSectionContent = (sectionId, path, value) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const section = newContent.sections.find(s => s.id === sectionId);
    
    if (section) {
      // Navigate to the nested path and update
      const pathParts = path.split('.');
      let target = section;
      for (let i = 0; i < pathParts.length - 1; i++) {
        target = target[pathParts[i]];
      }
      target[pathParts[pathParts.length - 1]] = value;
      
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const updateSectionStyle = (sectionId, styleKey, value) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const section = newContent.sections.find(s => s.id === sectionId);
    
    if (section) {
      if (!section.styles) section.styles = {};
      section.styles[styleKey] = value;
      
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const moveSectionUp = (sectionId) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const sectionIndex = newContent.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex > 0) {
      // Swap with previous section
      const temp = newContent.sections[sectionIndex - 1];
      newContent.sections[sectionIndex - 1] = newContent.sections[sectionIndex];
      newContent.sections[sectionIndex] = temp;
      
      // Update order numbers
      newContent.sections.forEach((s, i) => { s.order = i + 1; });
      
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const moveSectionDown = (sectionId) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const sectionIndex = newContent.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex < newContent.sections.length - 1) {
      // Swap with next section
      const temp = newContent.sections[sectionIndex + 1];
      newContent.sections[sectionIndex + 1] = newContent.sections[sectionIndex];
      newContent.sections[sectionIndex] = temp;
      
      // Update order numbers
      newContent.sections.forEach((s, i) => { s.order = i + 1; });
      
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const toggleSectionVisibility = (sectionId) => {
    if (!pageContent) return;
    
    const newContent = JSON.parse(JSON.stringify(pageContent));
    const section = newContent.sections.find(s => s.id === sectionId);
    
    if (section) {
      section.visible = !section.visible;
      setPageContent(newContent);
      setHasChanges(true);
      addToHistory(newContent);
    }
  };

  const handleMediaUpload = async (sectionId, path, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/api/builder/upload-media`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        updateSectionContent(sectionId, path, data.url);
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      alert('Error al subir el archivo');
    }
  };

  // Preview Component
  const Preview = () => {
    const deviceWidth = previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : '100%';
    
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-white/10">
          <div className="flex items-center gap-4">
            <button onClick={() => setPreviewMode(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-white font-medium">Vista Previa</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-2 rounded ${previewDevice === 'mobile' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-2 rounded ${previewDevice === 'desktop' ? 'bg-[#d4a968] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => setPreviewMode(false)}
            className="px-4 py-2 bg-[#d4a968] text-black rounded-lg font-medium"
          >
            Cerrar Preview
          </button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-8 flex justify-center">
          <div 
            style={{ width: deviceWidth, maxWidth: '100%' }}
            className="bg-[#0a0a0a] rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
          >
            {pageContent?.sections
              .filter(s => s.visible)
              .sort((a, b) => a.order - b.order)
              .map(section => (
                <PreviewSection key={section.id} section={section} device={previewDevice} />
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  // Preview Section Renderer
  const PreviewSection = ({ section, device }) => {
    const isMobile = device === 'mobile';
    
    switch (section.type) {
      case 'hero':
      case 'hero-small':
        return (
          <div 
            className={`relative ${section.type === 'hero-small' ? 'h-64' : 'min-h-[60vh]'} flex items-center justify-center`}
            style={{ backgroundColor: section.styles?.backgroundColor || '#0a0a0a' }}
          >
            {/* Background Image/Video */}
            {section.content.backgroundVideo ? (
              <video 
                autoPlay loop muted playsInline
                className="absolute inset-0 w-full h-full object-cover"
                src={section.content.backgroundVideo}
              />
            ) : section.content.backgroundImage && (
              <img 
                src={section.content.backgroundImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Content */}
            <div className={`relative z-10 text-center ${isMobile ? 'px-6' : 'px-12'}`}>
              <h1 
                className={`font-light text-white mb-4 ${isMobile ? 'text-3xl' : 'text-5xl'}`}
                style={{ color: section.styles?.textColor || '#ffffff' }}
              >
                {section.content.title}
              </h1>
              {section.content.subtitle && (
                <p className={`text-gray-300 mb-8 ${isMobile ? 'text-base' : 'text-xl'}`}>
                  {section.content.subtitle}
                </p>
              )}
              {section.content.ctaText && (
                <button className="px-8 py-3 bg-[#d4a968] text-black font-medium rounded-lg">
                  {section.content.ctaText}
                </button>
              )}
            </div>
          </div>
        );
        
      case 'features':
      case 'services':
        return (
          <div className={`${isMobile ? 'py-12 px-6' : 'py-24 px-12'}`} style={{ backgroundColor: section.styles?.backgroundColor || '#0a0a0a' }}>
            <h2 className={`text-white font-light text-center mb-12 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              {section.content.title}
            </h2>
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {section.content.items?.map((item, idx) => (
                <div key={idx} className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-12 text-center text-gray-500">
            Sección: {section.type}
          </div>
        );
    }
  };

  // Main Builder UI
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando Builder...</p>
        </div>
      </div>
    );
  }

  if (previewMode) {
    return <Preview />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Volver al Admin</span>
          </button>
          
          <div className="h-6 w-px bg-white/10" />
          
          {/* Page Selector */}
          <select
            value={selectedPage || ''}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none"
          >
            {pages.map(page => (
              <option key={page.page_id} value={page.page_id} className="bg-[#1a1a1a]">
                {page.page_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Deshacer"
          >
            <Undo className="w-5 h-5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Rehacer"
          >
            <Redo className="w-5 h-5" />
          </button>
          
          <div className="h-6 w-px bg-white/10 mx-2" />
          
          {/* Preview Button */}
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges 
                ? 'bg-[#d4a968] text-black hover:bg-[#c49958]' 
                : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Sections List */}
        <div className="w-64 bg-[#141414] border-r border-white/10 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-[#d4a968] text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Secciones
            </h3>
            
            <div className="space-y-2">
              {pageContent?.sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => (
                  <div
                    key={section.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSection?.id === section.id 
                        ? 'bg-[#d4a968]/20 border border-[#d4a968]/50' 
                        : 'bg-white/5 border border-transparent hover:border-white/20'
                    } ${!section.visible ? 'opacity-50' : ''}`}
                    onClick={() => {
                      setSelectedSection(section);
                      setSelectedElement(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">{section.id}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSectionUp(section.id); }}
                          disabled={index === 0}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                        >
                          <ArrowUp className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveSectionDown(section.id); }}
                          disabled={index === pageContent.sections.length - 1}
                          className="p-1 hover:bg-white/10 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-3 h-3 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section.id); }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Eye className={`w-3 h-3 ${section.visible ? 'text-gray-400' : 'text-gray-600'}`} />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 capitalize">{section.type}</p>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Center - Canvas/Editor */}
        <div className="flex-1 overflow-auto p-8 bg-[#0d0d0d]">
          {selectedSection ? (
            <SectionEditor 
              section={selectedSection}
              onUpdateContent={(path, value) => updateSectionContent(selectedSection.id, path, value)}
              onUpdateStyle={(key, value) => updateSectionStyle(selectedSection.id, key, value)}
              onUploadMedia={(path, file) => handleMediaUpload(selectedSection.id, path, file)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MousePointer2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>Selecciona una sección para editar</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties Panel */}
        {selectedSection && (
          <div className="w-80 bg-[#141414] border-l border-white/10 overflow-y-auto">
            <PropertiesPanel 
              section={selectedSection}
              onUpdateContent={(path, value) => updateSectionContent(selectedSection.id, path, value)}
              onUpdateStyle={(key, value) => updateSectionStyle(selectedSection.id, key, value)}
              onUploadMedia={(path, file) => handleMediaUpload(selectedSection.id, path, file)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({ section, onUpdateContent, onUpdateStyle, onUploadMedia }) => {
  const renderHeroEditor = () => (
    <div 
      className="relative min-h-[400px] rounded-xl overflow-hidden"
      style={{ backgroundColor: section.styles?.backgroundColor || '#0a0a0a' }}
    >
      {/* Background */}
      {section.content.backgroundVideo ? (
        <video 
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={section.content.backgroundVideo}
        />
      ) : section.content.backgroundImage && (
        <img 
          src={section.content.backgroundImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Editable Content */}
      <div className="relative z-10 p-12 text-center">
        <input
          type="text"
          value={section.content.title || ''}
          onChange={(e) => onUpdateContent('content.title', e.target.value)}
          className="w-full bg-transparent text-5xl font-light text-white text-center border-2 border-dashed border-transparent hover:border-[#d4a968]/50 focus:border-[#d4a968] focus:outline-none p-2 rounded"
          placeholder="Título"
        />
        
        <input
          type="text"
          value={section.content.subtitle || ''}
          onChange={(e) => onUpdateContent('content.subtitle', e.target.value)}
          className="w-full bg-transparent text-xl text-gray-300 text-center border-2 border-dashed border-transparent hover:border-[#d4a968]/50 focus:border-[#d4a968] focus:outline-none p-2 rounded mt-4"
          placeholder="Subtítulo"
        />
        
        {section.content.ctaText !== undefined && (
          <div className="mt-8">
            <input
              type="text"
              value={section.content.ctaText || ''}
              onChange={(e) => onUpdateContent('content.ctaText', e.target.value)}
              className="inline-block px-8 py-3 bg-[#d4a968] text-black font-medium rounded-lg border-2 border-dashed border-transparent hover:border-black focus:border-black focus:outline-none text-center"
              placeholder="Texto del botón"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderFeaturesEditor = () => (
    <div className="p-8 rounded-xl" style={{ backgroundColor: section.styles?.backgroundColor || '#0a0a0a' }}>
      <input
        type="text"
        value={section.content.title || ''}
        onChange={(e) => onUpdateContent('content.title', e.target.value)}
        className="w-full bg-transparent text-4xl font-light text-white text-center border-2 border-dashed border-transparent hover:border-[#d4a968]/50 focus:border-[#d4a968] focus:outline-none p-2 rounded mb-8"
        placeholder="Título de la sección"
      />
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {section.content.items?.map((item, idx) => (
          <div key={idx} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[#d4a968]/50 transition-colors">
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => {
                const newItems = [...section.content.items];
                newItems[idx] = { ...newItems[idx], title: e.target.value };
                onUpdateContent('content.items', newItems);
              }}
              className="w-full bg-transparent text-lg text-white border-b border-dashed border-transparent hover:border-[#d4a968]/50 focus:border-[#d4a968] focus:outline-none mb-2"
              placeholder="Título"
            />
            <textarea
              value={item.description || ''}
              onChange={(e) => {
                const newItems = [...section.content.items];
                newItems[idx] = { ...newItems[idx], description: e.target.value };
                onUpdateContent('content.items', newItems);
              }}
              className="w-full bg-transparent text-sm text-gray-400 border border-dashed border-transparent hover:border-[#d4a968]/50 focus:border-[#d4a968] focus:outline-none resize-none"
              placeholder="Descripción"
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );

  switch (section.type) {
    case 'hero':
    case 'hero-small':
      return renderHeroEditor();
    case 'features':
    case 'services':
      return renderFeaturesEditor();
    default:
      return (
        <div className="p-8 text-center text-gray-500">
          Editor no disponible para este tipo de sección
        </div>
      );
  }
};

// Properties Panel Component
const PropertiesPanel = ({ section, onUpdateContent, onUpdateStyle, onUploadMedia }) => {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('content');

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadMedia('content.backgroundImage', file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadMedia('content.backgroundVideo', file);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'content' ? 'text-[#d4a968] border-b-2 border-[#d4a968]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Contenido
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'style' ? 'text-[#d4a968] border-b-2 border-[#d4a968]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Estilos
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'media' ? 'text-[#d4a968] border-b-2 border-[#d4a968]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Media
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Título</label>
              <input
                type="text"
                value={section.content.title || ''}
                onChange={(e) => onUpdateContent('content.title', e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
              />
            </div>
            
            {section.content.subtitle !== undefined && (
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Subtítulo</label>
                <textarea
                  value={section.content.subtitle || ''}
                  onChange={(e) => onUpdateContent('content.subtitle', e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            )}
            
            {section.content.ctaText !== undefined && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Texto del Botón</label>
                  <input
                    type="text"
                    value={section.content.ctaText || ''}
                    onChange={(e) => onUpdateContent('content.ctaText', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Link del Botón</label>
                  <input
                    type="text"
                    value={section.content.ctaLink || ''}
                    onChange={(e) => onUpdateContent('content.ctaLink', e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                    placeholder="/ruta o https://..."
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Color de Fondo</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={section.styles?.backgroundColor || '#0a0a0a'}
                  onChange={(e) => onUpdateStyle('backgroundColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={section.styles?.backgroundColor || '#0a0a0a'}
                  onChange={(e) => onUpdateStyle('backgroundColor', e.target.value)}
                  className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Color de Texto</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={section.styles?.textColor || '#ffffff'}
                  onChange={(e) => onUpdateStyle('textColor', e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={section.styles?.textColor || '#ffffff'}
                  onChange={(e) => onUpdateStyle('textColor', e.target.value)}
                  className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Colores Predefinidos</label>
              <div className="flex flex-wrap gap-2">
                {['#0a0a0a', '#1a1a1a', '#ffffff', '#d4a968', '#000000', '#1e3a5f', '#2d4a3e', '#4a2d4a'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdateStyle('backgroundColor', color)}
                    className="w-8 h-8 rounded-lg border-2 border-white/20 hover:border-white/50 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Imagen de Fondo</label>
              {section.content.backgroundImage && (
                <div className="relative mb-3 rounded-lg overflow-hidden">
                  <img src={section.content.backgroundImage} alt="" className="w-full h-32 object-cover" />
                  <button
                    onClick={() => onUpdateContent('content.backgroundImage', '')}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2"
              >
                <Image className="w-5 h-5" />
                <span>Subir Imagen</span>
              </button>
              
              <div className="mt-3">
                <input
                  type="text"
                  value={section.content.backgroundImage || ''}
                  onChange={(e) => onUpdateContent('content.backgroundImage', e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none"
                  placeholder="O pega una URL de imagen..."
                />
              </div>
            </div>
            
            {/* Video Upload */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Video de Fondo</label>
              {section.content.backgroundVideo && (
                <div className="relative mb-3 rounded-lg overflow-hidden">
                  <video src={section.content.backgroundVideo} className="w-full h-32 object-cover" muted />
                  <button
                    onClick={() => onUpdateContent('content.backgroundVideo', '')}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                <span>Subir Video</span>
              </button>
              
              <div className="mt-3">
                <input
                  type="text"
                  value={section.content.backgroundVideo || ''}
                  onChange={(e) => onUpdateContent('content.backgroundVideo', e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-[#d4a968] focus:outline-none"
                  placeholder="O pega una URL de video..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteBuilder;
