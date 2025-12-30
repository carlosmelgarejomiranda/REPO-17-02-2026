import React from 'react';
import { Users, ArrowRight, Gift } from 'lucide-react';
import { getActiveCampaigns } from '../data/campaigns';

export const UGCCampaignsList = ({ t }) => {
  const campaigns = getActiveCampaigns();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 169, 104, 0.2)' }}>
            <Users className="w-10 h-10" style={{ color: '#d4a968' }} />
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-6 italic" style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}>
            UGC Creators
          </h1>
          <p className="text-xl mb-4" style={{ color: '#d4a968' }}>
            Conectamos marcas con creadores de contenido
          </p>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#a8a8a8' }}>
            Participá en campañas exclusivas, creá contenido auténtico y recibí increíbles canjes a cambio
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 px-6" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-light italic text-center mb-8" style={{ color: '#f5ede4' }}>
            ¿Cómo funciona?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Elegí una campaña', desc: 'Seleccioná la marca con la que querés colaborar' },
              { step: '2', title: 'Aplicá', desc: 'Completá el formulario con tus datos y redes' },
              { step: '3', title: 'Creá y canjeá', desc: 'Si quedás seleccionad@, grabá el contenido y recibí tu canje' },
            ].map((item) => (
              <div key={item.step} className="text-center p-6 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
                <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}>
                  {item.step}
                </div>
                <h3 className="font-medium mb-2" style={{ color: '#f5ede4' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: '#a8a8a8' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Campaigns */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light italic text-center mb-4" style={{ color: '#f5ede4' }}>
            Campañas Activas
          </h2>
          <p className="text-center mb-12" style={{ color: '#a8a8a8' }}>
            Elegí la campaña que más te guste y aplicá
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {campaigns.map((campaign) => (
              <a
                key={campaign.id}
                href={`/studio/ugc/${campaign.id}`}
                className="group relative overflow-hidden rounded-lg transition-all duration-500 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: '#1a1a1a',
                  border: `2px solid ${campaign.color}`,
                  boxShadow: `0 10px 40px ${campaign.color}20`
                }}
              >
                {/* Campaign Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={campaign.image} 
                    alt={campaign.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    style={{ filter: 'grayscale(30%)' }}
                  />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0%, #1a1a1a 100%)` }}></div>
                  
                  {/* Brand Badge */}
                  <div 
                    className="absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium"
                    style={{ backgroundColor: campaign.color, color: '#0d0d0d' }}
                  >
                    {campaign.brand}
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <h3 className="text-xl font-light italic mb-3" style={{ color: '#f5ede4' }}>
                    {campaign.title.substring(0, 60)}...
                  </h3>
                  
                  {/* Canje highlight */}
                  <div className="flex items-center gap-2 mb-4 p-3 rounded" style={{ backgroundColor: `${campaign.color}20` }}>
                    <Gift className="w-5 h-5" style={{ color: campaign.color }} />
                    <span style={{ color: campaign.color }}>
                      Canje hasta <strong>Gs. {campaign.canje.amount}</strong>
                    </span>
                  </div>

                  {/* Requirements summary */}
                  <div className="space-y-2 mb-6">
                    <p className="text-sm" style={{ color: '#a8a8a8' }}>
                      👤 {campaign.requirements.genderText}
                    </p>
                    <p className="text-sm" style={{ color: '#a8a8a8' }}>
                      📍 {campaign.requirements.location}
                    </p>
                    <p className="text-sm" style={{ color: '#a8a8a8' }}>
                      📱 +{campaign.requirements.minFollowers.toLocaleString()} followers
                    </p>
                  </div>

                  {/* CTA */}
                  <div 
                    className="flex items-center justify-center gap-2 py-3 rounded transition-all group-hover:gap-4"
                    style={{ backgroundColor: campaign.color, color: '#0d0d0d' }}
                  >
                    <span className="font-medium">Aplicar a esta campaña</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Info for brands */}
      <section className="py-12 px-6" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-xl font-light italic mb-4" style={{ color: '#f5ede4' }}>
            ¿Sos una marca y querés lanzar tu campaña?
          </h3>
          <p className="mb-6" style={{ color: '#a8a8a8' }}>
            Conectamos tu marca con microinfluencers verificados para crear contenido auténtico
          </p>
          <a
            href="https://wa.me/595976691520?text=Hola!%20Me%20interesa%20lanzar%20una%20campaña%20UGC%20con%20Avenue%20Studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded transition-all hover:scale-105"
            style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>

      {/* Back to Studio */}
      <div className="py-8 text-center">
        <a href="/studio" className="text-sm transition-colors hover:opacity-70" style={{ color: '#666' }}>
          ← Volver a Avenue Studio
        </a>
      </div>
    </div>
  );
};
