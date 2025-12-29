import React from 'react';
import { Instagram, Music, Phone, MapPin } from 'lucide-react';
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
      icon: Music,
      label: 'TikTok',
      url: 'https://tiktok.com/@avenue_py',
      handle: '@avenue_py'
    }
  ];

  const contactOptions = [
    {
      icon: Phone,
      label: t.footer.brands,
      url: 'https://wa.me/595976691520',
      text: '+595 976 691 520'
    },
    {
      icon: Phone,
      label: t.footer.delivery,
      url: 'https://wa.me/595973666000',
      text: '+595 973 666 000'
    }
  ];

  return (
    <footer className="py-20 px-6 relative" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: '#d4a968' }}></div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/c4c09402_AVENUE%20DOURADO.jpg"
              alt="Avenue"
              className="h-12 mb-6"
              style={{
                filter: 'brightness(1.3) contrast(1.5)',
                mixBlendMode: 'screen'
              }}
            />
            <p className="text-sm font-light leading-relaxed" 
               style={{ 
                 color: '#ead7c8',
                 fontFamily: 'var(--font-secondary)'
               }}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base font-light mb-6 italic" 
                style={{ 
                  color: '#d4a968',
                  fontFamily: 'var(--font-primary)'
                }}>
              WhatsApp
            </h4>
            <div className="space-y-4">
              {contactOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <a
                    key={index}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 transition-opacity hover:opacity-80"
                  >
                    <Icon className="w-4 h-4" style={{ color: '#d4a968' }} />
                    <div>
                      <p className="text-xs font-light" 
                         style={{ 
                           color: '#ead7c8',
                           fontFamily: 'var(--font-secondary)'
                         }}>
                        {option.label}
                      </p>
                      <p className="text-sm" 
                         style={{ 
                           color: '#f5ede4',
                           fontFamily: 'var(--font-secondary)'
                         }}>
                        {option.text}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Social & Location */}
          <div>
            <h4 className="text-base font-light mb-6 italic" 
                style={{ 
                  color: '#d4a968',
                  fontFamily: 'var(--font-primary)'
                }}>
              {t.footer.follow}
            </h4>
            <div className="flex gap-4 mb-8">
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
                      className="rounded-full border-2"
                      style={{ 
                        borderColor: '#d4a968',
                        backgroundColor: 'transparent',
                        color: '#d4a968'
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </a>
                );
              })}
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: '#d4a968' }} />
              <div>
                <p className="text-xs font-light" 
                   style={{ 
                     color: '#ead7c8',
                     fontFamily: 'var(--font-secondary)'
                   }}>
                  Paseo Los Árboles
                </p>
                <p className="text-sm" 
                   style={{ 
                     color: '#f5ede4',
                     fontFamily: 'var(--font-secondary)'
                   }}>
                  Av. San Martín, Asunción
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t" style={{ borderColor: 'rgba(212, 169, 104, 0.3)' }}>
          <p className="text-center text-xs font-light" 
             style={{ 
               color: '#ead7c8',
               fontFamily: 'var(--font-secondary)',
               letterSpacing: '0.05em'
             }}>
            © {new Date().getFullYear()} {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};