import React from 'react';
import { ArrowRight, Store, Camera, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';

export const MainLanding = ({ t }) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5ede4' }}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Architectural background with overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920&q=80" 
            alt="Neoclassical Architecture"
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(245, 237, 228, 0.88)' }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Isologo - 25x bigger */}
          <div className="mb-16">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zxjfbeqj_IMG_9648.PNG"
              alt="Avenue"
              className="h-20 md:h-28 mx-auto"
              style={{ 
                transform: 'scale(4)',
                filter: 'drop-shadow(0 4px 12px rgba(212, 169, 104, 0.3))' 
              }}
            />
          </div>

          <h1 
            className="text-4xl md:text-6xl lg:text-7xl font-light mb-6 italic"
            style={{ color: '#1a1a1a', fontFamily: 'var(--font-primary)' }}
          >
            {t.mainLanding?.welcome || 'Bienvenido a Avenue'}
          </h1>
          
          <p 
            className="text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed"
            style={{ color: '#5a5a5a' }}
          >
            {t.mainLanding?.tagline || 'Un concepto premium donde las marcas brillan y el contenido cobra vida'}
          </p>

          {/* Three Main Options */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Option 1: Únete a Avenue - White translucent */}
            <a 
              href="/marcas"
              className="group relative p-6 md:p-8 rounded-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                border: '1px solid rgba(212, 169, 104, 0.5)',
                boxShadow: '0 10px 40px rgba(212, 169, 104, 0.15)'
              }}
            >
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.15)' }}
              >
                <Store className="w-8 h-8" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-xl md:text-2xl font-light mb-3 italic"
                style={{ color: '#1a1a1a', fontFamily: 'var(--font-primary)' }}
              >
                {t.mainLanding?.joinAvenue || 'Únete a Avenue'}
              </h2>
              <p className="text-sm mb-4" style={{ color: '#5a5a5a' }}>
                {t.mainLanding?.joinDesc || 'Descubre cómo tu marca puede brillar en nuestro espacio premium'}
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium text-sm">{t.mainLanding?.forBrands || 'Para marcas'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </div>
            </a>

            {/* Option 2: Avenue Online (E-commerce) - Gold translucent */}
            <a 
              href="/shop"
              className="group relative p-6 md:p-8 rounded-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(212, 169, 104, 0.15)',
                border: '1px solid rgba(212, 169, 104, 0.6)',
                boxShadow: '0 10px 40px rgba(212, 169, 104, 0.2)'
              }}
            >
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.3)' }}
              >
                <ShoppingBag className="w-8 h-8" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-xl md:text-2xl font-light mb-3 italic"
                style={{ color: '#1a1a1a', fontFamily: 'var(--font-primary)' }}
              >
                Avenue Online
              </h2>
              <p className="text-sm mb-4" style={{ color: '#5a5a5a' }}>
                Tienda online con las mejores marcas de moda, accesorios, cosméticos y más
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium text-sm">Comprar ahora</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
              </div>
            </a>

            {/* Option 3: Avenue Studio - Absolute black translucent */}
            <a 
              href="/studio"
              className="group relative p-6 md:p-8 rounded-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                border: '1px solid rgba(212, 169, 104, 0.5)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'rgba(212, 169, 104, 0.2)' }}
              >
                <Camera className="w-8 h-8" style={{ color: '#d4a968' }} />
              </div>
              <h2 
                className="text-xl md:text-2xl font-light mb-3 italic"
                style={{ color: '#f5ede4', fontFamily: 'var(--font-primary)' }}
              >
                {t.mainLanding?.studioTitle || 'Avenue Studio'}
              </h2>
              <p className="text-sm mb-4" style={{ color: '#a8a8a8' }}>
                {t.mainLanding?.studioDesc || 'Alquiler de estudio fotográfico y plataforma UGC Creators'}
              </p>
              <div className="flex items-center justify-center gap-2" style={{ color: '#d4a968' }}>
                <span className="font-medium text-sm">{t.mainLanding?.explore || 'Explorar'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
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
              href="https://wa.me/595973666000" 
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
