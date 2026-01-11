import React, { useState } from 'react';
import { 
  ArrowRight, Check, Store, Camera, Users, Star, Phone, Mail, Building, Send,
  ShoppingBag, Sparkles, Image, Video, BarChart3, Globe, MapPin, Zap,
  MessageSquare, TrendingUp, Package, ChevronRight
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { trackBrandInquiry } from '../utils/analytics';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80';

// Pricing data
const PRICING = {
  exhibidores: {
    label: 'Exhibidores',
    description: 'Joyas, accesorios, cosmética, perfumería, calzados',
    icon: Package,
    plans: [
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Solo presencia digital',
        price: 500000,
        totalValue: 500000,
        savings: 0,
        savingsPercent: 0,
        features: ['Presencia en Avenue Online', 'Página de marca personalizada', 'Gestión de productos', 'Pasarela de pagos integrada'],
        highlight: false
      },
      {
        id: 'online-pro',
        name: 'Online PRO',
        description: 'Contenido + UGC incluido',
        price: 1200000,
        totalValue: 2040000,
        savings: 840000,
        savingsPercent: 41,
        features: ['Todo de E-commerce', 'Producción + post dedicado/mes', '2 horas de estudio/mes', '1 Campaña UGC Starter (4 materiales)/mes'],
        highlight: true
      },
      {
        id: 'showroom',
        name: 'Showroom + Online',
        description: 'Espacio físico + digital',
        price: 1300000,
        totalValue: 1800000,
        savings: 500000,
        savingsPercent: 28,
        features: ['Todo de E-commerce', 'Exhibidor en Avenue Showroom', 'Ubicación premium en Asunción', 'Atención personalizada en tienda'],
        highlight: false
      },
      {
        id: 'showroom-pro',
        name: 'Showroom + Online PRO',
        description: 'Todo el ecosistema',
        price: 1800000,
        totalValue: 3340000,
        savings: 1540000,
        savingsPercent: 46,
        features: ['Todo de Showroom + Online', 'Producción + post dedicado/mes', '2 horas de estudio/mes', '1 Campaña UGC Starter (4 materiales)/mes'],
        highlight: false
      }
    ]
  },
  percheros: {
    label: 'Percheros',
    description: 'Ropa, indumentaria',
    icon: Store,
    plans: [
      {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Solo presencia digital',
        price: 500000,
        totalValue: 500000,
        savings: 0,
        savingsPercent: 0,
        features: ['Presencia en Avenue Online', 'Página de marca personalizada', 'Gestión de productos', 'Pasarela de pagos integrada'],
        highlight: false
      },
      {
        id: 'online-pro',
        name: 'Online PRO',
        description: 'Contenido + UGC incluido',
        price: 1200000,
        totalValue: 2040000,
        savings: 840000,
        savingsPercent: 41,
        features: ['Todo de E-commerce', 'Producción + post dedicado/mes', '2 horas de estudio/mes', '1 Campaña UGC Starter (4 materiales)/mes'],
        highlight: true
      },
      {
        id: 'showroom',
        name: 'Showroom + Online',
        description: 'Espacio físico + digital',
        price: 1700000,
        totalValue: 2200000,
        savings: 500000,
        savingsPercent: 23,
        features: ['Todo de E-commerce', 'Perchero en Avenue Showroom', 'Ubicación premium en Asunción', 'Atención personalizada en tienda'],
        highlight: false
      },
      {
        id: 'showroom-pro',
        name: 'Showroom + Online PRO',
        description: 'Todo el ecosistema',
        price: 2200000,
        totalValue: 3740000,
        savings: 1540000,
        savingsPercent: 41,
        features: ['Todo de Showroom + Online', 'Producción + post dedicado/mes', '2 horas de estudio/mes', '1 Campaña UGC Starter (4 materiales)/mes'],
        highlight: false
      }
    ]
  }
};

const ECOSYSTEM = [
  {
    icon: Globe,
    title: 'Avenue Online',
    description: 'E-commerce premium con tu propia página de marca. Vendé 24/7 con pasarela de pagos integrada.',
    color: 'from-blue-500/20 to-blue-600/10'
  },
  {
    icon: Camera,
    title: 'Avenue Studio',
    description: 'Producción de contenido profesional + campañas UGC con creadores verificados.',
    color: 'from-purple-500/20 to-purple-600/10'
  },
  {
    icon: MapPin,
    title: 'Avenue Showroom',
    description: 'Espacio físico premium en Asunción. Tu marca presente donde están tus clientes.',
    color: 'from-[#d4a968]/20 to-[#d4a968]/10'
  }
];

