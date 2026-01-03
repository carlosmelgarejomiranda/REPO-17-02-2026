import React, { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [showMenu, setShowMenu] = useState(false);

  const navLinks = [
    { href: '/shop', label: 'E-commerce' },
    { href: '/studio', label: 'Studio' },
    { href: '/studio/ugc', label: 'UGC' },
    { href: '/tu-marca', label: 'Tu Marca' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <a href="/" className="flex items-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
              alt="Avenue"
              style={{ 
                height: '40px', 
                width: 'auto', 
                filter: 'brightness(1.2)',
                transform: 'scale(6)',
                transformOrigin: 'left center'
              }}
            />
          </a>
          
          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher 
              currentLang={language} 
              onLanguageChange={setLanguage}
              isDark={true}
            />

            {/* Login/User Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 hidden md:block">{user.name?.split(' ')[0]}</span>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Iniciar sesión"
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Hamburger Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block px-4 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                      onClick={() => setShowMenu(false)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
