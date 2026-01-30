import React, { useState } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  ArrowRight, Check, Store, Camera, Users, Star, Phone, Mail, Building, Send,
  ShoppingBag, Sparkles, Image, Video, BarChart3, Globe, MapPin, Zap,
  MessageSquare, TrendingUp, Package, ChevronRight, Shield, Heart,
  Truck, ClipboardList, CreditCard, Calendar, FileText, Handshake
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { trackBrandInquiry } from '../utils/analytics';

// Images
const HERO_IMAGE = 'https://customer-assets.emergentagent.com/job_one-account/artifacts/6frwfbef_fachada%20avenue.jpg';
const STUDIO_IMAGE = 'https://customer-assets.emergentagent.com/job_one-account/artifacts/idzlm38w_imagen%20studio.jpg';
const ECOMMERCE_IMAGE = 'https://images.unsplash.com/photo-1730749221242-e89b03900805?w=600&q=80';
const SHOWROOM_IMAGE = 'https://customer-assets.emergentagent.com/job_one-account/artifacts/6frwfbef_fachada%20avenue.jpg';

// Brands with logos
const BRANDS_LOGOS = [
  // Fila 1-2 (orden específico)
  { name: 'Fila', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/n23vvyer_fila.png' },
  { name: 'UGG', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/kjm7ig8m_ugg.png' },
  { name: 'Premiata', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/bz75uuaw_premiata.png' },
  { name: 'Hunter', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/81t0v820_hunter.png' },
  { name: 'Serotonina', url: 'https://customer-assets.emergentagent.com/job_avenue-agency/artifacts/owy00wkk_serotoninaa.png' },
  { name: 'Undisturbed', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/qigxzvwt_undisturbed.png' },
  { name: 'David Sandoval', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/2usl8am4_david%20sandoval.png' },
  { name: 'Santal', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/9ug3sffi_santal.png' },
  { name: 'Body Sculpt', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/x1508c3y_body%20sculpt.png' },
  { name: 'Inmortal', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/z44zvkxg_inmortal.png' },
  { name: 'Malva', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/dqrkyqty_malva.png' },
  // Resto (orden no importa)
  { name: 'Cristaline', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/43f8bnvu_cristaline.png' },
  { name: 'Sarelly', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/obb5nku6_sarelly.png' },
  { name: 'Coraltheia', url: 'https://customer-assets.emergentagent.com/job_avenue-agency/artifacts/bc1w5g5j_Coraltheia%20%281%29.png' },
  { name: 'Laese', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/o91gyue1_laese.png' },
  { name: 'Thula', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/y060bk89_thula.png' },
  { name: 'Maria E Makeup', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/b5o58lv1_maria%20e%20makeup.png' },
  { name: 'Aguara', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/q9zvhytl_aguara.png' },
  { name: 'Efimera', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/430czjwq_efimera.png' },
  { name: 'Brofitwear', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/pv6lug6t_brofitwear.png' },
  { name: 'Bravisima', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/sl1cdb62_bravisima.png' },
  { name: 'OKI', url: 'https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/trqd3flg_OKI.png' },
  { name: 'Karla Ruiz', url: 'https://customer-assets.emergentagent.com/job_avenue-agency/artifacts/lnpbw5d6_IMG_7056.PNG' },
  { name: 'Skyline', url: 'https://customer-assets.emergentagent.com/job_avenue-agency/artifacts/8imn49pd_Design%20sem%20nome%20%284%29.png' }
];

// Pricing data with breakdown - NEW STRUCTURE based on Showroom plans
const PRICING = {
  percheros: {
    label: 'Percheros',
    description: 'Ropa, indumentaria',
    icon: Store,
    plans: [
      {
        id: 'showroom-starter',
        name: 'Showroom Starter',
        description: 'Presencia física + UGC',
        price: 1700000,
        totalValue: 2490000,
        savings: 790000,
        savingsPercent: 32,
        breakdown: [
          { item: '1 Perchero en Showroom', value: 1700000 },
          { item: '1 Campaña UGC Starter (4 mat.)/Mes', value: 790000 }
        ],
        features: ['1 Perchero en Avenue Showroom', 'Ubicación premium en Asunción', 'Campaña UGC mensual con 4 materiales', 'Equipo de venta dedicado'],
        highlight: false,
        isPro: false
      },
      {
        id: 'showroom-standard',
        name: 'Showroom Standard',
        description: 'Presencia + Contenido + UGC',
        price: 2200000,
        totalValue: 3240000,
        savings: 1040000,
        savingsPercent: 32,
        breakdown: [
          { item: '1 Perchero en Showroom', value: 1700000 },
          { item: 'Producción + post dedicado/mes', value: 500000 },
          { item: '2 horas de estudio/mes', value: 250000 },
          { item: '1 Campaña UGC Starter (4 mat.)/Mes', value: 790000 }
        ],
        features: ['Todo de Showroom Starter', 'Producción de contenido mensual', '2 horas de estudio incluidas', 'Post dedicado en redes Avenue'],
        highlight: false,
        isPro: false
      },
      {
        id: 'showroom-pro',
        name: 'Showroom Pro+',
        description: 'Máxima presencia + Contenido premium',
        price: 7800000,
        totalValue: 11340000,
        savings: 3540000,
        savingsPercent: 31,
        breakdown: [
          { item: '2 Percheros en Showroom', value: 3400000 },
          { item: 'Producción 8 Reels/Mes', value: 3600000 },
          { item: '4 Posteos dedicados en redes Avenue/mes', value: 400000 },
          { item: 'Producción de 30 fotos estudio/Mes', value: 1500000 },
          { item: '4 horas de estudio/mes', value: 450000 },
          { item: '1 Campaña UGC Standard (12 mat.)/Mes', value: 1990000 }
        ],
        features: ['2 Percheros en Showroom', '8 Reels producidos por mes', '30 fotos de estudio mensuales', '4 horas de estudio incluidas', 'Campaña UGC Standard con 12 materiales', '4 posteos en redes de Avenue'],
        highlight: true,
        isPro: true
      }
    ]
  },
  exhibidores: {
    label: 'Exhibidores',
    description: 'Joyas, accesorios, cosmética, perfumería, calzados',
    icon: Package,
    plans: [
      {
        id: 'showroom-starter',
        name: 'Showroom Starter',
        description: 'Presencia física + UGC',
        price: 1300000,
        totalValue: 2090000,
        savings: 790000,
        savingsPercent: 38,
        breakdown: [
          { item: '1 Exhibidor en Showroom', value: 1300000 },
          { item: '1 Campaña UGC Starter (4 mat.)/Mes', value: 790000 }
        ],
        features: ['1 Exhibidor en Avenue Showroom', 'Ubicación premium en Asunción', 'Campaña UGC mensual con 4 materiales', 'Equipo de venta dedicado'],
        highlight: false,
        isPro: false
      },
      {
        id: 'showroom-standard',
        name: 'Showroom Standard',
        description: 'Presencia + Contenido + UGC',
        price: 1800000,
        totalValue: 2840000,
        savings: 1040000,
        savingsPercent: 37,
        breakdown: [
          { item: '1 Exhibidor en Showroom', value: 1300000 },
          { item: 'Producción + post dedicado/mes', value: 500000 },
          { item: '2 horas de estudio/mes', value: 250000 },
          { item: '1 Campaña UGC Starter (4 mat.)/Mes', value: 790000 }
        ],
        features: ['Todo de Showroom Starter', 'Producción de contenido mensual', '2 horas de estudio incluidas', 'Post dedicado en redes Avenue'],
        highlight: false,
        isPro: false
      },
      {
        id: 'showroom-pro',
        name: 'Showroom Pro+',
        description: 'Máxima presencia + Contenido premium',
        price: 7000000,
        totalValue: 10540000,
        savings: 3540000,
        savingsPercent: 34,
        breakdown: [
          { item: '2 Exhibidores en Showroom', value: 2600000 },
          { item: 'Producción 8 Reels/Mes', value: 3600000 },
          { item: '4 Posteos dedicados en redes Avenue/mes', value: 400000 },
          { item: 'Producción de 30 fotos estudio/Mes', value: 1500000 },
          { item: '4 horas de estudio/mes', value: 450000 },
          { item: '1 Campaña UGC Standard (12 mat.)/Mes', value: 1990000 }
        ],
        features: ['2 Exhibidores en Showroom', '8 Reels producidos por mes', '30 fotos de estudio mensuales', '4 horas de estudio incluidas', 'Campaña UGC Standard con 12 materiales', '4 posteos en redes de Avenue'],
        highlight: true,
        isPro: true
      }
    ]
  }
};

// Included in ALL plans
const INCLUDED_IN_ALL = [
  { icon: Users, text: 'Equipo de venta dedicado' },
  { icon: ClipboardList, text: 'Gestión de inventario' },
  { icon: Truck, text: 'Delivery incluido' },
  { icon: FileText, text: 'Reportes de ventas mensuales' }
];

// Ecosystem
const ECOSYSTEM = [
  {
    title: 'Avenue Online',
    description: 'E-commerce premium con tu propia página de marca. Vendé 24/7 con pasarela de pagos integrada y llegá a clientes de todo el país.',
    image: ECOMMERCE_IMAGE
  },
  {
    title: 'Avenue Studio',
    description: 'Producción de contenido profesional para tu marca. Sesiones fotográficas, videos y campañas UGC con creadores verificados.',
    image: STUDIO_IMAGE
  },
  {
    title: 'Avenue Showroom',
    description: 'Espacio físico premium en Asunción. Tu marca presente donde están tus clientes, con atención personalizada y experiencia de compra única.',
    image: SHOWROOM_IMAGE
  }
];

// Why Avenue
const WHY_AVENUE = [
  {
    icon: Handshake,
    title: 'Socio estratégico, no proveedor',
    description: 'Nos involucramos en tu crecimiento. Tu éxito es nuestro éxito.'
  },
  {
    icon: Globe,
    title: 'Ecosistema integrado',
    description: 'Online + físico + contenido. Todo conectado para maximizar tu visibilidad.'
  },
  {
    icon: Users,
    title: 'Audiencia premium',
    description: 'Accedé a una base de clientes ya construida que busca marcas como la tuya.'
  },
  {
    icon: TrendingUp,
    title: 'Resultados medibles',
    description: 'Reportes mensuales de ventas, tráfico y performance de tu marca.'
  }
];

// Alliance benefits
const ALLIANCE_BENEFITS = [
  { icon: Users, title: 'Equipo de venta', description: 'Personal capacitado que conoce tu marca y productos' },
  { icon: ClipboardList, title: 'Gestión de inventario', description: 'Control de stock y reposición coordinada' },
  { icon: Truck, title: 'Logística y delivery', description: 'Envíos a todo el país gestionados por Avenue' },
  { icon: FileText, title: 'Reportes mensuales', description: 'Información detallada de ventas y tendencias' },
  { icon: Camera, title: 'Contenido profesional', description: 'Fotos y videos de tus productos (según plan)' },
  { icon: MessageSquare, title: 'Marketing incluido', description: 'Promoción en nuestras redes y canales' }
];

// Process steps
const PROCESS_STEPS = [
  { step: '01', title: 'Conversamos', description: 'Entendemos tu marca, productos y objetivos' },
  { step: '02', title: 'Diseñamos', description: 'Creamos un plan a medida para vos' },
  { step: '03', title: 'Ejecutamos', description: 'Nos encargamos de todo: ventas, logística, contenido' },
  { step: '04', title: 'Medimos', description: 'Analizamos resultados y optimizamos' }
];

export const TuMarca = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
  const [productType, setProductType] = useState('percheros');
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

  const API_URL = getApiUrl();
  const currentPricing = PRICING[productType];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price);
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
              <p className="text-gray-400 mb-8">Gracias por tu interés en ser parte de Avenue</p>
              <p className="text-gray-500 text-sm mb-8">Nuestro equipo se pondrá en contacto contigo pronto.</p>
              <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors">
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
      <Navbar user={user} onLoginClick={onLoginClick} onLogout={onLogout} language={language} setLanguage={setLanguage} t={t} />

      {/* ============== HERO ============== */}
      <section className="relative min-h-[60vh] flex items-center pt-16">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Avenue Showroom" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
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
            
            <a href="#planes" className="inline-flex items-center gap-3 px-6 py-3 bg-[#d4a968] text-black text-sm font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300 rounded-lg" data-testid="hero-cta">
              <span>Ver planes</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ============== PLANES Y TARIFAS ============== */}
      <section id="planes" className="py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Planes y Tarifas</span>
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
                    productType === 'exhibidores' ? 'bg-[#d4a968] text-black' : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="toggle-exhibidores"
                >
                  <Package className="w-4 h-4" />
                  <span>Exhibidores</span>
                </button>
                <button
                  onClick={() => setProductType('percheros')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                    productType === 'percheros' ? 'bg-[#d4a968] text-black' : 'text-white/60 hover:text-white'
                  }`}
                  data-testid="toggle-percheros"
                >
                  <Store className="w-4 h-4" />
                  <span>Percheros</span>
                </button>
              </div>
              <p className="text-white/30 text-[10px] mt-2">{currentPricing.description}</p>
            </div>
          </div>

          {/* Plans Grid - Centered for 3 plans */}
          <div className="flex justify-center mb-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {currentPricing.plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative flex flex-col p-5 rounded-xl transition-all ${
                    plan.isPro
                      ? 'lava-lamp-card' 
                      : plan.highlight 
                        ? 'bg-gradient-to-b from-[#d4a968]/10 to-[#121212] border-2 border-[#d4a968] shadow-lg shadow-[#d4a968]/10' 
                        : 'bg-[#121212] border border-white/5 hover:border-white/20'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  {plan.isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="lava-lamp-badge text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        ⭐ Pro+
                      </span>
                    </div>
                  )}
                  {plan.highlight && !plan.isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#d4a968] text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        ⭐ Recomendado
                      </span>
                    </div>
                  )}

                {/* Plan Header */}
                <div className="mb-3 mt-2">
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="text-white/50 text-xs mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-white">{formatPrice(plan.price)}</span>
                    <span className="text-white/40 text-xs">Gs/mes</span>
                  </div>
                  
                  {/* Savings Badge */}
                  {plan.savings > 0 && (
                    <div className="mt-2">
                      <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-500/40 px-3 py-1.5 rounded-full">
                        <Sparkles className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-bold text-green-400">
                          Ahorrás {plan.savingsPercent}%
                        </span>
                      </div>
                      <p className="text-green-400/70 text-xs mt-1">
                        {formatPrice(plan.savings)} Gs de ahorro
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                {plan.breakdown && (
                  <div className="mb-3 p-3 bg-black/30 rounded-lg border border-white/5">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Desglose:</p>
                    <ul className="space-y-1">
                      {plan.breakdown.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-[11px]">
                          <span className="text-white/50">{item.item}</span>
                          <span className="text-white/70">{formatPrice(item.value)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between text-xs border-t border-white/10 pt-1 mt-1">
                        <span className="text-white/70 font-medium">Valor total</span>
                        <span className="text-white/70 line-through">{formatPrice(plan.totalValue)}</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Features */}
                <div className="flex-1 mb-4">
                  <ul className="space-y-1.5">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 text-xs text-white/60">
                        <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.isPro ? 'text-pink-400' : 'text-[#d4a968]'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full py-2.5 text-xs font-medium uppercase tracking-wider transition-all rounded-lg ${
                    plan.isPro
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
                      : plan.highlight
                        ? 'bg-[#d4a968] text-black hover:bg-[#e8c891]'
                        : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  Elegir plan
                </button>
              </div>
            ))}
          </div>

          {/* Included in ALL plans */}
          <div className="bg-[#121212] rounded-xl border border-white/5 p-5 mb-6">
            <p className="text-center text-white/40 text-xs uppercase tracking-wider mb-4">Incluido en todos los planes</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INCLUDED_IN_ALL.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#d4a968]" />
                  </div>
                  <span className="text-white/70 text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commercial Policy */}
          <div className="bg-[#0d0d0d] rounded-xl border border-white/5 p-5">
            <p className="text-center text-white/40 text-xs uppercase tracking-wider mb-4">Política Comercial</p>
            <div className="grid md:grid-cols-2 gap-4 text-xs text-white/60">
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                <p><span className="text-white/80">Markup del 10%:</span> La marca define el precio de venta y Avenue aplica un markup del 10% (con redondeo en 10.000) para cobertura de gastos de POS y activación de alianzas bancarias.</p>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                <p><span className="text-white/80">Contratos:</span> A partir de 3 meses con garantía. El pago del servicio se realiza por mes adelantado.</p>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                <p><span className="text-white/80">Liquidación:</span> Los pagos por las ventas realizadas se liquidan mensualmente.</p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                <p><span className="text-white/80">Garantía:</span> Tu inventario está protegido y asegurado mientras esté en nuestras instalaciones.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== MARCAS QUE CONFÍAN ============== */}
      <section className="py-12 border-y border-white/5 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Nuestros Aliados</span>
            <h3 className="text-xl md:text-2xl font-light text-white">
              Marcas que <span className="italic text-[#d4a968]">confían</span> en Avenue
            </h3>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {BRANDS_LOGOS.map((brand, index) => {
              let maxHeight = '45px';
              if (brand.name === 'Fila') maxHeight = '20px';
              else if (brand.name === 'UGG') maxHeight = '25px';
              else if (brand.name === 'OKI') maxHeight = '110px';
              else if (brand.name === 'Skyline') maxHeight = '110px';
              else if (brand.name === 'Serotonina') maxHeight = '59px';
              else if (brand.name === 'Laese') maxHeight = '32px';
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 group"
                  style={{ height: '70px' }}
                >
                  <img 
                    src={brand.url}
                    alt={brand.name}
                    className="w-full h-auto object-contain transition-all duration-300"
                    style={{
                      maxHeight: maxHeight,
                      maxWidth: '100%',
                      filter: 'brightness(0) invert(1) opacity(0.5)'
                    }}
                    onMouseEnter={(e) => e.target.style.filter = 'brightness(0) invert(1) opacity(1)'}
                    onMouseLeave={(e) => e.target.style.filter = 'brightness(0) invert(1) opacity(0.5)'}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== ECOSISTEMA AVENUE ============== */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Nuestro Ecosistema</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Todo lo que tu marca <span className="italic text-[#d4a968]">necesita</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Tres pilares integrados para maximizar tu visibilidad y ventas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {ECOSYSTEM.map((item, idx) => (
              <div key={idx} className="group rounded-xl overflow-hidden bg-[#121212] border border-white/5 hover:border-white/10 transition-all">
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== ¿POR QUÉ AVENUE? ============== */}
      <section className="py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Propuesta de Valor</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              ¿Por qué <span className="italic text-[#d4a968]">Avenue</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_AVENUE.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-[#121212] border border-white/5 hover:border-[#d4a968]/30 transition-all">
                <div className="w-12 h-12 rounded-lg bg-[#d4a968]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-[#d4a968]" />
                </div>
                <h3 className="text-white font-medium mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== LO QUE INCLUYE TU ALIANZA ============== */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Beneficios</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Lo que incluye tu <span className="italic text-[#d4a968]">alianza</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Más que un espacio de venta, una asociación estratégica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALLIANCE_BENEFITS.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-5 rounded-xl bg-[#121212] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">{item.title}</h4>
                  <p className="text-white/50 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CÓMO FUNCIONA ============== */}
      <section className="py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Proceso</span>
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
      <section id="contact-form" className="py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">Contacto</span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Hablemos de tu <span className="italic text-[#d4a968]">marca</span>
            </h2>
            <p className="text-white/50 text-sm">Completá el formulario y nuestro equipo se pondrá en contacto</p>
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
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs mb-2 text-white/40">Nombre de la Marca *</label>
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
                    <label className="block text-xs mb-2 text-white/40">Nombre de Contacto *</label>
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
                    <label className="block text-xs mb-2 text-white/40">Email *</label>
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
                    <label className="block text-xs mb-2 text-white/40">Teléfono</label>
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
                    <label className="block text-xs mb-2 text-white/40">Tipo de producto *</label>
                    <select
                      required
                      value={formData.product_type || productType}
                      onChange={(e) => {
                        updateField('product_type', e.target.value);
                        setProductType(e.target.value);
                      }}
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-[#d4a968] focus:outline-none transition-colors"
                    >
                      <option value="exhibidores" className="bg-[#1a1a1a]">Exhibidores (joyas, accesorios...)</option>
                      <option value="percheros" className="bg-[#1a1a1a]">Percheros (ropa, indumentaria)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-2 text-white/40">Plan de interés *</label>
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
                      <option value="showroom-pro" className="bg-[#1a1a1a]">Showroom + Online PRO ⭐</option>
                      <option value="consulta" className="bg-[#1a1a1a]">Quiero que me asesoren</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-2 text-white/40">Mensaje (opcional)</label>
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
      <section className="py-16 px-6 bg-[#0d0d0d]">
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
