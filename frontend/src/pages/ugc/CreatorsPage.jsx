import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Users, Gift, Star, TrendingUp, Award, CheckCircle,
  Instagram, Music2, Camera, Sparkles, Heart, Eye, MapPin
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

const CreatorsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ugc/campaigns/available?limit=6`
      );
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const benefits = [
    {
      icon: Gift,
      title: 'Canjes Exclusivos',
      desc: 'Accedé a productos y experiencias de marcas premium'
    },
    {
      icon: Star,
      title: 'Sistema de Reputación',
      desc: 'Construí tu perfil con ratings y métricas verificadas'
    },
    {
      icon: TrendingUp,
      title: 'Crecé como Creador',
      desc: 'Subí de nivel y accedé a campañas más premium'
    },
    {
      icon: Award,
      title: 'Rankings y Badges',
      desc: 'Competí con otros creadores y destacate'
    },
    {
      icon: Camera,
      title: 'Libertad Creativa',
      desc: 'Creá contenido auténtico con tu estilo'
    },
    {
      icon: CheckCircle,
      title: 'Proceso Claro',
      desc: 'Sabés exactamente qué se espera y cuándo'
    }
  ];

  const levels = [
    { name: 'Rookie', color: 'from-gray-500 to-gray-600', desc: 'Recién empezás' },
    { name: 'Trusted', color: 'from-blue-500 to-blue-600', desc: '3+ campañas, buen rating' },
    { name: 'Pro', color: 'from-purple-500 to-purple-600', desc: '10+ campañas, métricas altas' },
    { name: 'Elite', color: 'from-[#d4a968] to-amber-600', desc: 'Top performers' }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/20" />
        
        <div className="relative max-w-5xl mx-auto">
          <Link to="/studio/ugc" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Volver a UGC
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <p className="text-purple-400 text-sm font-medium tracking-[0.2em] uppercase">Para Creadores</p>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-light mb-6 leading-tight">
            Colaborá con<br />
            <span className="italic text-purple-400">marcas increíbles</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed">
            Aplicá a campañas de marcas premium, creá contenido auténtico 
            y recibí canjes exclusivos. Construí tu reputación como creador UGC.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link 
              to="/ugc/select-role"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-all"
            >
              Registrarme como Creator
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#campaigns"
              className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-lg hover:border-purple-400 hover:text-purple-400 transition-all"
            >
              Ver campañas
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-4">
            ¿Por qué ser parte de <span className="italic text-purple-400">Avenue UGC</span>?
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            No es solo crear contenido. Es construir tu carrera como creador.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-4">
            Sistema de <span className="italic text-purple-400">niveles</span>
          </h2>
          <p className="text-gray-400 text-center mb-16">
            Subí de nivel completando campañas y mejorando tu performance
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {levels.map((level, idx) => (
              <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                  <Award className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-medium mb-1">{level.name}</h3>
                <p className="text-gray-500 text-sm">{level.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-16">
            Cómo <span className="italic text-purple-400">funciona</span>
          </h2>

          <div className="space-y-6">
            {[
              { num: '01', title: 'Creá tu perfil', desc: 'Conectá tus redes sociales y elegí tus categorías' },
              { num: '02', title: 'Explorá campañas', desc: 'Filtrá por ciudad, categoría y tipo de canje' },
              { num: '03', title: 'Aplicá', desc: 'Postulate a las campañas que te interesen' },
              { num: '04', title: 'Creá contenido', desc: 'Si te seleccionan, creá tu contenido auténtico' },
              { num: '05', title: 'Subí métricas', desc: 'Compartí el performance de tu contenido' },
              { num: '06', title: 'Crecé', desc: 'Mejorá tu reputación y accedé a más campañas' }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start p-6 bg-white/5 rounded-xl">
                <span className="text-3xl font-light text-purple-400">{step.num}</span>
                <div>
                  <h3 className="text-lg font-medium mb-1">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campaigns */}
      <section id="campaigns" className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-light mb-2">
                Campañas <span className="italic text-purple-400">disponibles</span>
              </h2>
              <p className="text-gray-400">Explorá las oportunidades actuales</p>
            </div>
            <Link 
              to="/ugc/campaigns"
              className="hidden md:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
              <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Próximamente</h3>
              <p className="text-gray-400 mb-6">Estamos preparando nuevas campañas increíbles</p>
              <Link 
                to="/ugc/select-role"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
              >
                Registrarme para ser notificado
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/ugc/campaigns/${campaign.id}`}
                  className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all"
                >
                  {/* Brand */}
                  <div className="flex items-center gap-3 mb-4">
                    {campaign.brand?.logo_url ? (
                      <img
                        src={campaign.brand.logo_url}
                        alt={campaign.brand.company_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 font-medium">
                          {campaign.brand?.company_name?.charAt(0) || 'M'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium">{campaign.brand?.company_name}</span>
                      <p className="text-xs text-gray-500">{campaign.category}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-medium mb-2 group-hover:text-purple-400 transition-colors">
                    {campaign.name}
                  </h3>

                  {/* Canje */}
                  <div className="p-3 bg-purple-500/10 rounded-lg mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Canje:</span>
                      <span className="text-purple-400 font-medium">
                        {campaign.canje?.type === 'product' ? 'Producto' : 'Experiencia'}
                      </span>
                    </div>
                    <p className="text-sm text-white mt-1">{campaign.canje?.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Valor: {formatPrice(campaign.canje?.value)}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {campaign.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.slots_available}/{campaign.slots}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link 
              to="/ugc/campaigns"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              Ver todas las campañas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-light mb-6">
            ¿Listo para <span className="italic text-purple-400">empezar</span>?
          </h2>
          <p className="text-gray-400 mb-10">
            Registrate y empezá a colaborar con marcas increíbles
          </p>
          
          <Link 
            to="/ugc/select-role"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:opacity-90 transition-all"
          >
            Registrarme como Creator
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CreatorsPage;
