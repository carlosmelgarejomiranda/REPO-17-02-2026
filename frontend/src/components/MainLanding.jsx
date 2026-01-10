import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Camera, Users, Video, Sparkles, Store, ShoppingBag, 
  Check, Star, TrendingUp, Building2, Play, Zap, Target, BarChart3
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const PLANS = [
  {
    id: 'online-starter',
    name: 'Online Starter',
    description: 'Presencia digital básica',
    price: 'Consultar',
    features: [
      'E-commerce en Avenue Online',
      'Catálogo digital de productos',
      'Gestión de inventario',
      'Soporte de ventas'
    ],
    highlight: false
  },
  {
    id: 'online-showroom-starter',
    name: 'Online + Showroom',
    subtitle: 'Starter',
    description: 'Digital + Espacio físico',
    price: 'Consultar',
    features: [
      'Todo de Online Starter',
      'Exhibidor en showroom físico',
      'Centro de experiencias',
      'Atención personalizada'
    ],
    highlight: false
  },
  {
    id: 'online-pro',
    name: 'Online PRO',
    description: 'Posicionamiento completo',
    price: 'Consultar',
    features: [
      'Todo de Online Starter',
      '2 horas de estudio creativo/mes',
      '4 piezas UGC/mes',
      '1 producción + posteo dedicado'
    ],
    highlight: true,
    badge: 'Popular'
  },
  {
    id: 'online-showroom-pro',
    name: 'Online + Showroom',
    subtitle: 'PRO',
    description: 'La experiencia completa',
    price: 'Consultar',
    features: [
      'Todo de Online + Showroom',
      '2 horas de estudio creativo/mes',
      '4 piezas UGC/mes',
      '1 producción + posteo dedicado'
    ],
    highlight: true,
    badge: 'Más completo'
  }
];

