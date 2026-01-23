import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Camera, Building2, Home, Briefcase, FileText, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * UGCNavbar - Navbar unificado para paneles UGC (Creadores y Marcas)
 * Mantiene consistencia con el navbar principal de Avenue
 */
export const UGCNavbar = ({ type = 'creator' }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isCreator = type === 'creator';
  const isBrand = type === 'brand';

  // Navigation links based on user type
  const creatorLinks = [
    { href: '/ugc/creator/dashboard', label: 'Dashboard', icon: Home },
    { href: '/ugc/campaigns', label: 'Campañas', icon: Briefcase },
    { href: '/ugc/creator/applications', label: 'Mis Aplicaciones', icon: FileText },
    { href: '/ugc/creator/workspace', label: 'Workspace', icon: Camera },
    { href: '/ugc/creator/profile', label: 'Mi Perfil', icon: User },
  ];

  const brandLinks = [
    { href: '/ugc/brand/dashboard', label: 'Dashboard', icon: Home },
    { href: '/ugc/brand/campaigns', label: 'Campañas', icon: Briefcase },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zwgo3cp7_Design%20sem%20nome%20%283%29%20%281%29.png"
              alt="Avenue"
              className="h-[60px] md:h-[120px] w-auto"
              style={{ 
                filter: 'brightness(1.2)',
                objectFit: 'contain'
              }}
            />
          </Link>

          {/* Mobile Navigation - Visible buttons */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto scrollbar-hide">
            {links.slice(0, 3).map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    active 
                      ? 'bg-[#d4a968]/20 text-[#d4a968]' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{link.label.length > 10 ? link.label.substring(0, 8) + '..' : link.label}</span>
                </Link>
              );
            })}
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
          <div className="flex items-center gap-3">
            {/* Back to Main Site */}
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-black border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    active 
                      ? 'bg-[#d4a968]/20 text-[#d4a968]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
            
            <div className="border-t border-white/10 pt-4 mt-4">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white"
              >
                <Home className="w-5 h-5" />
                <span>Volver al Inicio</span>
              </Link>
              
              {user && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default UGCNavbar;
