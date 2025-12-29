import React from 'react';
import { Shirt, Footprints, Watch, Gem, Sparkles, Droplet } from 'lucide-react';

export const Categories = ({ t }) => {
  const categories = [
    { icon: Shirt, name: t.categories.cat1, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' },
    { icon: Footprints, name: t.categories.cat2, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' },
    { icon: Watch, name: t.categories.cat3, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' },
    { icon: Gem, name: t.categories.cat4, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' },
    { icon: Sparkles, name: t.categories.cat5, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' },
    { icon: Droplet, name: t.categories.cat6, image: 'https://images.unsplash.com/photo-1553544260-f87e671974ee?w=400&q=80' }
  ];

  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-7xl mx-auto">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-light mb-6 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.categories.title}
          </h2>
          <p className="text-base max-w-3xl mx-auto leading-relaxed" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{ aspectRatio: '1/1' }}
              >
                {/* Card background */}
                <div className="absolute inset-0" style={{ backgroundColor: '#f5ede4' }}></div>
                
                {/* Border accent */}
                <div className="absolute inset-0 border-2" style={{ borderColor: '#d4a968' }}></div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center p-6">
                  <div 
                    className="mb-4 p-4 rounded-full transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
                  >
                    <Icon className="w-8 h-8" style={{ color: '#d4a968' }} />
                  </div>
                  <p className="text-center font-light text-sm" 
                     style={{ 
                       color: '#1a1a1a',
                       fontFamily: 'var(--font-secondary)',
                       letterSpacing: '0.05em'
                     }}>
                    {category.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};