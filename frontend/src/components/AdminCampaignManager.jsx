import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, X, Building2, Calendar, Users, Target, MapPin, Upload,
  Instagram, Music2, Loader2, CheckCircle, AlertCircle, Clock,
  RefreshCw, Eye, EyeOff, ChevronDown, Image as ImageIcon,
  UserCheck, XCircle, Star, ClipboardList, List, Type, Minus
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Options for select fields
const GENDER_OPTIONS = [
  { value: 'all', label: 'Hombres y Mujeres' },
  { value: 'male', label: 'Hombres' },
  { value: 'female', label: 'Mujeres' }
];

const AGE_OPTIONS = [
  { value: 18, label: 'Mayores de 18' },
  { value: 25, label: 'Mayores de 25' },
  { value: 30, label: 'Mayores de 30' },
  { value: 40, label: 'Mayores de 40' },
  { value: 50, label: 'Mayores de 50' }
];

const FOLLOWERS_OPTIONS = [
  { value: 0, label: 'Sin mínimo' },
  { value: 1000, label: '1,000+' },
  { value: 3000, label: '3,000+' },
  { value: 5000, label: '5,000+' },
  { value: 10000, label: '10,000+' },
  { value: 20000, label: '20,000+' },
  { value: 50000, label: '50,000+' },
  { value: 100000, label: '100,000+' }
];

const COUNTRIES = [
  'Paraguay', 'Argentina', 'Brasil', 'Uruguay', 'Chile', 'Bolivia', 
  'Perú', 'Colombia', 'Ecuador', 'Venezuela', 'México', 'España',
  'Estados Unidos', 'Otro'
];

const RESIDENCE_OPTIONS = [
  { value: 'asuncion_gran', label: 'Asunción y Gran Asunción' },
  { value: 'other', label: 'Otro (especificar)' }
];

const CATEGORIES = [
  'fashion', 'beauty', 'food', 'travel', 'fitness', 'tech', 
  'lifestyle', 'entertainment', 'education', 'health', 'sports', 'other'
];

const CATEGORY_LABELS = {
  fashion: 'Moda',
  beauty: 'Belleza',
  food: 'Gastronomía',
  travel: 'Viajes',
  fitness: 'Fitness',
  tech: 'Tecnología',
  lifestyle: 'Lifestyle',
  entertainment: 'Entretenimiento',
  education: 'Educación',
  health: 'Salud',
  sports: 'Deportes',
  other: 'Otro'
};

