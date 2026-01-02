import React from 'react';
import { Instagram, Facebook, ArrowRight, MapPin, Phone, Mail } from 'lucide-react';

export const Footer = ({ t }) => {
  const socialLinks = [
    { icon: Instagram, url: 'https://instagram.com/avenue.py', label: 'Instagram' },
    { icon: Facebook, url: 'https://facebook.com/avenue.py', label: 'Facebook' },
  ];

  const contactOptions = [
    { label: 'Tienda', text: '+595 973 666 000', url: 'https://wa.me/595973666000' },
    { label: 'Studio', text: '+595 973 666 001', url: 'https://wa.me/595973666001' },
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
              alt="Avenue"
              className="h-6 mb-6"
              style={{ filter: 'brightness(1.1)' }}
            />
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
              {t?.footer?.tagline || 'Un concepto premium donde las marcas brillan y el contenido cobra vida.'}
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:border-[#d4a968] hover:text-[#d4a968] transition-all duration-300"
                    aria-label={social.label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">
              Explorar
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="/shop" className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2 group">
                  E-commerce
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="/studio" className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2 group">
                  Avenue Studio
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="/studio/ugc" className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2 group">
                  UGC Creators
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
              <li>
                <a href="/tu-marca" className="text-gray-400 text-sm hover:text-white transition-colors inline-flex items-center gap-2 group">
                  Para Marcas
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">
              WhatsApp
            </h4>
            <div className="space-y-4">
              {contactOptions.map((option, index) => (
                <a
                  key={index}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#d4a968]/20 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-[#d4a968]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{option.label}</p>
                    <p className="text-sm">{option.text}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Location Column */}
          <div>
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">
              Ubicación
            </h4>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#d4a968]" />
              </div>
              <div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Paseo Los Árboles<br />
                  Av. San Martín<br />
                  Asunción, Paraguay
                </p>
              </div>
            </div>
            
            {/* Schedule */}
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Horario</p>
              <p className="text-sm text-gray-300">Lun - Sáb: 10:00 - 20:00</p>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-10 px-8 rounded-2xl bg-gradient-to-r from-[#d4a968]/10 to-transparent border border-white/10 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-light text-white mb-2">
                Mantente <span className="italic text-[#d4a968]">conectad@</span>
              </h3>
              <p className="text-gray-500 text-sm">Recibe novedades de campañas y nuevas colecciones</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input 
                type="email"
                placeholder="tu@email.com"
                className="flex-1 md:w-64 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-[#d4a968] focus:outline-none transition-colors text-sm"
              />
              <button className="px-6 py-3 bg-[#d4a968] text-black font-medium rounded-lg hover:bg-[#c49958] transition-colors flex items-center gap-2">
                <span className="hidden sm:inline">Suscribir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Avenue. {t?.footer?.rights || 'Todos los derechos reservados.'}
          </p>
          <div className="flex items-center gap-6">
            <a href="https://instagram.com/avenue.py" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">
              Instagram
            </a>
            <a href="https://tiktok.com/@avenue.py" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">
              TikTok
            </a>
            <a href="https://wa.me/595973666000" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-sm">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
