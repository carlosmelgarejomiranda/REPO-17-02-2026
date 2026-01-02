import React, { useState } from 'react';
import { Users, ArrowRight, Gift, Star, Check, Instagram, TrendingUp, Sparkles, Heart } from 'lucide-react';
import { getActiveCampaigns } from '../data/campaigns';

// UGC Creator images
const UGC_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1664277497095-424e085175e8?w=1920&q=80',
  creator1: 'https://images.unsplash.com/photo-1630797160666-38e8c5ba44c1?w=800&q=80',
  creator2: 'https://images.pexels.com/photos/3576258/pexels-photo-3576258.jpeg?auto=compress&cs=tinysrgb&w=800',
  creator3: 'https://images.unsplash.com/photo-1664277497095-424e085175e8?w=600&q=80',
};

const HOW_IT_WORKS = [
  { 
    step: '01', 
    title: 'Elegí una campaña', 
    desc: 'Explorá las marcas disponibles y encontrá la que más se adapte a tu perfil',
    icon: Sparkles
  },
  { 
    step: '02', 
    title: 'Aplicá con tu perfil', 
    desc: 'Completá el formulario con tus redes sociales y estadísticas',
    icon: Instagram
  },
  { 
    step: '03', 
    title: 'Creá contenido', 
    desc: 'Si quedás seleccionad@, grabá el contenido según el brief de la marca',
    icon: TrendingUp
  },
  { 
    step: '04', 
    title: 'Recibí tu canje', 
    desc: 'Una vez aprobado el contenido, recibí productos o servicios como recompensa',
    icon: Gift
  },
];

const BENEFITS = [
  'Colaboraciones con marcas premium',
  'Canjes de hasta Gs. 1.000.000',
  'Acceso a productos exclusivos',
  'Exposición en redes de marcas',
  'Comunidad de creators',
  'Sesiones en Avenue Studio',
];

