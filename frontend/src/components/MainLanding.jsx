import React, { useState, useEffect } from 'react';
import { ArrowRight, Store, Camera, ShoppingBag, Sparkles, Play } from 'lucide-react';
import useBuilderModifications from '../hooks/useBuilderModifications';

// Hero images for rotation
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920&q=80',
  'https://images.pexels.com/photos/35428098/pexels-photo-35428098.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
];

const BRANDS_LOGOS = [
  { name: 'SEROTONINA', type: 'fashion' },
  { name: 'FILA', type: 'sport' },
  { name: 'PREMIATA', type: 'luxury' },
  { name: 'SUN68', type: 'casual' },
  { name: 'MALVA', type: 'beauty' },
  { name: 'AGUARA', type: 'fitness' },
];

export const MainLanding = ({ t }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Apply saved modifications from website builder
  useBuilderModifications('main-landing');

  useEffect(() => {
    setIsLoaded(true);
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Images with Crossfade */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((src, index) => (
            <img
              key={index}
              src={src}
              alt="Avenue"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                currentImage === index ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20 w-full">
          <div className={`max-w-3xl transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo */}
            <div className="mb-12">
              <img 
                src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
                alt="Avenue"
                className="h-8 md:h-10"
                style={{ filter: 'brightness(1.1)' }}
              />
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-[0.95]">
              <span className="block">Donde las</span>
              <span className="block italic text-[#d4a968]">marcas</span>
              <span className="block">brillan.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-xl leading-relaxed">
              {t?.mainLanding?.tagline || 'Un concepto premium donde las marcas brillan y el contenido cobra vida'}
            </p>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 mb-12">
              <div>
                <div className="text-3xl font-light text-[#d4a968]">30+</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Marcas</div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div>
                <div className="text-3xl font-light text-[#d4a968]">1500+</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Productos</div>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div>
                <div className="text-3xl font-light text-[#d4a968]">50m²</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Estudio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-500 uppercase tracking-widest">Explorar</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#d4a968] to-transparent"></div>
        </div>

        {/* Image Indicators */}
        <div className="absolute bottom-8 right-8 flex gap-2">
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImage(index)}
              className={`w-12 h-1 rounded-full transition-all duration-300 ${
                currentImage === index ? 'bg-[#d4a968]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Three Options Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-light text-white mb-4">
              ¿Qué estás <span className="italic text-[#d4a968]">buscando</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Descubre todo lo que Avenue tiene para ofrecerte
            </p>
          </div>

          {/* Three Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1: E-commerce */}
            <a 
              href="/shop"
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                alt="Avenue Online"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="w-14 h-14 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-7 h-7 text-[#d4a968]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                  Avenue <span className="italic text-[#d4a968]">Online</span>
                </h3>
                <p className="text-gray-300 mb-6 text-sm">
                  Tienda online con las mejores marcas de moda, accesorios y cosméticos
                </p>
                <div className="flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  <span>Comprar ahora</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </a>

            {/* Card 2: Studio */}
            <a 
              href="/studio"
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
            >
              <img 
                src="https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Avenue Studio"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="w-14 h-14 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-[#d4a968]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                  Avenue <span className="italic text-[#d4a968]">Studio</span>
                </h3>
                <p className="text-gray-300 mb-6 text-sm">
                  Estudio profesional de fotografía y plataforma UGC Creators
                </p>
                <div className="flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  <span>Explorar</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </a>

            {/* Card 3: For Brands */}
            <a 
              href="/tu-marca"
              className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=800&q=80"
                alt="Tu Marca en Avenue"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="w-14 h-14 rounded-full bg-[#d4a968]/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Store className="w-7 h-7 text-[#d4a968]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
                  Tu marca en <span className="italic text-[#d4a968]">Avenue</span>
                </h3>
                <p className="text-gray-300 mb-6 text-sm">
                  Descubre cómo tu marca puede brillar en nuestro espacio premium
                </p>
                <div className="flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  <span>Para marcas</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section className="py-16 border-y border-white/10 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...BRANDS_LOGOS, ...BRANDS_LOGOS, ...BRANDS_LOGOS].map((brand, index) => (
            <span 
              key={index}
              className="mx-12 text-2xl md:text-3xl font-light text-white/20 hover:text-[#d4a968] transition-colors cursor-default"
            >
              {brand.name}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </section>

      {/* Featured Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-[#d4a968]"></div>
                <span className="text-[#d4a968] text-sm tracking-[0.2em] uppercase">Descubre Avenue</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
                Un espacio donde lo <span className="italic text-[#d4a968]">extraordinario</span> sucede
              </h2>
              
              <p className="text-gray-400 mb-10 leading-relaxed text-lg">
                Avenue es más que una tienda. Es un concepto que une moda, arte y creatividad 
                en un solo lugar. Descubre las mejores marcas, reserva nuestro estudio fotográfico 
                o únete a nuestra comunidad de creadores.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: '2023', label: 'Fundado' },
                  { number: '+50', label: 'Sesiones/mes' },
                  { number: '100%', label: 'Satisfacción' },
                  { number: '24/7', label: 'Soporte' },
                ].map((stat, index) => (
                  <div key={index} className="p-4 rounded-lg bg-white/5">
                    <div className="text-2xl font-light text-[#d4a968] mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src="https://images.pexels.com/photos/35449796/pexels-photo-35449796.jpeg?auto=compress&cs=tinysrgb&w=600"
                    alt="Avenue"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                  <div className="p-6 rounded-lg bg-[#d4a968]">
                    <Sparkles className="w-8 h-8 text-black mb-3" />
                    <p className="text-black font-medium">Premium Quality</p>
                    <p className="text-black/70 text-sm">Solo las mejores marcas</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="p-6 rounded-lg bg-white/5 border border-white/10">
                    <Play className="w-8 h-8 text-[#d4a968] mb-3" />
                    <p className="text-white font-medium">UGC Platform</p>
                    <p className="text-gray-400 text-sm">Conecta con marcas</p>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1664277497095-424e085175e8?w=600&q=80"
                    alt="Avenue"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4a968]/10 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight">
            Empieza tu <span className="italic text-[#d4a968]">experiencia</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Ya sea que busques las mejores marcas o crear contenido increíble
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/shop"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-[#d4a968] text-black font-medium text-lg tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Ir a la Tienda</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a 
              href="/studio"
              className="group inline-flex items-center gap-3 px-10 py-5 border border-white/30 text-white font-medium text-lg tracking-wide hover:bg-white/10 transition-all duration-300"
            >
              <Camera className="w-5 h-5" />
              <span>Avenue Studio</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
                alt="Avenue"
                className="h-32 w-auto mb-6"
              />
              <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                Un concepto premium donde las marcas brillan y el contenido cobra vida. 
                Moda, fotografía y creatividad en un solo lugar.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-[#d4a968] text-sm tracking-wider uppercase mb-4">Explorar</h4>
              <ul className="space-y-2">
                <li><a href="/shop" className="text-gray-400 text-sm hover:text-white transition-colors">E-commerce</a></li>
                <li><a href="/studio" className="text-gray-400 text-sm hover:text-white transition-colors">Studio</a></li>
                <li><a href="/studio/ugc" className="text-gray-400 text-sm hover:text-white transition-colors">UGC Creators</a></li>
                <li><a href="/tu-marca" className="text-gray-400 text-sm hover:text-white transition-colors">Para Marcas</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-[#d4a968] text-sm tracking-wider uppercase mb-4">Contacto</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://wa.me/595973666000" className="text-gray-400 text-sm hover:text-white transition-colors">
                    +595 973 666 000
                  </a>
                </li>
                <li>
                  <a href="https://instagram.com/avenue.py" className="text-gray-400 text-sm hover:text-white transition-colors">
                    @avenue.py
                  </a>
                </li>
                <li className="text-gray-500 text-sm">
                  Paseo Los Árboles, Asunción
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Avenue. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://instagram.com/avenue.py" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">Instagram</a>
              <a href="https://tiktok.com/@avenue.py" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">TikTok</a>
              <a href="https://wa.me/595973666000" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
