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
    <section className="py-20 px-6" style={{ backgroundColor: '#1e1919' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'white' }}>
            {t.valueProposition.title}
          </h2>
          <p className="text-lg md:text-xl max-w-4xl mx-auto" style={{ color: '#bbb5ae' }}>
            {t.valueProposition.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-none transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={{ backgroundColor: '#f7f5f2' }}
              >
                <CardContent className="p-8">
                  <div className="mb-6 inline-block p-4 rounded-full" style={{ backgroundColor: '#61525a20' }}>
                    <Icon className="w-8 h-8" style={{ color: '#61525a' }} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4" style={{ color: '#1a1918' }}>
                    {feature.title}
                  </h3>
                  <p className="text-base" style={{ color: '#736c64' }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};