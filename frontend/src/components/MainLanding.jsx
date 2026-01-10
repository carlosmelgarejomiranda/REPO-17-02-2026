import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Camera, Users, ShoppingBag, Store, Sparkles
} from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

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
      <section className="relative min-h-[70vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/30246902/pexels-photo-30246902.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Avenue"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#d4a968]/30 bg-[#d4a968]/10 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#d4a968]" />
            <span className="text-[10px] font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Posicionamiento & Visibilidad
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Donde las marcas <span className="italic text-[#d4a968]">brillan</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            Estrategia de contenido, plataforma comercial y estudio creativo. 
            Todo en un solo lugar.
          </p>

          {/* Single CTA */}
          <Link
            to="/tu-marca"
            className="inline-flex items-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all"
            data-testid="hero-cta"
          >
            Potenciá tu marca
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============== THREE OPTIONS - IMMEDIATE ACCESS ============== */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-light text-white">
              ¿Qué estás <span className="italic text-[#d4a968]">buscando</span>?
            </h2>
          </div>

          {/* Three Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Card 1: E-commerce */}
            <Link 
              to="/shop"
              className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
              data-testid="card-ecommerce"
            >
              <img 
                src="https://images.unsplash.com/photo-1730749221242-e89b03900805?w=600&q=80"
                alt="Avenue Online"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h3 className="text-lg font-light text-white mb-1">
                  Avenue <span className="italic text-[#d4a968]">Online</span>
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  Tienda online con las mejores marcas
                </p>
                <span className="flex items-center gap-1.5 text-[#d4a968] text-xs font-medium group-hover:gap-2 transition-all">
                  Comprar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Card 2: Studio */}
            <Link 
              to="/studio"
              className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
              data-testid="card-studio"
            >
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/idzlm38w_imagen%20studio.jpg"
                alt="Avenue Studio"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h3 className="text-lg font-light text-white mb-1">
                  Avenue <span className="italic text-[#d4a968]">Studio</span>
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  Estudio creativo & Plataforma UGC
                </p>
                <span className="flex items-center gap-1.5 text-[#d4a968] text-xs font-medium group-hover:gap-2 transition-all">
                  Explorar <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Card 3: For Brands */}
            <Link 
              to="/tu-marca"
              className="group relative overflow-hidden rounded-lg aspect-[4/3] cursor-pointer"
              data-testid="card-brands"
            >
              <img 
                src="https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=600&q=80"
                alt="Tu Marca en Avenue"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Store className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h3 className="text-lg font-light text-white mb-1">
                  Tu marca en <span className="italic text-[#d4a968]">Avenue</span>
                </h3>
                <p className="text-white/60 text-xs mb-3">
                  Planes y servicios para marcas
                </p>
                <span className="flex items-center gap-1.5 text-[#d4a968] text-xs font-medium group-hover:gap-2 transition-all">
                  Ver planes <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============== ABOUT AVENUE - COMPACT ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1764593605393-e7c44d74b677?w=800&q=80"
                alt="Avenue"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right - Text */}
            <div>
              <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium">
                Quiénes somos
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mt-3 mb-4 leading-tight">
                Agencia de <span className="italic text-[#d4a968]">posicionamiento</span> con plataforma comercial
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Ayudamos a marcas a construir visibilidad a través de contenido estratégico, 
                producción profesional y acceso a una plataforma comercial real con showroom 
                físico y tienda online.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Camera className="w-5 h-5 text-[#d4a968] mx-auto mb-2" />
                  <span className="text-white/70 text-[11px]">Estudio</span>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Users className="w-5 h-5 text-[#d4a968] mx-auto mb-2" />
                  <span className="text-white/70 text-[11px]">UGC</span>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Store className="w-5 h-5 text-[#d4a968] mx-auto mb-2" />
                  <span className="text-white/70 text-[11px]">Showroom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============== SERVICES PREVIEW - COMPACT ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-light text-white">
              Servicios <span className="italic text-[#d4a968]">destacados</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Service 1: UGC */}
            <Link 
              to="/ugc"
              className="group p-5 bg-[#121212] border border-white/5 rounded-lg hover:border-[#d4a968]/30 transition-all"
              data-testid="service-ugc"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white mb-1">Plataforma UGC</h3>
                  <p className="text-white/50 text-xs mb-2">
                    Conectamos marcas con creadores de contenido verificados. 
                    Gestionamos todo el proceso.
                  </p>
                  <span className="text-[#d4a968] text-xs group-hover:underline">
                    Conocer más →
                  </span>
                </div>
              </div>
            </Link>

            {/* Service 2: Studio */}
            <Link 
              to="/studio/reservar"
              className="group p-5 bg-[#121212] border border-white/5 rounded-lg hover:border-[#d4a968]/30 transition-all"
              data-testid="service-studio"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white mb-1">Alquiler de Estudio</h3>
                  <p className="text-white/50 text-xs mb-2">
                    Espacio equipado con fondo infinito, iluminación profesional 
                    y ubicación premium.
                  </p>
                  <span className="text-[#d4a968] text-xs group-hover:underline">
                    Reservar →
                  </span>
                </div>
              </div>
            </Link>

            {/* Service 3: E-commerce */}
            <Link 
              to="/shop"
              className="group p-5 bg-[#121212] border border-white/5 rounded-lg hover:border-[#d4a968]/30 transition-all"
              data-testid="service-ecommerce"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white mb-1">Tienda Online</h3>
                  <p className="text-white/50 text-xs mb-2">
                    E-commerce multimarca con gestión de inventario, 
                    logística y sistema de ventas.
                  </p>
                  <span className="text-[#d4a968] text-xs group-hover:underline">
                    Ver tienda →
                  </span>
                </div>
              </div>
            </Link>

            {/* Service 4: Showroom */}
            <Link 
              to="/tu-marca"
              className="group p-5 bg-[#121212] border border-white/5 rounded-lg hover:border-[#d4a968]/30 transition-all"
              data-testid="service-showroom"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-white mb-1">Centro de Experiencias</h3>
                  <p className="text-white/50 text-xs mb-2">
                    Showroom físico en ubicación premium para que tus 
                    clientes experimenten tu marca.
                  </p>
                  <span className="text-[#d4a968] text-xs group-hover:underline">
                    Ver planes →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL - COMPACT ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            ¿Listo para <span className="italic text-[#d4a968]">brillar</span>?
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            Descubrí cómo Avenue puede potenciar el posicionamiento de tu marca.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/tu-marca"
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all"
              data-testid="cta-plans"
            >
              Ver planes
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

export default MainLanding;
