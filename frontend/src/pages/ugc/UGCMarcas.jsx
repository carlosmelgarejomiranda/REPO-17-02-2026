import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Building2, Users, BarChart3, CheckCircle, Sparkles,
  FileCheck, Clock, Shield, Package, Calculator, Check, Star
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

const UGCMarcas = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [packages, setPackages] = useState([]);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    duration_months: 6,
    deliveries_per_month: 16
  });
  const [enterpriseQuote, setEnterpriseQuote] = useState(null);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/pricing`);
      const data = await res.json();
      setPackages(data.packages.filter(p => p.type !== 'enterprise'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchEnterpriseQuote = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/enterprise/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enterpriseForm)
      });
      const data = await res.json();
      setEnterpriseQuote(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showEnterprise) {
      fetchEnterpriseQuote();
    }
  }, [enterpriseForm, showEnterprise]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const benefits = [
    {
      icon: Users,
      title: 'Creadores Verificados',
      desc: 'Red de +50 creadores con métricas y reputación pública'
    },
    {
      icon: FileCheck,
      title: 'Gestión End-to-End',
      desc: 'Desde la publicación hasta las métricas, todo en un solo lugar'
    },
    {
      icon: BarChart3,
      title: 'Métricas Reales',
      desc: 'Reportes de performance con views, reach e interacciones'
    },
    {
      icon: Clock,
      title: 'Control de Entregas',
      desc: 'SLAs definidos, tracking de puntualidad y 2 rondas de revisión'
    },
    {
      icon: Shield,
      title: 'Cumplimiento Garantizado',
      desc: 'Verificamos tags, menciones y requisitos mínimos'
    },
    {
      icon: Sparkles,
      title: 'Contenido Auténtico',
      desc: 'UGC real que conecta con tu audiencia'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4a968]/20 via-black to-black" />
        
        <div className="relative max-w-5xl mx-auto">
          <Link to="/studio/ugc" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Volver a UGC
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#d4a968] rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-black" />
            </div>
            <p className="text-[#d4a968] text-sm font-medium tracking-[0.2em] uppercase">Para Marcas</p>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
            Lanzá campañas UGC<br />
            <span className="italic text-[#d4a968]">sin fricción</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
            Publicá tu campaña, recibí postulaciones de creadores verificados, 
            gestioná entregas y obtené métricas. Todo desde una plataforma.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link 
              to="/ugc/brand/onboarding"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-all"
            >
              Registrar mi marca
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#paquetes"
              className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-lg hover:border-[#d4a968] hover:text-[#d4a968] transition-all"
            >
              Ver paquetes
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-4">
            ¿Por qué elegir <span className="italic text-[#d4a968]">Avenue UGC</span>?
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            No somos una agencia. Somos una plataforma que te da control total sobre tus campañas.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-12 h-12 bg-[#d4a968]/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#d4a968]" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-16">
            Cómo <span className="italic text-[#d4a968]">funciona</span>
          </h2>

          <div className="space-y-6">
            {[
              { num: '01', title: 'Comprá tu paquete', desc: 'Elegí la cantidad de entregas que necesitás' },
              { num: '02', title: 'Creá tu campaña', desc: 'Definí el canje, requisitos de contenido y plazos' },
              { num: '03', title: 'Recibí postulaciones', desc: 'Creadores verificados aplican a tu campaña' },
              { num: '04', title: 'Seleccioná perfiles', desc: 'Revisá métricas, rating y portfolio de cada creador' },
              { num: '05', title: 'Gestioná entregas', desc: '2 rondas de revisión para asegurar cumplimiento' },
              { num: '06', title: 'Recibí métricas', desc: 'Reporte final con views, reach e interacciones' }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start p-6 bg-white/5 rounded-xl">
                <span className="text-3xl font-light text-[#d4a968]">{step.num}</span>
                <div>
                  <h3 className="text-lg font-medium mb-1">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="paquetes" className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          {/* Promo Banner */}
          <div className="mb-12 p-4 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl text-center">
            <Sparkles className="w-5 h-5 text-[#d4a968] inline mr-2" />
            <span className="text-[#d4a968] font-medium">¡Promoción de Lanzamiento!</span>
            <span className="text-gray-400 ml-2">Precios especiales por tiempo limitado</span>
          </div>

          <h2 className="text-3xl font-light text-center mb-4">
            Elegí tu <span className="italic text-[#d4a968]">paquete</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Cada paquete incluye entregas de contenido UGC con proceso de revisión y métricas.
          </p>

          {/* Packages Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {packages.map((pkg) => {
              const isPopular = pkg.type === 'standard';
              const hasPromo = pkg.promo_price;
              
              return (
                <div
                  key={pkg.type}
                  className={`relative p-8 rounded-2xl border-2 transition-all ${
                    isPopular
                      ? 'border-[#d4a968]/50 bg-[#d4a968]/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#d4a968] text-black text-xs font-medium px-3 py-1 rounded-full">
                        MÁS POPULAR
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-medium mb-2">{pkg.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>

                  <div className="mb-6">
                    <span className="text-5xl font-light text-[#d4a968]">{pkg.deliveries}</span>
                    <span className="text-gray-400 ml-2">entregas</span>
                  </div>

                  <div className="mb-6">
                    {hasPromo ? (
                      <>
                        <span className="text-gray-500 line-through text-lg">
                          {formatPrice(pkg.price)}
                        </span>
                        <div className="text-3xl font-medium text-white">
                          {formatPrice(pkg.promo_price)}
                        </div>
                        <span className="text-[#d4a968] text-sm">
                          Ahorro: {formatPrice(pkg.price - pkg.promo_price)}
                        </span>
                      </>
                    ) : (
                      <div className="text-3xl font-medium text-white">
                        {formatPrice(pkg.price)}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-[#d4a968] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/ugc/brand/onboarding"
                    className={`block text-center py-3 rounded-lg font-medium transition-all ${
                      isPopular
                        ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Seleccionar
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Enterprise */}
          <div className="border-t border-white/10 pt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-light mb-2">
                ¿Necesitás más <span className="text-[#d4a968] italic">volumen</span>?
              </h3>
              <p className="text-gray-400">Armá tu paquete Enterprise a medida</p>
            </div>

            {!showEnterprise ? (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowEnterprise(true)}
                  className="flex items-center gap-2 px-6 py-3 border border-[#d4a968]/50 rounded-lg text-[#d4a968] hover:bg-[#d4a968]/10 transition-all"
                >
                  <Calculator className="w-5 h-5" />
                  Calcular cotización
                </button>
              </div>
            ) : (
              <div className="max-w-xl mx-auto p-8 bg-white/5 border border-white/10 rounded-2xl">
                <h4 className="text-xl font-medium mb-6 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#d4a968]" />
                  Cotizador Enterprise
                </h4>

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Duración del contrato</label>
                    <select
                      value={enterpriseForm.duration_months}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, duration_months: parseInt(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                    >
                      {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>{m} meses</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Entregas por mes</label>
                    <select
                      value={enterpriseForm.deliveries_per_month}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, deliveries_per_month: parseInt(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                    >
                      <option value={16}>16 entregas/mes</option>
                      <option value={24}>24 entregas/mes</option>
                      <option value={30}>30 entregas/mes</option>
                    </select>
                  </div>
                </div>

                {enterpriseQuote && (
                  <div className="p-6 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-400">Total entregas:</span>
                        <span className="text-white ml-2 font-medium">{enterpriseQuote.total_deliveries}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Precio/entrega:</span>
                        <span className="text-white ml-2">{formatPrice(enterpriseQuote.price_per_delivery)}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#d4a968]/30 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Valor total:</span>
                        <span className="text-2xl font-medium text-white">{formatPrice(enterpriseQuote.total_price)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Cuota mensual:</span>
                        <span className="text-[#d4a968] font-medium">{formatPrice(enterpriseQuote.monthly_payment)}/mes</span>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  to="/ugc/brand/onboarding"
                  className="block text-center py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-all"
                >
                  Solicitar Enterprise
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-6">
            ¿Listo para <span className="italic text-[#d4a968]">empezar</span>?
          </h2>
          <p className="text-gray-400 mb-10">
            Registrá tu marca y lanzá tu primera campaña UGC
          </p>
          
          <Link 
            to="/ugc/brand/onboarding"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-all"
          >
            Registrar mi marca
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default UGCMarcas;
