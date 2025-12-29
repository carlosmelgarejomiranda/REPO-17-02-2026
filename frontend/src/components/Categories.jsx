import React from 'react';
import { Shirt, Footprints, Watch, Gem, Sparkles, Droplet } from 'lucide-react';

export const Categories = ({ t }) => {
  const categories = [
    { icon: Shirt, name: t.categories.cat1, color: '#283750' },
    { icon: Footprints, name: t.categories.cat2, color: '#fad24b' },
    { icon: Watch, name: t.categories.cat3, color: '#3dd3ee' },
    { icon: Gem, name: t.categories.cat4, color: '#ff8c19' },
    { icon: Sparkles, name: t.categories.cat5, color: '#b4dc19' },
    { icon: Droplet, name: t.categories.cat6, color: '#fa551e' }
  ];

  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#1e1919' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'white' }}>
            {t.categories.title}
          </h2>
          <p className="text-lg max-w-3xl mx-auto" style={{ color: '#bbb5ae' }}>
            {t.categories.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 hover:scale-110 cursor-pointer"
                style={{ 
                  backgroundColor: '#f7f5f2',
                  border: `2px solid ${category.color}33`
                }}
              >
                <div 
                  className="mb-4 p-4 rounded-full"
                  style={{ backgroundColor: `${category.color}22` }}
                >
                  <Icon className="w-8 h-8" style={{ color: category.color }} />
                </div>
                <p className="text-center font-semibold" style={{ color: '#1a1918' }}>
                  {category.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};