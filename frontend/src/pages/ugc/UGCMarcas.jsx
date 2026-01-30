import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../utils/api';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Building2, Users, BarChart3, CheckCircle, Sparkles,
  ArrowLeft, Heart, TrendingUp, MessageCircle, Shield,
  Package, Zap, FileCheck, Check, Star, Eye, Clock, MessageSquare, Truck
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

const API_URL = getApiUrl();

const UGCMarcas = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [packages, setPackages] = useState([]);
  const [promoActive, setPromoActive] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/packages/pricing`);
      const data = await res.json();
      setPackages(data.packages || []);
      setPromoActive(data.promo_active || false);
    } catch (err) {
      console.error(err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const getPricePerMaterial = (pkg) => {
    if (pkg.deliveries === 0) return null;
    const price = pkg.is_promo_active && pkg.promo_price ? pkg.promo_price : pkg.price;
    return Math.round(price / pkg.deliveries);
  };

  // Features that are exclusive to higher tiers (for highlighting)
  const exclusiveFeatures = {
    standard: ['Reporte de métricas de los postulantes'],
    pro: ['Gráficos de distribución demográfica', 'Soporte comercial prioritario'],
    enterprise: ['Personalización de campañas', 'Panel de selección de postulantes', 'Reportes personalizados']
  };

  const isExclusiveFeature = (pkg, feature) => {
    if (pkg.type === 'standard' && exclusiveFeatures.standard.includes(feature)) return true;
    if (pkg.type === 'pro' && exclusiveFeatures.pro.includes(feature)) return true;
    if (pkg.type === 'enterprise' && exclusiveFeatures.enterprise.includes(feature)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* ============== HERO SECTION ============== */}
      <section className="relative min-h-[50vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://customer-assets.emergentagent.com/job_one-account/artifacts/tk0opl7n_influencer%20ugc%201.webp"
            alt="UGC Content"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Back link */}
          <Link 
            to="/ugc" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a UGC
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#d4a968]/30 bg-[#d4a968]/10 px-3 py-1.5 rounded-full mb-6">
            <Building2 className="w-3.5 h-3.5 text-[#d4a968]" />
            <span className="text-[10px] font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Para Marcas
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Contenido de <span className="italic text-[#d4a968]">creadores reales</span><br className="hidden sm:block" /> 
            para tu marca
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            UGC gestionado de principio a fin. Vos ponés el producto, 
            nosotros te entregamos contenido listo para usar.
          </p>

          {/* CTA */}
          <a
            href="#planes"
            className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
            data-testid="hero-cta"
          >
            Ver planes
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ============== PLANES Y PRECIOS ============== */}
      <section id="planes" className="py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Planes UGC
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Elegí según tu <span className="italic text-[#d4a968]">volumen</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto mb-4">
              A mayor volumen, menor costo por material y más funcionalidades incluidas.
            </p>
            {promoActive && (
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">Promoción de lanzamiento</span>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.length === 0 ? (
              <div className="col-span-4 text-center py-8 text-gray-500">
                <p>Cargando planes...</p>
              </div>
            ) : (
              packages.map((pkg, idx) => {
                const pricePerMaterial = getPricePerMaterial(pkg);
                const isPro = pkg.type === 'pro';
                const isEnterprise = pkg.type === 'enterprise';
                
                return (
                  <div 
                    key={pkg.type}
                    className={`relative flex flex-col p-5 rounded-lg transition-all ${
                      isPro
                        ? 'lava-lamp-card-gold'
                        : isEnterprise
                        ? 'lava-lamp-card'
                        : 'bg-[#121212] border border-white/5 hover:border-white/20'
                  }`}
                  data-testid={`plan-${pkg.type}`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="lava-lamp-badge-gold text-black text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Recomendado
                      </span>
                    </div>
                  )}
                  {isEnterprise && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="lava-lamp-badge text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                        Enterprise
                      </span>
                    </div>
                  )}

                  <div className="mb-3">
                    <h3 className="text-lg font-medium text-white">{pkg.name}</h3>
                    <p className="text-white/50 text-xs mt-1">{pkg.description}</p>
                  </div>

                  {/* Materials highlight */}
                  {pkg.deliveries > 0 ? (
                    <div className="mb-3 p-3 bg-[#d4a968]/10 rounded-lg text-center">
                      <span className="text-3xl font-light text-[#d4a968]">{pkg.deliveries}</span>
                      <span className="text-white/60 text-sm ml-2">materiales</span>
                    </div>
                  ) : (
                    <div className="mb-3 p-3 bg-[#d4a968]/10 rounded-lg text-center">
                      <span className="text-base font-light text-[#d4a968]">Volumen personalizado</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {pkg.type !== 'enterprise' ? (
                      <>
                        {pkg.is_promo_active && pkg.promo_price ? (
                          <div>
                            <span className="text-white/40 line-through text-sm">{formatPrice(pkg.price)}</span>
                            <div className="text-xl font-light text-white">{formatPrice(pkg.promo_price)}</div>
                          </div>
                        ) : (
                          <div className="text-xl font-light text-white">{formatPrice(pkg.price)}</div>
                        )}
                        {pricePerMaterial && (
                          <span className="text-[#d4a968] text-xs">{formatPrice(pricePerMaterial)} por material</span>
                        )}
                      </>
                    ) : (
                      <div className="text-lg font-light text-white">Consultar</div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="flex-1 mb-4">
                    <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Incluye:</p>
                    <ul className="space-y-1.5">
                      {pkg.features && pkg.features.map((feature, fidx) => (
                        <li 
                          key={fidx} 
                          className={`flex items-start gap-2 text-xs ${
                            isExclusiveFeature(pkg, feature) 
                              ? 'text-[#d4a968]' 
                              : 'text-white/60'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                            isExclusiveFeature(pkg, feature) 
                              ? 'text-[#d4a968]' 
                              : 'text-white/40'
                          }`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <Link
                    to={pkg.type === 'enterprise' ? '#contacto' : '/ugc/brand/onboarding'}
                    className={`block w-full text-center py-2.5 text-xs font-medium uppercase tracking-wider transition-all rounded-lg mt-auto hover:scale-105 ${
                      isPro
                        ? 'lava-lamp-btn-gold text-black'
                        : isEnterprise
                          ? 'lava-lamp-btn text-white'
                          : 'border border-white/20 text-white hover:bg-white/5'
                    }`}
                  >
                    {pkg.type === 'enterprise' ? 'Contactar' : 'Elegir plan'}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Delivery Note */}
          <div className="mt-8 p-4 bg-[#121212] rounded-lg border border-white/5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-[#d4a968]" />
              </div>
              <div>
                <h4 className="text-white text-sm font-medium mb-1">Tarifas de delivery de productos*</h4>
                <p className="text-white/50 text-xs leading-relaxed">
                  El envío de productos a creadores tiene un costo de <span className="text-white/70">30.000 Gs</span> para entregas en 
                  Asunción y Gran Asunción, y <span className="text-white/70">50.000 Gs</span> para entregas al interior del país.
                </p>
                <p className="text-white/40 text-[10px] mt-2 italic">
                  *Estas tarifas pueden variar para localidades específicas o para objetos grandes o delicados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== ¿QUÉ ES UGC? ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/e9d2076s_bastante-joven-morena-de-pelo-corto-en-vestido-rojo-de-lino-con-cinturon-negro-sonrie-toma-selfie-muestra-el-signo-de-la-paz-y-posa-en-la-oficina-del-disenador-de-moda.jpg"
                alt="UGC Creator"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right - Content */}
            <div>
              <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-4 block">
                ¿Por qué UGC?
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Contenido de <span className="italic text-[#d4a968]">personas reales</span>
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                El UGC es contenido creado por personas reales usando tu producto. 
                Es auténtico, relatable y genera confianza porque no parece publicidad.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: Shield, text: 'Genera confianza: prueba social real' },
                  { icon: TrendingUp, text: 'Amplifica alcance: se comparte naturalmente' },
                  { icon: MessageCircle, text: 'Mejor engagement: la audiencia se identifica' },
                  { icon: Heart, text: 'Construye comunidad: clientes se vuelven embajadores' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-8 h-8 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[#d4a968]" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== NOSOTROS GESTIONAMOS TODO ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Servicio completo
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Nosotros <span className="italic text-[#d4a968]">gestionamos</span> todo
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Vos solo ponés el producto. Nosotros nos encargamos del resto.
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Creás tu campaña', desc: 'Definís producto y requisitos' },
              { step: '02', title: 'Seleccionamos creadores', desc: 'De nuestra red verificada' },
              { step: '03', title: 'Coordinamos todo', desc: 'Envíos, seguimiento, entregas' },
              { step: '04', title: 'Recibís contenido', desc: 'Listo para usar + métricas' }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-[#121212] rounded-lg border border-white/5 text-center">
                <div className="text-[#d4a968]/30 text-3xl font-light mb-3">{item.step}</div>
                <h4 className="text-white font-medium mb-1 text-sm">{item.title}</h4>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section id="contacto" className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            Empezá con tu primera <span className="italic text-[#d4a968]">campaña</span>
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            Elegí un plan, creá tu campaña y empezá a recibir 
            contenido auténtico de creadores reales.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#planes"
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
              data-testid="cta-plans"
            >
              Ver planes
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://wa.me/595971000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all rounded-lg"
              data-testid="cta-contact"
            >
              Contactar
            </a>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default UGCMarcas;
