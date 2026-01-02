import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, Menu, ChevronRight, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const ShopHeader = ({ 
  cart = [], 
  user, 
  onLoginClick, 
  onLogout, 
  language, 
  setLanguage, 
  t,
  showSearchBar = true
}) => {
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showStudioSubmenu, setShowStudioSubmenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="max-w-[1800px] mx-auto">
        {/* Main navigation bar */}
        <div className="flex items-center justify-between px-8 py-4">
          {/* Left section - Back to Shop */}
          <div className="flex items-center">
            <a 
              href="/shop" 
              className="text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              ← Tienda
            </a>
          </div>

          {/* Center - Logo */}
          <a href="/shop" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl tracking-[0.3em] uppercase font-light text-gray-900">
              Avenue
            </h1>
          </a>

          {/* Right section - Cart, Menu, Login, Language */}
          <div className="flex items-center gap-4">
            {/* Cart */}
            <button
              onClick={() => navigate('/shop/cart')}
              className="text-gray-500 hover:text-gray-900 transition-colors relative"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger Menu */}
            <div 
              className="relative"
              onMouseEnter={() => setShowNavMenu(true)}
              onMouseLeave={() => { setShowNavMenu(false); setShowStudioSubmenu(false); }}
            >
              <button className="text-gray-500 hover:text-gray-900 transition-colors p-1">
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Navigation Dropdown */}
              {showNavMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-lg border border-gray-100 py-2 z-50">
                  <a 
                    href="/" 
                    className="block px-5 py-3 text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Inicio
                  </a>
                  <a 
                    href="/shop" 
                    className="block px-5 py-3 text-xs tracking-[0.15em] uppercase text-gray-900 font-medium bg-gray-50"
                  >
                    E-commerce
                  </a>
                  
                  {/* Studio with submenu */}
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowStudioSubmenu(true)}
                    onMouseLeave={() => setShowStudioSubmenu(false)}
                  >
                    <button className="w-full px-5 py-3 text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-between">
                      <span>Studio</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    
                    {/* Studio Submenu */}
                    {showStudioSubmenu && (
                      <div className="absolute left-full top-0 w-52 bg-white shadow-lg border border-gray-100 py-2 -ml-1">
                        <a 
                          href="/studio" 
                          className="block px-5 py-3 text-xs tracking-[0.12em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          Reserva el Estudio
                        </a>
                        <a 
                          href="/ugc" 
                          className="block px-5 py-3 text-xs tracking-[0.12em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        >
                          UGC Creators
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <a 
                    href="/tu-marca" 
                    className="block px-5 py-3 text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    Tu Marca en Avenue
                  </a>
                  
                  {/* Admin link for admin users */}
                  {user?.role === 'admin' && (
                    <>
                      <div className="border-t border-gray-100 my-2"></div>
                      <a 
                        href="/admin" 
                        className="block px-5 py-3 text-xs tracking-[0.15em] uppercase text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                      >
                        Admin
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-gray-200"></div>

            {/* User / Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 hidden md:block">{user.name?.split(' ')[0]}</span>
                <button onClick={onLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick}
                className="text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                <span className="text-xs tracking-[0.1em] uppercase hidden md:block">Login</span>
              </button>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} />
          </div>
        </div>

        {/* Search Bar - Optional */}
        {showSearchBar && (
          <div className="border-t border-gray-100 px-8 py-3">
            <form onSubmit={handleSearch} className="max-w-md mx-auto">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-2 pl-10 pr-4 bg-gray-50 border-0 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 rounded-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
};
