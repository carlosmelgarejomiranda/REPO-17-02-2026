import React from 'react';
import { Button } from './ui/button';
import { Sparkles, ShoppingBag } from 'lucide-react';

export const Hero = ({ t, onBrandsClick, onDeliveryClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-[#f7f5f2]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#61525a] rounded-full blur-3xl opacity-10"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#5f9dff] rounded-full blur-3xl opacity-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Logo placeholder - can be replaced with actual Avenue logo */}
        <div className="mb-8 inline-block">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-[#61525a] rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute inset-2 bg-[#61525a] rounded-full flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight" 
            style={{ 
              fontFamily: 'var(--font-primary)', 
              color: '#61525a',
              fontWeight: 500
            }}>
          {t.hero.title}
        </h1>
        
        <p className="text-2xl md:text-3xl mb-4 font-medium" style={{ color: '#736c64' }}>
          {t.hero.subtitle}
        </p>
        
        <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto" style={{ color: '#1a1918' }}>
          {t.hero.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 transition-all duration-300 hover:scale-105"
            style={{ 
              backgroundColor: '#61525a',
              color: 'white'
            }}
            onClick={onBrandsClick}
          >
            {t.hero.cta}
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-6 transition-all duration-300 hover:scale-105"
            style={{ 
              borderColor: '#61525a',
              color: '#61525a'
            }}
            onClick={onDeliveryClick}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {t.hero.deliveryCta}
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 rounded-full" style={{ borderColor: '#61525a' }}>
          <div className="w-1.5 h-3 bg-[#61525a] rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </section>
  );
};