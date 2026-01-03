import React, { useState, useEffect } from 'react';
import { Camera, Users, ArrowRight, Play, Star, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import useBuilderModifications from '../hooks/useBuilderModifications';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

// Studio images
const STUDIO_IMAGES = {
  hero: 'https://images.pexels.com/photos/35428098/pexels-photo-35428098.jpeg?auto=compress&cs=tinysrgb&w=1920',
  heroSecondary: 'https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?auto=compress&cs=tinysrgb&w=1920',
  rental: 'https://images.unsplash.com/photo-1431068799455-80bae0caf685?w=800&q=80',
  equipment: 'https://images.unsplash.com/photo-1585155802409-ff2950580a9d?w=800&q=80',
  creator1: 'https://images.unsplash.com/photo-1664277497095-424e085175e8?w=800&q=80',
  creator2: 'https://images.unsplash.com/photo-1630797160666-38e8c5ba44c1?w=800&q=80',
  creator3: 'https://images.pexels.com/photos/3576258/pexels-photo-3576258.jpeg?auto=compress&cs=tinysrgb&w=800',
  gallery1: 'https://images.pexels.com/photos/35449796/pexels-photo-35449796.jpeg?auto=compress&cs=tinysrgb&w=600',
  gallery2: 'https://images.pexels.com/photos/35432095/pexels-photo-35432095.jpeg?auto=compress&cs=tinysrgb&w=600',
};

// Gallery images for infinite scroll
const GALLERY_ITEMS = [
  { src: STUDIO_IMAGES.hero, label: 'Sesión Editorial', location: 'Avenue Studio' },
  { src: STUDIO_IMAGES.creator1, label: 'Content Creator', location: 'Asunción, PY' },
  { src: STUDIO_IMAGES.rental, label: 'Producción de Moda', location: 'Avenue Studio' },
  { src: STUDIO_IMAGES.gallery1, label: 'Sesión Corporativa', location: 'Asunción, PY' },
  { src: STUDIO_IMAGES.creator2, label: 'UGC Campaign', location: 'Avenue Studio' },
  { src: STUDIO_IMAGES.equipment, label: 'Setup Profesional', location: 'Avenue Studio' },
  { src: STUDIO_IMAGES.gallery2, label: 'Fashion Shoot', location: 'Asunción, PY' },
  { src: STUDIO_IMAGES.creator3, label: 'Podcast Recording', location: 'Avenue Studio' },
];

// Activity pills
const ACTIVITIES = [
  { name: 'Sesión de fotos', icon: '📸' },
  { name: 'Video', icon: '🎬' },
  { name: 'Podcast', icon: '🎙️' },
  { name: 'E-commerce', icon: '🛍️' },
  { name: 'Retratos', icon: '👤' },
  { name: 'Moda', icon: '👗' },
  { name: 'Producto', icon: '📦' },
  { name: 'Contenido UGC', icon: '✨' },
];

export const StudioLanding = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
  const sl = t?.studioLanding || {};
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  
  // Apply saved modifications from website builder
  useBuilderModifications('studio-landing');

  // Auto-rotate gallery
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % GALLERY_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] overflow-hidden">
      {/* Navbar */}
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* Hero Section - Full Screen with Search */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={STUDIO_IMAGES.hero}
            alt="Avenue Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32 w-full">
          <div className="max-w-2xl">
            {/* Tagline */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-px bg-[#d4a968]"></div>
              <span className="text-[#d4a968] text-sm tracking-[0.2em] uppercase font-medium">
                Avenue Studio
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-[0.95]">
              <span className="block">Encuentra tu</span>
              <span className="block italic text-[#d4a968]">espacio.</span>
              <span className="block">Crea tu</span>
              <span className="block italic text-[#d4a968]">visión.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
              Un estudio profesional de fotografía y video en Asunción, 
              diseñado para creadores que buscan la excelencia.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/studio/alquiler"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
              >
                <span>Reservar Estudio</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a 
                href="/studio/ugc"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 border border-white/30 text-white font-medium tracking-wide hover:bg-white/10 transition-all duration-300"
              >
                <span>Soy Creator</span>
                <Users className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-8">
            <div className="text-center">
              <div className="text-4xl font-light text-[#d4a968]">50m²</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Espacio</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-light text-[#d4a968]">6</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Luces Godox</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-light text-[#d4a968]">∞</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Backdrop</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-400 uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#d4a968] to-transparent"></div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-3">
                Un espacio para <span className="italic text-[#d4a968]">cada momento</span>
              </h2>
              <p className="text-gray-400">Reserva el estudio para tu próxima producción</p>
            </div>
            <a href="/studio/alquiler" className="text-[#d4a968] flex items-center gap-2 hover:gap-3 transition-all">
              Ver todas las opciones <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Activity Pills */}
          <div className="flex flex-wrap gap-3 mb-16">
            {ACTIVITIES.map((activity, i) => (
              <a
                key={i}
                href="/studio/alquiler"
                className="group flex items-center gap-2 px-5 py-3 rounded-full border border-white/20 text-gray-300 hover:border-[#d4a968] hover:text-[#d4a968] transition-all duration-300"
              >
                <span>{activity.icon}</span>
                <span className="text-sm">{activity.name}</span>
              </a>
            ))}
          </div>

          {/* Featured Image with Label */}
          <div className="relative group overflow-hidden rounded-lg">
            <img 
              src={STUDIO_IMAGES.rental}
              alt="Avenue Studio"
              className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <span className="text-[#d4a968] text-sm uppercase tracking-wider mb-2 block">Estudio Fotográfico</span>
              <h3 className="text-2xl md:text-3xl text-white font-light">Avenue Studio · Asunción</h3>
            </div>
            <a 
              href="/studio/alquiler"
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#d4a968] hover:text-black transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Made In Section - Infinite Gallery */}
      <section className="py-20 overflow-hidden border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl md:text-5xl font-light text-white">
            Creado en <span className="italic text-[#d4a968]">Avenue</span>
          </h2>
        </div>

        {/* Infinite Scroll Gallery */}
        <div className="relative">
          <div 
            className="flex gap-4 animate-scroll"
            style={{
              animation: 'scroll 30s linear infinite',
            }}
          >
            {[...GALLERY_ITEMS, ...GALLERY_ITEMS].map((item, i) => (
              <div 
                key={i}
                className="flex-shrink-0 w-72 md:w-80 group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg aspect-[4/5]">
                  <img 
                    src={item.src}
                    alt={item.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-gray-300 text-sm">{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            width: max-content;
          }
        `}</style>
      </section>

      {/* Two Cards Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-light text-white mb-4">
              ¿Qué estás <span className="italic text-[#d4a968]">buscando</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Ya sea que necesites un espacio profesional o quieras colaborar con marcas como creator
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1: Studio Rental */}
            <a 
              href="/studio/alquiler"
              className="group relative overflow-hidden rounded-xl aspect-[4/5] md:aspect-[3/4]"
            >
              <img 
                src={STUDIO_IMAGES.equipment}
                alt="Alquiler de Estudio"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="mb-4">
                  <Camera className="w-10 h-10 text-[#d4a968] mb-4" />
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                    Alquiler de Estudio
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Estudio profesional equipado con luces Godox, fondos infinitos y área de descanso
                  </p>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { hours: '2h', price: '250.000 Gs' },
                    { hours: '4h', price: '450.000 Gs' },
                    { hours: '6h', price: '650.000 Gs' },
                    { hours: '8h', price: '800.000 Gs' },
                  ].map((item) => (
                    <div 
                      key={item.hours}
                      className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-between"
                    >
                      <span className="text-gray-300 text-sm">{item.hours}</span>
                      <span className="text-[#d4a968] text-sm font-medium">{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  <span>Ver disponibilidad</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </a>

            {/* Card 2: UGC Creators */}
            <a 
              href="/studio/ugc"
              className="group relative overflow-hidden rounded-xl aspect-[4/5] md:aspect-[3/4]"
            >
              <img 
                src={STUDIO_IMAGES.creator1}
                alt="UGC Creators"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="mb-4">
                  <Users className="w-10 h-10 text-[#d4a968] mb-4" />
                  <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                    UGC Creators
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Conectamos marcas con microinfluencers para crear contenido auténtico
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                  {[
                    'Contenido UGC auténtico',
                    'Canjes de productos',
                    'Campañas personalizadas',
                    'Comunidad de creadores',
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 text-gray-300"
                    >
                      <Check className="w-4 h-4 text-[#d4a968]" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  <span>Únete como creator</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Why Avenue Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Image */}
            <div className="relative">
              <img 
                src={STUDIO_IMAGES.heroSecondary}
                alt="Avenue Studio"
                className="w-full rounded-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-[#d4a968] text-black p-6 rounded-lg hidden md:block">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-sm font-medium">+50 sesiones exitosas</p>
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h2 className="text-3xl md:text-5xl font-light text-white mb-6">
                ¿Por qué <span className="italic text-[#d4a968]">Avenue</span>?
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#d4a968] font-medium">01</span>
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2">Equipamiento Profesional</h3>
                    <p className="text-gray-400">Luces Godox de última generación, fondos infinitos en múltiples colores y accesorios premium.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#d4a968] font-medium">02</span>
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2">Ubicación Privilegiada</h3>
                    <p className="text-gray-400">En el corazón de Asunción, fácil acceso y estacionamiento disponible.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#d4a968] font-medium">03</span>
                  </div>
                  <div>
                    <h3 className="text-xl text-white mb-2">Soporte Incluido</h3>
                    <p className="text-gray-400">Asistencia técnica durante tu sesión y orientación en el uso del equipamiento.</p>
                  </div>
                </div>
              </div>

              <a 
                href="/studio/alquiler"
                className="inline-flex items-center gap-2 mt-10 text-[#d4a968] font-medium hover:gap-3 transition-all"
              >
                Reservar ahora <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={STUDIO_IMAGES.creator2}
            alt="CTA Background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
            Donde lo <span className="italic text-[#d4a968]">extraordinario</span> comienza
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Reserva tu sesión hoy y transforma tus ideas en contenido memorable
          </p>
          <a 
            href="/studio/alquiler"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#d4a968] text-black font-medium text-lg tracking-wide hover:bg-[#c49958] transition-all duration-300"
          >
            <span>Reservar Estudio</span>
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
