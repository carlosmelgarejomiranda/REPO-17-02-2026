import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Users, Gift, Star, TrendingUp, Award, CheckCircle,
  Camera, Sparkles, ArrowLeft, UserPlus, Send, Zap
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const CreatorsPage = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const levels = [
    { name: 'Rookie', color: 'from-gray-400 to-gray-500', desc: 'Recién empezás', icon: '🌱' },
    { name: 'Trusted', color: 'from-blue-400 to-blue-500', desc: '3+ campañas completadas', icon: '⭐' },
    { name: 'Pro', color: 'from-purple-400 to-purple-500', desc: '10+ campañas, métricas altas', icon: '🚀' },
    { name: 'Elite', color: 'from-[#d4a968] to-amber-500', desc: 'Top performers', icon: '👑' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* ============== HERO SECTION ============== */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://customer-assets.emergentagent.com/job_one-account/artifacts/tk0opl7n_influencer%20ugc%201.webp"
            alt="Creator"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/70 to-[#0a0a0a]" />
          {/* Purple/pink gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        </div>

        {/* Content */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Back link */}
          <Link 
            to="/ugc" 
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a UGC
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 rounded-full mb-6">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-400 tracking-[0.15em] uppercase">
              Para Creadores
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Abrí las puertas a <br className="hidden sm:block" />
            <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">oportunidades reales</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            Colaborá con marcas premium, construí tu marca personal 
            y ganá credibilidad con cada colaboración.
          </p>

          {/* CTA */}
          <Link
            to="/ugc/creator/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
            data-testid="hero-cta-register"
          >
            <UserPlus className="w-4 h-4" />
            Registrarme como Creator
          </Link>
        </div>
      </section>

      {/* ============== UNIQUE OPPORTUNITY ============== */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/e9d2076s_bastante-joven-morena-de-pelo-corto-en-vestido-rojo-de-lino-con-cinturon-negro-sonrie-toma-selfie-muestra-el-signo-de-la-paz-y-posa-en-la-oficina-del-disenador-de-moda.jpg"
                alt="Creator"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right - Content */}
            <div>
              <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-4 block">
                Oportunidad única
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Una puerta que <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">antes no existía</span>
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Avenue UGC te da acceso real a colaborar con marcas. 
                No necesitás miles de seguidores ni un agente. 
                Solo tu creatividad y ganas de crear contenido auténtico.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: Gift, text: 'Acceso a marcas premium por canjes' },
                  { icon: Star, text: 'Construí tu track record público' },
                  { icon: TrendingUp, text: 'Crecé tu marca personal' },
                  { icon: Award, text: 'Ganá credibilidad verificable' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-purple-400" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Proceso simple
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white">
              ¿Cómo <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">funciona</span>?
            </h2>
          </div>

          {/* 3 Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Registrate',
                desc: 'Creá tu perfil de creator con tus redes y estilo de contenido.'
              },
              {
                step: '02',
                icon: Send,
                title: 'Aplicá',
                desc: 'Explorá campañas disponibles y aplicá a las que te interesen.'
              },
              {
                step: '03',
                icon: Camera,
                title: 'Creá',
                desc: 'Recibí el producto, creá contenido auténtico y subí tus métricas.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-[#121212] rounded-lg border border-white/5 text-center">
                <div className="text-purple-400/30 text-4xl font-light mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-medium mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== LEVEL SYSTEM ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Sistema de niveles
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Tu credibilidad <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">crece</span> con vos
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Cada colaboración suma a tu track record público. 
              Subí de nivel y accedé a mejores oportunidades.
            </p>
          </div>

          {/* Levels */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {levels.map((level, idx) => (
              <div 
                key={idx} 
                className="p-4 bg-[#121212] rounded-lg border border-white/5 text-center hover:border-purple-500/30 transition-colors"
              >
                <div className="text-2xl mb-2">{level.icon}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${level.color} text-white mb-2`}>
                  {level.name}
                </div>
                <p className="text-white/50 text-xs">{level.desc}</p>
              </div>
            ))}
          </div>

          {/* Arrow progression */}
          <div className="hidden md:flex justify-center items-center gap-4 mt-6 text-white/20">
            <span className="text-xs">Empezás acá</span>
            <ArrowRight className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs">Meta</span>
          </div>
        </div>
      </section>

      {/* ============== WHAT YOU GET ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white">
              ¿Qué <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">ganás</span>?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Gift, title: 'Productos gratis', desc: 'Recibí productos de marcas para crear contenido' },
              { icon: Star, title: 'Reputación pública', desc: 'Tu perfil muestra ratings y colaboraciones' },
              { icon: Zap, title: 'Experiencia real', desc: 'Portfolio con trabajos verificados' },
              { icon: TrendingUp, title: 'Crecimiento', desc: 'Cada nivel desbloquea mejores campañas' },
              { icon: Users, title: 'Red de contactos', desc: 'Conectá con marcas y otros creators' },
              { icon: CheckCircle, title: 'Flexibilidad', desc: 'Elegís las campañas que te interesan' }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-[#121212] rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-white font-medium mb-1 text-sm">{item.title}</h4>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            Empezá tu carrera como <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">creator</span>
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            No necesitás ser influencer. Solo necesitás ganas de crear 
            contenido auténtico y colaborar con marcas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/ugc/creator/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
              data-testid="cta-register"
            >
              <UserPlus className="w-4 h-4" />
              Registrarme ahora
            </Link>
            <Link
              to="/ugc/campaigns"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all rounded-lg"
              data-testid="cta-campaigns"
            >
              Ver campañas disponibles
            </Link>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default CreatorsPage;
