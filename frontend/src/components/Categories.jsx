import React from 'react';
import { Shirt, Footprints, Watch, Gem, Sparkles, Droplet } from 'lucide-react';

export const Categories = ({ t }) => {
  const categories = [
    { icon: Shirt, name: t.categories.cat1 },
    { icon: Footprints, name: t.categories.cat2 },
    { icon: Watch, name: t.categories.cat3 },
    { icon: Gem, name: t.categories.cat4 },
    { icon: Sparkles, name: t.categories.cat5 },
    { icon: Droplet, name: t.categories.cat6 }
  ];

  return (
    <section className="py-14 px-6" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-5xl mx-auto">
        <div className="w-20 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-4xl font-light mb-3 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.categories.title}
          </h2>
          <p className="text-sm max-w-2xl mx-auto leading-relaxed" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ aspectRatio: '1/1' }}
              >
                <div className="absolute inset-0" style={{ backgroundColor: '#f5ede4' }}></div>
                <div className="absolute inset-0 border" style={{ borderColor: '#d4a968' }}></div>
                
                <div className="relative h-full flex flex-col items-center justify-center p-3">
                  <div 
                    className="mb-2 p-2 rounded-full transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#d4a968' }} />
                  </div>
                  <p className="text-center font-light text-xs" 
                     style={{ 
                       color: '#1a1a1a',
                       fontFamily: 'var(--font-secondary)',
                       letterSpacing: '0.03em'
                     }}>
                    {category.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="w-20 h-0.5 mx-auto mt-8" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
