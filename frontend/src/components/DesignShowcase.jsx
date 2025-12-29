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
    <section className="py-20 px-6" style={{ backgroundColor: '#f7f5f2' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: '#1a1918' }}>
            {t.design.title}
          </h2>
          <p className="text-xl" style={{ color: '#736c64' }}>
            {t.design.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-6 rounded-lg transition-all duration-300 hover:shadow-md"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex-shrink-0 p-2 rounded-full" style={{ backgroundColor: '#61525a22' }}>
                  <Icon className="w-5 h-5" style={{ color: '#61525a' }} />
                </div>
                <p className="text-base leading-relaxed" style={{ color: '#1a1918' }}>
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};