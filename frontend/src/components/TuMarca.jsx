import React, { useState } from 'react';
import { ArrowRight, Check, Store, Camera, Users, Star, Sparkles, Phone, Mail, Building, Send } from 'lucide-react';
import useBuilderModifications from '../hooks/useBuilderModifications';
import { Navbar } from './Navbar';

// Hero images
const HERO_IMAGE = 'https://images.unsplash.com/photo-1676517243531-69e3b27276e9?w=1920&q=80';

const BENEFITS = [
  {
    icon: Store,
    title: 'Espacio Premium',
    description: 'Tu marca en un entorno de lujo, rodeada de las mejores marcas de moda'
  },
  {
    icon: Camera,
    title: 'Contenido Profesional',
    description: 'Acceso a nuestro estudio fotográfico y equipo de producción'
  },
  {
    icon: Users,
    title: 'Comunidad de Creators',
    description: 'Conecta con microinfluencers para campañas de contenido UGC'
  },
  {
    icon: Star,
    title: 'Experiencia Exclusiva',
    description: 'Eventos privados y lanzamientos en un ambiente único'
  }
];

const BRANDS_SHOWCASE = [
  'SEROTONINA', 'FILA', 'PREMIATA', 'SUN68', 'MALVA', 'AGUARA', 'SANTAL'
];

export const TuMarca = ({ t, user, onLoginClick, onLogout, language, setLanguage }) => {
  // Apply saved modifications from website builder
  useBuilderModifications('tu-marca');
  
  const [formData, setFormData] = useState({
    brand_name: '',
    contact_name: '',
    email: '',
    phone: '',
    message: '',
    interest: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/contact/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.detail || 'Error al enviar el mensaje');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <div className="max-w-lg w-full">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10 p-10 text-center">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4a968]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#d4a968] flex items-center justify-center">
                <Check className="w-10 h-10 text-black" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-light text-white mb-2">
                ¡Mensaje <span className="italic text-[#d4a968]">Enviado</span>!
              </h2>
              <p className="text-gray-400 mb-8">
                Gracias por tu interés en ser parte de Avenue
              </p>
              
              <p className="text-gray-500 text-sm mb-8">
                Nuestro equipo se pondrá en contacto contigo pronto.
              </p>
              
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors"
              >
                Volver al Inicio
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center pt-16">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE} alt="Tu marca en Avenue" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/50" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full py-32">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-px bg-[#d4a968]"></div>
              <span className="text-[#d4a968] text-sm tracking-[0.2em] uppercase">Para Marcas</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[0.95]">
              <span className="block">Tu marca en</span>
              <span className="block italic text-[#d4a968]">Avenue.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl leading-relaxed">
              Un concepto premium donde las marcas brillan. Descubre cómo tu marca puede formar parte de este espacio único en Asunción.
            </p>
            
            <a 
              href="#contact-form"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <span>Quiero saber más</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section className="py-8 border-y border-white/10 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...BRANDS_SHOWCASE, ...BRANDS_SHOWCASE, ...BRANDS_SHOWCASE].map((brand, index) => (
            <span 
              key={index}
              className="mx-12 text-2xl font-light text-white/20"
            >
              {brand}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.33%); }
          }
          .animate-marquee {
            animation: marquee 20s linear infinite;
          }
        `}</style>
      </section>

      {/* Why Avenue */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              ¿Por qué <span className="italic text-[#d4a968]">Avenue</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Un espacio diseñado para marcas que buscan destacar en un entorno premium
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index}
                  className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-[#d4a968]/50 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#d4a968]/20 flex items-center justify-center mb-6 group-hover:bg-[#d4a968]/30 transition-colors">
                    <Icon className="w-7 h-7 text-[#d4a968]" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-3">{benefit.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                Lo que <span className="italic text-[#d4a968]">ofrecemos</span>
              </h2>
              
              <div className="space-y-6">
                {[
                  'Espacio de venta en nuestra tienda física premium',
                  'Presencia en nuestra tienda online Avenue Online',
                  'Sesiones fotográficas en nuestro estudio profesional',
                  'Campañas con microinfluencers y creadores de contenido',
                  'Eventos exclusivos de lanzamiento y activaciones',
                  'Marketing digital y promoción en redes sociales'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-[#d4a968]" />
                    </div>
                    <p className="text-gray-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                alt="Avenue Store"
                className="w-full rounded-2xl"
              />
              <div className="absolute -bottom-6 -left-6 p-6 rounded-xl bg-[#d4a968] hidden lg:block">
                <p className="text-black font-medium text-lg">30+</p>
                <p className="text-black/70 text-sm">Marcas confían en nosotros</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="py-24 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Hablemos de tu <span className="italic text-[#d4a968]">marca</span>
            </h2>
            <p className="text-gray-400">
              Completa el formulario y nuestro equipo se pondrá en contacto contigo
            </p>
          </div>
          
          <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10">
            <div className="p-8 md:p-10">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 text-gray-400">
                      <Building className="w-4 h-4 inline mr-2" />
                      Nombre de la Marca *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brand_name}
                      onChange={(e) => updateField('brand_name', e.target.value)}
                      className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="Tu marca"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-400">
                      Nombre de Contacto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_name}
                      onChange={(e) => updateField('contact_name', e.target.value)}
                      className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 text-gray-400">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-400">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors"
                      placeholder="+595 9XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-400">
                    ¿Qué te interesa? *
                  </label>
                  <select
                    required
                    value={formData.interest}
                    onChange={(e) => updateField('interest', e.target.value)}
                    className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white focus:border-[#d4a968] focus:outline-none transition-colors"
                  >
                    <option value="" className="bg-[#1a1a1a]">Seleccionar</option>
                    <option value="venta_tienda" className="bg-[#1a1a1a]">Venta en tienda física</option>
                    <option value="tienda_online" className="bg-[#1a1a1a]">Presencia en tienda online</option>
                    <option value="estudio" className="bg-[#1a1a1a]">Sesiones fotográficas</option>
                    <option value="ugc" className="bg-[#1a1a1a]">Campañas con creators/UGC</option>
                    <option value="eventos" className="bg-[#1a1a1a]">Eventos y activaciones</option>
                    <option value="todo" className="bg-[#1a1a1a]">Todo lo anterior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-400">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="w-full p-4 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors resize-none"
                    placeholder="Cuéntanos más sobre tu marca y lo que buscas..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium text-lg rounded-lg transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Enviar Mensaje</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4a968]/10 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            ¿Prefieres hablar <span className="italic text-[#d4a968]">directamente</span>?
          </h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
            Nuestro equipo está disponible para resolver tus dudas por WhatsApp
          </p>
          
          <a 
            href="https://wa.me/595973666000?text=Hola!%20Me%20interesa%20saber%20más%20sobre%20cómo%20mi%20marca%20puede%20estar%20en%20Avenue"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#d4a968] text-black font-medium text-lg tracking-wide hover:bg-[#c49958] transition-all duration-300"
          >
            <Phone className="w-5 h-5" />
            <span>Contactar por WhatsApp</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
