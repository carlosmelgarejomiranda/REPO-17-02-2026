import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Sparkles, Users, Building2, Check, Heart, 
  TrendingUp, MessageCircle, Shield, Package, BarChart3, Zap
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const UGCLanding = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
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
      <section className="relative min-h-[60vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://customer-assets.emergentagent.com/job_one-account/artifacts/tk0opl7n_influencer%20ugc%201.webp"
            alt="UGC Creator"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#d4a968]/30 bg-[#d4a968]/10 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#d4a968]" />
            <span className="text-[10px] font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Plataforma UGC
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Contenido <span className="italic text-[#d4a968]">auténtico</span><br className="hidden sm:block" /> que conecta
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            La plataforma que une marcas con creadores de contenido. 
            UGC que genera confianza y convierte.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/ugc/creators"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
              data-testid="hero-cta-creator"
            >
              <Users className="w-4 h-4" />
              Soy Creador
            </Link>
            <Link
              to="/ugc/marcas"
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
              data-testid="hero-cta-brand"
            >
              <Building2 className="w-4 h-4" />
              Soy Marca
            </Link>
          </div>
        </div>
      </section>

      {/* ============== TWO CARDS - FOR WHO ============== */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card: Creators */}
            <div className="p-6 md:p-8 rounded-lg bg-[#121212] border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-1">
                    Para <span className="italic text-purple-400">Creadores</span>
                  </h3>
                  <p className="text-white/50 text-sm">Oportunidades reales con marcas</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Colaborá con marcas reales',
                  'Construí tu track record público',
                  'Obtené beneficios por canjes',
                  'Crecé tu marca personal',
                  'Acceso a campañas exclusivas'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/ugc/creators"
                className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium hover:gap-3 transition-all"
              >
                Quiero ser creator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Card: Brands */}
            <div className="p-6 md:p-8 rounded-lg bg-[#121212] border border-white/5 hover:border-[#d4a968]/30 transition-all group">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-[#d4a968]" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-1">
                    Para <span className="italic text-[#d4a968]">Marcas</span>
                  </h3>
                  <p className="text-white/50 text-sm">Contenido que convierte</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Contenido auténtico que conecta',
                  'Red de +50 creadores verificados',
                  'Gestión completa de campañas',
                  'Métricas y reportes detallados',
                  'Contenido por canjes o pago'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-[#d4a968] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/ugc/marcas"
                className="inline-flex items-center gap-2 text-[#d4a968] text-sm font-medium hover:gap-3 transition-all"
              >
                Quiero contenido UGC <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== WHY UGC? ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              El poder del contenido real
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              ¿Por qué <span className="italic text-[#d4a968]">UGC</span>?
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              El contenido promocional tradicional ya no conecta. 
              Los consumidores quieren ver experiencias reales.
            </p>
          </div>

          {/* 4 Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Heart,
                title: 'Autenticidad',
                desc: 'Contenido orgánico que refleja experiencias reales, no guiones promocionales.'
              },
              {
                icon: Shield,
                title: 'Confianza',
                desc: 'Cuando la gente ve personas reales usando un producto, confía más en la marca.'
              },
              {
                icon: TrendingUp,
                title: 'Alcance',
                desc: 'El UGC se comparte naturalmente, amplificando el reach más allá de tus seguidores.'
              },
              {
                icon: MessageCircle,
                title: 'Engagement',
                desc: 'La audiencia interactúa más con contenido con el que se puede identificar.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-[#121212] rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h4 className="text-white font-medium mb-2">{item.title}</h4>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WE HANDLE EVERYTHING ============== */}
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
                Diferencial Avenue
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Nosotros nos <span className="italic text-[#d4a968]">encargamos</span> de todo
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                No solo conectamos marcas con creadores. Gestionamos cada detalle 
                del proceso para que vos te enfoques en lo que importa.
              </p>

              <ul className="space-y-4 mb-6">
                {[
                  { icon: Users, text: 'Coordinación marca-creador' },
                  { icon: Package, text: 'Logística de productos' },
                  { icon: Zap, text: 'Recopilación de contenidos' },
                  { icon: BarChart3, text: 'Métricas verificadas' },
                  { icon: Shield, text: 'Control de calidad' }
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

      {/* ============== CTA FINAL ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            Empezá a crear <span className="italic text-[#d4a968]">conexiones reales</span>
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            Ya sea que busques contenido auténtico para tu marca o quieras 
            colaborar con marcas como creador, Avenue UGC es tu plataforma.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={creatorLink}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
              data-testid="cta-creator"
            >
              <Users className="w-4 h-4" />
              {user?.has_creator_profile ? 'Mi Panel Creator' : 'Soy Creador'}
            </Link>
            <Link
              to={brandLink}
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
              data-testid="cta-brand"
            >
              <Building2 className="w-4 h-4" />
              {user?.has_brand_profile ? 'Mi Panel Marca' : 'Soy Marca'}
            </Link>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default UGCLanding;
