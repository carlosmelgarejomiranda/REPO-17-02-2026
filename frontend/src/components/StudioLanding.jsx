import React from 'react';
import { Camera, Users, ArrowRight } from 'lucide-react';

export const StudioLanding = ({ t }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0d0d0d' }}>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <h1 
            className="text-5xl md:text-7xl font-light mb-6 italic"
            style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}
          >
            Avenue Studio
          </h1>
          <p 
            className="text-xl md:text-2xl mb-4 font-light"
            style={{ color: '#d4a968' }}
          >
            Donde el contenido cobra vida
          </p>
          <p 
            className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed"
            style={{ color: '#a8a8a8' }}
          >
            Un espacio profesional para crear contenido de alta calidad y conectar marcas con creadores
          </p>
        </div>
      </section>

      {/* Two Options */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Option 1: Alquiler de Estudio */}
            <a 
              href="/studio/alquiler"
              className="group relative p-8 md:p-12 rounded-lg transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #d4a968',
                boxShadow: '0 10px 40px rgba(212, 169, 104, 0.1)'
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
              >
                <Camera className="w-10 h-10" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-2xl md:text-3xl font-light mb-4 italic text-center"
                style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}
              >
                Alquiler de Estudio
              </h2>
              <p className="mb-6 text-center" style={{ color: '#a8a8a8' }}>
                Estudio fotográfico profesional equipado con luces Godox, fondo infinito, área de descanso y más
              </p>
              
              {/* Prices */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { hours: '2h', price: '250.000' },
                  { hours: '4h', price: '450.000' },
                  { hours: '6h', price: '650.000' },
                  { hours: '8h', price: '800.000' },
                ].map((item) => (
                  <div 
                    key={item.hours}
                    className="p-3 rounded text-center"
                    style={{ backgroundColor: 'rgba(212, 169, 104, 0.1)' }}
                  >
                    <span style={{ color: '#a8a8a8' }}>{item.hours}</span>
                    <span className="mx-2" style={{ color: '#d4a968' }}>•</span>
                    <span style={{ color: '#d4a968' }}>{item.price} Gs</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium">Ver más y Reservar</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </div>
            </a>

            {/* Option 2: UGC Creators */}
            <a 
              href="/studio/ugc"
              className="group relative p-8 md:p-12 rounded-lg transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #d4a968',
                boxShadow: '0 10px 40px rgba(212, 169, 104, 0.1)'
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
              >
                <Users className="w-10 h-10" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-2xl md:text-3xl font-light mb-4 italic text-center"
                style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}
              >
                UGC Creators
              </h2>
              <p className="mb-6 text-center" style={{ color: '#a8a8a8' }}>
                Conectamos marcas con microinfluencers para crear contenido auténtico a cambio de canjes
              </p>
              
              {/* Benefits */}
              <div className="space-y-3 mb-6">
                {[
                  'Contenido UGC auténtico',
                  'Microinfluencers verificados',
                  'Canjes de productos/servicios',
                  'Campañas personalizadas',
                ].map((item, i) => (
                  <div 
                    key={i}
                    className="p-3 rounded text-center"
                    style={{ backgroundColor: 'rgba(212, 169, 104, 0.1)' }}
                  >
                    <span style={{ color: '#a8a8a8' }}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium">Conocer más</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <div className="pb-12 text-center">
        <a 
          href="/"
          className="text-sm transition-colors hover:opacity-70"
          style={{ color: '#666' }}
        >
          ← Volver a Avenue
        </a>
      </div>
    </div>
  );
};