export const MainLanding = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* ============== HERO SECTION ============== */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/30246902/pexels-photo-30246902.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Avenue Studio"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]" />
          {/* Subtle gold glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,169,104,0.08)_0%,transparent_60%)]" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-5xl mx-auto px-6 text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-[#d4a968]/30 bg-[#d4a968]/10 px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-[#d4a968] mr-2" />
            <span className="text-xs font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Agencia de Posicionamiento & Visibilidad
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-[1.05] tracking-tight">
            Tu marca, <span className="italic text-[#d4a968]">visible</span><br />
            en todos los mundos.
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Estrategia digital + Plataforma comercial física. 
            <span className="text-white"> El nuevo estándar para marcas que quieren brillar.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tu-marca"
              className="inline-flex items-center justify-center gap-3 bg-[#d4a968] text-black px-8 py-4 text-sm tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all duration-300"
              data-testid="hero-cta-primary"
            >
              Potenciá tu marca
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-3 border border-white/20 text-white px-8 py-4 text-sm tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all duration-300"
              data-testid="hero-cta-secondary"
            >
              Conocer Avenue Studio
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-white/40 uppercase tracking-widest">Descubrí más</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#d4a968] to-transparent"></div>
        </div>
      </section>

      {/* ============== VALUE PROPOSITION ============== */}
      <section className="py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-[#d4a968]"></div>
                <span className="text-[#d4a968] text-xs tracking-[0.2em] uppercase font-medium">El nuevo enfoque</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6 leading-tight">
                No somos una tienda.<br />
                <span className="italic text-[#d4a968]">Somos tu partner</span> de posicionamiento.
              </h2>
              
              <p className="text-white/60 mb-8 leading-relaxed text-lg">
                Las marcas que tienen buen plan comercial y buena comunicación, les va bien. 
                Las que no, no. Es así de simple. Por eso cambiamos el enfoque: 
                <span className="text-white"> primero posicionamiento, después ventas.</span>
              </p>

              <div className="space-y-4">
                {[
                  { icon: Target, text: 'Estrategia de visibilidad integral' },
                  { icon: Video, text: 'Contenido UGC que conecta con tu audiencia' },
                  { icon: Store, text: 'Plataforma comercial como bonus, no como promesa' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#d4a968]" />
                    </div>
                    <span className="text-white/80">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Visual */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-sm overflow-hidden border border-white/10">
                <img 
                  src="https://images.pexels.com/photos/7676484/pexels-photo-7676484.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Content Creation"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating stat */}
              <div className="absolute -bottom-6 -left-6 bg-[#121212] border border-[#d4a968]/20 p-6 rounded-sm">
                <div className="text-3xl font-light text-[#d4a968] mb-1">+200%</div>
                <div className="text-sm text-white/60">Engagement promedio<br />con contenido UGC</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== AVENUE STUDIO SECTION (BENTO GRID) ============== */}
      <section className="py-24 md:py-32 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-[#d4a968]/30 bg-[#d4a968]/10 px-4 py-2 mb-6">
              <Camera className="w-4 h-4 text-[#d4a968] mr-2" />
              <span className="text-xs font-medium text-[#d4a968] tracking-[0.15em] uppercase">
                El core del negocio
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Avenue <span className="italic text-[#d4a968]">Studio</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              El motor que impulsa el posicionamiento de tu marca. Contenido profesional, 
              creadores verificados y producción de primer nivel.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            {/* Large Card - Studio */}
            <div className="col-span-12 md:col-span-8 md:row-span-2 relative group overflow-hidden rounded-sm">
              <img 
                src="https://images.pexels.com/photos/30246902/pexels-photo-30246902.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Avenue Studio"
                className="w-full h-full min-h-[400px] md:min-h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-[#d4a968]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-2">Estudio Creativo</h3>
                <p className="text-white/70 mb-4 max-w-md">
                  50m² equipados con fondo infinito, iluminación profesional y todo 
                  lo que necesitás para producir contenido de primer nivel.
                </p>
                <Link 
                  to="/studio/reservar"
                  className="inline-flex items-center gap-2 text-[#d4a968] hover:gap-3 transition-all"
                  data-testid="studio-cta"
                >
                  Reservar estudio <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* UGC Card */}
            <div className="col-span-12 md:col-span-4 relative group overflow-hidden rounded-sm bg-[#121212] border border-white/5 hover:border-[#d4a968]/30 transition-colors">
              <div className="p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-full bg-[#d4a968]/10 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-[#d4a968]" />
                </div>
                <h3 className="text-xl font-light text-white mb-2">Plataforma UGC</h3>
                <p className="text-white/60 text-sm mb-6 flex-grow">
                  Conectá tu marca con +50 creadores verificados. 
                  Contenido auténtico que convierte, gestionado de principio a fin.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-[#121212]" />
                    ))}
                  </div>
                  <Link 
                    to="/ugc"
                    className="text-[#d4a968] text-sm hover:underline"
                    data-testid="ugc-cta"
                  >
                    Ver más →
                  </Link>
                </div>
              </div>
            </div>

            {/* Production Card */}
            <div className="col-span-12 md:col-span-4 relative group overflow-hidden rounded-sm bg-gradient-to-br from-[#d4a968] to-[#b8914d]">
              <div className="p-8 h-full flex flex-col">
                <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center mb-6">
                  <Video className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-medium text-black mb-2">Producción de Contenido</h3>
                <p className="text-black/70 text-sm mb-4 flex-grow">
                  Materiales audiovisuales dedicados para tu marca. 
                  Fotografía, video y dirección creativa profesional.
                </p>
                <span className="text-black/60 text-xs uppercase tracking-wider">Próximamente para externos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PLATFORM SECTION (THE DIFFERENTIAL) ============== */}
      <section className="py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-0 items-stretch min-h-[600px]">
            {/* Left - Content */}
            <div className="bg-[#121212] p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
              <div className="inline-flex items-center rounded-full border border-[#d4a968]/30 bg-[#d4a968]/10 px-4 py-2 mb-6 w-fit">
                <Zap className="w-4 h-4 text-[#d4a968] mr-2" />
                <span className="text-xs font-medium text-[#d4a968] tracking-[0.15em] uppercase">
                  El diferencial
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-light text-white mb-6 leading-tight">
                Además, accedés a una <span className="italic text-[#d4a968]">plataforma comercial real</span>
              </h2>

              <p className="text-white/60 mb-8 leading-relaxed">
                No prometemos que las ventas paguen todo. Pero sí te damos acceso a canales 
                de venta reales que pueden ayudar a que tu inversión en posicionamiento se pague sola.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-4 bg-white/5 rounded-sm">
                  <ShoppingBag className="w-6 h-6 text-[#d4a968] mb-3" />
                  <h4 className="text-white font-medium mb-1">E-commerce</h4>
                  <p className="text-white/50 text-sm">Catálogo online + gestión de ventas</p>
                </div>
                <div className="p-4 bg-white/5 rounded-sm">
                  <Building2 className="w-6 h-6 text-[#d4a968] mb-3" />
                  <h4 className="text-white font-medium mb-1">Centro de Experiencias</h4>
                  <p className="text-white/50 text-sm">Showroom en ubicación premium</p>
                </div>
              </div>

              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-[#d4a968] hover:gap-3 transition-all"
                data-testid="platform-cta"
              >
                Ver Avenue Online <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right - Image */}
            <div className="relative overflow-hidden order-1 lg:order-2">
              <img 
                src="https://images.pexels.com/photos/1884579/pexels-photo-1884579.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Avenue Showroom"
                className="w-full h-full min-h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#121212]/50 lg:bg-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ============== PLANS SECTION ============== */}
      <section className="py-24 md:py-32 px-6 bg-[#0a0a0a]" id="planes">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full border border-[#d4a968]/30 bg-[#d4a968]/10 px-4 py-2 mb-6">
              <BarChart3 className="w-4 h-4 text-[#d4a968] mr-2" />
              <span className="text-xs font-medium text-[#d4a968] tracking-[0.15em] uppercase">
                Planes
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Elegí tu <span className="italic text-[#d4a968]">nivel</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Desde presencia digital básica hasta el paquete completo de posicionamiento. 
              Los planes PRO incluyen servicios de Avenue Studio a precios muy competitivos.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-8 rounded-sm transition-all duration-300 ${
                  plan.highlight 
                    ? 'bg-[#121212] border-2 border-[#d4a968]/50 hover:border-[#d4a968]' 
                    : 'bg-[#121212] border border-white/5 hover:border-white/20'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#d4a968] text-black text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  {plan.subtitle && (
                    <span className="text-[#d4a968] text-sm">{plan.subtitle}</span>
                  )}
                  <p className="text-white/50 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-2xl font-light text-white">{plan.price}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                      <Check className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/tu-marca"
                  className={`block w-full text-center py-3 text-sm font-medium transition-all ${
                    plan.highlight
                      ? 'bg-[#d4a968] text-black hover:bg-[#e8c891]'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  Consultar
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <p className="text-center text-white/40 text-sm mt-12">
            Los precios de los servicios de Studio en los planes PRO son significativamente 
            más bajos que si se contratan por separado.
          </p>
        </div>
      </section>

      {/* ============== SOCIAL PROOF ============== */}
      <section className="py-24 md:py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className="w-6 h-6 fill-[#d4a968] text-[#d4a968]" />
            ))}
          </div>
          
          <blockquote className="text-2xl md:text-3xl font-light text-white mb-8 leading-relaxed">
            "Lo que comprás es un servicio de agencia de posicionamiento que te ofrece 
            como diferencial la posibilidad de acceder a una plataforma comercial real. 
            <span className="italic text-[#d4a968]"> Y tu presencia en esta plataforma hasta podría pagarse sola.</span>"
          </blockquote>

          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4a968] to-[#b8914d]" />
            <div className="text-left">
              <div className="text-white font-medium">Avenue Team</div>
              <div className="text-white/50 text-sm">La promesa de valor</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#121212]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-6">
            ¿Listo para <span className="italic text-[#d4a968]">brillar</span>?
          </h2>
          <p className="text-white/60 mb-12 text-lg max-w-2xl mx-auto">
            Descubrí cómo Avenue puede potenciar el posicionamiento de tu marca 
            con estrategia, contenido y una plataforma comercial real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/tu-marca"
              className="inline-flex items-center justify-center gap-3 bg-[#d4a968] text-black px-10 py-5 text-sm tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all duration-300"
              data-testid="final-cta-primary"
            >
              Quiero saber más
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://wa.me/595971000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-white/20 text-white px-10 py-5 text-sm tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all duration-300"
              data-testid="final-cta-whatsapp"
            >
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default MainLanding;