const AdminCampaignManager = ({ onClose, onSuccess }) => {
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    brand_id: '',
    brand_name: '', // The specific brand/product name for the campaign title
    name: '',
    description: '',
    category: 'fashion',
    city: 'Asunción',
    // Contract
    monthly_deliverables: 4,
    contract_duration_months: 3,
    contract_start_date: new Date().toISOString().split('T')[0],
    // Requirements
    gender: 'all',
    min_age: 18,
    min_followers: 0,
    country: 'Paraguay',
    residence: 'asuncion_gran',
    residence_other: '',
    // Canje
    canje_type: 'product',
    canje_description: '',
    canje_value: 0,
    // Timeline
    applications_deadline: '',
    publish_start: '',
    publish_end: '',
    // Image
    cover_image_url: '',
    admin_notes: ''
  });

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      // Fetch brands
      const brandsRes = await fetch(`${API_URL}/api/ugc/admin/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrands(data.brands || []);
      }

      // Fetch campaigns
      const campaignsRes = await fetch(`${API_URL}/api/ugc/admin/campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, cover_image_url: data.url }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.brand_id) newErrors.brand_id = 'Seleccioná una empresa';
    if (!formData.brand_name.trim()) newErrors.brand_name = 'Ingresá el nombre de la marca';
    if (!formData.description.trim()) newErrors.description = 'Ingresá una descripción';
    if (!formData.canje_description.trim()) newErrors.canje_description = 'Describí el canje';
    if (!formData.applications_deadline) newErrors.applications_deadline = 'Seleccioná fecha límite';
    if (!formData.publish_start) newErrors.publish_start = 'Seleccioná fecha de inicio';
    if (!formData.publish_end) newErrors.publish_end = 'Seleccioná fecha de fin';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCampaign = async () => {
    if (!validateForm()) return;

    setActionLoading('create');
    const token = localStorage.getItem('auth_token');

    // Build campaign name from brand name
    const campaignName = formData.name.trim() || formData.brand_name;

    const payload = {
      brand_id: formData.brand_id,
      name: campaignName,
      description: formData.description,
      category: formData.category,
      city: formData.residence === 'asuncion_gran' ? 'Asunción' : formData.residence_other,
      monthly_deliverables: parseInt(formData.monthly_deliverables),
      contract_duration_months: parseInt(formData.contract_duration_months),
      contract_start_date: new Date(formData.contract_start_date).toISOString(),
      requirements: {
        min_followers: parseInt(formData.min_followers) || null,
        min_age: parseInt(formData.min_age),
        gender: formData.gender,
        country: formData.country,
        residence: formData.residence === 'asuncion_gran' ? 'Asunción y Gran Asunción' : formData.residence_other,
        platforms: ['instagram', 'tiktok'],
        mandatory_tag: null,
        mandatory_mention: null,
        additional_rules: ['Perfil público de Instagram y/o TikTok']
      },
      canje: {
        type: formData.canje_type,
        description: formData.canje_description,
        value: parseInt(formData.canje_value) || 0,
        requires_shipping: formData.canje_type === 'product',
        requires_scheduling: formData.canje_type === 'service'
      },
      timeline: {
        applications_deadline: new Date(formData.applications_deadline).toISOString(),
        publish_start: new Date(formData.publish_start).toISOString(),
        publish_end: new Date(formData.publish_end).toISOString(),
        delivery_sla_hours: 48
      },
      assets: {
        cover_image: formData.cover_image_url,
        brand_name: formData.brand_name
      },
      admin_notes: formData.admin_notes
    };

    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Campaña creada exitosamente');
        setShowCreateForm(false);
        fetchData();
        if (onSuccess) onSuccess();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al crear campaña');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenewCampaign = async (campaign) => {
    const months = prompt('¿Cuántos meses de renovación?', '3');
    if (!months) return;

    const slots = prompt('¿Cuántos cupos por mes?', campaign.contract?.monthly_deliverables || '4');
    if (!slots) return;

    setActionLoading(campaign.id);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns/${campaign.id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monthly_deliverables: parseInt(slots),
          duration_months: parseInt(months),
          start_date: new Date().toISOString()
        })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Contrato renovado');
        fetchData();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al renovar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSlots = async (campaign) => {
    const slots = prompt('¿Cuántos cupos agregar?', '4');
    if (!slots) return;

    setActionLoading(campaign.id);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns/${campaign.id}/add-slots?slots=${slots}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Cupos agregados');
        fetchData();
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (campaign) => {
    setActionLoading(campaign.id);
    const token = localStorage.getItem('auth_token');
    const newVisibility = !campaign.visible_to_creators;

    try {
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns/${campaign.id}/visibility?visible=${newVisibility}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewApplications = async (campaign) => {
    setSelectedCampaign(campaign);
    setShowApplications(true);
    setLoadingApplications(true);
    
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/campaign/${campaign.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    setActionLoading(applicationId);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(`${API_URL}/api/ugc/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus, 
          reason: newStatus === 'rejected' ? 'No seleccionado por Avenue' : null 
        })
      });
      
      if (res.ok) {
        // Refresh applications and campaigns
        handleViewApplications(selectedCampaign);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al actualizar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setActionLoading(null);
    }
  };

  const getApplicationStatusBadge = (status) => {
    const badges = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado', icon: UserCheck },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: XCircle }
    };
    const badge = badges[status] || badges.applied;
    const Icon = badge.icon;
    return (
      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status, contract) => {
    const isExpired = contract && new Date(contract.end_date) < new Date();
    
    if (isExpired) {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">Vencida</span>;
    }
    
    const badges = {
      draft: { color: 'bg-gray-500/20 text-gray-400', label: 'Borrador' },
      live: { color: 'bg-green-500/20 text-green-400', label: 'Activa' },
      closed: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Cerrada' },
      in_production: { color: 'bg-purple-500/20 text-purple-400', label: 'En Producción' },
      completed: { color: 'bg-blue-500/20 text-blue-400', label: 'Completada' }
    };
    const badge = badges[status] || badges.draft;
    return <span className={`px-2 py-1 rounded-full text-xs ${badge.color}`}>{badge.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium">Gestión de Campañas</h2>
          <p className="text-sm text-gray-400">{campaigns.length} campañas registradas</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nueva Campaña
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-3xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-medium text-white">Crear Nueva Campaña</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Company & Brand */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Empresa <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_id: e.target.value }))}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${errors.brand_id ? 'border-red-500' : 'border-white/10'}`}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Seleccionar empresa...</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{brand.company_name}</option>
                    ))}
                  </select>
                  {errors.brand_id && <p className="text-red-400 text-xs mt-1">{errors.brand_id}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Nombre de la Marca <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                    placeholder="Ej: Sedal, Rexona, Axe..."
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none ${errors.brand_name ? 'border-red-500' : 'border-white/10'}`}
                  />
                  {errors.brand_name && <p className="text-red-400 text-xs mt-1">{errors.brand_name}</p>}
                </div>
              </div>

              {/* Campaign Name & Category */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Título de Campaña <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Si está vacío, usa el nombre de la marca"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                    style={{ colorScheme: 'dark' }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{CATEGORY_LABELS[cat]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Descripción de la campaña para los creadores..."
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none resize-none ${errors.description ? 'border-red-500' : 'border-white/10'}`}
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Imagen de Portada</label>
                <div className="flex items-center gap-4">
                  {formData.cover_image_url ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                      <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#d4a968]/50 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                          <span className="text-xs text-gray-500">Subir imagen</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                  <p className="text-xs text-gray-500">Recomendado: 800x600px, máx 2MB</p>
                </div>
              </div>

              {/* Contract Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                  <Calendar className="w-5 h-5 text-[#d4a968]" />
                  Contrato
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cupos por Mes</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.monthly_deliverables}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_deliverables: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duración (meses)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.contract_duration_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, contract_duration_months: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, contract_start_date: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Requirements Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                  <Target className="w-5 h-5 text-[#d4a968]" />
                  Requisitos del Creador
                </h4>

                {/* Always required notice */}
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2">
                  <div className="flex gap-2">
                    <Instagram className="w-5 h-5 text-pink-400" />
                    <Music2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-sm text-blue-300">Perfil público de Instagram y/o TikTok es requisito obligatorio</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Sexo</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      {GENDER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Edad Mínima</label>
                    <select
                      value={formData.min_age}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_age: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      {AGE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Seguidores Mínimo</label>
                    <select
                      value={formData.min_followers}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_followers: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      {FOLLOWERS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">País de Residencia</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      {COUNTRIES.map(country => (
                        <option key={country} value={country} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Residencia</label>
                    <div className="flex gap-4">
                      <select
                        value={formData.residence}
                        onChange={(e) => setFormData(prev => ({ ...prev, residence: e.target.value }))}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        {RESIDENCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{opt.label}</option>
                        ))}
                      </select>
                      {formData.residence === 'other' && (
                        <input
                          type="text"
                          value={formData.residence_other}
                          onChange={(e) => setFormData(prev => ({ ...prev, residence_other: e.target.value }))}
                          placeholder="Especificar ciudad/zona..."
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Canje Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#d4a968]" />
                  Canje / Compensación
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Canje</label>
                    <select
                      value={formData.canje_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, canje_type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="product" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Producto</option>
                      <option value="service" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Servicio</option>
                      <option value="discount" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Descuento</option>
                      <option value="money" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Dinero</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Valor estimado (Gs)</label>
                    <input
                      type="number"
                      value={formData.canje_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, canje_value: e.target.value }))}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">
                      Descripción del Canje <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.canje_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, canje_description: e.target.value }))}
                      rows={2}
                      placeholder="Ej: Kit de productos Sedal (Shampoo + Acondicionador + Tratamiento)..."
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none resize-none ${errors.canje_description ? 'border-red-500' : 'border-white/10'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#d4a968]" />
                  Fechas de la Campaña
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Cierre de Aplicaciones <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.applications_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, applications_deadline: e.target.value }))}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${errors.applications_deadline ? 'border-red-500' : 'border-white/10'}`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Inicio de Publicación <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.publish_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, publish_start: e.target.value }))}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${errors.publish_start ? 'border-red-500' : 'border-white/10'}`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Fin de Publicación <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.publish_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, publish_end: e.target.value }))}
                      className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${errors.publish_end ? 'border-red-500' : 'border-white/10'}`}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="border-t border-white/10 pt-6">
                <label className="block text-sm text-gray-400 mb-2">Notas Internas (solo admin)</label>
                <textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  rows={2}
                  placeholder="Notas privadas sobre esta campaña..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={actionLoading === 'create'}
                className="px-6 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === 'create' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay campañas creadas</p>
          </div>
        ) : (
          campaigns.map(campaign => {
            const contract = campaign.contract;
            const isExpired = contract && new Date(contract.end_date) < new Date();
            
            return (
              <div 
                key={campaign.id}
                className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg text-white">{campaign.name}</h3>
                      {getStatusBadge(campaign.status, contract)}
                      {campaign.visible_to_creators === false && (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Oculta
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">
                      <span className="text-gray-500">Empresa:</span> {campaign.brand?.company_name || '-'} • 
                      <span className="text-gray-500 ml-2">Categoría:</span> {CATEGORY_LABELS[campaign.category] || campaign.category}
                    </p>

                    {/* Contract Info */}
                    {contract && (
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-400">
                          <span className="text-gray-500">Cupos:</span>{' '}
                          <span className="text-white">{campaign.available_slots || 0}</span> disponibles / 
                          <span className="text-white"> {campaign.total_slots_loaded || campaign.slots}</span> cargados
                        </span>
                        <span className="text-gray-400">
                          <span className="text-gray-500">Confirmados:</span>{' '}
                          <span className="text-green-400">{campaign.slots_filled || 0}</span>
                        </span>
                        <span className="text-gray-400">
                          <span className="text-gray-500">Próxima recarga:</span>{' '}
                          <span className={contract.next_reload_date ? 'text-cyan-400' : 'text-gray-500'}>
                            {contract.next_reload_date ? formatDate(contract.next_reload_date) : 'N/A'}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          <span className="text-gray-500">Vencimiento:</span>{' '}
                          <span className={isExpired ? 'text-red-400' : 'text-white'}>
                            {formatDate(contract.end_date)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {actionLoading === campaign.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#d4a968]" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleViewApplications(campaign)}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="Ver aplicaciones"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddSlots(campaign)}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          title="Agregar cupos"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {isExpired && (
                          <button
                            onClick={() => handleRenewCampaign(campaign)}
                            className="p-2 rounded-lg bg-[#d4a968]/20 text-[#d4a968] hover:bg-[#d4a968]/30 transition-colors"
                            title="Renovar contrato"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleVisibility(campaign)}
                          className={`p-2 rounded-lg transition-colors ${
                            campaign.visible_to_creators === false
                              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                              : 'bg-white/10 text-gray-400 hover:bg-white/20'
                          }`}
                          title={campaign.visible_to_creators === false ? 'Mostrar a creadores' : 'Ocultar de creadores'}
                        >
                          {campaign.visible_to_creators === false ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Applications Modal */}
      {showApplications && selectedCampaign && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 className="text-xl font-medium">Aplicaciones</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {selectedCampaign.name} • {applications.length} aplicaciones
                </p>
              </div>
              <button 
                onClick={() => { setShowApplications(false); setSelectedCampaign(null); }} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Slots Info */}
            <div className="px-6 py-4 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-400">
                  <span className="text-gray-500">Cupos disponibles:</span>{' '}
                  <span className="text-green-400 font-medium">{selectedCampaign.available_slots || 0}</span>
                </span>
                <span className="text-gray-400">
                  <span className="text-gray-500">Confirmados:</span>{' '}
                  <span className="text-white font-medium">{selectedCampaign.slots_filled || 0}</span>
                </span>
                <span className="text-gray-400">
                  <span className="text-gray-500">Total cargados:</span>{' '}
                  <span className="text-white font-medium">{selectedCampaign.total_slots_loaded || selectedCampaign.slots || 0}</span>
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingApplications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay aplicaciones para esta campaña</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map(app => {
                    const canConfirm = (selectedCampaign.available_slots || 0) > (selectedCampaign.slots_filled || 0);
                    
                    return (
                      <div 
                        key={app.id}
                        className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          {/* Creator Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-bold text-lg">
                              {app.creator_name?.charAt(0) || 'C'}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{app.creator_name}</h4>
                              <p className="text-sm text-gray-400">@{app.creator_username}</p>
                              
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-400 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5" />
                                  {(app.creator_followers || 0).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-400">
                                  <Star className="w-3.5 h-3.5 fill-current" />
                                  {app.creator_rating?.toFixed(1) || '0.0'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white/10 text-xs capitalize">
                                  {app.creator_level || 'rookie'}
                                </span>
                              </div>

                              {app.motivation && (
                                <p className="mt-2 text-sm text-gray-300 italic max-w-md">
                                  "{app.motivation}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col items-end gap-3">
                            {getApplicationStatusBadge(app.status)}

                            {/* Action Buttons */}
                            {actionLoading === app.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-[#d4a968]" />
                            ) : (
                              <>
                                {app.status === 'applied' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-colors"
                                    >
                                      Preseleccionar
                                    </button>
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'confirmed')}
                                      disabled={!canConfirm}
                                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={!canConfirm ? 'No hay cupos disponibles' : ''}
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                )}

                                {app.status === 'shortlisted' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'confirmed')}
                                      disabled={!canConfirm}
                                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={!canConfirm ? 'No hay cupos disponibles' : ''}
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition-colors"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                )}

                                {app.status === 'confirmed' && (
                                  <span className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Creador confirmado
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-white/10">
              <button
                onClick={() => { setShowApplications(false); setSelectedCampaign(null); }}
                className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignManager;
