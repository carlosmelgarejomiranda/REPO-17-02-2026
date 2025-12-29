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
    <section className="py-24 px-6" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-7xl mx-auto">
        {/* Decorative top border with molding effect */}
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-light mb-6 italic" 
              style={{ 
                color: '#f5ede4',
                fontFamily: 'var(--font-primary)'
              }}>
            {t.valueProposition.title}
          </h2>
          <p className="text-base md:text-lg max-w-4xl mx-auto leading-relaxed" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)'
             }}>
            {t.valueProposition.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-none transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{ 
                  backgroundColor: '#f5ede4',
                  border: '1px solid #d4a968'
                }}
              >
                <CardContent className="p-8">
                  <div className="mb-6 inline-block p-4 rounded-full" 
                       style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}>
                    <Icon className="w-8 h-8" style={{ color: '#d4a968' }} />
                  </div>
                  <h3 className="text-2xl font-light mb-4 italic" 
                      style={{ 
                        color: '#1a1a1a',
                        fontFamily: 'var(--font-primary)'
                      }}>
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed" 
                     style={{ 
                       color: '#5a5a5a',
                       fontFamily: 'var(--font-secondary)'
                     }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Decorative bottom border */}
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};