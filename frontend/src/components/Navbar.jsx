import React, { useState } from 'react';
import { Menu, X, User, LogOut, Settings } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

// Admin roles that can access the admin panel
const ADMIN_ROLES = ['superadmin', 'admin', 'staff', 'designer'];

export const Navbar = ({ user, onLoginClick, onLogout, language, setLanguage, t }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = user && ADMIN_ROLES.includes(user.role);

  const navLinks = [
    { href: '/shop', label: 'E-commerce' },
    { href: '/studio', label: 'Studio' },
    { href: '/studio/ugc', label: 'UGC' },
    { href: '/tu-marca', label: 'Tu Marca' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#000000] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <a href="/" className="flex items-center h-full">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
              alt="Avenue"
              className="h-[100px] md:h-[240px] w-auto"
              style={{ 
                filter: 'brightness(1.2)',
                objectFit: 'contain',
                imageRendering: 'crisp-edges'
              }}
            />
          </a>
          
          {/* Right Section */}
          <div className="flex items-center gap-5">
            {/* Admin Panel Button - Only for admin roles */}
            {hasAdminAccess && (
              <a
                href="/admin"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black text-xs tracking-[0.1em] uppercase font-medium hover:bg-[#c49958] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Admin
              </a>
            )}

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
                  <div className="absolute right-0 top-full mt-2 w-52 z-50 overflow-hidden bg-black"
                    style={{ 
                      backgroundColor: '#000',
                      border: '1px solid rgba(212, 169, 104, 0.3)',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    {navLinks.map((link, index) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block py-4 px-6 text-[11px] tracking-[0.15em] uppercase text-[#f5ede4] bg-black hover:bg-[#111] hover:text-[#d4a968] transition-colors"
                        style={{ 
                          backgroundColor: '#000',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          textDecoration: 'none'
                        }}
                        onClick={() => setShowMenu(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                    
                    {/* Admin Panel link in dropdown for mobile */}
                    {hasAdminAccess && (
                      <a
                        href="/admin"
                        className="block py-4 px-6 text-[11px] tracking-[0.15em] uppercase bg-[#d4a968] text-black hover:bg-[#c49958] transition-colors font-medium"
                        style={{ 
                          textDecoration: 'none'
                        }}
                        onClick={() => setShowMenu(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-3.5 h-3.5" />
                          Panel Admin
                        </span>
                      </a>
                    )}
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
