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
    <section className="py-20 px-6" style={{ backgroundColor: '#f7f5f2' }}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ color: '#1a1918' }}>
          {t.benefits.title}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="p-8 rounded-lg transition-all duration-300 hover:shadow-lg"
                style={{ 
                  backgroundColor: 'white',
                  border: '1px solid #5f9dff33'
                }}
              >
                <div className="mb-4 inline-block p-3 rounded-full" style={{ backgroundColor: '#5f9dff22' }}>
                  <Icon className="w-6 h-6" style={{ color: '#5f9dff' }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: '#1a1918' }}>
                  {benefit.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: '#736c64' }}>
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};