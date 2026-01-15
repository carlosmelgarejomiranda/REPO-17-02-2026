import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Users, Gift, Star, TrendingUp, Award, CheckCircle,
  Camera, Sparkles, ArrowLeft, UserPlus, Send, Zap, MapPin, Package,
  Calendar, Eye, Instagram
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { getApiUrl } from '../../utils/api';

const API_URL = getApiUrl();

const CreatorsPage = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async (retryCount = 0) => {
    try {
      setFetchError(false);
      const res = await fetch(`${API_URL}/api/ugc/campaigns/available`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      // Retry once after 1 second if first attempt fails
      if (retryCount < 1) {
        setTimeout(() => fetchCampaigns(retryCount + 1), 1000);
      } else {
        setFetchError(true);
      }
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const levels = [
    { name: 'Rookie', color: 'from-gray-400 to-gray-500', desc: 'Recién empezás', icon: '🌱' },
    { name: 'Trusted', color: 'from-blue-400 to-blue-500', desc: '3+ campañas completadas', icon: '⭐' },
    { name: 'Pro', color: 'from-purple-400 to-purple-500', desc: '10+ campañas, métricas altas', icon: '🚀' },
    { name: 'Elite', color: 'from-[#d4a968] to-amber-500', desc: 'Top performers', icon: '👑' }
  ];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });
  };

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

      {/* ============== HERO ============== */}
      <section className="relative min-h-[50vh] flex items-center justify-center pt-16">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://customer-assets.emergentagent.com/job_one-account/artifacts/tk0opl7n_influencer%20ugc%201.webp"
            alt="Creator"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/70 to-[#0a0a0a]" />
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
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-medium text-purple-400 tracking-[0.15em] uppercase">
              Para Creators
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1]">
            Creá contenido para <br className="hidden sm:block" />
            <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">marcas reales</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white/60 mb-8 max-w-xl mx-auto">
            Colaborá con marcas premium por canjes. Construí tu track record 
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

      {/* ============== CAMPAÑAS ACTIVAS ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Oportunidades reales
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Campañas <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">activas</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Estas son las marcas que están buscando creators como vos ahora mismo
            </p>
          </div>

          {loadingCampaigns ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : fetchError ? (
            <div className="text-center py-12 px-6 bg-[#121212] rounded-xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Error al cargar campañas</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                Hubo un problema al cargar las campañas. Por favor intenta de nuevo.
              </p>
              <button
                onClick={() => {
                  setLoadingCampaigns(true);
                  fetchCampaigns();
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
              >
                Reintentar
              </button>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.slice(0, 6).map((campaign) => (
                <div 
                  key={campaign.id}
                  className="group p-5 bg-[#121212] rounded-xl border border-white/5 hover:border-purple-500/30 transition-all"
                  data-testid={`campaign-card-${campaign.id}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {campaign.brand?.logo_url ? (
                        <img 
                          src={campaign.brand.logo_url} 
                          alt={campaign.brand?.company_name || 'Brand'} 
                          className="w-10 h-10 rounded-lg object-cover bg-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-medium text-sm">{campaign.name}</h3>
                        <p className="text-white/50 text-xs">{campaign.brand?.company_name || 'Marca'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] uppercase font-medium rounded">
                      Activa
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4">
                    {campaign.city && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{campaign.city}</span>
                      </div>
                    )}
                    {campaign.deadline && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Hasta {formatDate(campaign.deadline)}</span>
                      </div>
                    )}
                    {campaign.requirements?.platforms && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Instagram className="w-3.5 h-3.5" />
                        <span>{campaign.requirements.platforms.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Canje */}
                  {campaign.canje && (
                    <div className="p-3 bg-purple-500/10 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-400 text-xs font-medium">Canje</span>
                      </div>
                      <p className="text-white/70 text-xs">
                        {campaign.canje.description || 'Producto de la marca'}
                      </p>
                    </div>
                  )}

                  {/* Slots - Only show if 1 or 2 left */}
                  {campaign.slots_available !== undefined && campaign.slots_available > 0 && campaign.slots_available <= 2 && (
                    <div className="flex items-center justify-between text-xs mb-4 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <span className="text-orange-400 font-medium">¡Últimos cupos!</span>
                      <span className="text-orange-300 font-medium">
                        {campaign.slots_available === 1 ? '1 cupo' : `${campaign.slots_available} cupos`}
                      </span>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    to={user ? `/ugc/campaigns/${campaign.id}` : '/ugc/creator/onboarding'}
                    className="block w-full text-center py-2.5 text-xs font-medium uppercase tracking-wider bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all rounded-lg"
                  >
                    {user ? 'Ver detalles' : 'Registrarme para aplicar'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-[#121212] rounded-xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-2">Próximamente nuevas campañas</h3>
              <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                Registrate ahora para ser de los primeros en enterarte cuando lancemos nuevas oportunidades de colaboración con marcas.
              </p>
              <Link
                to="/ugc/creator/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 text-xs tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-all rounded-lg"
              >
                <UserPlus className="w-4 h-4" />
                Registrarme
              </Link>
            </div>
          )}

          {/* Ver todas las campañas */}
          {campaigns.length > 0 && (
            <div className="text-center mt-8">
              <Link
                to="/ugc/campaigns"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                Ver todas las campañas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
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
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Cómo <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">funciona</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Registrate', desc: 'Creá tu perfil de creator con tus redes y métricas' },
              { step: '02', title: 'Explorá', desc: 'Mirá las campañas activas y elegí las que te gusten' },
              { step: '03', title: 'Aplicá', desc: 'Postulate a las campañas que encajen con tu perfil' },
              { step: '04', title: 'Creá', desc: 'Si te seleccionan, recibí el producto y creá contenido' }
            ].map((item, idx) => (
              <div key={idx} className="p-5 bg-[#121212] rounded-lg border border-white/5 text-center">
                <div className="text-purple-400/30 text-3xl font-light mb-3">{item.step}</div>
                <h4 className="text-white font-medium mb-1 text-sm">{item.title}</h4>
                <p className="text-white/50 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== LEVELS ============== */}
      <section className="py-12 md:py-16 px-6 bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Sistema de niveles
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Crecé como <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">creator</span>
            </h2>
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Tu track record te abre puertas. Cada campaña completada suma a tu reputación.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {levels.map((level, idx) => (
              <div 
                key={idx}
                className="p-4 bg-[#121212] rounded-lg border border-white/5 text-center"
              >
                <div className="text-2xl mb-2">{level.icon}</div>
                <div className={`text-sm font-semibold bg-gradient-to-r ${level.color} bg-clip-text text-transparent mb-1`}>
                  {level.name}
                </div>
                <p className="text-white/40 text-xs">{level.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== BENEFITS ============== */}
      <section className="py-12 md:py-16 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-purple-400 text-[10px] tracking-[0.2em] uppercase font-medium mb-3 block">
              Beneficios
            </span>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              ¿Por qué <span className="italic bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Avenue UGC</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Gift, title: 'Productos reales', desc: 'Recibí productos de marcas premium para crear contenido' },
              { icon: Award, title: 'Perfil verificado', desc: 'Construí credibilidad con métricas verificadas por IA' },
              { icon: Users, title: 'Red de contactos', desc: 'Conectá con marcas y otros creators' },
              { icon: CheckCircle, title: 'Flexibilidad', desc: 'Elegís las campañas que te interesan' },
              { icon: TrendingUp, title: 'Sin mínimos', desc: 'No necesitás miles de seguidores para empezar' },
              { icon: Zap, title: 'Proceso simple', desc: 'Aplicá en minutos, sin burocracia' }
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
