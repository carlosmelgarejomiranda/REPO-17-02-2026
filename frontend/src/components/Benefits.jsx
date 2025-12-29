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
      className="py-24 px-6 relative" 
      style={{ backgroundColor: '#f7f2ed' }}
    >
      {/* Background architectural image with overlay */}
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920&q=80" 
          alt="Neoclassical Architecture"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <h2 className="text-4xl md:text-6xl font-light text-center mb-20 italic" 
            style={{ 
              color: '#1a1a1a',
              fontFamily: 'var(--font-primary)'
            }}>
          {t.benefits.title}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="p-10 rounded-sm transition-all duration-300 hover:shadow-2xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(212, 169, 104, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div className="mb-6 inline-block p-4 rounded-full" 
                     style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}>
                  <Icon className="w-7 h-7" style={{ color: '#d4a968' }} />
                </div>
                <h3 className="text-xl font-light mb-4 italic" 
                    style={{ 
                      color: '#1a1a1a',
                      fontFamily: 'var(--font-primary)'
                    }}>
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed" 
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
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};