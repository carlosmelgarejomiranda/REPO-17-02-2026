import React from 'react';
import { MapPin, Car, Shield, TrendingUp } from 'lucide-react';

export const Location = ({ t }) => {
  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-7xl mx-auto">
        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#d4a968' }}></div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Info */}
          <div>
            <h2 className="text-4xl md:text-6xl font-light mb-8 italic" 
                style={{ 
                  color: '#f5ede4',
                  fontFamily: 'var(--font-primary)'
                }}>
              {t.location.title}
            </h2>
            <p className="text-base mb-10 leading-relaxed" 
               style={{ 
                 color: '#ead7c8',
                 fontFamily: 'var(--font-secondary)'
               }}>
              {t.location.description}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-10">
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
                    className="flex items-center gap-2 px-5 py-3 rounded-sm"
                    style={{ 
                      backgroundColor: 'rgba(212, 169, 104, 0.15)',
                      border: '1px solid rgba(212, 169, 104, 0.3)'
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: '#d4a968' }} />
                    <span className="text-sm font-light" 
                          style={{ 
                            color: '#ead7c8',
                            fontFamily: 'var(--font-secondary)'
                          }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-sm" 
               style={{ 
                 color: '#ead7c8',
                 fontFamily: 'var(--font-secondary)'
               }}>
              {t.location.features}
            </p>
          </div>

          {/* Right side - Google Maps con ubicación exacta de Avenue */}
          <div className="rounded-sm overflow-hidden shadow-2xl" style={{ height: '500px', border: '2px solid #d4a968' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3607.5474166945686!2d-57.5764508!3d-25.2921064!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945da9002e40e909%3A0x7f238934210e33c4!2sAVENUE!5e0!3m2!1sen!2spy!4v1640000000000!5m2!1sen!2spy"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Avenue - Paseo Los Árboles, Asunción"
            ></iframe>
          </div>
        </div>
        
        <div className="w-32 h-1 mx-auto mt-12" style={{ backgroundColor: '#d4a968' }}></div>
      </div>
    </section>
  );
};