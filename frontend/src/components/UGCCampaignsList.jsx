import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, Gift, Star, Check, Instagram, TrendingUp, Sparkles, Heart, Play, Building2, Package, BarChart3 } from 'lucide-react';
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
  { text: 'Colaboraciones con marcas premium', icon: Star },
  { text: 'Canjes de hasta Gs. 1.000.000', icon: Gift },
  { text: 'Acceso a productos exclusivos', icon: Sparkles },
  { text: 'Exposición en redes de marcas', icon: TrendingUp },
  { text: 'Comunidad de creators', icon: Users },
  { text: 'Sesiones en Avenue Studio', icon: Play },
];

export const UGCCampaignsList = ({ t }) => {
  const campaigns = getActiveCampaigns();
  const [hoveredCampaign, setHoveredCampaign] = useState(null);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section - Editorial Style */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={UGC_IMAGES.hero}
            alt="UGC Creators"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32 w-full">
          <div className="max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-12">
              <a href="/studio" className="text-gray-300 text-xs tracking-[0.15em] uppercase hover:text-[#d4a968] transition-colors">
                Avenue Studio
              </a>
              <span className="text-gray-500">/</span>
              <span className="text-[#d4a968] text-xs tracking-[0.15em] uppercase">UGC Creators</span>
            </div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl font-light text-white mb-8 leading-[0.95] tracking-tight">
              <span className="block">Crea.</span>
              <span className="block">Comparte.</span>
              <span className="block italic text-[#d4a968]">Gana.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-300 text-lg mb-12 max-w-lg leading-relaxed">
              Conectamos creadores de contenido con marcas increíbles. 
              Creá contenido auténtico y recibí productos exclusivos a cambio.
            </p>

            {/* CTA */}
            <a 
              href="#campaigns"
              className="group inline-flex items-center gap-4 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <span>Ver Campañas</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Floating Stats - Editorial */}
        <div className="absolute bottom-16 right-16 hidden lg:block">
          <div className="flex items-center gap-12 bg-black/40 backdrop-blur-sm px-8 py-6 border border-white/25">
            <div className="text-center">
              <div className="text-4xl font-light text-white">50<span className="text-[#d4a968]">+</span></div>
              <div className="text-xs text-gray-300 tracking-[0.2em] uppercase mt-2">Creators</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-light text-white">20<span className="text-[#d4a968]">+</span></div>
              <div className="text-xs text-gray-300 tracking-[0.2em] uppercase mt-2">Marcas</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl font-light text-white">100<span className="text-[#d4a968]">%</span></div>
              <div className="text-xs text-gray-300 tracking-[0.2em] uppercase mt-2">Auténtico</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is UGC Program */}
      <section className="py-28 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <p className="text-[#d4a968] text-xs font-medium tracking-[0.3em] uppercase mb-6">El Programa</p>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-8 leading-tight">
                ¿Qué es el programa <span className="italic text-[#d4a968]">UGC</span>?
              </h2>
              <p className="text-gray-300 leading-relaxed mb-10 text-lg">
                El programa UGC (User Generated Content) de Avenue conecta creadores de contenido 
                con marcas premium. Creás contenido auténtico en nuestra tienda y recibís 
                productos exclusivos como recompensa.
              </p>

              <div className="space-y-5">
                {BENEFITS.slice(0, 4).map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/10 border border-white/25 hover:border-[#d4a968]/30 transition-colors">
                      <div className="w-10 h-10 bg-[#d4a968]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#d4a968]" />
                      </div>
                      <span className="text-gray-200">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right - Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src={UGC_IMAGES.creator1}
                    alt="Creator"
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="bg-[#d4a968] p-6">
                    <p className="text-black text-xs tracking-[0.2em] uppercase mb-2">Hasta</p>
                    <p className="text-black text-3xl font-light">Gs. 1.000.000</p>
                    <p className="text-black/70 text-sm tracking-wide mt-1">en canjes por campaña</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="bg-[#1a1a1a] border border-white/25 p-6">
                    <Star className="w-6 h-6 text-[#d4a968] mb-4" />
                    <p className="text-white text-lg mb-1">Experiencia Única</p>
                    <p className="text-gray-300 text-sm">Colaborá con marcas premium</p>
                  </div>
                  <img 
                    src={UGC_IMAGES.creator2}
                    alt="Creator"
                    className="w-full aspect-[3/4] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-28 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#d4a968] text-xs font-medium tracking-[0.3em] uppercase mb-6">Proceso</p>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              ¿Cómo <span className="italic text-[#d4a968]">funciona</span>?
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto">
              Un proceso simple para conectarte con las mejores marcas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="relative p-8 bg-[#141414] border border-white/25 group hover:border-[#d4a968]/30 transition-all duration-300"
                >
                  {/* Step Number */}
                  <span className="absolute top-4 right-4 text-5xl font-light text-white/30 group-hover:text-[#d4a968]/50 transition-colors">
                    {item.step}
                  </span>
                  
                  {/* Icon */}
                  <div className="w-14 h-14 bg-[#d4a968]/10 flex items-center justify-center mb-6 group-hover:bg-[#d4a968]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#d4a968]" />
                  </div>
                  
                  <h3 className="text-white text-lg mb-3">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section id="campaigns" className="py-28 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-[#d4a968] text-xs font-medium tracking-[0.3em] uppercase mb-6">Oportunidades</p>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-3">
                Campañas <span className="italic text-[#d4a968]">activas</span>
              </h2>
              <p className="text-gray-300">
                Elegí la marca que más te guste y aplicá
              </p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-[#d4a968]/10 border border-[#d4a968]/30">
              <div className="w-2 h-2 bg-[#d4a968] rounded-full animate-pulse"></div>
              <span className="text-[#d4a968] text-sm">{campaigns.length} disponibles</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`/studio/ugc/${campaign.id}`}
                className="group relative overflow-hidden bg-[#141414] border border-white/25 hover:border-[#d4a968]/30 transition-all duration-500"
                onMouseEnter={() => setHoveredCampaign(campaign.id)}
                onMouseLeave={() => setHoveredCampaign(null)}
              >
                {/* Campaign Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
                  
                  {/* Brand Badge */}
                  <div 
                    className="absolute top-6 left-6 px-4 py-2 text-xs font-medium tracking-[0.1em] uppercase"
                    style={{ backgroundColor: campaign.color, color: '#000' }}
                  >
                    {campaign.brand}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-8">
                  <h3 className="text-xl font-light text-white mb-6 group-hover:text-[#d4a968] transition-colors">
                    {campaign.title}
                  </h3>
                  
                  {/* Canje highlight */}
                  <div 
                    className="flex items-center gap-4 mb-6 p-5 bg-[#1a1a1a] border border-white/25"
                  >
                    <Gift className="w-6 h-6 text-[#d4a968]" />
                    <div>
                      <p className="text-xs text-gray-300 tracking-[0.1em] uppercase">Canje hasta</p>
                      <p className="text-xl font-light text-[#d4a968]">
                        Gs. {campaign.canje.amount}
                      </p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-3 py-1.5 bg-white/10 border border-white/25 text-xs text-gray-300">
                      {campaign.requirements.genderText}
                    </span>
                    <span className="px-3 py-1.5 bg-white/10 border border-white/25 text-xs text-gray-300">
                      {campaign.requirements.location}
                    </span>
                    <span className="px-3 py-1.5 bg-white/10 border border-white/25 text-xs text-gray-300">
                      +{campaign.requirements.minFollowers.toLocaleString()} followers
                    </span>
                  </div>

                  {/* CTA */}
                  <div 
                    className="flex items-center justify-center gap-3 py-4 font-medium transition-all text-black tracking-[0.1em] uppercase text-sm"
                    style={{ backgroundColor: campaign.color }}
                  >
                    <span>Aplicar ahora</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands CTA */}
      <section className="py-28 px-6 bg-[#0a0a0a] border-t border-white/25">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#d4a968] text-xs font-medium tracking-[0.3em] uppercase mb-6">Para Marcas</p>
          
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            ¿Querés lanzar tu <span className="italic text-[#d4a968]">campaña</span>?
          </h2>
          <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
            Conectamos tu marca con microinfluencers verificados para crear contenido auténtico que convierte
          </p>
          
          <a
            href="https://wa.me/595976691520?text=Hola!%20Me%20interesa%20lanzar%20una%20campaña%20UGC%20con%20Avenue%20Studio"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-4 px-10 py-5 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
          >
            <span>Contactar por WhatsApp</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>
    </div>
  );
};
