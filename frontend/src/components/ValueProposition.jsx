import React from 'react';
import { TrendingUp, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export const ValueProposition = ({ t }) => {
  const features = [
    {
      icon: TrendingUp,
      title: t.valueProposition.feature1Title,
      description: t.valueProposition.feature1Desc
    },
    {
      icon: MapPin,
      title: t.valueProposition.feature2Title,
      description: t.valueProposition.feature2Desc
    },
    {
      icon: Users,
      title: t.valueProposition.feature3Title,
      description: t.valueProposition.feature3Desc
    }
  ];

  return (
    <section className="py-14 px-6" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-6xl mx-auto">
        <div className="w-20 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-light mb-3 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.valueProposition.title}
          </h2>
          <p className="text-sm md:text-base max-w-3xl mx-auto leading-relaxed" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.valueProposition.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-none transition-all duration-300 hover:scale-102 hover:shadow-xl backdrop-blur-sm"
                style={{ 
                  backgroundColor: 'rgba(245, 237, 228, 0.12)',
                  border: '1px solid rgba(212, 169, 104, 0.3)'
                }}
              >
                <CardContent className="p-5">
                  <div className="mb-3 inline-block p-2.5 rounded-full" 
                       style={{ backgroundColor: 'rgba(212, 169, 104, 0.2)' }}>
                    <Icon className="w-5 h-5" style={{ color: '#d4a968' }} />
                  </div>
                  <h3 className="text-lg font-light mb-2 italic" 
                      style={{ 
                        color: '#f5ede4',
                        fontFamily: 'var(--font-primary)'
                      }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" 
                     style={{ 
                       color: '#ead7c8',
                       fontFamily: 'var(--font-secondary)'
                     }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="w-20 h-0.5 mx-auto mt-8" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};
