import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Camera, Building2, Home, Briefcase, FileText, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

/**
 * UGCNavbar - Navbar unificado para paneles UGC (Creadores y Marcas)
 * Mobile: Top bar simple + Bottom navigation
 * Desktop: Top bar completa
 */
export const UGCNavbar = ({ type = 'creator' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isCreator = type === 'creator';
  const isBrand = type === 'brand';

  // Navigation links based on user type
  const creatorLinks = [
    { href: '/ugc/creator/dashboard', label: 'Home', shortLabel: 'Home', icon: Home },
    { href: '/ugc/creator/campaigns', label: 'Campañas', shortLabel: 'Campañas', icon: Briefcase },
    { href: '/ugc/creator/profile', label: 'Perfil', shortLabel: 'Perfil', icon: User },
  ];

  const brandLinks = [
    { href: '/ugc/brand/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home },
    { href: '/ugc/brand/campaigns', label: 'Campañas', shortLabel: 'Campañas', icon: Briefcase },
  ];

  const links = isCreator ? creatorLinks : brandLinks;

  const isActive = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img 
                src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
                alt="Avenue"
                className="h-10 md:h-[120px] w-auto"
                style={{ 
                  filter: 'brightness(1.2)',
                  objectFit: 'contain'
                }}
              />
            </Link>

            {/* Mobile: Page title */}
            <div className="md:hidden flex-1 mx-4">
              <span className="text-sm font-medium text-white">
                {isCreator ? 'Panel Creador' : 'Panel Marca'}
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      active 
                        ? 'bg-[#d4a968]/20 text-[#d4a968]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Back to Main Site - Desktop */}
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm">Inicio</span>
              </Link>

              {/* User Menu - Desktop */}
              {user && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                    {isCreator ? (
                      <Camera className="w-4 h-4 text-[#d4a968]" />
                    ) : (
                      <Building2 className="w-4 h-4 text-[#d4a968]" />
                    )}
                    <span className="text-sm text-white">{user.name || user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Mobile: Menu & Logout buttons */}
              <div className="flex md:hidden items-center gap-1">
                <Link
                  to="/"
                  className="p-2 text-gray-400 hover:text-white"
                  title="Inicio"
                >
                  <Home className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center justify-center flex-1 py-2 transition-all ${
                  active ? 'text-[#d4a968]' : 'text-gray-500'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-[#d4a968]' : ''}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#d4a968]' : ''}`}>
                  {link.shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default UGCNavbar;
