import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Users, ArrowRight, Sparkles, Video, Building2, Check } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const StudioLanding = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
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
            src="https://customer-assets.emergentagent.com/job_one-account/artifacts/idzlm38w_imagen%20studio.jpg"
            alt="Avenue Studio"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/70 via-[#0a0a0a]/60 to-[#0a0a0a]" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#d4a968]/30 bg-[#d4a968]/10 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#d4a968]" />
            <span className="text-[10px] font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Avenue Studio
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            El motor de tu <span className="italic text-[#d4a968]">posicionamiento</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            Estudio creativo, plataforma UGC y producción de contenido. 
            Todo lo que necesitás para construir visibilidad.
          </p>
        </div>
      </section>

      {/* ============== TWO OPTIONS - IMMEDIATE ACCESS ============== */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Two Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Card 1: UGC Platform */}
            <Link 
              to="/ugc"
              className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
              data-testid="card-ugc"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/tk0opl7n_influencer%20ugc%201.webp"
                alt="Plataforma UGC"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h3 className="text-lg font-light text-white mb-1">
                  Plataforma <span className="italic text-[#d4a968]">UGC</span>
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  Conectamos marcas con creadores de contenido
                </p>
                <span className="flex items-center gap-1.5 text-[#d4a968] text-xs font-medium group-hover:gap-2 transition-all">
                  Explorar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Card 2: Studio Rental */}
            <Link 
              to="/studio/reservar"
              className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
              data-testid="card-studio-rental"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/idzlm38w_imagen%20studio.jpg"
                alt="Alquiler de Estudio"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h3 className="text-lg font-light text-white mb-1">
                  Alquiler de <span className="italic text-[#d4a968]">Estudio</span>
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  Espacio profesional para tus producciones
                </p>
                <span className="flex items-center gap-1.5 text-[#d4a968] text-xs font-medium group-hover:gap-2 transition-all">
                  Reservar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============== UGC PLATFORM DETAIL ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Content */}
            <div>
              <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-4 block">
                Plataforma UGC
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Contenido <span className="italic text-[#d4a968]">auténtico</span><br /> 
                que conecta
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Conectamos marcas con creadores de contenido verificados para generar 
                UGC que realmente convierte. Gestionamos todo el proceso: 
                coordinación, logística, contenidos y métricas.
              </p>

              <ul className="space-y-3 mb-8">
                {[
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

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/ugc/marcas"
                  className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-5 py-2.5 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all"
                  data-testid="ugc-brands-cta"
                >
                  Soy Marca
                </Link>
                <Link
                  to="/ugc/creators"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-5 py-2.5 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all"
                  data-testid="ugc-creators-cta"
                >
                  Soy Creador
                </Link>
              </div>
            </div>

            {/* Right - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/e9d2076s_bastante-joven-morena-de-pelo-corto-en-vestido-rojo-de-lino-con-cinturon-negro-sonrie-toma-selfie-muestra-el-signo-de-la-paz-y-posa-en-la-oficina-del-disenador-de-moda.jpg"
                alt="UGC Creators"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============== STUDIO RENTAL DETAIL ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden order-2 lg:order-1">
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/idzlm38w_imagen%20studio.jpg"
                alt="Avenue Studio"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right - Content */}
            <div className="order-1 lg:order-2">
              <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-4 block">
                Alquiler de Estudio
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Espacio <span className="italic text-[#d4a968]">profesional</span><br /> 
                para crear
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Estudio creativo equipado con todo lo que necesitás para producir 
                contenido de primer nivel. Ubicación premium, fácil acceso y 
                precios competitivos.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Fondo infinito blanco',
                  'Iluminación profesional (softbox, flash)',
                  'Mesa de producción',
                  'Ubicación céntrica y accesible'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-[#d4a968] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                to="/studio/reservar"
                className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-5 py-2.5 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all"
                data-testid="studio-reserve-cta"
              >
                Reservar estudio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== PRODUCTION - COMING SOON ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="p-8 rounded-lg bg-[#121212] border border-white/5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#d4a968]/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-[#d4a968]" />
            </div>
            
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Próximamente
            </span>
            
            <h3 className="text-xl md:text-2xl font-light text-white mb-3">
              Producción de <span className="italic text-[#d4a968]">Contenido</span>
            </h3>
            
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Servicios de producción audiovisual dedicados para tu marca. 
              Fotografía, video y dirección creativa profesional.
            </p>
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            Potenciá tu <span className="italic text-[#d4a968]">visibilidad</span>
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            Descubrí cómo Avenue Studio puede ayudarte a construir 
            el posicionamiento que tu marca necesita.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/tu-marca"
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all"
              data-testid="cta-plans"
            >
              Ver planes completos
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/595971000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all"
              data-testid="cta-whatsapp"
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

export default StudioLanding;
