import React from 'react';
import { Button } from './ui/button';
import { ShoppingBag, ArrowDown } from 'lucide-react';

export const Hero = ({ t, onBrandsClick, onDeliveryClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1553544260-f87e671974ee?w=1920&q=80" 
          alt="Fashion Editorial"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(to bottom, rgba(245, 237, 228, 0.7) 0%, rgba(26, 26, 26, 0.5) 100%)'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Solo Logo AVENUE - MUCHO MÁS GRANDE */}
        <div className="mb-16 inline-block">
          <img 
            src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
            alt="Avenue"
            className="h-48 md:h-64 lg:h-80 xl:h-96"
            style={{
              filter: 'drop-shadow(0 10px 30px rgba(212, 169, 104, 0.4))'
            }}
          />
        </div>
        
        <p className="text-xl md:text-3xl mb-6 font-light italic" 
           style={{ 
             color: '#1a1a1a',
             fontFamily: 'var(--font-primary)',
             textShadow: '0 2px 4px rgba(245, 237, 228, 0.8)'
           }}>
          {t.hero.subtitle}
        </p>
        
        <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto font-light" 
           style={{ 
             color: '#1a1a1a',
             fontFamily: 'var(--font-secondary)',
             textShadow: '0 1px 2px rgba(245, 237, 228, 0.8)'
           }}>
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-base px-10 py-6 transition-all duration-300 hover:scale-105 border-2"
            style={{ 
              backgroundColor: '#d4a968',
              borderColor: '#b88f4f',
              color: '#1a1a1a',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.05em'
            }}
            onClick={onBrandsClick}
          >
            {t.hero.cta}
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="text-base px-10 py-6 transition-all duration-300 hover:scale-105 border-2"
            style={{ 
              borderColor: '#d4a968',
              backgroundColor: 'rgba(245, 237, 228, 0.9)',
              color: '#1a1a1a',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.05em'
            }}
            onClick={onDeliveryClick}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {t.hero.deliveryCta}
          </Button>
        </div>
      </div>

      {/* Scroll indicator with gold accent */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <ArrowDown className="w-6 h-6" style={{ color: '#d4a968' }} />
        </div>
      </div>
    </section>
  );
};