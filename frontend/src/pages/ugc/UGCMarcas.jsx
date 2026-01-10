import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Building2, Users, BarChart3, CheckCircle, Sparkles,
  ArrowLeft, Heart, TrendingUp, MessageCircle, UserPlus, Shield,
  Package, Zap, FileCheck, X, Check
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const UGCMarcas = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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
            alt="UGC Content"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/70 to-[#0a0a0a]" />
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
          <div className="inline-flex items-center gap-2 border border-[#d4a968]/30 bg-[#d4a968]/10 px-3 py-1.5 rounded-full mb-6">
            <Building2 className="w-3.5 h-3.5 text-[#d4a968]" />
            <span className="text-[10px] font-medium text-[#d4a968] tracking-[0.15em] uppercase">
              Para Marcas
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Contenido que <span className="italic text-[#d4a968]">conecta</span>,<br className="hidden sm:block" /> 
            no que interrumpe
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            UGC auténtico que despierta interés y posiciona 
            tu marca en la mente de tu audiencia.
          </p>

          {/* CTA */}
          <Link
            to="/ugc/brand/onboarding"
            className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
            data-testid="hero-cta"
          >
            Empezar ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ============== THE PROBLEM vs SOLUTION ============== */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* The Problem */}
            <div className="p-6 md:p-8 rounded-lg bg-[#121212] border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <span className="text-red-400 text-[10px] tracking-[0.15em] uppercase font-medium">El problema</span>
                  <h3 className="text-lg font-light text-white">Contenido promocional</h3>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  'Se siente scripted y forzado',
                  'La audiencia lo ignora',
                  'No genera confianza',
                  'Parece "publicidad actuada"',
                  'Bajo engagement'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/60">
                    <X className="w-4 h-4 text-red-400/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* The Solution */}
            <div className="p-6 md:p-8 rounded-lg bg-[#121212] border border-[#d4a968]/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#d4a968]" />
                </div>
                <div>
                  <span className="text-[#d4a968] text-[10px] tracking-[0.15em] uppercase font-medium">La solución</span>
                  <h3 className="text-lg font-light text-white">Contenido UGC</h3>
                </div>
              </div>

              <ul className="space-y-3">
                {[
                  'Se siente real y auténtico',
                  'La audiencia se identifica',
                  'Genera confianza real',
                  'Experiencias genuinas',
                  'Alto engagement'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="w-4 h-4 text-[#d4a968] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== WHY UGC WORKS ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Por qué funciona
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white">
              El poder del contenido <span className="italic text-[#d4a968]">auténtico</span>
            </h2>
          </div>

          {/* 4 Benefits */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Shield,
                title: 'Aumenta la confianza',
                desc: 'Prueba social real: uso genuino, reviews y testimonios que eliminan dudas.'
              },
              {
                icon: TrendingUp,
                title: 'Amplifica el alcance',
                desc: 'El contenido se comparte y viaja más allá de la audiencia del creador.'
              },
              {
                icon: MessageCircle,
                title: 'Mejora el engagement',
                desc: 'La gente comenta, guarda y manda DM porque se identifica con lo que ve.'
              },
              {
                icon: Heart,
                title: 'Construye comunidad',
                desc: 'Cuando reposteás a clientes/creadores, generás pertenencia y embajadores.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-[#121212] rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#d4a968]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#d4a968]" />
                </div>
                <h4 className="text-white font-medium mb-2">{item.title}</h4>
                <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WE HANDLE EVERYTHING ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Content */}
            <div>
              <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-4 block">
                Diferencial Avenue
              </span>
              
              <h2 className="text-2xl md:text-3xl font-light text-white mb-4 leading-tight">
                Un productazo <span className="italic text-[#d4a968]">llave en mano</span>
              </h2>
              
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                No solo te conectamos con creadores. Gestionamos absolutamente 
                todo el proceso para que vos solo recibas contenido listo para usar.
              </p>

              <ul className="space-y-4">
                {[
                  { icon: Users, text: 'Selección y coordinación de creadores' },
                  { icon: Package, text: 'Logística de envío de productos' },
                  { icon: FileCheck, text: 'Recopilación y entrega de contenidos' },
                  { icon: BarChart3, text: 'Métricas verificadas y reportes' },
                  { icon: Shield, text: 'Control de calidad y cumplimiento' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/70">
                    <div className="w-8 h-8 rounded-full bg-[#d4a968]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[#d4a968]" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right - Image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <img 
                src="https://customer-assets.emergentagent.com/job_one-account/artifacts/e9d2076s_bastante-joven-morena-de-pelo-corto-en-vestido-rojo-de-lino-con-cinturon-negro-sonrie-toma-selfie-muestra-el-signo-de-la-paz-y-posa-en-la-oficina-del-disenador-de-moda.jpg"
                alt="UGC Creator"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="text-[#d4a968] text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Proceso simple
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white">
              ¿Cómo <span className="italic text-[#d4a968]">funciona</span>?
            </h2>
          </div>

          {/* 3 Steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: FileCheck,
                title: 'Creás tu campaña',
                desc: 'Definís el producto, tipo de contenido y requisitos. Nosotros lo publicamos.'
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'Recibís contenido',
                desc: 'Los creadores aplican, seleccionamos los mejores y te entregan contenido.'
              },
              {
                step: '03',
                icon: BarChart3,
                title: 'Medís resultados',
                desc: 'Accedés a métricas reales de cada publicación y el impacto generado.'
              }
            ].map((item, idx) => (
              <div key={idx} className="p-6 bg-[#121212] rounded-lg border border-white/5 text-center">
                <div className="text-[#d4a968]/30 text-4xl font-light mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-full bg-[#d4a968]/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-[#d4a968]" />
                </div>
                <h3 className="text-white font-medium mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA FINAL ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
            Empezá a generar contenido que <span className="italic text-[#d4a968]">convierte</span>
          </h2>
          <p className="text-white/50 mb-6 text-sm max-w-lg mx-auto">
            Dejá de invertir en contenido que nadie mira. 
            El UGC auténtico conecta, genera confianza y vende.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/ugc/brand/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-[#d4a968] text-black px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-[#e8c891] transition-all rounded-lg"
              data-testid="cta-register"
            >
              Registrar mi marca
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/595971000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3 text-xs tracking-[0.1em] uppercase font-semibold hover:bg-white/5 transition-all rounded-lg"
              data-testid="cta-contact"
            >
              Contactar
            </a>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
};

export default UGCMarcas;
