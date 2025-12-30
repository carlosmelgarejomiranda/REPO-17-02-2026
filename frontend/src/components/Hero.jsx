import React from 'react';
import { Button } from './ui/button';
import { ShoppingBag, ArrowDown } from 'lucide-react';

export const Hero = ({ t, onBrandsClick, onDeliveryClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Subtle Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://customer-assets.emergentagent.com/job_1b3572cd-a3d0-456a-8ed6-f6e2b33dc707/artifacts/fhsbv62q_IMG_9720.jpg" 
          alt="Avenue Store"
          className="w-full h-full object-cover"
        />
        {/* Subtle dark overlay for better text readability */}
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(180deg, rgba(13, 13, 13, 0.4) 0%, rgba(13, 13, 13, 0.55) 50%, rgba(13, 13, 13, 0.7) 100%)'
        }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        {/* Logo AVENUE */}
        <div className="mb-12 inline-block">
          <img 
            src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
            alt="Avenue"
            className="h-20 md:h-24"
            style={{
              transform: 'scale(2.5)',
              filter: 'brightness(1.1) drop-shadow(0 4px 20px rgba(212, 169, 104, 0.3))'
            }}
          />
        </div>
        
        <p className="text-2xl md:text-4xl mb-4 font-light italic" 
           style={{ 
             color: '#f5ede4',
             fontFamily: 'var(--font-primary)',
             textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
           }}>
          {t.hero.subtitle}
        </p>
        
        <p className="text-base md:text-lg mb-10 max-w-xl mx-auto font-light" 
           style={{ 
             color: 'rgba(245, 237, 228, 0.85)',
             fontFamily: 'var(--font-secondary)',
             lineHeight: '1.7'
           }}>
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-sm px-8 py-5 transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: '#d4a968',
              border: 'none',
              color: '#0d0d0d',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.1em',
              fontWeight: '500'
            }}
            onClick={onBrandsClick}
          >
            {t.hero.cta}
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="text-sm px-8 py-5 transition-all duration-300 hover:scale-105"
            style={{ 
              border: '1px solid rgba(212, 169, 104, 0.6)',
              backgroundColor: 'rgba(13, 13, 13, 0.4)',
              backdropFilter: 'blur(4px)',
              color: '#f5ede4',
              fontFamily: 'var(--font-secondary)',
              letterSpacing: '0.1em',
              fontWeight: '400'
            }}
            onClick={onDeliveryClick}
          >
            <ShoppingBag className="mr-2 h-4 w-4" style={{ color: '#d4a968' }} />
            {t.hero.deliveryCta}
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-5 h-5" style={{ color: 'rgba(212, 169, 104, 0.7)' }} />
      </div>
    </section>
  );
};