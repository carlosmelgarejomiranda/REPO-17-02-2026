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
    <footer className="py-16 px-6" style={{ backgroundColor: '#1e1919' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-3xl font-bold mb-3" style={{ color: 'white' }}>
              AVENUE
            </h3>
            <p className="text-base" style={{ color: '#bbb5ae' }}>
              {t.footer.tagline}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: 'white' }}>
              WhatsApp
            </h4>
            <div className="space-y-3">
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
                    <Icon className="w-4 h-4" style={{ color: '#5f9dff' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#bbb5ae' }}>
                        {option.label}
                      </p>
                      <p className="text-sm" style={{ color: 'white' }}>
                        {option.text}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-4" style={{ color: 'white' }}>
              {t.footer.follow}
            </h4>
            <div className="flex gap-4">
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
                      className="rounded-full"
                      style={{ borderColor: '#5f9dff', color: '#5f9dff' }}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  </a>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1" style={{ color: '#5f9dff' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#bbb5ae' }}>
                    Paseo Los Árboles
                  </p>
                  <p className="text-sm" style={{ color: 'white' }}>
                    Av. San Martín, Asunción
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t" style={{ borderColor: '#61525a' }}>
          <p className="text-center text-sm" style={{ color: '#bbb5ae' }}>
            © {new Date().getFullYear()} {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};