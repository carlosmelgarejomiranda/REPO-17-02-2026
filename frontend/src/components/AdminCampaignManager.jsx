import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Building2, Calendar, Users, Target, MapPin, Upload,
  Instagram, Music2, Loader2, CheckCircle, AlertCircle, Clock,
  RefreshCw, Eye, EyeOff, ChevronDown, Image as ImageIcon,
  UserCheck, XCircle, Star, ClipboardList, List, Type, Minus, Pencil, ArrowRightLeft,
  BadgeCheck, TrendingUp, Heart, MessageCircle, Share2, Bookmark, BarChart3, Award,
  Search, MoreVertical, Filter, Link as LinkIcon, LineChart
} from 'lucide-react';
import { getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

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
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null); // For edit mode
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPending, setFilterPending] = useState(false);
  const [filterLate, setFilterLate] = useState(false);
  const [brandsForFilter, setBrandsForFilter] = useState([]);
  
  // Transfer ownership state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [campaignToTransfer, setCampaignToTransfer] = useState(null);

  // Initial form state
  const initialFormState = {
    brand_id: '',
    brand_name: '',
    name: '',
    description: '',
    category: 'fashion',
    city: 'Asunción',
    monthly_deliverables: 4,
    contract_duration_months: 3,
    contract_start_date: new Date().toISOString().split('T')[0],
    gender: 'all',
    min_age: 18,
    min_followers: 0,
    country: 'Paraguay',
    residence: 'asuncion_gran',
    residence_other: '',
    canje_type: 'product',
    canje_description: '',
    canje_value: 0,
    // New canje fields
    delivery_method: 'pickup',  // delivery, pickup, not_applicable
    pickup_address: '',
    pickup_maps_url: '',
    pickup_hours: '',
    brand_contact_name: '',
    brand_contact_phone: '',
    // End new fields
    applications_deadline: '',
    publish_start: '',
    publish_end: '',
    cover_image_url: '',
    admin_notes: ''
  };

  // Form state
  const [formData, setFormData] = useState(initialFormState);

  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);
  
  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchCampaigns();
    }
  }, [searchQuery, filterStatus, filterBrand, filterPending, filterLate]);

  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      // Fetch brands for form
      const brandsRes = await fetch(`${API_URL}/api/ugc/admin/brands`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrands(data.brands || []);
      }

      // Fetch campaigns with stats
      await fetchCampaigns();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCampaigns = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      if (filterBrand) params.append('brand_id', filterBrand);
      if (filterPending) params.append('has_pending', 'true');
      if (filterLate) params.append('has_late_deliveries', 'true');
      
      const url = `${API_URL}/api/ugc/admin/campaigns?${params.toString()}`;
      const campaignsRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
        setBrandsForFilter(data.brands_for_filter || []);
      }
    } catch (err) {
      console.error(err);
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
        delivery_method: formData.delivery_method,
        pickup_address: formData.pickup_address,
        pickup_maps_url: formData.pickup_maps_url,
        pickup_hours: formData.pickup_hours,
        brand_contact_name: formData.brand_contact_name,
        brand_contact_phone: formData.brand_contact_phone,
        requires_shipping: formData.delivery_method === 'delivery',
        requires_scheduling: formData.canje_type === 'service' || formData.delivery_method === 'not_applicable'
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
        setEditingCampaign(null);
        setFormData(initialFormState);
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

  // Open edit mode for a campaign
  const handleEditCampaign = (campaign) => {
    const timeline = campaign.timeline || {};
    const requirements = campaign.requirements || {};
    const canje = campaign.canje || {};
    const contract = campaign.contract || {};
    
    // Determine residence value
    let residenceValue = 'asuncion_gran';
    let residenceOther = '';
    if (requirements.residence && !requirements.residence.includes('Asunción y Gran')) {
      residenceValue = 'other';
      residenceOther = requirements.residence;
    }
    
    setFormData({
      brand_id: campaign.brand_id || '',
      brand_name: campaign.assets?.brand_name || campaign.name || '',
      name: campaign.name || '',
      description: campaign.description || '',
      category: campaign.category || 'fashion',
      city: campaign.city || 'Asunción',
      monthly_deliverables: contract.monthly_deliverables || 4,
      contract_duration_months: contract.duration_months || 3,
      contract_start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      gender: requirements.gender || 'all',
      min_age: requirements.min_age || 18,
      min_followers: requirements.min_followers || 0,
      country: requirements.country || 'Paraguay',
      residence: residenceValue,
      residence_other: residenceOther,
      canje_type: canje.type || 'product',
      canje_description: canje.description || '',
      canje_value: canje.value || 0,
      // New canje fields
      delivery_method: canje.delivery_method || 'pickup',
      pickup_address: canje.pickup_address || '',
      pickup_maps_url: canje.pickup_maps_url || '',
      pickup_hours: canje.pickup_hours || '',
      brand_contact_name: canje.brand_contact_name || '',
      brand_contact_phone: canje.brand_contact_phone || '',
      // End new fields
      applications_deadline: timeline.applications_deadline ? new Date(timeline.applications_deadline).toISOString().split('T')[0] : '',
      publish_start: timeline.publish_start ? new Date(timeline.publish_start).toISOString().split('T')[0] : '',
      publish_end: timeline.publish_end ? new Date(timeline.publish_end).toISOString().split('T')[0] : '',
      cover_image_url: campaign.assets?.cover_image || '',
      admin_notes: campaign.admin_notes || ''
    });
    
    setEditingCampaign(campaign);
    setShowCreateForm(true);
  };

  // Save edited campaign
  const handleSaveCampaign = async () => {
    if (!validateForm()) return;
    if (!editingCampaign) return;

    setActionLoading('save');
    const token = localStorage.getItem('auth_token');

    const campaignName = formData.name.trim() || formData.brand_name;

    const payload = {
      name: campaignName,
      description: formData.description,
      category: formData.category,
      city: formData.residence === 'asuncion_gran' ? 'Asunción' : formData.residence_other,
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
        delivery_method: formData.delivery_method,
        pickup_address: formData.pickup_address,
        pickup_maps_url: formData.pickup_maps_url,
        pickup_hours: formData.pickup_hours,
        brand_contact_name: formData.brand_contact_name,
        brand_contact_phone: formData.brand_contact_phone,
        requires_shipping: formData.delivery_method === 'delivery',
        requires_scheduling: formData.canje_type === 'service' || formData.delivery_method === 'not_applicable'
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
      const res = await fetch(`${API_URL}/api/ugc/admin/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Campaña actualizada exitosamente');
        setShowCreateForm(false);
        setEditingCampaign(null);
        setFormData(initialFormState);
        fetchData();
        if (onSuccess) onSuccess();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al actualizar campaña');
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

  const handleViewApplications = (campaign) => {
    // Navigate to full page instead of modal
    navigate(`/admin/campaigns/${campaign.id}/applications`);
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    setActionLoading(applicationId);
    const token = localStorage.getItem('auth_token');
    
    try {
      // Use admin endpoint to update application status
      const params = new URLSearchParams({
        status: newStatus
      });
      if (newStatus === 'rejected') {
        params.append('reason', 'No seleccionado por Avenue');
      }
      
      const res = await fetch(`${API_URL}/api/ugc/admin/applications/${applicationId}/status?${params}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
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

  const handleTransferCampaign = async () => {
    if (!transferEmail || !campaignToTransfer) return;
    
    setTransferring(true);
    const token = localStorage.getItem('auth_token');
    
    try {
      const res = await fetch(
        `${API_URL}/api/ugc/admin/campaigns/${campaignToTransfer.id}/transfer?new_brand_email=${encodeURIComponent(transferEmail)}`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        alert(`Campaña transferida exitosamente a ${data.new_brand_name || transferEmail}`);
        setShowTransferModal(false);
        setTransferEmail('');
        setCampaignToTransfer(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al transferir campaña');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setTransferring(false);
    }
  };

  const getApplicationStatusBadge = (status) => {
    const badges = {
      applied: { color: 'bg-blue-500/20 text-blue-400', label: 'Pendiente', icon: Clock },
      shortlisted: { color: 'bg-purple-500/20 text-purple-400', label: 'Preseleccionado', icon: UserCheck },
      confirmed: { color: 'bg-green-500/20 text-green-400', label: 'Confirmado', icon: CheckCircle },
      rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rechazado', icon: XCircle },
      cancelled: { color: 'bg-orange-500/20 text-orange-400', label: 'Cancelado', icon: XCircle },
      withdrawn: { color: 'bg-gray-500/20 text-gray-400', label: 'Retirado', icon: XCircle }
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

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 overflow-y-auto py-10">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-3xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-medium text-white">
                {editingCampaign ? 'Editar Campaña' : 'Crear Nueva Campaña'}
              </h3>
              <button onClick={() => { setShowCreateForm(false); setEditingCampaign(null); setFormData(initialFormState); }} className="text-gray-400 hover:text-white">
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
                    disabled={!!editingCampaign}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${editingCampaign ? 'opacity-50 cursor-not-allowed' : ''} ${errors.brand_id ? 'border-red-500' : 'border-white/10'}`}
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

              {/* Description with formatting toolbar */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Descripción <span className="text-red-400">*</span>
                </label>
                
                {/* Formatting Toolbar */}
                <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-t-lg border border-white/10 border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('campaign-description');
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const text = formData.description;
                      const newText = text.substring(0, start) + '• ' + text.substring(end);
                      setFormData(prev => ({ ...prev, description: newText }));
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + 2, start + 2);
                      }, 0);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
                    title="Agregar bullet point"
                  >
                    <List className="w-4 h-4" />
                    Bullet
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('campaign-description');
                      const start = textarea.selectionStart;
                      const text = formData.description;
                      const newText = text.substring(0, start) + '\n\n📌 ' + text.substring(start);
                      setFormData(prev => ({ ...prev, description: newText }));
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + 5, start + 5);
                      }, 0);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
                    title="Agregar subtítulo"
                  >
                    <Type className="w-4 h-4" />
                    Subtítulo
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const textarea = document.getElementById('campaign-description');
                      const start = textarea.selectionStart;
                      const text = formData.description;
                      const newText = text.substring(0, start) + '\n───────────────\n' + text.substring(start);
                      setFormData(prev => ({ ...prev, description: newText }));
                      setTimeout(() => {
                        textarea.focus();
                        textarea.setSelectionRange(start + 19, start + 19);
                      }, 0);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
                    title="Agregar separador"
                  >
                    <Minus className="w-4 h-4" />
                    Separador
                  </button>
                  
                  <span className="text-xs text-gray-500 ml-auto">
                    Tip: Usa doble Enter para separar párrafos
                  </span>
                </div>
                
                <textarea
                  id="campaign-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  placeholder="Descripción de la campaña para los creadores...

Ejemplo de formato:
📌 Qué buscamos
• Contenido auténtico y creativo
• Videos de 30-60 segundos
• Mostrar el producto en uso

📌 Requisitos
• Perfil público
• Mencionar @marca"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-b-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none resize-y min-h-[200px] whitespace-pre-wrap ${errors.description ? 'border-red-500' : 'border-white/10'}`}
                />
                {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
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

              {/* Delivery/Pickup Section - NEW */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#d4a968]" />
                  Entrega del Canje
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Método de Entrega</label>
                    <select
                      value={formData.delivery_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_method: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="pickup" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Retiro en local</option>
                      <option value="delivery" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Delivery (envío al creador)</option>
                      <option value="not_applicable" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Experiencia en ubicación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Contacto Comercial (Nombre)</label>
                    <input
                      type="text"
                      value={formData.brand_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_contact_name: e.target.value }))}
                      placeholder="Nombre del contacto de la marca"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Teléfono de Contacto</label>
                    <input
                      type="tel"
                      value={formData.brand_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand_contact_phone: e.target.value }))}
                      placeholder="+595 9XX XXX XXX"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                    />
                  </div>
                  {(formData.delivery_method === 'pickup' || formData.delivery_method === 'not_applicable') && (
                    <>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-2">
                          Dirección de {formData.delivery_method === 'pickup' ? 'Retiro' : 'la Experiencia'}
                        </label>
                        <input
                          type="text"
                          value={formData.pickup_address}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
                          placeholder="Ej: Av. España 1234, Asunción"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">URL Google Maps</label>
                        <input
                          type="url"
                          value={formData.pickup_maps_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickup_maps_url: e.target.value }))}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Horario de Atención</label>
                        <input
                          type="text"
                          value={formData.pickup_hours}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickup_hours: e.target.value }))}
                          placeholder="Ej: Lunes a Viernes 9:00 - 18:00"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#d4a968] focus:outline-none"
                        />
                      </div>
                    </>
                  )}
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
                onClick={() => { setShowCreateForm(false); setEditingCampaign(null); setFormData(initialFormState); }}
                className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-white"
              >
                Cancelar
              </button>
              {editingCampaign ? (
                <button
                  onClick={handleSaveCampaign}
                  disabled={actionLoading === 'save'}
                  className="px-6 py-2 bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'save' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Guardar Cambios
                </button>
              ) : (
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
              )}
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
                          onClick={() => handleEditCampaign(campaign)}
                          className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                          title="Editar campaña"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewApplications(campaign)}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                          title="Ver aplicaciones"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/ugc/deliverables/${campaign.id}`)}
                          className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                          title="Ver entregas"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCampaignToTransfer(campaign);
                            setShowTransferModal(true);
                          }}
                          className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
                          title="Transferir propiedad"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
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

      {/* Transfer Campaign Modal */}
      {showTransferModal && campaignToTransfer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1a1a1a] rounded-xl w-full max-w-md border border-white/10">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-yellow-400" />
                Transferir Campaña
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Campaña</p>
                <p className="text-white font-medium">{campaignToTransfer.name}</p>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email del nuevo propietario (marca)
                </label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="email@ejemplo.com"
                />
                <p className="text-xs text-gray-500 mt-2">
                  El usuario debe tener un perfil de marca registrado
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferEmail('');
                  setCampaignToTransfer(null);
                }}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleTransferCampaign}
                disabled={!transferEmail || transferring}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  transferEmail && !transferring
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                } transition-colors`}
              >
                {transferring ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Transfiriendo...</>
                ) : (
                  <>Transferir</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignManager;
