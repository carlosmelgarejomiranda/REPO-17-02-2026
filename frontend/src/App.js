import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { translations } from "./i18n/translations";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { Hero } from "./components/Hero";
import { ValueProposition } from "./components/ValueProposition";
import { Benefits } from "./components/Benefits";
import { Categories } from "./components/Categories";
import { DesignShowcase } from "./components/DesignShowcase";
import { Brands } from "./components/Brands";
import { Location } from "./components/Location";
import { ContactForm } from "./components/ContactForm";
import { Footer } from "./components/Footer";
import { AvenueStudio } from "./components/AvenueStudio";
import { BookingCalendar } from "./components/BookingCalendar";
import { AuthForms, AuthCallback } from "./components/AuthForms";
import { AdminDashboard } from "./components/AdminDashboard";
import { Button } from "./components/ui/button";
import { Menu, X, User, LogOut, Calendar } from "lucide-react";

// Auth context helper
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return { user, loading, login, logout, checkAuth };
};

// App Router component to handle session_id in URL
function AppRouter() {
  const location = useLocation();
  const [language, setLanguage] = useState('es');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, loading, login, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const t = translations[language];

  // Check URL fragment for session_id (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback onAuthComplete={(userData) => {
      login(userData);
      navigate('/studio/reservar');
    }} />;
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const handleBrandsClick = () => {
    scrollToSection('contact-form');
  };

  const handleDeliveryClick = () => {
    window.open('https://wa.me/595973666000', '_blank');
  };

  const handleAuthSuccess = (userData) => {
    login(userData);
    setShowAuthModal(false);
  };

  return (
    <BrowserRouter>
      {showAuthModal && (
        <AuthForms 
          onLogin={handleAuthSuccess} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
      
      <div className="App">
        <Routes>
          <Route path="/" element={
            <>
              {/* Navigation */}
              <nav 
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(247, 242, 237, 0.95)', borderBottom: '1px solid rgba(212, 169, 104, 0.3)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Isologo escalado 10x sin afectar la barra */}
            <img 
              src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zxjfbeqj_IMG_9648.PNG"
              alt="Avenue"
              className="h-12 cursor-pointer"
              style={{
                transform: 'scale(2.5)',
                transformOrigin: 'left center',
                filter: 'drop-shadow(0 2px 8px rgba(212, 169, 104, 0.3))'
              }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection('value')}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.about}
            </button>
            <button 
              onClick={() => scrollToSection('benefits')}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.benefits}
            </button>
            <button 
              onClick={() => scrollToSection('categories')}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.categories}
            </button>
            <a 
              href="/studio"
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#d4a968' }}
            >
              {t.nav.studio}
            </a>
            <button 
              onClick={() => scrollToSection('contact-form')}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.contact}
            </button>
            <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <button 
              onClick={() => scrollToSection('value')}
              className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.about}
            </button>
            <button 
              onClick={() => scrollToSection('benefits')}
              className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.benefits}
            </button>
            <button 
              onClick={() => scrollToSection('categories')}
              className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.categories}
            </button>
            <a 
              href="/studio"
              className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70"
              style={{ color: '#d4a968' }}
            >
              {t.nav.studio}
            </a>
            <button 
              onClick={() => scrollToSection('contact-form')}
              className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70"
              style={{ color: '#1a1918' }}
            >
              {t.nav.contact}
            </button>
          </div>
        )}
      </nav>

      {/* Page Sections */}
      <main>
        <Hero t={t} onBrandsClick={handleBrandsClick} onDeliveryClick={handleDeliveryClick} />
        <div id="value">
          <ValueProposition t={t} />
        </div>
        <div id="benefits">
          <Benefits t={t} />
        </div>
        <div id="categories">
          <Categories t={t} />
        </div>
        <DesignShowcase t={t} />
        <Brands t={t} />
        <Location t={t} />
        <ContactForm t={t} />
      </main>

      <Footer t={t} />
            </>
          } />
          
          <Route path="/studio" element={
            <>
              {/* Navigation for Studio page - Dark Theme */}
              <nav 
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
                style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #d4a968' }}
              >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a href="/">
                      <img 
                        src="https://customer-assets.emergentagent.com/job_avenue-shop/artifacts/zxjfbeqj_IMG_9648.PNG"
                        alt="Avenue"
                        className="h-12 cursor-pointer"
                        style={{
                          transform: 'scale(2.5)',
                          transformOrigin: 'left center',
                          filter: 'brightness(1.2) drop-shadow(0 2px 8px rgba(212, 169, 104, 0.3))'
                        }}
                      />
                    </a>
                  </div>
                  <div className="flex items-center gap-6">
                    <a href="/" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70" style={{ color: '#d4a968' }}>
                      {t.nav.home}
                    </a>
                    <div className="h-4 w-px" style={{ backgroundColor: '#d4a968' }}></div>
                    <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
                  </div>
                </div>
              </nav>
              
              <div style={{ paddingTop: '80px' }}>
                <AvenueStudio t={t} />
              </div>
              <Footer t={t} />
            </>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return <AppRouter />;
}

export default App;
