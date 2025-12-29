import React from 'react';
import { MapPin, Car, Shield, TrendingUp } from 'lucide-react';

export const Location = ({ t }) => {
  return (
    <section className="py-20 px-6" style={{ backgroundColor: '#1e1919' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Info */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: 'white' }}>
              {t.location.title}
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: '#bbb5ae' }}>
              {t.location.description}
            </p>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { icon: TrendingUp, label: 'Alto tránsito' },
                { icon: Car, label: 'Estacionamiento' },
                { icon: Shield, label: 'Seguridad 24/7' },
                { icon: MapPin, label: 'Accesibilidad' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ backgroundColor: '#61525a33' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: '#5f9dff' }} />
                    <span className="text-sm font-medium" style={{ color: '#bbb5ae' }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-base" style={{ color: '#bbb5ae' }}>
              {t.location.features}
            </p>
          </div>

          {/* Right side - Map placeholder */}
          <div className="rounded-lg overflow-hidden shadow-2xl" style={{ height: '400px' }}>
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: '#f7f5f2' }}
            >
              <div className="text-center p-8">
                <MapPin className="w-16 h-16 mx-auto mb-4" style={{ color: '#61525a' }} />
                <p className="text-lg font-semibold mb-2" style={{ color: '#1a1918' }}>
                  Paseo Los Árboles
                </p>
                <p className="text-base" style={{ color: '#736c64' }}>
                  Av. San Martín, Asunción
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};