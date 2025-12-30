import React from 'react';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';
import { Instagram, MapPin } from 'lucide-react';
import { Button } from './ui/button';

export const Footer = ({ t }) => {
  const socialLinks = [
    {
      icon: Instagram,
      label: 'Instagram',
      url: 'https://instagram.com/avenuepy',
      handle: '@avenuepy'
    },
    {
      icon: FaTiktok,
      label: 'TikTok',
      url: 'https://tiktok.com/@avenue_py',
      handle: '@avenue_py'
    }
  ];

  const contactOptions = [
    {
      icon: FaWhatsapp,
      label: t.footer.brands,
      url: 'https://wa.me/595976691520',
      text: '+595 976 691 520'
    },
    {
      icon: FaWhatsapp,
      label: t.footer.delivery,
      url: 'https://wa.me/595973666000',
      text: '+595 973 666 000'
    }
  ];

  return (
    <footer className="py-10 px-6 relative" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#d4a968' }}></div>
      
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
                alt="Avenue"
                className="h-4"
                style={{
                  transform: 'scale(8)',
                  transformOrigin: 'left center',
                  filter: 'drop-shadow(0 2px 8px rgba(212, 169, 104, 0.3))'
                }}
              />
            </div>
            <p className="text-xs font-light leading-relaxed" 
               style={{ 
                 color: '#ead7c8',
                 fontFamily: 'var(--font-secondary)'
               }}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-light mb-3 italic" 
                style={{ 
                  color: '#d4a968',
                  fontFamily: 'var(--font-primary)'
                }}>
              WhatsApp
            </h4>
            <div className="space-y-2">
              {contactOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <a
                    key={index}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                  >
                    <Icon className="w-3 h-3" style={{ color: '#d4a968' }} />
                    <div>
                      <p className="text-xs font-light" 
                         style={{ 
                           color: '#ead7c8',
                           fontFamily: 'var(--font-secondary)'
                         }}>
                        {option.label}: <span style={{ color: '#f5ede4' }}>{option.text}</span>
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Social & Location */}
          <div>
            <h4 className="text-sm font-light mb-3 italic" 
                style={{ 
                  color: '#d4a968',
                  fontFamily: 'var(--font-primary)'
                }}>
              {t.footer.follow}
            </h4>
            <div className="flex gap-2 mb-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-transform hover:scale-110"
                  >
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="rounded-full border w-8 h-8"
                      style={{ 
                        borderColor: '#d4a968',
                        backgroundColor: 'transparent',
                        color: '#d4a968'
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                );
              })}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#d4a968' }} />
              <p className="text-xs font-light" 
                 style={{ 
                   color: '#ead7c8',
                   fontFamily: 'var(--font-secondary)'
                 }}>
                Paseo Los Árboles, Av. San Martín, Asunción
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: 'rgba(212, 169, 104, 0.2)' }}>
          <p className="text-center text-xs font-light" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)',
               letterSpacing: '0.03em'
             }}>
            © {new Date().getFullYear()} {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};