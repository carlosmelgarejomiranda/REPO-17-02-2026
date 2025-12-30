import React from 'react';
import { Award, Presentation, Eye, Zap, Camera, Handshake } from 'lucide-react';

export const Benefits = ({ t }) => {
  const benefits = [
    { icon: Award, title: t.benefits.benefit1Title, description: t.benefits.benefit1Desc },
    { icon: Presentation, title: t.benefits.benefit2Title, description: t.benefits.benefit2Desc },
    { icon: Eye, title: t.benefits.benefit3Title, description: t.benefits.benefit3Desc },
    { icon: Zap, title: t.benefits.benefit4Title, description: t.benefits.benefit4Desc },
    { icon: Camera, title: t.benefits.benefit5Title, description: t.benefits.benefit5Desc },
    { icon: Handshake, title: t.benefits.benefit6Title, description: t.benefits.benefit6Desc }
  ];

  return (
    <section 
      className="py-14 px-6 relative" 
      style={{ backgroundColor: '#f5ede4' }}
    >
      {/* Architectural background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920&q=80" 
          alt="Neoclassical Architecture"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(245, 237, 228, 0.85)' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="w-20 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#d4a968' }}></div>
        
        <h2 className="text-2xl md:text-4xl font-light text-center mb-10 italic" 
            style={{ 
              color: '#1a1a1a',
              fontFamily: 'var(--font-primary)'
            }}>
          {t.benefits.title}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="p-5 rounded-sm transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(212, 169, 104, 0.3)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <div className="mb-3 inline-block p-2.5 rounded-full" 
                     style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}>
                  <Icon className="w-5 h-5" style={{ color: '#d4a968' }} />
                </div>
                <h3 className="text-base font-light mb-2 italic" 
                    style={{ 
                      color: '#1a1a1a',
                      fontFamily: 'var(--font-primary)'
                    }}>
                  {benefit.title}
                </h3>
                <p className="text-xs leading-relaxed" 
                   style={{ 
                     color: '#5a5a5a',
                     fontFamily: 'var(--font-secondary)'
                   }}>
                  {benefit.description}
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
