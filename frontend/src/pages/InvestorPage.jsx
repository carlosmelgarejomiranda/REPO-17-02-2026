import React from 'react';
import { 
  TrendingUp, Users, ShoppingBag, Camera, Sparkles, Building, 
  Target, Rocket, Globe, DollarSign, Award, ChevronRight,
  ArrowUpRight, CheckCircle, MapPin, Calendar, Star
} from 'lucide-react';

const InvestorPage = () => {
  // Key metrics (these would ideally come from an API)
  const metrics = {
    gmv: '500M+',
    creators: '150+',
    brands: '45+',
    campaigns: '80+',
    studioBookings: '200+',
    yoyGrowth: '180%'
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4a968]/20 via-transparent to-purple-500/10" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a968]/10 border border-[#d4a968]/30 text-[#d4a968] text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-[#d4a968] animate-pulse" />
              Documento Confidencial - Solo Inversores
            </div>
            <h1 className="text-5xl md:text-7xl font-light mb-6">
              <span className="text-[#d4a968]">Avenue</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              La primera plataforma integral de <span className="text-white">posicionamiento y visibilidad</span> para marcas de moda en Paraguay
            </p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'GMV Anual', value: metrics.gmv, suffix: 'Gs', icon: DollarSign },
              { label: 'Creadores UGC', value: metrics.creators, icon: Users },
              { label: 'Marcas Activas', value: metrics.brands, icon: Building },
              { label: 'Campañas', value: metrics.campaigns, icon: Sparkles },
              { label: 'Reservas Studio', value: metrics.studioBookings, icon: Camera },
              { label: 'Crecimiento YoY', value: metrics.yoyGrowth, icon: TrendingUp }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <stat.icon className="w-6 h-6 text-[#d4a968] mb-3" />
                <p className="text-3xl font-light text-white">{stat.value}</p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Story */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-1 bg-[#d4a968]" />
            <h2 className="text-2xl font-light">Nuestra Historia</h2>
          </div>
          
          <div className="space-y-6 text-lg text-white/70 leading-relaxed">
            <p>
              <span className="text-white font-medium">Avenue nació como un showroom físico</span> de moda femenina en Asunción, 
              representando marcas premium internacionales. Lo que comenzó como un espacio de exhibición 
              evolucionó hacia algo más grande cuando identificamos una oportunidad única en el mercado paraguayo.
            </p>
            <p>
              Las marcas que exhibíamos tenían un problema común: <span className="text-[#d4a968]">necesitaban visibilidad y contenido de calidad</span>, 
              pero no tenían las herramientas ni conexiones para lograrlo de manera eficiente. Esto nos llevó a construir 
              una plataforma integral que resuelve toda la cadena de valor del posicionamiento de marcas.
            </p>
          </div>

          {/* Timeline */}
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            {[
              { year: '2021', title: 'Showroom Físico', desc: 'Inicio como espacio de exhibición para marcas internacionales' },
              { year: '2022', title: 'Avenue Studio', desc: 'Lanzamiento del estudio fotográfico profesional' },
              { year: '2023', title: 'E-commerce', desc: 'Plataforma de venta online con 4000+ productos' },
              { year: '2024', title: 'UGC Platform', desc: 'Conexión de marcas con creadores de contenido' }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-[#d4a968] text-sm font-medium mb-2">{item.year}</div>
                <h4 className="text-white font-medium mb-1">{item.title}</h4>
                <p className="text-white/50 text-sm">{item.desc}</p>
                {i < 3 && <ChevronRight className="hidden md:block absolute right-0 top-1/2 w-5 h-5 text-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Platform */}
      <section className="py-16 px-6 bg-gradient-to-b from-transparent to-[#111111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-1 bg-[#d4a968]" />
            <h2 className="text-2xl font-light">La Plataforma</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* E-commerce */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <ShoppingBag className="w-10 h-10 text-blue-400 mb-6" />
              <h3 className="text-xl font-medium text-white mb-3">E-commerce</h3>
              <p className="text-white/60 mb-6">
                Tienda online con más de 4,000 productos de moda femenina. Marketplace que conecta 
                marcas internacionales con consumidores paraguayos.
              </p>
              <div className="space-y-2">
                {['4,000+ SKUs activos', 'Integración con pasarelas locales', 'Logística propia'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Studio */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/20">
              <Camera className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-xl font-medium text-white mb-3">Avenue Studio</h3>
              <p className="text-white/60 mb-6">
                Estudio fotográfico profesional para producción de contenido. Equipamiento de primer 
                nivel y sets versátiles para todo tipo de sesiones.
              </p>
              <div className="space-y-2">
                {['Reservas online automatizadas', 'Equipamiento profesional', 'Sets temáticos'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* UGC Platform */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-600/5 border border-purple-500/20">
              <Sparkles className="w-10 h-10 text-purple-400 mb-6" />
              <h3 className="text-xl font-medium text-white mb-3">UGC Platform</h3>
              <p className="text-white/60 mb-6">
                Plataforma que conecta marcas con creadores de contenido. Sistema de campañas, 
                entregables y métricas de performance integrado.
              </p>
              <div className="space-y-2">
                {['Red de 150+ creadores', 'Sistema de métricas', 'Gestión de campañas'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/50">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-16 px-6 bg-[#111111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-1 bg-[#d4a968]" />
            <h2 className="text-2xl font-light">Oportunidad de Mercado</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Globe className="w-8 h-8 text-[#d4a968] mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">Paraguay: Mercado Emergente</h4>
                <p className="text-white/60">
                  Con una economía en crecimiento y una penetración digital acelerada post-pandemia, 
                  Paraguay presenta una oportunidad única para plataformas de e-commerce y marketing digital.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Target className="w-8 h-8 text-[#d4a968] mb-4" />
                <h4 className="text-lg font-medium text-white mb-2">Gap en el Mercado</h4>
                <p className="text-white/60">
                  No existe una solución integral que combine e-commerce, producción de contenido 
                  y conexión con creadores bajo un mismo ecosistema en el mercado local.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#d4a968]/10 to-[#d4a968]/5 border border-[#d4a968]/30">
              <h4 className="text-xl font-medium text-[#d4a968] mb-6">Ventaja Competitiva</h4>
              <div className="space-y-4">
                {[
                  { title: 'First Mover', desc: 'Primera plataforma UGC del país' },
                  { title: 'Ecosistema Integrado', desc: 'E-commerce + Studio + UGC en un solo lugar' },
                  { title: 'Red Establecida', desc: '150+ creadores activos y creciendo' },
                  { title: 'Infraestructura', desc: 'Estudio físico y operación logística propia' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-[#d4a968] mt-0.5" />
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-white/50 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Model */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-1 bg-[#d4a968]" />
            <h2 className="text-2xl font-light">Modelo de Ingresos</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                title: 'E-commerce', 
                revenue: '60%', 
                model: 'Margen sobre ventas',
                desc: 'Venta de productos de moda con markup'
              },
              { 
                title: 'UGC Subscriptions', 
                revenue: '25%', 
                model: 'SaaS + Comisión',
                desc: 'Planes mensuales para marcas + fee por campaña'
              },
              { 
                title: 'Studio Rental', 
                revenue: '10%', 
                model: 'Por hora/sesión',
                desc: 'Alquiler de estudio y equipamiento'
              },
              { 
                title: 'Brand Services', 
                revenue: '5%', 
                model: 'Fee por proyecto',
                desc: 'Consultoría y producción para marcas aliadas'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#d4a968]/30 transition-colors">
                <p className="text-3xl font-light text-[#d4a968] mb-2">{item.revenue}</p>
                <h4 className="text-white font-medium mb-1">{item.title}</h4>
                <p className="text-white/40 text-sm mb-3">{item.model}</p>
                <p className="text-white/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 px-6 bg-gradient-to-t from-[#111111] to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <Rocket className="w-12 h-12 text-[#d4a968] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
            Visión a 3 Años
          </h2>
          <p className="text-xl text-white/60 mb-12">
            Convertirnos en la plataforma de referencia para el posicionamiento de marcas 
            en el Cono Sur, expandiendo nuestro modelo a Argentina, Uruguay y Bolivia.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { year: 'Año 1', goals: ['500+ creadores', '100+ marcas activas', 'Break-even operativo'] },
              { year: 'Año 2', goals: ['Expansión regional', '10,000+ SKUs', 'App móvil para creadores'] },
              { year: 'Año 3', goals: ['Presencia en 4 países', 'Marketplace B2B', 'Series A'] }
            ].map((phase, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#d4a968] font-medium mb-4">{phase.year}</p>
                <ul className="space-y-2">
                  {phase.goals.map((goal, j) => (
                    <li key={j} className="flex items-center gap-2 text-white/70 text-sm">
                      <ArrowUpRight className="w-4 h-4 text-[#d4a968]" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team & Contact */}
      <section className="py-16 px-6 bg-[#111111] border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-light text-white mb-8">Contacto</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <MapPin className="w-5 h-5 text-[#d4a968]" />
              <span className="text-white/70">Asunción, Paraguay</span>
            </div>
            <a 
              href="mailto:avenuepy@gmail.com" 
              className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#d4a968] text-black hover:bg-[#c49958] transition-colors"
            >
              <span className="font-medium">avenuepy@gmail.com</span>
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d4a968] flex items-center justify-center">
              <span className="text-black font-bold">A</span>
            </div>
            <span className="text-white/40 text-sm">Avenue © {new Date().getFullYear()}</span>
          </div>
          <p className="text-white/30 text-sm">Documento confidencial - Solo para inversores autorizados</p>
        </div>
      </footer>
    </div>
  );
};

export default InvestorPage;
