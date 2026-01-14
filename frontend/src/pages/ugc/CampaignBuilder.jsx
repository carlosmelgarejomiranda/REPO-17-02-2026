import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Save, Send, Loader2, Image, 
  Calendar, Users, MapPin, Tag, Gift, FileText, 
  Instagram, Music2, Info, AlertCircle, Check
} from 'lucide-react';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

const CampaignBuilder = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [packageInfo, setPackageInfo] = useState(null);
  const [errors, setErrors] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    category: '',
    city: 'Asunción',
    
    // Step 2: Requirements
    slots: 1,
    platforms: ['instagram'],
    content_type: 'reel',
    min_followers: 1000,
    max_followers: null,
    hashtags: '',
    mentions: '',
    
    // Step 3: Canje/Reward
    canje_type: 'product',
    canje_value: 0,
    canje_description: '',
    
    // Step 4: Timeline
    application_deadline: '',
    publication_deadline: '',
    metrics_deadline: ''
  });

  useEffect(() => {
    fetchPackageInfo();
  }, []);

  const fetchPackageInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/brands/me/dashboard`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPackageInfo(data.active_package);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    'Food & Gastro', 'Beauty', 'Fashion', 'Lifestyle', 'Travel',
    'Fitness', 'Tech', 'Pets', 'Parenting', 'Home & Deco', 'Entertainment', 'Services'
  ];

  const cities = [
    'Asunción', 'San Lorenzo', 'Luque', 'Fernando de la Mora', 
    'Lambaré', 'Capiatá', 'Encarnación', 'Ciudad del Este', 'Otro'
  ];

  const contentTypes = [
    { id: 'reel', label: 'Reel/Video corto', platforms: ['instagram', 'tiktok'] },
    { id: 'story', label: 'Historia', platforms: ['instagram'] },
    { id: 'post', label: 'Post feed', platforms: ['instagram'] },
    { id: 'carousel', label: 'Carrusel', platforms: ['instagram'] }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
      if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
      if (!formData.category) newErrors.category = 'Selecciona una categoría';
    }
    
    if (stepNum === 2) {
      if (formData.slots < 1) newErrors.slots = 'Mínimo 1 slot';
      if (packageInfo && formData.slots > packageInfo.deliveries_remaining) {
        newErrors.slots = `Solo tenés ${packageInfo.deliveries_remaining} entregas disponibles`;
      }
      if (formData.platforms.length === 0) newErrors.platforms = 'Selecciona al menos una plataforma';
    }
    
    if (stepNum === 3) {
      if (!formData.canje_description.trim()) newErrors.canje_description = 'Describe qué recibirá el creator';
      if (formData.canje_value < 0) newErrors.canje_value = 'El valor no puede ser negativo';
    }
    
    if (stepNum === 4) {
      if (!formData.application_deadline) newErrors.application_deadline = 'Define fecha límite de postulación';
      if (!formData.publication_deadline) newErrors.publication_deadline = 'Define fecha límite de publicación';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`${API_URL}/api/ugc/campaigns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        alert('Campaña guardada como borrador');
        navigate(`/ugc/brand/campaigns/${data.campaign_id}`);
      } else {
        const error = await res.json();
        alert(error.detail || 'Error al guardar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const publishCampaign = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    try {
      // First create as draft
      const payload = buildPayload();
      const createRes = await fetch(`${API_URL}/api/ugc/campaigns/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!createRes.ok) {
        const error = await createRes.json();
        alert(error.detail || 'Error al crear campaña');
        return;
      }
      
      const { campaign_id } = await createRes.json();
      
      // Then publish
      const publishRes = await fetch(`${API_URL}/api/ugc/campaigns/${campaign_id}/publish`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (publishRes.ok) {
        alert('¡Campaña publicada exitosamente!');
        navigate('/ugc/brand/campaigns');
      } else {
        const error = await publishRes.json();
        alert(error.detail || 'Error al publicar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => {
    return {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      city: formData.city,
      slots: formData.slots,
      requirements: {
        platforms: formData.platforms,
        content_type: formData.content_type,
        min_followers: formData.min_followers,
        max_followers: formData.max_followers,
        hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(h => h),
        mentions: formData.mentions.split(',').map(m => m.trim()).filter(m => m)
      },
      canje: {
        type: formData.canje_type,
        value: formData.canje_value,
        description: formData.canje_description
      },
      timeline: {
        application_deadline: formData.application_deadline,
        publication_deadline: formData.publication_deadline,
        metrics_deadline: formData.metrics_deadline || null
      },
      assets: []
    };
  };

  const steps = [
    { num: 1, label: 'Info Básica', icon: FileText },
    { num: 2, label: 'Requisitos', icon: Users },
    { num: 3, label: 'Canje', icon: Gift },
    { num: 4, label: 'Fechas', icon: Calendar },
    { num: 5, label: 'Revisar', icon: Check }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/ugc/brand/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
          <h1 className="text-xl font-light">
            Nueva <span className="text-[#d4a968] italic">Campaña</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {packageInfo ? (
              <>
                <span className="text-[#d4a968]">{packageInfo.deliveries_remaining}</span> entregas disponibles
              </>
            ) : (
              <span className="text-red-400">Sin paquete activo</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                <React.Fragment key={s.num}>
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-[#d4a968] text-black' 
                        : isCompleted 
                          ? 'bg-green-500/20 text-green-400 cursor-pointer'
                          : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">{s.label}</span>
                  </button>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 ${
                      step > s.num ? 'bg-green-500' : 'bg-white/10'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-2">Información de la campaña</h2>
              <p className="text-gray-500">Define los datos básicos de tu campaña</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nombre de la campaña *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Lanzamiento Colección Verano 2025"
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${
                    errors.name ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripción *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe qué buscás, el tono del contenido, ejemplos de lo que esperás..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none ${
                    errors.description ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Categoría *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${
                      errors.category ? 'border-red-500' : 'border-white/10'
                    }`}
                  >
                    <option value="" className="bg-black">Seleccionar...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="bg-black">{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Ciudad</label>
                  <select
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    {cities.map(city => (
                      <option key={city} value={city} className="bg-black">{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Requirements */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-2">Requisitos del contenido</h2>
              <p className="text-gray-500">Define qué tipo de contenido y creators buscás</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Cantidad de creators *</label>
                <input
                  type="number"
                  value={formData.slots}
                  onChange={(e) => handleChange('slots', parseInt(e.target.value) || 1)}
                  min="1"
                  max={packageInfo?.deliveries_remaining || 10}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${
                    errors.slots ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.slots && <p className="text-red-400 text-sm mt-1">{errors.slots}</p>}
                <p className="text-gray-600 text-sm mt-1">
                  Cada slot usa 1 entrega de tu paquete
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Plataformas *</label>
                <div className="flex gap-3">
                  {[
                    { id: 'instagram', label: 'Instagram', icon: Instagram },
                    { id: 'tiktok', label: 'TikTok', icon: Music2 }
                  ].map(platform => {
                    const Icon = platform.icon;
                    const isSelected = formData.platforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          const newPlatforms = isSelected
                            ? formData.platforms.filter(p => p !== platform.id)
                            : [...formData.platforms, platform.id];
                          handleChange('platforms', newPlatforms);
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#d4a968] bg-[#d4a968]/10 text-[#d4a968]'
                            : 'border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {platform.label}
                      </button>
                    );
                  })}
                </div>
                {errors.platforms && <p className="text-red-400 text-sm mt-1">{errors.platforms}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de contenido</label>
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleChange('content_type', type.id)}
                      className={`px-4 py-3 rounded-lg border text-left transition-all ${
                        formData.content_type === type.id
                          ? 'border-[#d4a968] bg-[#d4a968]/10 text-white'
                          : 'border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Seguidores mínimos</label>
                  <input
                    type="number"
                    value={formData.min_followers}
                    onChange={(e) => handleChange('min_followers', parseInt(e.target.value) || 0)}
                    placeholder="1000"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Seguidores máximos (opcional)</label>
                  <input
                    type="number"
                    value={formData.max_followers || ''}
                    onChange={(e) => handleChange('max_followers', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Sin límite"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Hashtags requeridos (separados por coma)</label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => handleChange('hashtags', e.target.value)}
                  placeholder="#tumarca, #verano2025"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Menciones requeridas (separados por coma)</label>
                <input
                  type="text"
                  value={formData.mentions}
                  onChange={(e) => handleChange('mentions', e.target.value)}
                  placeholder="@tumarca"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Canje/Reward */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-2">¿Qué ofrecés a cambio?</h2>
              <p className="text-gray-500">Define el canje o beneficio para los creators</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de canje</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'product', label: 'Producto' },
                    { id: 'service', label: 'Servicio' },
                    { id: 'experience', label: 'Experiencia' }
                  ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleChange('canje_type', type.id)}
                      className={`px-4 py-3 rounded-lg border text-center transition-all ${
                        formData.canje_type === type.id
                          ? 'border-[#d4a968] bg-[#d4a968]/10 text-white'
                          : 'border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Valor estimado del canje (Gs)</label>
                <input
                  type="number"
                  value={formData.canje_value}
                  onChange={(e) => handleChange('canje_value', parseInt(e.target.value) || 0)}
                  placeholder="150000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Los creators verán este valor como referencia
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Descripción del canje *</label>
                <textarea
                  value={formData.canje_description}
                  onChange={(e) => handleChange('canje_description', e.target.value)}
                  placeholder="Ej: Kit de productos de skincare completo (limpiador, tónico, crema hidratante y serum) valorizado en 200.000 Gs"
                  rows={3}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none resize-none ${
                    errors.canje_description ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.canje_description && <p className="text-red-400 text-sm mt-1">{errors.canje_description}</p>}
              </div>

              <div className="bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#d4a968] mt-0.5" />
                  <div>
                    <p className="text-[#d4a968] font-medium">Consejo</p>
                    <p className="text-gray-400 text-sm">
                      Canjes con valor mayor a 100.000 Gs tienden a atraer más creators de calidad.
                      Sé específico sobre lo que incluye el canje.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Timeline */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-2">Fechas importantes</h2>
              <p className="text-gray-500">Define los plazos de tu campaña</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha límite de postulación *</label>
                <input
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => handleChange('application_deadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${
                    errors.application_deadline ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.application_deadline && <p className="text-red-400 text-sm mt-1">{errors.application_deadline}</p>}
                <p className="text-gray-600 text-sm mt-1">
                  Hasta cuándo pueden postularse los creators
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha límite de publicación *</label>
                <input
                  type="date"
                  value={formData.publication_deadline}
                  onChange={(e) => handleChange('publication_deadline', e.target.value)}
                  min={formData.application_deadline || new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white focus:border-[#d4a968] focus:outline-none ${
                    errors.publication_deadline ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.publication_deadline && <p className="text-red-400 text-sm mt-1">{errors.publication_deadline}</p>}
                <p className="text-gray-600 text-sm mt-1">
                  Fecha máxima para que el creator publique el contenido
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Fecha límite de métricas (opcional)</label>
                <input
                  type="date"
                  value={formData.metrics_deadline}
                  onChange={(e) => handleChange('metrics_deadline', e.target.value)}
                  min={formData.publication_deadline || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                />
                <p className="text-gray-600 text-sm mt-1">
                  Hasta cuándo el creator debe subir las métricas de su publicación
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-light mb-2">Revisar campaña</h2>
              <p className="text-gray-500">Verificá que todo esté correcto antes de publicar</p>
            </div>

            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-medium text-white mb-4">{formData.name || 'Sin nombre'}</h3>
                <p className="text-gray-400 mb-6">{formData.description || 'Sin descripción'}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">Categoría</p>
                    <p className="text-white">{formData.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Ciudad</p>
                    <p className="text-white">{formData.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Slots</p>
                    <p className="text-white">{formData.slots} creators</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Plataformas</p>
                    <p className="text-white">{formData.platforms.join(', ')}</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-4">
                  <h4 className="text-[#d4a968] font-medium mb-2">Canje</h4>
                  <p className="text-white">{formData.canje_description || '-'}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Valor: {formatPrice(formData.canje_value)} ({formData.canje_type})
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-[#d4a968] font-medium mb-2">Timeline</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Postulación hasta</p>
                      <p className="text-white">{formData.application_deadline || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Publicación hasta</p>
                      <p className="text-white">{formData.publication_deadline || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Métricas hasta</p>
                      <p className="text-white">{formData.metrics_deadline || 'No definido'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning if no package */}
              {!packageInfo && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Sin paquete activo</p>
                      <p className="text-gray-400 text-sm">
                        Necesitás comprar un paquete antes de publicar campañas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              step === 1
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>

          <div className="flex items-center gap-3">
            {step < 5 && (
              <button
                onClick={saveDraft}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar borrador
              </button>
            )}
            
            {step < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#d4a968] text-black hover:bg-[#c49958] transition-colors"
              >
                Siguiente
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={publishCampaign}
                disabled={loading || !packageInfo}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg transition-colors ${
                  loading || !packageInfo
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar campaña
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;
