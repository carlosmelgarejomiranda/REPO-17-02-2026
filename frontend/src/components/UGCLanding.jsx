import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Building2, Sparkles, TrendingUp, Gift, BarChart3, CheckCircle, Star } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

const UGCLanding = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-[#d4a968]/10" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <p className="text-[#d4a968] text-sm font-medium tracking-[0.3em] uppercase mb-6">
            Avenue UGC Platform
          </p>
          
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
            Contenido <span className="italic text-[#d4a968]">auténtico</span><br />
            que conecta
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            La plataforma que une creadores de contenido con marcas premium. 
            Campañas UGC sin fricción, con métricas reales.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/ugc/creators"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium tracking-wide hover:opacity-90 transition-all rounded-lg"
            >
              <Users className="w-5 h-5" />
              <span>Soy Creador</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/ugc/marcas"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all rounded-lg"
            >
              <Building2 className="w-5 h-5" />
              <span>Soy Marca</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-[#d4a968] rounded-full" />
          </div>
        </div>
      </section>

      {/* What is UGC - Brief */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            ¿Qué es <span className="italic text-[#d4a968]">UGC</span>?
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            User Generated Content es contenido auténtico creado por personas reales, no por agencias. 
            Es más creíble, más cercano y <span className="text-white">convierte mejor</span>.
          </p>
        </div>
      </section>

      {/* Two Audiences */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* For Creators */}
            <Link 
              to="/ugc/creators"
              className="group relative p-10 bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/20 rounded-2xl hover:border-purple-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-medium mb-3 group-hover:text-purple-400 transition-colors">
                  Para Creadores
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Accedé a campañas de marcas premium, creá contenido auténtico y recibí canjes exclusivos.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <Gift className="w-4 h-4 text-purple-400" />
                    Canjes de hasta Gs. 1.000.000
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <Star className="w-4 h-4 text-purple-400" />
                    Sistema de reputación
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Crecé como creador UGC
                  </li>
                </ul>

                <span className="inline-flex items-center gap-2 text-purple-400 font-medium group-hover:gap-3 transition-all">
                  Conocer más <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>

            {/* For Brands */}
            <Link 
              to="/ugc/marcas"
              className="group relative p-10 bg-gradient-to-br from-[#d4a968]/20 to-amber-900/20 border border-[#d4a968]/20 rounded-2xl hover:border-[#d4a968]/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4a968]/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-[#d4a968] to-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-black" />
                </div>
                
                <h3 className="text-2xl font-medium mb-3 group-hover:text-[#d4a968] transition-colors">
                  Para Marcas
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Lanzá campañas UGC, conectá con creadores verificados y recibí contenido + métricas.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <Users className="w-4 h-4 text-[#d4a968]" />
                    +50 creadores verificados
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <BarChart3 className="w-4 h-4 text-[#d4a968]" />
                    Métricas y reportes
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-300">
                    <Sparkles className="w-4 h-4 text-[#d4a968]" />
                    Desde Gs. 790.000
                  </li>
                </ul>

                <span className="inline-flex items-center gap-2 text-[#d4a968] font-medium group-hover:gap-3 transition-all">
                  Conocer más <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works - Brief */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-16">
            Así <span className="italic text-[#d4a968]">funciona</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                <span className="text-[#d4a968] font-medium">1</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Marca publica campaña</h3>
              <p className="text-gray-500 text-sm">Define el canje, requisitos y plazos</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                <span className="text-[#d4a968] font-medium">2</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Creadores aplican</h3>
              <p className="text-gray-500 text-sm">La marca selecciona los perfiles</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                <span className="text-[#d4a968] font-medium">3</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Contenido + Métricas</h3>
              <p className="text-gray-500 text-sm">Entregas verificadas con performance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-[#0a0a0a] border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-4xl font-light text-[#d4a968]">50+</p>
              <p className="text-sm text-gray-500 mt-1">Creadores</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#d4a968]">20+</p>
              <p className="text-sm text-gray-500 mt-1">Marcas</p>
            </div>
            <div>
              <p className="text-4xl font-light text-[#d4a968]">100%</p>
              <p className="text-sm text-gray-500 mt-1">Auténtico</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light mb-6">
            ¿Listo para <span className="italic text-[#d4a968]">empezar</span>?
          </h2>
          <p className="text-gray-400 mb-10">
            Elegí tu camino y comenzá a crear conexiones auténticas
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/ugc/creators"
              className="px-8 py-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-all"
            >
              Soy Creador
            </Link>
            <Link 
              to="/ugc/marcas"
              className="px-8 py-4 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-all"
            >
              Soy Marca
            </Link>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default UGCLanding;
