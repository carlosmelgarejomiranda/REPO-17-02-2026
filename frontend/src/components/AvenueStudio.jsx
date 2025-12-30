import React from 'react';
import { Check, Camera, Lightbulb, Users, Wifi, Droplet, Tv, Square } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export const AvenueStudio = ({ t }) => {
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
    <div className="min-h-screen" style={{ backgroundColor: '#f7f2ed' }}>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: '#1a1a1a' }}>
          <div className="absolute inset-0 opacity-30">
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
             style={{ color: '#ead7c8' }}>
            {t.studio.subtitle}
          </p>
          <p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed" 
             style={{ color: '#ead7c8' }}>
            {t.studio.description}
          </p>
        </div>
      </section>

      {/* Promo Badge */}
      <div className="py-6 text-center" style={{ backgroundColor: '#d4a968' }}>
        <p className="text-lg md:text-xl font-semibold" 
           style={{ 
             color: '#1a1a1a',
             fontFamily: 'var(--font-primary)',
             letterSpacing: '0.05em'
           }}>
          {t.studio.promoTitle}
        </p>
      </div>

      {/* Rates Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#f7f2ed' }}>
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
          
          <h2 className="text-4xl md:text-5xl font-light text-center mb-16 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.rates.title}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rates.map((rate, index) => (
              <Card 
                key={index}
                className="border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ 
                  borderColor: '#d4a968',
                  backgroundColor: 'white'
                }}
              >
                <CardContent className="p-8 text-center">
                  <p className="text-lg mb-4 font-light" 
                     style={{ 
                       color: '#5a5a5a',
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

      {/* Equipment Section */}
      <section className="py-20 px-6" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="max-w-6xl mx-auto">
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
                  className="flex items-start gap-4 p-6 rounded-sm"
                  style={{ 
                    backgroundColor: item.highlight ? 'rgba(212, 169, 104, 0.15)' : 'rgba(245, 237, 228, 0.1)',
                    border: item.highlight ? '1px solid #d4a968' : '1px solid rgba(245, 237, 228, 0.2)'
                  }}
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6" style={{ color: '#d4a968' }} />
                  </div>
                  <p className="text-base leading-relaxed" 
                     style={{ 
                       color: '#ead7c8',
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
      <section className="py-20 px-6 text-center" style={{ backgroundColor: '#f7f2ed' }}>
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-4xl font-light mb-8 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.studio.contact}
          </h3>
          
          <Button 
            size="lg" 
            className="text-lg px-12 py-6 transition-all duration-300 hover:scale-105 border-2"
            style={{ 
              backgroundColor: '#d4a968',
              borderColor: '#b88f4f',
              color: '#1a1a1a',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.05em'
            }}
            onClick={handleContact}
          >
            {t.studio.cta}
          </Button>
        </div>
      </section>
    </div>
  );
};
