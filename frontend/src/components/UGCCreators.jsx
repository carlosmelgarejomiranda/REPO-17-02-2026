import React, { useState } from 'react';
import { Instagram, Music2, CheckCircle, XCircle, Send, Gift, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getCampaign } from '../data/campaigns';

const CITIES = [
  'Asunción', 'Luque', 'San Lorenzo', 'Fernando de la Mora', 'Lambaré', 
  'Capiatá', 'Limpio', 'Ñemby', 'Villa Elisa', 'Mariano Roque Alonso', 
  'San Antonio', 'Otro'
];

const FOLLOWER_RANGES = [
  { value: '0-1000', label: '0 - 1.000', eligible: false },
  { value: '1000-3000', label: '1.000 - 3.000', eligible: false },
  { value: '3000-5000', label: '3.000 - 5.000', eligible: true },
  { value: '5000-10000', label: '5.000 - 10.000', eligible: true },
  { value: '10000+', label: '+10.000', eligible: true },
];

export const UGCCreators = ({ t, campaignId }) => {
  const campaign = getCampaign(campaignId);
  
  const [formData, setFormData] = useState({
    campaign_id: campaignId,
    email: '',
    nombre: '',
    apellido: '',
    sexo: '',
    fecha_nacimiento: '',
    instagram_url: '',
    instagram_privado: '',
    instagram_seguidores: '',
    tiktok_url: '',
    tiktok_privado: '',
    tiktok_seguidores: '',
    video_link_1: '',
    video_link_2: '',
    confirma_grabar_tienda: false,
    ciudad: '',
    whatsapp: '',
    acepta_condiciones: false,
    acepta_whatsapp: false,
    autoriza_contenido: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  // If campaign not found, show error
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="text-center">
          <h1 className="text-2xl mb-4" style={{ color: '#f5ede4' }}>Campaña no encontrada</h1>
          <a href="/studio/ugc" className="text-sm" style={{ color: '#d4a968' }}>Ver campañas disponibles</a>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.email) newErrors.email = 'Email es requerido';
    if (!formData.nombre) newErrors.nombre = 'Nombre es requerido';
    if (!formData.apellido) newErrors.apellido = 'Apellido es requerido';
    if (!formData.sexo) newErrors.sexo = 'Selecciona una opción';
    if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'Fecha de nacimiento es requerida';
    
    // Gender validation based on campaign
    if (formData.sexo && campaign.requirements.gender !== 'all') {
      if (campaign.requirements.gender === 'female' && formData.sexo !== 'femenino') {
        newErrors.sexo = 'Esta campaña es solo para mujeres';
      } else if (campaign.requirements.gender === 'male' && formData.sexo !== 'masculino') {
        newErrors.sexo = 'Esta campaña es solo para hombres';
      }
    }
    
    // Age validation (18+)
    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) newErrors.fecha_nacimiento = 'Debes ser mayor de 18 años';
    }

    // At least one social network required
    if (!formData.instagram_url && !formData.tiktok_url) {
      newErrors.redes = 'Debes completar al menos una red social (Instagram o TikTok)';
    }

    // Instagram validations
    if (formData.instagram_url) {
      if (!formData.instagram_privado) newErrors.instagram_privado = 'Indica si tu perfil es público o privado';
      if (formData.instagram_privado === 'privado') newErrors.instagram_privado = 'Tu perfil de Instagram debe ser público';
      if (!formData.instagram_seguidores) newErrors.instagram_seguidores = 'Indica tu cantidad de seguidores';
      const igRange = FOLLOWER_RANGES.find(r => r.value === formData.instagram_seguidores);
      if (igRange && !igRange.eligible && !formData.tiktok_url) {
        newErrors.instagram_seguidores = 'Necesitas mínimo 3.000 seguidores';
      }
    }

    // TikTok validations
    if (formData.tiktok_url) {
      if (!formData.tiktok_privado) newErrors.tiktok_privado = 'Indica si tu perfil es público o privado';
      if (formData.tiktok_privado === 'privado') newErrors.tiktok_privado = 'Tu perfil de TikTok debe ser público';
      if (!formData.tiktok_seguidores) newErrors.tiktok_seguidores = 'Indica tu cantidad de seguidores';
      const tkRange = FOLLOWER_RANGES.find(r => r.value === formData.tiktok_seguidores);
      if (tkRange && !tkRange.eligible && !formData.instagram_url) {
        newErrors.tiktok_seguidores = 'Necesitas mínimo 3.000 seguidores';
      }
    }

    // Check if at least one network meets minimum
    if (formData.instagram_url || formData.tiktok_url) {
      const igEligible = formData.instagram_url && formData.instagram_privado === 'publico' && 
        FOLLOWER_RANGES.find(r => r.value === formData.instagram_seguidores)?.eligible;
      const tkEligible = formData.tiktok_url && formData.tiktok_privado === 'publico' && 
        FOLLOWER_RANGES.find(r => r.value === formData.tiktok_seguidores)?.eligible;
      
      if (!igEligible && !tkEligible) {
        newErrors.redes = 'Necesitas al menos una red social pública con +3.000 seguidores';
      }
    }

    // Video links
    if (!formData.video_link_1) newErrors.video_link_1 = 'Link de video 1 es requerido';
    if (!formData.video_link_2) newErrors.video_link_2 = 'Link de video 2 es requerido';
    if (formData.video_link_1 && formData.video_link_2 && formData.video_link_1 === formData.video_link_2) {
      newErrors.video_link_2 = 'Los links deben ser diferentes';
    }

    // Confirmation
    if (!formData.confirma_grabar_tienda) newErrors.confirma_grabar_tienda = 'Debes confirmar que grabarás en AVENUE';

    // Location and contact
    if (!formData.ciudad) newErrors.ciudad = 'Ciudad es requerida';
    if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp es requerido';

    // Terms
    if (!formData.acepta_condiciones) newErrors.acepta_condiciones = 'Debes aceptar las condiciones';
    if (!formData.autoriza_contenido) newErrors.autoriza_contenido = 'Debes autorizar el uso del contenido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/ugc/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setSubmitResult(data);
      } else {
        setErrors({ submit: data.detail || 'Error al enviar la solicitud' });
      }
    } catch (err) {
      setErrors({ submit: 'Error de conexión' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0d0d0d' }}>
        <Card className="max-w-lg w-full" style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
              <CheckCircle className="w-10 h-10" style={{ color: '#22c55e' }} />
            </div>
            <h2 className="text-2xl font-light italic mb-4" style={{ color: '#f5ede4' }}>
              ¡Solicitud Enviada!
            </h2>
            <p className="mb-6" style={{ color: '#a8a8a8' }}>
              Gracias por tu interés en ser parte de AVENUE. Revisaremos tu perfil y te contactaremos por WhatsApp si quedás seleccionad@.
            </p>
            <p className="text-sm" style={{ color: '#666' }}>
              ¡Buena suerte! 🍀✨
            </p>
            <Button
              onClick={() => window.location.href = '/studio'}
              className="mt-6"
              style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
            >
              Volver a Avenue Studio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light mb-6 italic" style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}>
            UGC Creators
          </h1>
          <p className="text-xl mb-4" style={{ color: '#d4a968' }}>
            ¿Te gustaría compartir tu experiencia en AVENUE con tu comunidad?
          </p>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a8a8a8' }}>
            AVENUE te invita a ser parte de esta experiencia y a mostrar cómo se vive la moda, el detalle y el descubrimiento en un solo lugar.
          </p>
        </div>
      </section>

      {/* Canje Info */}
      <section className="py-12 px-6" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)', border: '1px solid #d4a968' }}>
            <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: '#d4a968' }} />
            <h3 className="text-xl font-medium mb-3" style={{ color: '#d4a968' }}>
              🎁 Mega Canje en Tienda
            </h3>
            <p className="text-lg mb-2" style={{ color: '#f5ede4' }}>
              Podés elegir productos del <strong>OUTLET de AVENUE</strong> y de <strong>SANTAL</strong> hasta <strong style={{ color: '#d4a968' }}>Gs. 500.000</strong>
            </p>
            <p className="text-sm" style={{ color: '#a8a8a8' }}>
              📍 El video/contenido se debe grabar dentro de AVENUE (en tienda)
            </p>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-light italic text-center mb-8" style={{ color: '#f5ede4' }}>
            ⚡ Requisitos
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Mujeres y hombres',
              'Mayores de 18 años',
              'Residencia en Asunción y Gran Asunción',
              'Perfiles públicos de Instagram y/o TikTok',
              '+3.000 followers (mínimo)',
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded" style={{ backgroundColor: '#1a1a1a' }}>
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#d4a968' }} />
                <span style={{ color: '#a8a8a8' }}>{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Card style={{ backgroundColor: '#1a1a1a', borderColor: '#d4a968' }}>
            <CardHeader>
              <CardTitle className="text-center italic" style={{ color: '#f5ede4' }}>
                🧡 Completá con tus datos
              </CardTitle>
              <p className="text-center text-sm" style={{ color: '#a8a8a8' }}>
                Te contactaremos por WhatsApp si quedás seleccionad@
              </p>
            </CardHeader>
            <CardContent>
              {errors.submit && (
                <div className="mb-6 p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Data */}
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: '#d4a968' }}>
                    Datos Personales
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full p-3 rounded border"
                        style={{ backgroundColor: '#2a2a2a', borderColor: errors.email ? '#ef4444' : '#333', color: '#f5ede4' }}
                      />
                      {errors.email && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Nombre *</label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => updateField('nombre', e.target.value)}
                          className="w-full p-3 rounded border"
                          style={{ backgroundColor: '#2a2a2a', borderColor: errors.nombre ? '#ef4444' : '#333', color: '#f5ede4' }}
                        />
                        {errors.nombre && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.nombre}</p>}
                      </div>
                      <div>
                        <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Apellido *</label>
                        <input
                          type="text"
                          value={formData.apellido}
                          onChange={(e) => updateField('apellido', e.target.value)}
                          className="w-full p-3 rounded border"
                          style={{ backgroundColor: '#2a2a2a', borderColor: errors.apellido ? '#ef4444' : '#333', color: '#f5ede4' }}
                        />
                        {errors.apellido && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.apellido}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Sexo *</label>
                        <select
                          value={formData.sexo}
                          onChange={(e) => updateField('sexo', e.target.value)}
                          className="w-full p-3 rounded border"
                          style={{ backgroundColor: '#2a2a2a', borderColor: errors.sexo ? '#ef4444' : '#333', color: '#f5ede4' }}
                        >
                          <option value="">Seleccionar</option>
                          <option value="femenino">Femenino</option>
                          <option value="masculino">Masculino</option>
                          <option value="otro">Otro</option>
                        </select>
                        {errors.sexo && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.sexo}</p>}
                      </div>
                      <div>
                        <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Fecha de Nacimiento *</label>
                        <input
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) => updateField('fecha_nacimiento', e.target.value)}
                          className="w-full p-3 rounded border"
                          style={{ backgroundColor: '#2a2a2a', borderColor: errors.fecha_nacimiento ? '#ef4444' : '#333', color: '#f5ede4' }}
                        />
                        {errors.fecha_nacimiento && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.fecha_nacimiento}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Networks */}
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: '#d4a968' }}>
                    <Instagram className="w-4 h-4" /> Redes Sociales (mínimo 1)
                  </h4>
                  {errors.redes && (
                    <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                      {errors.redes}
                    </div>
                  )}

                  {/* Instagram */}
                  <div className="p-4 rounded mb-4" style={{ backgroundColor: '#2a2a2a' }}>
                    <label className="block text-sm mb-2 font-medium" style={{ color: '#f5ede4' }}>Instagram</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/tu_usuario"
                      value={formData.instagram_url}
                      onChange={(e) => updateField('instagram_url', e.target.value)}
                      className="w-full p-3 rounded border mb-3"
                      style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#f5ede4' }}
                    />
                    {formData.instagram_url && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>¿Público o privado?</label>
                          <select
                            value={formData.instagram_privado}
                            onChange={(e) => updateField('instagram_privado', e.target.value)}
                            className="w-full p-2 rounded border text-sm"
                            style={{ backgroundColor: '#1a1a1a', borderColor: errors.instagram_privado ? '#ef4444' : '#333', color: '#f5ede4' }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="publico">Público</option>
                            <option value="privado">Privado</option>
                          </select>
                          {errors.instagram_privado && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.instagram_privado}</p>}
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Seguidores</label>
                          <select
                            value={formData.instagram_seguidores}
                            onChange={(e) => updateField('instagram_seguidores', e.target.value)}
                            className="w-full p-2 rounded border text-sm"
                            style={{ backgroundColor: '#1a1a1a', borderColor: errors.instagram_seguidores ? '#ef4444' : '#333', color: '#f5ede4' }}
                          >
                            <option value="">Seleccionar</option>
                            {FOLLOWER_RANGES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          {errors.instagram_seguidores && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.instagram_seguidores}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="p-4 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    <label className="block text-sm mb-2 font-medium flex items-center gap-2" style={{ color: '#f5ede4' }}>
                      <Music2 className="w-4 h-4" /> TikTok
                    </label>
                    <input
                      type="url"
                      placeholder="https://tiktok.com/@tu_usuario"
                      value={formData.tiktok_url}
                      onChange={(e) => updateField('tiktok_url', e.target.value)}
                      className="w-full p-3 rounded border mb-3"
                      style={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#f5ede4' }}
                    />
                    {formData.tiktok_url && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>¿Público o privado?</label>
                          <select
                            value={formData.tiktok_privado}
                            onChange={(e) => updateField('tiktok_privado', e.target.value)}
                            className="w-full p-2 rounded border text-sm"
                            style={{ backgroundColor: '#1a1a1a', borderColor: errors.tiktok_privado ? '#ef4444' : '#333', color: '#f5ede4' }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="publico">Público</option>
                            <option value="privado">Privado</option>
                          </select>
                          {errors.tiktok_privado && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.tiktok_privado}</p>}
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: '#a8a8a8' }}>Seguidores</label>
                          <select
                            value={formData.tiktok_seguidores}
                            onChange={(e) => updateField('tiktok_seguidores', e.target.value)}
                            className="w-full p-2 rounded border text-sm"
                            style={{ backgroundColor: '#1a1a1a', borderColor: errors.tiktok_seguidores ? '#ef4444' : '#333', color: '#f5ede4' }}
                          >
                            <option value="">Seleccionar</option>
                            {FOLLOWER_RANGES.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          {errors.tiktok_seguidores && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.tiktok_seguidores}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Samples */}
                <div>
                  <h4 className="text-sm font-medium mb-4" style={{ color: '#d4a968' }}>
                    Muestras de Contenido *
                  </h4>
                  <p className="text-xs mb-3" style={{ color: '#666' }}>
                    Comparte 2 links a videos que hayas creado (Instagram Reels, TikTok, etc.)
                  </p>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="url"
                        placeholder="Link video 1"
                        value={formData.video_link_1}
                        onChange={(e) => updateField('video_link_1', e.target.value)}
                        className="w-full p-3 rounded border"
                        style={{ backgroundColor: '#2a2a2a', borderColor: errors.video_link_1 ? '#ef4444' : '#333', color: '#f5ede4' }}
                      />
                      {errors.video_link_1 && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.video_link_1}</p>}
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="Link video 2"
                        value={formData.video_link_2}
                        onChange={(e) => updateField('video_link_2', e.target.value)}
                        className="w-full p-3 rounded border"
                        style={{ backgroundColor: '#2a2a2a', borderColor: errors.video_link_2 ? '#ef4444' : '#333', color: '#f5ede4' }}
                      />
                      {errors.video_link_2 && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.video_link_2}</p>}
                    </div>
                  </div>
                </div>

                {/* Confirmation */}
                <div className="p-4 rounded" style={{ backgroundColor: 'rgba(212, 169, 104, 0.1)', border: '1px solid rgba(212, 169, 104, 0.3)' }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.confirma_grabar_tienda}
                      onChange={(e) => updateField('confirma_grabar_tienda', e.target.checked)}
                      className="mt-1"
                    />
                    <span style={{ color: '#f5ede4' }}>
                      <strong>Confirmo que el contenido se graba presencialmente en AVENUE</strong>
                    </span>
                  </label>
                  {errors.confirma_grabar_tienda && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{errors.confirma_grabar_tienda}</p>}
                </div>

                {/* Location and Contact */}
                <div>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: '#d4a968' }}>
                    <MapPin className="w-4 h-4" /> Ubicación y Contacto
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>Ciudad *</label>
                      <select
                        value={formData.ciudad}
                        onChange={(e) => updateField('ciudad', e.target.value)}
                        className="w-full p-3 rounded border"
                        style={{ backgroundColor: '#2a2a2a', borderColor: errors.ciudad ? '#ef4444' : '#333', color: '#f5ede4' }}
                      >
                        <option value="">Seleccionar</option>
                        {CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {errors.ciudad && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.ciudad}</p>}
                    </div>
                    <div>
                      <label className="block text-sm mb-1" style={{ color: '#a8a8a8' }}>WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="+595 9XX XXX XXX"
                        value={formData.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        className="w-full p-3 rounded border"
                        style={{ backgroundColor: '#2a2a2a', borderColor: errors.whatsapp ? '#ef4444' : '#333', color: '#f5ede4' }}
                      />
                      {errors.whatsapp && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.whatsapp}</p>}
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium mb-2" style={{ color: '#d4a968' }}>
                    Condiciones
                  </h4>
                  
                  <div className="p-3 rounded text-sm" style={{ backgroundColor: '#2a2a2a', color: '#a8a8a8' }}>
                    <p><strong style={{ color: '#d4a968' }}>Canje:</strong> Hasta Gs. 500.000 en productos del Outlet de AVENUE + SANTAL</p>
                    <p><strong style={{ color: '#d4a968' }}>Condición:</strong> El contenido se graba en AVENUE</p>
                    <p className="text-xs mt-2" style={{ color: '#666' }}>No canjeable por dinero. Cupos limitados. 1 canje por persona seleccionada.</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    <input
                      type="checkbox"
                      checked={formData.acepta_condiciones}
                      onChange={(e) => updateField('acepta_condiciones', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm" style={{ color: '#a8a8a8' }}>
                      He leído y acepto las condiciones de uso y privacidad *
                    </span>
                  </label>
                  {errors.acepta_condiciones && <p className="text-sm" style={{ color: '#ef4444' }}>{errors.acepta_condiciones}</p>}

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    <input
                      type="checkbox"
                      checked={formData.acepta_whatsapp}
                      onChange={(e) => updateField('acepta_whatsapp', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm" style={{ color: '#a8a8a8' }}>
                      Acepto recibir comunicaciones por WhatsApp sobre la campaña
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
                    <input
                      type="checkbox"
                      checked={formData.autoriza_contenido}
                      onChange={(e) => updateField('autoriza_contenido', e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm" style={{ color: '#a8a8a8' }}>
                      Autorizo a AVENUE a reutilizar el contenido en sus redes (orgánico) *
                    </span>
                  </label>
                  {errors.autoriza_contenido && <p className="text-sm" style={{ color: '#ef4444' }}>{errors.autoriza_contenido}</p>}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-6 text-lg flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                >
                  {submitting ? 'Enviando...' : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Solicitud
                    </>
                  )}
                </Button>

                <p className="text-center text-sm" style={{ color: '#666' }}>
                  ¡Buena suerte! 🍀✨
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Back to Studio */}
      <div className="py-8 text-center">
        <a href="/studio" className="text-sm transition-colors hover:opacity-70" style={{ color: '#666' }}>
          ← Volver a Avenue Studio
        </a>
      </div>
    </div>
  );
};
