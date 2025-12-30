import React from 'react';
import { Check, Camera, Lightbulb, Users, Wifi, Droplet, Tv, Square } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export const AvenueStudio = ({ t }) => {
  // Editorial B&W photography studio images
  const studioImages = {
    hero: 'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?q=80&w=2132&auto=format&fit=crop',
    equipment: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=2070&auto=format&fit=crop',
    cta: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?q=80&w=2070&auto=format&fit=crop'
  };

  const rates = [
    { hours: t.studio.rates.hours2, price: t.studio.rates.price2 },
    { hours: t.studio.rates.hours4, price: t.studio.rates.price4 },
    { hours: t.studio.rates.hours6, price: t.studio.rates.price6 },
    { hours: t.studio.rates.hours8, price: t.studio.rates.price8 }
  ];

  const equipment = [
    { icon: Lightbulb, text: t.studio.equipment.light, highlight: true },
    { icon: Camera, text: t.studio.equipment.flash, highlight: true },
    { icon: Users, text: t.studio.equipment.table },
    { icon: Square, text: t.studio.equipment.backdrop },
    { icon: Tv, text: t.studio.equipment.tv },
    { icon: Wifi, text: t.studio.equipment.wifi },
    { icon: Droplet, text: t.studio.equipment.water }
  ];

  const handleContact = () => {
    const message = `Hola! Me interesa reservar Avenue Studio. ¿Podrían darme más información sobre disponibilidad?`;
    const whatsappUrl = `https://wa.me/595976691520?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with B&W Filter */}
        <div className="absolute inset-0">
          <img 
            src={studioImages.hero}
            alt="Avenue Studio"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(100%) contrast(1.2)' }}
          />
          {/* Dark Overlay for text readability */}
          <div className="absolute inset-0 bg-black/75"></div>
          {/* Gold accent glow */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-20 left-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-7xl font-light mb-6 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.title}
          </h1>
          <p className="text-xl md:text-2xl mb-4 font-light" 
             style={{ color: '#d4a968' }}>
            {t.studio.subtitle}
          </p>
          <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" 
             style={{ color: '#a8a8a8' }}>
            {t.studio.description}
          </p>
        </div>
      </section>

      {/* Promo Badge - Black with Gold Border */}
      <div 
        className="py-5 text-center border-y-2"
        style={{ 
          backgroundColor: '#0d0d0d',
          borderColor: '#d4a968'
        }}
      >
        <p className="text-lg md:text-xl font-semibold tracking-wider" 
           style={{ 
             color: '#d4a968',
             fontFamily: 'var(--font-primary)'
           }}>
          {t.studio.promoTitle}
        </p>
      </div>

      {/* Rates Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#141414' }}>
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
          
          <h2 className="text-4xl md:text-5xl font-light text-center mb-16 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.rates.title}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rates.map((rate, index) => (
              <Card 
                key={index}
                className="border transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#d4a968]/20"
                style={{ 
                  borderColor: '#d4a968',
                  backgroundColor: '#1a1a1a'
                }}
              >
                <CardContent className="p-8 text-center">
                  <p className="text-lg mb-4 font-light" 
                     style={{ 
                       color: '#a8a8a8',
                       fontFamily: 'var(--font-secondary)'
                     }}>
                    {rate.hours}
                  </p>
                  <p className="text-3xl md:text-4xl font-light italic" 
                     style={{ 
                       color: '#d4a968',
                       fontFamily: 'var(--font-primary)'
                     }}>
                    {rate.price}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section - Nuestro Espacio */}
      <section className="py-20 px-6" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
          
          <h2 className="text-4xl md:text-5xl font-light text-center mb-6 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.gallery?.title || 'Nuestro Espacio'}
          </h2>
          
          <p className="text-center text-base mb-12" 
             style={{ 
               color: '#a8a8a8',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.studio.gallery?.subtitle || 'Conocé el estudio donde tu marca cobra vida'}
          </p>

          {/* Video Principal */}
          <div className="mb-8">
            <div 
              className="relative overflow-hidden rounded-sm border"
              style={{ borderColor: '#d4a968' }}
            >
              <video 
                className="w-full h-auto"
                controls
                playsInline
                poster=""
                style={{ maxHeight: '500px', objectFit: 'cover', width: '100%' }}
              >
                <source src="https://customer-assets.emergentagent.com/job_06a29df7-a974-4134-b07f-60d78598450e/artifacts/tqww6bmt_IMG_9492.MOV" type="video/quicktime" />
                <source src="https://customer-assets.emergentagent.com/job_06a29df7-a974-4134-b07f-60d78598450e/artifacts/tqww6bmt_IMG_9492.MOV" type="video/mp4" />
                Tu navegador no soporta el elemento de video.
              </video>
            </div>
          </div>

          <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background Image with B&W Filter */}
        <div className="absolute inset-0">
          <img 
            src={studioImages.equipment}
            alt="Studio Equipment"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(100%) contrast(1.2)' }}
          />
          <div className="absolute inset-0 bg-black/90"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
          
          <h2 className="text-4xl md:text-5xl font-light text-center mb-6 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.equipment.title}
          </h2>
          
          <p className="text-center text-base mb-12 italic" 
             style={{ 
               color: '#d4a968',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.studio.equipment.savings}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: item.highlight ? 'rgba(212, 169, 104, 0.15)' : 'rgba(30, 30, 30, 0.8)',
                    border: item.highlight ? '1px solid #d4a968' : '1px solid rgba(212, 169, 104, 0.3)'
                  }}
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6" style={{ color: '#d4a968' }} />
                  </div>
                  <p className="text-base leading-relaxed" 
                     style={{ 
                       color: '#e0e0e0',
                       fontFamily: 'var(--font-secondary)'
                     }}>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        {/* Background Image with B&W Filter */}
        <div className="absolute inset-0">
          <img 
            src={studioImages.cta}
            alt="Creative Studio"
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(100%) contrast(1.2)' }}
          />
          <div className="absolute inset-0 bg-black/80"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="w-24 h-0.5 mx-auto mb-10" style={{ backgroundColor: '#d4a968' }}></div>
          <h3 className="text-3xl md:text-4xl font-light mb-8 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.contact}
          </h3>
          
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 transition-all duration-300 hover:scale-105 border"
            style={{ 
              backgroundColor: '#d4a968',
              borderColor: '#d4a968',
              color: '#0d0d0d',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.1em',
              fontWeight: '600'
            }}
            onClick={handleContact}
          >
            {t.studio.cta}
          </Button>
          <div className="w-24 h-0.5 mx-auto mt-10" style={{ backgroundColor: '#d4a968' }}></div>
        </div>
      </section>
    </div>
  );
};