export const UGCCampaignsList = ({ t }) => {
  const campaigns = getActiveCampaigns();
  const [hoveredCampaign, setHoveredCampaign] = useState(null);

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Hero Section - Full Width Editorial */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={UGC_IMAGES.hero}
            alt="UGC Creators"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32 w-full">
          <div className="max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-8">
              <a href="/studio" className="text-gray-400 text-sm hover:text-[#d4a968] transition-colors">
                Avenue Studio
              </a>
              <span className="text-gray-600">/</span>
              <span className="text-[#d4a968] text-sm">UGC Creators</span>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a968]/20 border border-[#d4a968]/40 mb-8">
              <Sparkles className="w-4 h-4 text-[#d4a968]" />
              <span className="text-[#d4a968] text-sm font-medium">{campaigns.length} campañas activas</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-[1.1]">
              <span className="block">Crea.</span>
              <span className="block">Conecta.</span>
              <span className="block italic text-[#d4a968]">Canjea.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed">
              Conectamos creadores de contenido con marcas increíbles. 
              Creá contenido auténtico y recibí productos exclusivos a cambio.
            </p>

            {/* CTA */}
            <a 
              href="#campaigns"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <span>Ver Campañas</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-12 right-12 hidden lg:flex items-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-light text-[#d4a968]">50+</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Creators</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
          <div className="text-center">
            <div className="text-4xl font-light text-[#d4a968]">20+</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Marcas</div>
          </div>
          <div className="w-px h-12 bg-white/20"></div>
          <div className="text-center">
            <div className="text-4xl font-light text-[#d4a968]">100%</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Gratis</div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              ¿Cómo <span className="italic text-[#d4a968]">funciona</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Un proceso simple para conectarte con las mejores marcas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="relative p-8 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-[#d4a968]/30 transition-all duration-300 group"
                >
                  {/* Step Number */}
                  <span className="absolute top-4 right-4 text-6xl font-light text-white/5 group-hover:text-[#d4a968]/10 transition-colors">
                    {item.step}
                  </span>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-[#d4a968]/10 flex items-center justify-center mb-6 group-hover:bg-[#d4a968]/20 transition-colors">
                    <Icon className="w-7 h-7 text-[#d4a968]" />
                  </div>
                  
                  <h3 className="text-xl text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Images Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img 
                  src={UGC_IMAGES.creator1}
                  alt="Creator"
                  className="w-full aspect-[4/5] object-cover rounded-lg"
                />
                <div className="bg-[#d4a968] rounded-lg p-6">
                  <p className="text-black text-2xl font-light mb-1">Hasta</p>
                  <p className="text-black text-4xl font-light">Gs. 1M</p>
                  <p className="text-black/70 text-sm">en canjes</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#d4a968]/20">
                  <Star className="w-8 h-8 text-[#d4a968] mb-3" />
                  <p className="text-white text-lg mb-1">100% Gratis</p>
                  <p className="text-gray-400 text-sm">Sin costos ocultos</p>
                </div>
                <img 
                  src={UGC_IMAGES.creator2}
                  alt="Creator"
                  className="w-full aspect-[4/5] object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                ¿Por qué ser parte de <span className="italic text-[#d4a968]">Avenue</span>?
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed">
                Unite a nuestra comunidad de creators y accedé a oportunidades exclusivas 
                con las mejores marcas de Paraguay.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {BENEFITS.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#d4a968]" />
                    </div>
                    <span className="text-gray-300 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section id="campaigns" className="py-24 px-6 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-3">
                Campañas <span className="italic text-[#d4a968]">activas</span>
              </h2>
              <p className="text-gray-400">
                Elegí la marca que más te guste y aplicá
              </p>
            </div>
            <div className="flex items-center gap-2 text-[#d4a968]">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{campaigns.length} disponibles</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`/studio/ugc/${campaign.id}`}
                className="group relative overflow-hidden rounded-2xl bg-[#1a1a1a] transition-all duration-500 hover:scale-[1.02]"
                onMouseEnter={() => setHoveredCampaign(campaign.id)}
                onMouseLeave={() => setHoveredCampaign(null)}
                style={{ 
                  boxShadow: hoveredCampaign === campaign.id 
                    ? `0 20px 60px ${campaign.color}30` 
                    : 'none'
                }}
              >
                {/* Campaign Image */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                  
                  {/* Brand Badge */}
                  <div 
                    className="absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm"
                    style={{ backgroundColor: `${campaign.color}dd`, color: '#000' }}
                  >
                    {campaign.brand}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <h3 className="text-xl font-light text-white mb-4 line-clamp-2 group-hover:text-[#d4a968] transition-colors">
                    {campaign.title}
                  </h3>
                  
                  {/* Canje highlight */}
                  <div 
                    className="flex items-center gap-3 mb-6 p-4 rounded-xl"
                    style={{ backgroundColor: `${campaign.color}15` }}
                  >
                    <Gift className="w-6 h-6" style={{ color: campaign.color }} />
                    <div>
                      <p className="text-sm text-gray-400">Canje hasta</p>
                      <p className="text-xl font-light" style={{ color: campaign.color }}>
                        Gs. {campaign.canje.amount}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-gray-300">
                      👤 {campaign.requirements.genderText}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-gray-300">
                      📍 {campaign.requirements.location}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs bg-white/10 text-gray-300">
                      📱 +{campaign.requirements.minFollowers.toLocaleString()}
                    </span>
                  </div>

                  {/* CTA */}
                  <div 
                    className="flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all group-hover:gap-3"
                    style={{ backgroundColor: campaign.color, color: '#000' }}
                  >
                    <span>Aplicar ahora</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#d4a968]/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8">
            <TrendingUp className="w-4 h-4 text-[#d4a968]" />
            <span className="text-gray-300 text-sm">Para marcas</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            ¿Querés lanzar tu <span className="italic text-[#d4a968]">campaña</span>?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Conectamos tu marca con microinfluencers verificados para crear contenido auténtico que convierte
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/595976691520?text=Hola!%20Me%20interesa%20lanzar%20una%20campaña%20UGC%20con%20Avenue%20Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <span>Contactar por WhatsApp</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <div className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="/studio" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
            ← Volver a Avenue Studio
          </a>
          <div className="flex items-center gap-6">
            <a href="/studio/alquiler" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
              Alquiler de Estudio
            </a>
            <a href="/shop" className="text-gray-500 hover:text-gray-300 transition-colors text-sm">
              E-commerce
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
