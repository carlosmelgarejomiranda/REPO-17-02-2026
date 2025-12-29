import React from 'react';
import { Lightbulb, Palette, Sun, Package, Sofa, ImageIcon } from 'lucide-react';

export const DesignShowcase = ({ t }) => {
  const features = [
    { icon: Package, text: t.design.feature1 },
    { icon: Palette, text: t.design.feature2 },
    { icon: Sun, text: t.design.feature3 },
    { icon: Lightbulb, text: t.design.feature4 },
    { icon: Sofa, text: t.design.feature5 },
    { icon: ImageIcon, text: t.design.feature6 }
  ];

  return (
    <section className="py-24 px-6 relative" style={{ backgroundColor: '#f5ede4' }}>
      {/* Luxury boutique background */}
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1763914766563-d15bef819106?w=1920&q=80" 
          alt="Luxury Boutique"
          className="w-full h-full object-cover opacity-30"
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-light mb-6 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.design.title}
          </h2>
          <p className="text-xl font-light italic" 
             style={{ 
               color: '#5a5a5a',
               fontFamily: 'var(--font-primary)'
             }}>
            {t.design.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-8 rounded-sm transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(212, 169, 104, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="flex-shrink-0 p-3 rounded-full" 
                     style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#d4a968' }} />
                </div>
                <p className="text-sm leading-relaxed" 
                   style={{ 
                     color: '#1a1a1a',
                     fontFamily: 'var(--font-secondary)'
                   }}>
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};