const PROCESS_STEPS = [
  { step: '01', title: 'Conversamos', description: 'Entendemos tu marca, productos y objetivos de crecimiento' },
  { step: '02', title: 'Diseñamos', description: 'Creamos un plan a medida: online, showroom, UGC o todo junto' },
  { step: '03', title: 'Ejecutamos', description: 'Nos encargamos de todo: producción, gestión y logística' },
  { step: '04', title: 'Medimos', description: 'Analizamos resultados y optimizamos tu estrategia' }
];

export const TuMarca = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
  const [productType, setProductType] = useState('exhibidores');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    contact_name: '',
    email: '',
    phone: '',
    message: '',
    interest: '',
    product_type: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const currentPricing = PRICING[productType];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({ 
      ...prev, 
      interest: plan.id,
      product_type: productType
    }));
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/contact/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          product_type: productType,
          selected_plan: selectedPlan?.name || formData.interest
        })
      });

      if (response.ok) {
        trackBrandInquiry(formData.interest || 'general');
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al enviar el mensaje');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10 p-10 text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a968]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#d4a968] flex items-center justify-center">
                <Check className="w-10 h-10 text-black" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
                ¡Mensaje <span className="italic text-[#d4a968]">Enviado</span>!
              </h2>
              <p className="text-gray-400 mb-8">
                Gracias por tu interés en ser parte de Avenue
              </p>
              
              <p className="text-gray-500 text-sm mb-8">
                Nuestro equipo se pondrá en contacto contigo pronto.
              </p>
              
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors"
              >
                Volver al Inicio
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* ============== HERO ============== */}
      <section className="relative min-h-[60vh] flex items-center pt-16">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Tu marca en Avenue" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-px bg-[#d4a968]"></div>
              <span className="text-[#d4a968] text-xs tracking-[0.2em] uppercase">Para Marcas</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-[1.05]">
              <span className="block">Posicioná tu marca</span>
              <span className="block">con <span className="italic text-[#d4a968]">Avenue</span></span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-300 mb-8 max-w-xl leading-relaxed">
              No somos solo una tienda. Somos tu socio estratégico para ganar visibilidad y conectar con tu audiencia.
            </p>
            
            <a 
              href="#planes"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#d4a968] text-black text-sm font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300 rounded-lg"
              data-testid="hero-cta"
            >
              <span>Ver planes</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ============== ECOSISTEMA AVENUE ============== */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Nuestro ecosistema
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Todo lo que tu marca <span className="italic text-[#d4a968]">necesita</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Tres pilares integrados para maximizar tu visibilidad y ventas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {ECOSYSTEM.map((item, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl bg-[#121212] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-5`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== PLANES Y TARIFAS ============== */}
      <section id="planes" className="py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Planes y Tarifas
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Elegí el plan ideal para <span className="italic text-[#d4a968]">tu marca</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto mb-8">
              Todos los planes son mensuales. A mayor integración, mayor ahorro.
            </p>

            {/* Toggle */}
            <div className="inline-flex flex-col items-center">
              <p className="text-white/40 text-xs mb-3">¿Qué tipo de productos vendés?</p>
              <div className="inline-flex bg-[#1a1a1a] rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setProductType('exhibidores')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                    productType === 'exhibidores'
                      ? 'bg-[#d4a968] text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="toggle-exhibidores"
                >
                  <Package className="w-4 h-4" />
                  <span>Exhibidores</span>
                </button>
                <button
                  onClick={() => setProductType('percheros')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                    productType === 'percheros'
                      ? 'bg-[#d4a968] text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="toggle-percheros"
                >
                  <Store className="w-4 h-4" />
                  <span>Percheros</span>
                </button>
              </div>
              <p className="text-white/30 text-[10px] mt-2">
                {currentPricing.description}
              </p>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentPricing.plans.map((plan, idx) => (
              <div 
                key={plan.id}
                className={`relative flex flex-col p-5 rounded-xl transition-all ${
                  plan.highlight 
                    ? 'bg-[#121212] border-2 border-[#d4a968]/50 hover:border-[#d4a968]' 
                    : 'bg-[#121212] border border-white/5 hover:border-white/20'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#d4a968] text-black text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      Recomendado
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="text-white/50 text-xs mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-2xl font-light text-white">{formatPrice(plan.price)}</div>
                  <span className="text-white/40 text-xs">/mes</span>
                  
                  {plan.savings > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
                      <Sparkles className="w-3 h-3 text-green-400" />
                      <span className="text-xs font-medium text-green-400">
                        Ahorrás {plan.savingsPercent}%
                      </span>
                    </div>
                  )}
                  
                  {plan.savings > 0 && (
                    <p className="text-white/30 text-[10px] mt-1">
                      Valor real: {formatPrice(plan.totalValue)}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="flex-1 mb-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-xs text-white/60">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#d4a968]" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-2.5 text-xs font-medium uppercase tracking-wider transition-all rounded-lg ${
                    plan.highlight
                      ? 'bg-[#d4a968] text-black hover:bg-[#e8c891]'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  Elegir plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CÓMO FUNCIONA ============== */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Proceso simple
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Cómo <span className="italic text-[#d4a968]">funciona</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="p-5 bg-[#121212] rounded-xl border border-white/5 text-center h-full">
                  <div className="text-[#d4a968]/30 text-3xl font-light mb-3">{item.step}</div>
                  <h4 className="text-white font-medium mb-2 text-sm">{item.title}</h4>
                  <p className="text-white/50 text-xs leading-relaxed">{item.description}</p>
                </div>
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FORMULARIO ============== */}
      <section id="contact-form" className="py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Contacto
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Hablemos de tu <span className="italic text-[#d4a968]">marca</span>
            </h2>
            <p className="text-white/50 text-sm">
              Completá el formulario y nuestro equipo se pondrá en contacto
            </p>
            {selectedPlan && (
              <div className="mt-4 inline-flex items-center gap-2 bg-[#d4a968]/10 border border-[#d4a968]/30 px-4 py-2 rounded-full">
                <Check className="w-4 h-4 text-[#d4a968]" />
                <span className="text-sm text-[#d4a968]">Plan seleccionado: {selectedPlan.name}</span>
              </div>
            )}
          </div>
          
          <div className="rounded-xl overflow-hidden bg-[#121212] border border-white/5">
            <div className="p-6 md:p-8">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Nombre de la Marca *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brand_name}
                      onChange={(e) => updateField('brand_name', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="Tu marca"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Nombre de Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => updateField('contact_name', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="+595 9XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Tipo de producto *
                    </label>
                    <select
                      required
                      value={formData.product_type || productType}
                      onChange={(e) => {
                        updateField('product_type', e.target.value);
                        setProductType(e.target.value);
                      }}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none transition-colors"
                    >
                      <option value="exhibidores" className="bg-[#1a1a1a]">Exhibidores (joyas, accesorios, cosmética...)</option>
                      <option value="percheros" className="bg-[#1a1a1a]">Percheros (ropa, indumentaria)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-white/40">
                      Plan de interés *
                    </label>
                    <select
                      required
                      value={formData.interest}
                      onChange={(e) => updateField('interest', e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none transition-colors"
                    >
                      <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                      <option value="ecommerce" className="bg-[#1a1a1a]">E-commerce</option>
                      <option value="online-pro" className="bg-[#1a1a1a]">Online PRO</option>
                      <option value="showroom" className="bg-[#1a1a1a]">Showroom + Online</option>
                      <option value="showroom-pro" className="bg-[#1a1a1a]">Showroom + Online PRO</option>
                      <option value="consulta" className="bg-[#1a1a1a]">Quiero que me asesoren</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-2 text-white/40">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:border-[#d4a968] focus:outline-none transition-colors resize-none"
                    placeholder="Contanos más sobre tu marca..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-form"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ============== CTA WHATSAPP ============== */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            ¿Preferís hablar <span className="italic text-[#d4a968]">directamente</span>?
          </h2>
          <p className="text-white/50 text-sm mb-6 max-w-lg mx-auto">
            Nuestro equipo está disponible para resolver tus dudas por WhatsApp
          </p>
          
          <a 
            href="https://wa.me/595973666000?text=Hola!%20Me%20interesa%20saber%20más%20sobre%20cómo%20mi%20marca%20puede%20estar%20en%20Avenue"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4a968] text-black text-sm font-medium tracking-wide hover:bg-[#c49958] transition-all rounded-lg"
            data-testid="whatsapp-cta"
          >
            <Phone className="w-4 h-4" />
            <span>Contactar por WhatsApp</span>
          </a>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};
