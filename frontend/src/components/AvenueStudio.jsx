import React, { useState } from 'react';
import { Camera, Lightbulb, Users, Wifi, Droplet, Tv, Square, ArrowRight, Check, Play, Calendar, Clock, MapPin } from 'lucide-react';

// Studio images with editorial aesthetic
const STUDIO_IMAGES = {
  hero: 'https://images.pexels.com/photos/35465931/pexels-photo-35465931.jpeg?auto=compress&cs=tinysrgb&w=1920',
  equipment: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80',
  lighting: 'https://images.unsplash.com/photo-1431068799455-80bae0caf685?w=800&q=80',
  backdrop: 'https://images.pexels.com/photos/35428098/pexels-photo-35428098.jpeg?auto=compress&cs=tinysrgb&w=800',
  lounge: 'https://images.unsplash.com/photo-1585155802409-ff2950580a9d?w=800&q=80',
  gallery1: 'https://images.pexels.com/photos/35449796/pexels-photo-35449796.jpeg?auto=compress&cs=tinysrgb&w=600',
  gallery2: 'https://images.pexels.com/photos/35432095/pexels-photo-35432095.jpeg?auto=compress&cs=tinysrgb&w=600',
};

const RATES = [
  { hours: '2 horas', price: '250.000', popular: false },
  { hours: '4 horas', price: '450.000', popular: true },
  { hours: '6 horas', price: '650.000', popular: false },
  { hours: '8 horas', price: '800.000', popular: false },
];

const EQUIPMENT = [
  { icon: Lightbulb, title: '6 Luces Godox', desc: 'Iluminación profesional LED de última generación', highlight: true },
  { icon: Camera, title: 'Flash Godox AD600', desc: 'Potencia y precisión para cualquier situación', highlight: true },
  { icon: Square, title: 'Fondo Infinito', desc: 'Múltiples colores disponibles: blanco, negro, gris', highlight: false },
  { icon: Users, title: 'Mesa de Producción', desc: 'Espacio para preparación y maquillaje', highlight: false },
  { icon: Tv, title: 'Smart TV 55"', desc: 'Para referencias y revisión de material', highlight: false },
  { icon: Wifi, title: 'WiFi Alta Velocidad', desc: 'Conexión estable para transferencias', highlight: false },
  { icon: Droplet, title: 'Amenities', desc: 'Agua, café y snacks incluidos', highlight: false },
];

const GALLERY = [
  { src: STUDIO_IMAGES.lighting, label: 'Setup de Iluminación' },
  { src: STUDIO_IMAGES.backdrop, label: 'Fondo Infinito' },
  { src: STUDIO_IMAGES.lounge, label: 'Área de Producción' },
  { src: STUDIO_IMAGES.gallery1, label: 'Sesión Editorial' },
  { src: STUDIO_IMAGES.gallery2, label: 'Fashion Shoot' },
];

