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
          <a href="/" className="flex items-center h-full">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
              alt="Avenue"
              style={{ 
                height: '40px', 
                width: 'auto', 
                filter: 'brightness(1.2)',
                transform: 'scale(6) translateY(1px)',
                transformOrigin: 'left center'
              }}
              className="my-auto"
            />
          </a>
          
          {/* Right Section */}
          <div className="flex items-center gap-5">
            {/* Language Switcher */}
            <LanguageSwitcher 
              currentLang={language} 
              onLanguageChange={setLanguage}
              isDark={true}
            />

            {/* Login/User Button */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 hidden md:block tracking-[0.1em] uppercase">{user.name?.split(' ')[0]}</span>
                <button
                  onClick={onLogout}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                title="Iniciar sesión"
              >
                <User className="w-4 h-4" />
                <span className="text-xs tracking-[0.1em] uppercase hidden md:block">Login</span>
              </button>
            )}

            {/* Hamburger Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div 
                    className="absolute right-0 top-full mt-2 w-52 z-50 overflow-hidden"
                    style={{ 
                      backgroundColor: '#000000',
                      background: '#000000',
                      border: '1px solid rgba(212, 169, 104, 0.3)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                      isolation: 'isolate'
                    }}
                  >
                    {navLinks.map((link, index) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block"
                        style={{ 
                          padding: '16px 24px',
                          fontSize: '11px',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          color: '#f5ede4',
                          backgroundColor: '#000000',
                          background: '#000000',
                          borderBottom: index < navLinks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          textDecoration: 'none',
                          transition: 'color 0.2s, background 0.2s'
                        }}
                        onClick={() => setShowMenu(false)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(30,30,30,1)';
                          e.currentTarget.style.color = '#d4a968';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#000000';
                          e.currentTarget.style.color = '#f5ede4';
                        }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
