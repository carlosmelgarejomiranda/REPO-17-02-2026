import React from 'react';
import { Instagram, MapPin, Clock } from 'lucide-react';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const Footer = ({ t }) => {
  return (
    <footer className="py-20 px-6 border-t border-white/10 bg-[#000000]">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-12 gap-12 items-start">
          {/* Logo & Description - Takes 3 columns */}
          <div className="md:col-span-3">
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">Avenue</h4>
            <p className="text-gray-500 text-xs leading-relaxed max-w-sm tracking-[0.1em] uppercase">
              Un concepto premium donde las marcas brillan y el contenido cobra vida.
            </p>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-3"></div>

          {/* Links - Takes 2 columns */}
          <div className="md:col-span-2">
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">Explorar</h4>
            <ul className="space-y-4">
              <li><a href="/shop" className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors">E-commerce</a></li>
              <li><a href="/studio" className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors">Studio</a></li>
              <li><a href="/studio/ugc" className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors">UGC Creators</a></li>
              <li><a href="/tu-marca" className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors">Para Marcas</a></li>
            </ul>
          </div>

          {/* Contact - Takes 2 columns */}
          <div className="md:col-span-2">
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">Contacto</h4>
            <ul className="space-y-4">
              {/* WhatsApp Comercial */}
              <li>
                <a 
                  href="https://wa.me/595973666000" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors flex items-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Comercial: +595 973 666 000
                </a>
              </li>
              {/* WhatsApp Marcas */}
              <li>
                <a 
                  href="https://wa.me/595976691520" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors flex items-center gap-2"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Marcas: +595 976 691 520
                </a>
              </li>
              {/* Instagram */}
              <li>
                <a 
                  href="https://instagram.com/avenue.py" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  @avenue.py
                </a>
              </li>
              {/* Ubicación */}
              <li>
                <a 
                  href="https://maps.google.com/?q=Paseo+Los+Árboles,+Asunción,+Paraguay" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 text-xs tracking-[0.1em] uppercase hover:text-white transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Paseo Los Árboles, Asunción
                </a>
              </li>
            </ul>
          </div>

          {/* Horarios - Takes 2 columns */}
          <div className="md:col-span-2">
            <h4 className="text-[#d4a968] text-xs font-medium tracking-[0.2em] uppercase mb-6">Horarios</h4>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500 text-xs tracking-[0.1em] uppercase">Lunes a Sábado</p>
                <p className="text-gray-400 text-xs tracking-[0.1em] uppercase mt-1">9:00 - 21:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs tracking-[0.1em] uppercase">
            © {new Date().getFullYear()} Avenue. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-8">
            <a href="https://instagram.com/avenue.py" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-xs tracking-[0.1em] uppercase">Instagram</a>
            <a href="https://tiktok.com/@avenue.py" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-xs tracking-[0.1em] uppercase">TikTok</a>
            <a href="https://wa.me/595973666000" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#d4a968] transition-colors text-xs tracking-[0.1em] uppercase">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