export const AvenueStudio = ({ t }) => {
  const [selectedRate, setSelectedRate] = useState(1);

  const handleReserve = () => {
    window.location.href = '/studio/reservar';
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      {/* Hero Section - Full Width Editorial */}
      <section className="relative min-h-[80vh] flex items-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={STUDIO_IMAGES.hero}
            alt="Avenue Studio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-32 w-full">
          <div className="max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-8">
              <a href="/studio" className="text-gray-400 text-sm hover:text-[#d4a968] transition-colors">
                Avenue Studio
              </a>
              <span className="text-gray-600">/</span>
              <span className="text-[#d4a968] text-sm">Alquiler</span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-[1.1]">
              <span className="block">Tu estudio.</span>
              <span className="block italic text-[#d4a968]">Tu visión.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg leading-relaxed">
              50m² de espacio profesional equipado con iluminación Godox, 
              fondos infinitos y todo lo que necesitas para crear.
            </p>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-6 mb-10">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-[#d4a968]" />
                <span className="text-sm">Asunción, Paraguay</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4 text-[#d4a968]" />
                <span className="text-sm">Disponible 7 días</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Camera className="w-4 h-4 text-[#d4a968]" />
                <span className="text-sm">Equipo incluido</span>
              </div>
            </div>

            {/* CTA */}
            <button 
              onClick={handleReserve}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d4a968] text-black font-medium tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <Calendar className="w-5 h-5" />
              <span>Ver Disponibilidad</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Floating Price Badge */}
        <div className="absolute bottom-12 right-12 hidden lg:block">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <p className="text-gray-400 text-sm mb-1">Desde</p>
            <p className="text-4xl font-light text-[#d4a968]">250.000 <span className="text-lg">Gs</span></p>
            <p className="text-gray-400 text-sm">por 2 horas</p>
          </div>
        </div>
      </section>

      {/* Same-day Notice */}
      <section className="py-4 px-6 border-y border-[#d4a968]/30 bg-[#d4a968]/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
          <Calendar className="w-5 h-5 text-[#d4a968]" />
          <p className="text-sm text-gray-300">
            Las reservas online requieren <span className="text-[#d4a968] font-medium">1 día de anticipación</span>. 
            Para reservas del mismo día: 
            <a href="https://wa.me/595973666000" className="text-[#d4a968] ml-1 hover:underline">
              +595 973 666 000
            </a>
          </p>
        </div>
      </section>

      {/* Rates Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-3">
                Elige tu <span className="italic text-[#d4a968]">tiempo</span>
              </h2>
              <p className="text-gray-400 max-w-lg">
                Tarifas flexibles para cada tipo de producción. Todos los paquetes incluyen equipamiento completo.
              </p>
            </div>
          </div>

          {/* Rate Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {RATES.map((rate, index) => (
              <div 
                key={index}
                onClick={() => setSelectedRate(index)}
                className={`relative cursor-pointer rounded-xl p-8 transition-all duration-300 hover:scale-[1.02] ${
                  selectedRate === index 
                    ? 'bg-[#d4a968] text-black' 
                    : 'bg-[#1a1a1a] border border-white/10 hover:border-[#d4a968]/50'
                }`}
              >
                {rate.popular && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-medium ${
                    selectedRate === index ? 'bg-black text-[#d4a968]' : 'bg-[#d4a968] text-black'
                  }`}>
                    Más popular
                  </div>
                )}
                
                <p className={`text-lg mb-6 ${selectedRate === index ? 'text-black/70' : 'text-gray-400'}`}>
                  {rate.hours}
                </p>
                
                <p className={`text-4xl md:text-5xl font-light mb-2 ${selectedRate === index ? 'text-black' : 'text-gray-200'}`}>
                  {rate.price}
                </p>
                <p className={`text-sm ${selectedRate === index ? 'text-black/70' : 'text-gray-500'}`}>
                  Guaraníes
                </p>

                <div className={`mt-6 pt-6 border-t ${selectedRate === index ? 'border-black/20' : 'border-white/10'}`}>
                  <ul className="space-y-2">
                    {['Equipo incluido', 'Asistencia técnica', 'WiFi + Amenities'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${selectedRate === index ? 'text-black' : 'text-[#d4a968]'}`} />
                        <span className={selectedRate === index ? 'text-black/80' : 'text-gray-400'}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Reserve Button */}
          <div className="text-center mt-12">
            <button 
              onClick={handleReserve}
              className="inline-flex items-center gap-3 px-10 py-5 bg-[#d4a968] text-black font-medium text-lg tracking-wide hover:bg-[#c49958] transition-all duration-300"
            >
              <span>Reservar {RATES[selectedRate].hours}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Equipment Section - Editorial Grid */}
      <section className="py-24 px-6 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Image */}
            <div className="relative">
              <img 
                src={STUDIO_IMAGES.equipment}
                alt="Equipamiento"
                className="w-full rounded-lg"
              />
              <div className="absolute -bottom-6 -right-6 bg-[#d4a968] text-black p-6 rounded-lg hidden md:block">
                <p className="text-2xl font-light mb-1">+$5.000</p>
                <p className="text-sm opacity-80">en equipamiento</p>
              </div>
            </div>

            {/* Right - Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
                Equipamiento <span className="italic text-[#d4a968]">profesional</span>
              </h2>
              <p className="text-gray-400 mb-10 leading-relaxed">
                Todo lo que necesitas para una producción de alta calidad. 
                Sin costos adicionales, sin sorpresas.
              </p>

              <div className="space-y-4">
                {EQUIPMENT.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 ${
                        item.highlight 
                          ? 'bg-[#d4a968]/10 border border-[#d4a968]/30' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.highlight ? 'bg-[#d4a968]/20' : 'bg-white/10'
                      }`}>
                        <Icon className="w-5 h-5 text-[#d4a968]" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">{item.title}</h3>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-12 text-center">
            Conoce el <span className="italic text-[#d4a968]">espacio</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {GALLERY.map((item, index) => (
              <div 
                key={index}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg cursor-pointer"
              >
                <img 
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-6 bg-[#111]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-16 text-center">
            ¿Cómo <span className="italic text-[#d4a968]">reservar</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Elige fecha y hora', desc: 'Selecciona el día y horario disponible que mejor se adapte a tu producción' },
              { step: '02', title: 'Confirma tu reserva', desc: 'Realiza el pago del 50% para asegurar tu espacio' },
              { step: '03', title: 'Crea sin límites', desc: 'Llegá al estudio y encontrá todo listo para tu sesión' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                  <span className="text-[#d4a968] text-xl font-light">{item.step}</span>
                </div>
                <h3 className="text-xl text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={STUDIO_IMAGES.backdrop}
            alt="CTA Background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
            Tu próxima <span className="italic text-[#d4a968]">producción</span> empieza aquí
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Reserva ahora y transforma tus ideas en contenido extraordinario
          </p>
          <button 
            onClick={handleReserve}
            className="inline-flex items-center justify-center gap-3 px-12 py-5 bg-[#d4a968] text-black font-medium text-lg tracking-wide hover:bg-[#c49958] transition-all duration-300"
          >
            <Calendar className="w-6 h-6" />
            <span>Reservar Ahora</span>
          </button>
        </div>
      </section>

    </div>
  );
};
