import React from 'react';
import { ArrowRight, Store, Camera } from 'lucide-react';
import { Button } from './ui/button';

export const MainLanding = ({ t }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f2ed' }}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #f7f2ed 0%, #ead7c8 50%, #d4a968 100%)',
              opacity: 0.3
            }}
          />
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-[#d4a968] rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1a1a1a] rounded-full blur-3xl opacity-10"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zxjfbeqj_IMG_9648.PNG"
            alt="Avenue"
            className="h-24 md:h-32 mx-auto mb-8"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(212, 169, 104, 0.3))' }}
          />

          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-light mb-6 italic"
            style={{ color: '#1a1a1a', fontFamily: 'var(--font-primary)' }}
          >
            Bienvenido a Avenue
          </h1>
          
          <p 
            className="text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed"
            style={{ color: '#5a5a5a' }}
          >
            Un concepto premium donde las marcas brillan y el contenido cobra vida
          </p>

          {/* Two Main Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Option 1: Únete a Avenue */}
            <a 
              href="/marcas"
              className="group relative p-8 md:p-12 rounded-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: '2px solid #d4a968',
                boxShadow: '0 10px 40px rgba(212, 169, 104, 0.2)'
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
              >
                <Store className="w-10 h-10" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-2xl md:text-3xl font-light mb-4 italic"
                style={{ color: '#1a1a1a', fontFamily: 'var(--font-primary)' }}
              >
                Únete a Avenue
              </h2>
              <p className="mb-6" style={{ color: '#5a5a5a' }}>
                Descubre cómo tu marca puede brillar en nuestro espacio premium sin comisiones
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium">Para Marcas</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </div>
            </a>

            {/* Option 2: Avenue Studio */}
            <a 
              href="/studio"
              className="group relative p-8 md:p-12 rounded-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
              style={{ 
                backgroundColor: '#1a1a1a',
                border: '2px solid #d4a968',
                boxShadow: '0 10px 40px rgba(26, 26, 26, 0.3)'
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.2)' }}
              >
                <Camera className="w-10 h-10" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-2xl md:text-3xl font-light mb-4 italic"
                style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}
              >
                Avenue Studio
              </h2>
              <p className="mb-6" style={{ color: '#a8a8a8' }}>
                Alquiler de estudio fotográfico profesional y plataforma UGC Creators
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium">Explorar</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </div>
            </a>
          </div>

          {/* Social Links */}
          <div className="mt-16 flex items-center justify-center gap-6">
            <a 
              href="https://www.instagram.com/avenue.py" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: '#5a5a5a' }}
            >
              Instagram
            </a>
            <span style={{ color: '#d4a968' }}>•</span>
            <a 
              href="https://www.tiktok.com/@avenue.py" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: '#5a5a5a' }}
            >
              TikTok
            </a>
            <span style={{ color: '#d4a968' }}>•</span>
            <a 
              href="https://wa.me/595976691520" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm transition-colors hover:opacity-70"
              style={{ color: '#5a5a5a' }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
