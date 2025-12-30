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
    <section className="py-14 px-6 relative" style={{ backgroundColor: '#f5ede4' }}>
      {/* Architectural background image */}
      <div className="absolute inset-0 opacity-8">
        <img 
          src="https://images.unsplash.com/photo-1673010523525-bcf9cfb4b8b5?w=1920&q=80" 
          alt="Neoclassical Interior"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="w-20 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-light mb-2 italic" 
              style={{ 
                color: '#1a1a1a',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.design.title}
          </h2>
          <p className="text-base font-light italic" 
             style={{ 
               color: '#5a5a5a',
               fontFamily: 'var(--font-primary)'
             }}>
            {t.design.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-sm transition-all duration-300 hover:shadow-md"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(212, 169, 104, 0.3)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div className="flex-shrink-0 p-2 rounded-full" 
                     style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}>
                  <Icon className="w-4 h-4" style={{ color: '#d4a968' }} />
                </div>
                <p className="text-xs leading-relaxed" 
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
        
        <div className="w-20 h-0.5 mx-auto mt-8" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
