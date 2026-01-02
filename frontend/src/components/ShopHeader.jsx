import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

export const ShopHeader = ({ 
  cart = [], 
  user, 
  onLoginClick, 
  onLogout, 
  language, 
  setLanguage, 
  t,
  showSearch = false,
  onSearchClick
}) => {
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between px-8 py-4">
          {/* Left section - Navigation links */}
          <div className="flex items-center gap-6">
            <a href="/" className="text-xs tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
              {t?.nav?.home || 'Inicio'}
            </a>
            <a href="/shop" className="text-xs tracking-[0.15em] uppercase text-gray-900 font-medium hidden md:block">
              E-commerce
            </a>
            <a href="/studio" className="text-xs tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
              Studio
            </a>
          </div>

          {/* Center - Logo */}
          <a href="/shop" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl tracking-[0.3em] uppercase font-light text-gray-900">
              Avenue
            </h1>
          </a>

          {/* Right section - Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            {onSearchClick && (
              <button
                onClick={onSearchClick}
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

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

            <div className="h-4 w-px bg-gray-200"></div>

            {/* User / Auth */}
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'admin' && (
                  <a href="/admin" className="text-xs tracking-[0.1em] uppercase text-gray-500 hover:text-gray-900 transition-colors hidden md:block">
                    Admin
                  </a>
                )}
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
      </div>
    </header>
  );
};
