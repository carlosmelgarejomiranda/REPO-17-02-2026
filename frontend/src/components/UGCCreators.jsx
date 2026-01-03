import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Music2, CheckCircle, ChevronLeft, Send, Gift, MapPin, Phone, ArrowRight, Check, Sparkles, Users, Star } from 'lucide-react';
import { Button } from './ui/button';
import { getCampaign } from '../data/campaigns';
import { Footer } from './Footer';

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

// Hero image
const CREATOR_HERO = 'https://images.unsplash.com/photo-1664277497095-424e085175e8?w=1920&q=80';

export const UGCCreators = ({ t, campaignId }) => {
  const campaign = getCampaign(campaignId);
  
  const [formData, setFormData] = useState({
    campaign_id: campaignId,
    email: '',
    nombre: '',
    apellido: '',
    sexo: '',
    fecha_nacimiento: '',
    instagram_username: '',
    instagram_privado: '',
    instagram_seguidores: '',
    tiktok_username: '',
    tiktok_privado: '',
    tiktok_seguidores: '',
    video_link_1: '',
    video_link_2: '',
    confirma_grabar_tienda: false,
    ciudad: '',
    whatsapp: '',
    acepta_condiciones: false,
    acepta_whatsapp: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  // If campaign not found, show error
  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-light text-white mb-4">Campaña no encontrada</h1>
          <p className="text-gray-500 mb-8">La campaña que buscas no está disponible</p>
          <a 
            href="/studio/ugc" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors"
          >
            Ver campañas disponibles
            <ArrowRight className="w-4 h-4" />
          </a>
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
    if (!formData.instagram_username && !formData.tiktok_username) {
      newErrors.redes = 'Debes completar al menos una red social (Instagram o TikTok)';
    }

    // Instagram validations
    if (formData.instagram_username) {
      if (!formData.instagram_privado) newErrors.instagram_privado = 'Indica si tu perfil es público o privado';
      if (formData.instagram_privado === 'privado') newErrors.instagram_privado = 'Tu perfil de Instagram debe ser público';
      if (!formData.instagram_seguidores) newErrors.instagram_seguidores = 'Indica tu cantidad de seguidores';
      const igRange = FOLLOWER_RANGES.find(r => r.value === formData.instagram_seguidores);
      if (igRange && !igRange.eligible && !formData.tiktok_username) {
        newErrors.instagram_seguidores = 'Necesitas mínimo 3.000 seguidores';
      }
    }

    // TikTok validations
    if (formData.tiktok_username) {
      if (!formData.tiktok_privado) newErrors.tiktok_privado = 'Indica si tu perfil es público o privado';
      if (formData.tiktok_privado === 'privado') newErrors.tiktok_privado = 'Tu perfil de TikTok debe ser público';
      if (!formData.tiktok_seguidores) newErrors.tiktok_seguidores = 'Indica tu cantidad de seguidores';
      const tkRange = FOLLOWER_RANGES.find(r => r.value === formData.tiktok_seguidores);
      if (tkRange && !tkRange.eligible && !formData.instagram_username) {
        newErrors.tiktok_seguidores = 'Necesitas mínimo 3.000 seguidores';
      }
    }

    // Check if at least one network meets minimum
    if (formData.instagram_username || formData.tiktok_username) {
      const igEligible = formData.instagram_username && formData.instagram_privado === 'publico' && 
        FOLLOWER_RANGES.find(r => r.value === formData.instagram_seguidores)?.eligible;
      const tkEligible = formData.tiktok_username && formData.tiktok_privado === 'publico' && 
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Generate full URLs from usernames before sending
      const submitData = {
        ...formData,
        instagram_url: formData.instagram_username ? `https://www.instagram.com/${formData.instagram_username}` : '',
        tiktok_url: formData.tiktok_username ? `https://www.tiktok.com/@${formData.tiktok_username}` : '',
      };
      
      const response = await fetch(`${API_URL}/api/ugc/aplicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
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

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10 p-10 text-center">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: `${campaign.color}20` }}></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: `${campaign.color}10` }}></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center" style={{ backgroundColor: campaign.color }}>
                <Check className="w-10 h-10 text-black" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
                ¡Solicitud <span className="italic" style={{ color: campaign.color }}>Enviada</span>!
              </h2>
              <p className="text-gray-400 mb-8">
                Gracias por tu interés en ser parte de AVENUE
              </p>
              
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-8 text-left">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Revisaremos tu perfil y te contactaremos por <span style={{ color: campaign.color }}>WhatsApp</span> si quedás seleccionad@ para la campaña de <span className="font-medium text-white">{campaign.brand}</span>.
                </p>
              </div>
              
              <p className="text-gray-500 text-sm mb-8">¡Buena suerte! 🍀✨</p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/studio/ugc"
                  className="flex-1 py-4 px-6 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-black"
                  style={{ backgroundColor: campaign.color }}
                >
                  Ver más campañas
                </a>
                <a 
                  href="/studio"
                  className="flex-1 py-4 px-6 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  Volver al Studio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <img src={CREATOR_HERO} alt="UGC Creators" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/50" />
          {/* Campaign Color Overlay */}
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 80% 50%, ${campaign.color}40, transparent 60%)` }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <a href="/studio/ugc" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Ver todas las campañas</span>
          </a>
          
          {/* Campaign Badge */}
          <div 
            className="inline-block px-5 py-2 rounded-full text-sm font-medium mb-6"
            style={{ backgroundColor: campaign.color, color: '#0d0d0d' }}
          >
            Campaña {campaign.brand}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-4">
            {campaign.title.split(' ').slice(0, 2).join(' ')} <span className="italic" style={{ color: campaign.color }}>{campaign.title.split(' ').slice(2).join(' ')}</span>
          </h1>
          
          <p className="text-lg text-gray-300 max-w-xl">
            {campaign.description}
          </p>
        </div>
      </section>

      {/* Canje Highlight */}
      <section className="py-16 px-6 border-t border-white/10" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl p-8 md:p-12" style={{ backgroundColor: `${campaign.color}10`, border: `1px solid ${campaign.color}30` }}>
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ backgroundColor: campaign.color }}></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: campaign.color }}>
                <Gift className="w-10 h-10 text-black" />
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-light text-white mb-2">
                  🎁 Mega Canje en Tienda
                </h3>
                <p className="text-xl text-white mb-2">
                  {campaign.canje.description.split('Gs.')[0]}
                  <span className="font-medium" style={{ color: campaign.color }}>Gs. {campaign.canje.amount}</span>
                  {campaign.canje.description.split(campaign.canje.amount)[1] || '.'}
                </p>
                <div className="flex items-center gap-2 justify-center md:justify-start text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{campaign.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
              Requisitos de la <span className="italic" style={{ color: campaign.color }}>campaña</span>
            </h2>
            <p className="text-gray-500">Asegúrate de cumplir con estos requisitos antes de aplicar</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, text: campaign.requirements.genderText },
              { icon: Star, text: `Mayores de ${campaign.requirements.minAge} años` },
              { icon: MapPin, text: campaign.requirements.location },
              { icon: CheckCircle, text: campaign.requirements.publicProfile },
              { icon: Instagram, text: `+${campaign.requirements.minFollowers.toLocaleString()} followers (mínimo)` },
            ].map((req, i) => {
              const Icon = req.icon;
              return (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${campaign.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: campaign.color }} />
                  </div>
                  <span className="text-gray-300">{req.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
              Completá tu <span className="italic" style={{ color: campaign.color }}>aplicación</span>
            </h2>
            <p className="text-gray-500">Te contactaremos por WhatsApp si quedás seleccionad@</p>
          </div>
          
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10">
            <div className="p-8 md:p-10">
              {errors.submit && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Data */}
                <div>
                  <h4 className="text-sm font-medium mb-6 uppercase tracking-wider flex items-center gap-2" style={{ color: campaign.color }}>
                    <Users className="w-4 h-4" /> Datos Personales
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                        placeholder="tu@email.com"
                      />
                      {errors.email && <p className="text-sm mt-2 text-red-400">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2 text-gray-400">Nombre *</label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => updateField('nombre', e.target.value)}
                          className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.nombre ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                          placeholder="Tu nombre"
                        />
                        {errors.nombre && <p className="text-sm mt-2 text-red-400">{errors.nombre}</p>}
                      </div>
                      <div>
                        <label className="block text-sm mb-2 text-gray-400">Apellido *</label>
                        <input
                          type="text"
                          value={formData.apellido}
                          onChange={(e) => updateField('apellido', e.target.value)}
                          className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.apellido ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                          placeholder="Tu apellido"
                        />
                        {errors.apellido && <p className="text-sm mt-2 text-red-400">{errors.apellido}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-2 text-gray-400">Sexo *</label>
                        <select
                          value={formData.sexo}
                          onChange={(e) => updateField('sexo', e.target.value)}
                          className={`w-full p-4 rounded-lg bg-white/5 border text-white focus:outline-none transition-colors ${errors.sexo ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                        >
                          <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                          <option value="femenino" className="bg-[#1a1a1a]">Femenino</option>
                          <option value="masculino" className="bg-[#1a1a1a]">Masculino</option>
                          <option value="otro" className="bg-[#1a1a1a]">Otro</option>
                        </select>
                        {errors.sexo && <p className="text-sm mt-2 text-red-400">{errors.sexo}</p>}
                      </div>
                      <div>
                        <label className="block text-sm mb-2 text-gray-400">Fecha de Nacimiento *</label>
                        <input
                          type="date"
                          value={formData.fecha_nacimiento}
                          onChange={(e) => updateField('fecha_nacimiento', e.target.value)}
                          className={`w-full p-4 rounded-lg bg-white/5 border text-white focus:outline-none transition-colors ${errors.fecha_nacimiento ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                        />
                        {errors.fecha_nacimiento && <p className="text-sm mt-2 text-red-400">{errors.fecha_nacimiento}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Networks */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-6 uppercase tracking-wider flex items-center gap-2" style={{ color: campaign.color }}>
                    <Instagram className="w-4 h-4" /> Redes Sociales (mínimo 1)
                  </h4>
                  {errors.redes && (
                    <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {errors.redes}
                    </div>
                  )}

                  {/* Instagram */}
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <label className="block text-sm mb-3 font-medium text-white flex items-center gap-2">
                      <Instagram className="w-4 h-4" style={{ color: campaign.color }} /> Instagram
                    </label>
                    <div className="flex items-center mb-4">
                      <span className="p-4 rounded-l-lg border border-r-0 text-sm bg-black/30 border-white/10 text-gray-500">@</span>
                      <input
                        type="text"
                        placeholder="tu_usuario"
                        value={formData.instagram_username}
                        onChange={(e) => updateField('instagram_username', e.target.value.replace('@', ''))}
                        className="w-full p-4 rounded-r-lg border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      />
                    </div>
                    {formData.instagram_username && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs mb-2 text-gray-500">¿Público o privado?</label>
                          <select
                            value={formData.instagram_privado}
                            onChange={(e) => updateField('instagram_privado', e.target.value)}
                            className={`w-full p-3 rounded-lg border text-sm bg-white/5 text-white focus:outline-none transition-colors ${errors.instagram_privado ? 'border-red-500/50' : 'border-white/10 focus:border-[#d4a968]'}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                            <option value="publico" className="bg-[#1a1a1a]">Público</option>
                            <option value="privado" className="bg-[#1a1a1a]">Privado</option>
                          </select>
                          {errors.instagram_privado && <p className="text-xs mt-1 text-red-400">{errors.instagram_privado}</p>}
                        </div>
                        <div>
                          <label className="block text-xs mb-2 text-gray-500">Seguidores</label>
                          <select
                            value={formData.instagram_seguidores}
                            onChange={(e) => updateField('instagram_seguidores', e.target.value)}
                            className={`w-full p-3 rounded-lg border text-sm bg-white/5 text-white focus:outline-none transition-colors ${errors.instagram_seguidores ? 'border-red-500/50' : 'border-white/10 focus:border-[#d4a968]'}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                            {FOLLOWER_RANGES.map(r => (
                              <option key={r.value} value={r.value} className="bg-[#1a1a1a]">{r.label}</option>
                            ))}
                          </select>
                          {errors.instagram_seguidores && <p className="text-xs mt-1 text-red-400">{errors.instagram_seguidores}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                    <label className="block text-sm mb-3 font-medium text-white flex items-center gap-2">
                      <Music2 className="w-4 h-4" style={{ color: campaign.color }} /> TikTok
                    </label>
                    <div className="flex items-center mb-4">
                      <span className="p-4 rounded-l-lg border border-r-0 text-sm bg-black/30 border-white/10 text-gray-500">@</span>
                      <input
                        type="text"
                        placeholder="tu_usuario"
                        value={formData.tiktok_username}
                        onChange={(e) => updateField('tiktok_username', e.target.value.replace('@', ''))}
                        className="w-full p-4 rounded-r-lg border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      />
                    </div>
                    {formData.tiktok_username && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs mb-2 text-gray-500">¿Público o privado?</label>
                          <select
                            value={formData.tiktok_privado}
                            onChange={(e) => updateField('tiktok_privado', e.target.value)}
                            className={`w-full p-3 rounded-lg border text-sm bg-white/5 text-white focus:outline-none transition-colors ${errors.tiktok_privado ? 'border-red-500/50' : 'border-white/10 focus:border-[#d4a968]'}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                            <option value="publico" className="bg-[#1a1a1a]">Público</option>
                            <option value="privado" className="bg-[#1a1a1a]">Privado</option>
                          </select>
                          {errors.tiktok_privado && <p className="text-xs mt-1 text-red-400">{errors.tiktok_privado}</p>}
                        </div>
                        <div>
                          <label className="block text-xs mb-2 text-gray-500">Seguidores</label>
                          <select
                            value={formData.tiktok_seguidores}
                            onChange={(e) => updateField('tiktok_seguidores', e.target.value)}
                            className={`w-full p-3 rounded-lg border text-sm bg-white/5 text-white focus:outline-none transition-colors ${errors.tiktok_seguidores ? 'border-red-500/50' : 'border-white/10 focus:border-[#d4a968]'}`}
                          >
                            <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                            {FOLLOWER_RANGES.map(r => (
                              <option key={r.value} value={r.value} className="bg-[#1a1a1a]">{r.label}</option>
                            ))}
                          </select>
                          {errors.tiktok_seguidores && <p className="text-xs mt-1 text-red-400">{errors.tiktok_seguidores}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Portfolio */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-2 uppercase tracking-wider" style={{ color: campaign.color }}>
                    🎬 Portfolio de Videos
                  </h4>
                  <p className="text-gray-500 text-sm mb-6">Comparte 2 videos que muestren tu estilo de contenido</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Link Video 1 *</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/reel/... o tiktok.com/..."
                        value={formData.video_link_1}
                        onChange={(e) => updateField('video_link_1', e.target.value)}
                        className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.video_link_1 ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                      />
                      {errors.video_link_1 && <p className="text-sm mt-2 text-red-400">{errors.video_link_1}</p>}
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Link Video 2 *</label>
                      <input
                        type="url"
                        placeholder="https://instagram.com/reel/... o tiktok.com/..."
                        value={formData.video_link_2}
                        onChange={(e) => updateField('video_link_2', e.target.value)}
                        className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.video_link_2 ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                      />
                      {errors.video_link_2 && <p className="text-sm mt-2 text-red-400">{errors.video_link_2}</p>}
                    </div>
                  </div>
                </div>

                {/* Location & Contact */}
                <div className="pt-6 border-t border-white/10">
                  <h4 className="text-sm font-medium mb-6 uppercase tracking-wider flex items-center gap-2" style={{ color: campaign.color }}>
                    <MapPin className="w-4 h-4" /> Ubicación y Contacto
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">Ciudad *</label>
                      <select
                        value={formData.ciudad}
                        onChange={(e) => updateField('ciudad', e.target.value)}
                        className={`w-full p-4 rounded-lg bg-white/5 border text-white focus:outline-none transition-colors ${errors.ciudad ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                      >
                        <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                        {CITIES.map(city => (
                          <option key={city} value={city} className="bg-[#1a1a1a]">{city}</option>
                        ))}
                      </select>
                      {errors.ciudad && <p className="text-sm mt-2 text-red-400">{errors.ciudad}</p>}
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-gray-400">WhatsApp *</label>
                      <input
                        type="tel"
                        placeholder="+595 9XX XXX XXX"
                        value={formData.whatsapp}
                        onChange={(e) => updateField('whatsapp', e.target.value)}
                        className={`w-full p-4 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:outline-none transition-colors ${errors.whatsapp ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#d4a968]'}`}
                      />
                      {errors.whatsapp && <p className="text-sm mt-2 text-red-400">{errors.whatsapp}</p>}
                    </div>
                  </div>
                </div>

                {/* Confirmations */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  {/* Store confirmation */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${formData.confirma_grabar_tienda ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input
                      type="checkbox"
                      checked={formData.confirma_grabar_tienda}
                      onChange={(e) => updateField('confirma_grabar_tienda', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded accent-[#d4a968]"
                    />
                    <div>
                      <span className="text-white">Confirmo que grabaré el contenido en AVENUE *</span>
                      <p className="text-gray-500 text-sm mt-1">El contenido debe ser grabado en nuestra tienda física</p>
                    </div>
                  </label>
                  {errors.confirma_grabar_tienda && <p className="text-sm text-red-400">{errors.confirma_grabar_tienda}</p>}

                  {/* Terms */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${formData.acepta_condiciones ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input
                      type="checkbox"
                      checked={formData.acepta_condiciones}
                      onChange={(e) => updateField('acepta_condiciones', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded accent-[#d4a968]"
                    />
                    <div>
                      <span className="text-white">Acepto las condiciones de participación *</span>
                      <p className="text-gray-500 text-sm mt-1">
                        He leído y acepto los{' '}
                        <a 
                          href="/studio/ugc/terms" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#d4a968] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          términos y condiciones
                        </a>
                        {' '}del programa UGC Creators
                      </p>
                    </div>
                  </label>
                  {errors.acepta_condiciones && <p className="text-sm text-red-400">{errors.acepta_condiciones}</p>}

                  {/* WhatsApp permission */}
                  <label className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors ${formData.acepta_whatsapp ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input
                      type="checkbox"
                      checked={formData.acepta_whatsapp}
                      onChange={(e) => updateField('acepta_whatsapp', e.target.checked)}
                      className="mt-1 w-5 h-5 rounded accent-[#d4a968]"
                    />
                    <div>
                      <span className="text-white">Acepto recibir información por WhatsApp</span>
                      <p className="text-gray-500 text-sm mt-1">Me gustaría recibir novedades de futuras campañas</p>
                    </div>
                  </label>
                </div>

                {/* Submit */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 font-medium text-lg rounded-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                    style={{ backgroundColor: campaign.color }}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Enviar Aplicación</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
