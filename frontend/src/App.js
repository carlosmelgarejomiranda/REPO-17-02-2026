import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
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
import { MainLanding } from "./components/MainLanding";
import { StudioLanding } from "./components/StudioLanding";
import { UGCCreators } from "./components/UGCCreators";
import { UGCCampaignsList } from "./components/UGCCampaignsList";
import { TuMarca } from "./components/TuMarca";
import { TerminosCondiciones } from "./components/TerminosCondiciones";
import { TerminosEcommerce } from "./components/TerminosEcommerce";
import { TerminosStudio } from "./components/TerminosStudio";
import { PoliticaPrivacidad } from "./components/PoliticaPrivacidad";
import { CookieBanner } from "./components/CookieBanner";
import { ShopPage } from "./components/ShopPage";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { OrderSuccessPage } from "./components/OrderSuccessPage";
import { Navbar } from "./components/Navbar";
import { Button } from "./components/ui/button";
import { Menu, X, User, LogOut, Calendar, ShoppingBag } from "lucide-react";
import { 
  HomeSEO, ShopSEO, StudioSEO, StudioBookingSEO, BrandsSEO, UGCSEO, 
  PrivacySEO, TermsSEO, StudioTermsSEO, CheckoutSEO, CartSEO, AdminSEO 
} from "./components/SEOHead";
import { getApiUrl } from "./utils/api";

// UGC Platform Pages
import BrandOnboarding from "./pages/ugc/BrandOnboarding";
import CreatorOnboarding from "./pages/ugc/CreatorOnboarding";
import PackagePricing from "./pages/ugc/PackagePricing";
import CampaignsList from "./pages/ugc/CampaignsList";
import CreatorDashboard from "./pages/ugc/CreatorDashboard";
import BrandDashboard from "./pages/ugc/BrandDashboard";
import CampaignBuilder from "./pages/ugc/CampaignBuilder";
import CampaignsCatalog from "./pages/ugc/CampaignsCatalog";
import CampaignDetail from "./pages/ugc/CampaignDetail";
import BrandCampaigns from "./pages/ugc/BrandCampaigns";
import CreatorWorkspace from "./pages/ugc/CreatorWorkspace";
import DeliverableDetail from "./pages/ugc/DeliverableDetail";
import BrandDeliverables from "./pages/ugc/BrandDeliverables";
import MetricsSubmit from "./pages/ugc/MetricsSubmit";
import CreatorProfile from "./pages/ugc/CreatorProfile";
import CreatorProfileEdit from "./pages/ugc/CreatorProfileEdit";
import Leaderboard from "./pages/ugc/Leaderboard";
import UGCMarcas from "./pages/ugc/UGCMarcas";
import CreatorsPage from "./pages/ugc/CreatorsPage";
import UGCLanding from "./components/UGCLanding";
import BrandCampaignReports from "./pages/ugc/BrandCampaignReports";
import CampaignApplications from "./pages/ugc/CampaignApplications";
import CreatorApplications from "./pages/ugc/CreatorApplications";
import CreatorFeedback from "./pages/ugc/CreatorFeedback";
import CreatorCampaigns from "./pages/ugc/CreatorCampaigns";
import CreatorReports from "./pages/ugc/CreatorReports";
import CreatorDeliverables from "./pages/ugc/CreatorDeliverables";
import CampaignApplicationsPage from "./pages/admin/CampaignApplicationsPage";
import AdminDeliverables from "./pages/admin/AdminDeliverables";
import AdminCreatorDeliverables from "./pages/admin/AdminCreatorDeliverables";
import AdminTermsManagement from "./pages/admin/AdminTermsManagement";
import LoginPage from "./pages/LoginPage";
import MyProfile from "./pages/MyProfile";

// Auth context helper
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = getApiUrl();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/auth/me`, {
        
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
        
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return { user, loading, login, logout, checkAuth };
};

// Studio Navigation Component - Editorial Style
const StudioNav = ({ t, language, setLanguage, user, onLoginClick, onLogout }) => {
  // Apply dark theme to body
  React.useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => document.body.classList.remove('dark-theme');
  }, []);

  return (
    <header id="studio-main-nav" style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 50,
      backgroundColor: '#0a0a0a'
    }}>
      <div style={{ padding: '16px 24px' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <span style={{ fontSize: '20px', fontWeight: 300, letterSpacing: '0.1em', color: 'white' }}>
            AVENUE
          </span>
        </a>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }} 
             onMouseOver={(e) => e.target.style.color = 'white'} 
             onMouseOut={(e) => e.target.style.color = '#9ca3af'}>
            {t.nav.home}
          </a>
          <a href="/shop" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}
             onMouseOver={(e) => e.target.style.color = 'white'} 
             onMouseOut={(e) => e.target.style.color = '#9ca3af'}>
            E-commerce
          </a>
          <a href="/studio" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}
             onMouseOver={(e) => e.target.style.color = 'white'} 
             onMouseOut={(e) => e.target.style.color = '#9ca3af'}>
            Studio
          </a>
          <a href="/studio/reservar" style={{ fontSize: '14px', color: '#d4a968', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar className="w-4 h-4" />
            <span>Reservar</span>
          </a>
        </div>
        
        {/* Right Side */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {['admin', 'superadmin', 'staff', 'designer'].includes(user.role) && (
                <a 
                  href="/admin" 
                  className="hidden md:flex items-center gap-1.5"
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '9999px', 
                    backgroundColor: 'rgba(212, 169, 104, 0.1)', 
                    border: '1px solid rgba(212, 169, 104, 0.3)',
                    color: '#d4a968',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  Admin
                </a>
              )}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '6px 12px', 
                borderRadius: '9999px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <User className="w-4 h-4" style={{ color: '#d4a968' }} />
                <span className="hidden md:inline" style={{ fontSize: '14px', color: 'white' }}>{user.name?.split(' ')[0]}</span>
              </div>
              <button 
                onClick={onLogout} 
                style={{ padding: '8px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '8px 16px', 
                borderRadius: '9999px', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Iniciar Sesión</span>
            </button>
          )}
          
          <div className="hidden md:block" style={{ height: '20px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
          <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
        </div>
      </div>
    </div>
  </header>
  );
};

// Shop Navigation Component
const ShopNav = ({ t, language, setLanguage, user, cart, onLoginClick, onLogout }) => {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
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
        <div className="flex items-center gap-4 md:gap-6">
          <a href="/" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70 hidden md:block" style={{ color: '#d4a968' }}>
            {t.nav?.home || 'Inicio'}
          </a>
          <a href="/shop" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70 hidden md:block" style={{ color: '#f5ede4' }}>
            E-commerce
          </a>
          <a href="/studio" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70 hidden md:block" style={{ color: '#d4a968' }}>
            Studio
          </a>
          
          <div className="h-4 w-px hidden md:block" style={{ backgroundColor: '#d4a968' }}></div>
          
          <a href="/shop/cart" className="relative p-2" style={{ color: '#d4a968' }}>
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                {cartCount}
              </span>
            )}
          </a>
          
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'admin' && (
                <a href="/admin" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70" style={{ color: '#d4a968' }}>
                  Admin
                </a>
              )}
              <button onClick={onLogout} className="p-1" style={{ color: '#666' }}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="text-sm font-medium tracking-wide transition-colors hover:opacity-70 flex items-center gap-1"
              style={{ color: '#d4a968' }}
            >
              <User className="w-4 h-4" />
            </button>
          )}
          
          <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
        </div>
      </div>
    </nav>
  );
};

// UGC Campaign Page wrapper component
const UGCCampaignPage = ({ t, language, setLanguage, user, onLoginClick, onLogout }) => {
  const { campaignId } = useParams();
  
  return (
    <>
      <Navbar 
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
      <div style={{ paddingTop: '64px' }}>
        <UGCCreators t={t} campaignId={campaignId} />
      </div>
      <Footer t={t} />
    </>
  );
};

// Protected Route Component - handles loading state
const ProtectedAdminRoute = ({ user, loading, children, onLoginClick }) => {
  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#a8a8a8' }}>Cargando...</p>
        </div>
      </div>
    );
  }
  
  const isAdmin = ['admin', 'superadmin', 'staff', 'designer'].includes(user?.role);
  
  if (isAdmin) {
    return children;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="text-center">
        <h1 className="text-2xl mb-4" style={{ color: '#f5ede4' }}>Acceso Restringido</h1>
        <p className="mb-4" style={{ color: '#a8a8a8' }}>Necesitas iniciar sesión como administrador</p>
        <Button 
          onClick={onLoginClick}
          style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
        >
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
};

// Admin Route Component - handles auth state properly
const AdminRoute = ({ user, loading, onLoginClick, onLogout, language, setLanguage, t }) => {
  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#d4a968] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#a8a8a8' }}>Cargando...</p>
        </div>
      </div>
    );
  }
  
  const isAdmin = ['admin', 'superadmin', 'staff', 'designer'].includes(user?.role);
  
  if (isAdmin) {
    return (
      <>
        <AdminSEO />
        <Navbar 
          user={user}
          onLoginClick={onLoginClick}
          onLogout={onLogout}
          language={language}
          setLanguage={setLanguage}
          t={t}
        />
        <div style={{ paddingTop: '64px' }}>
          <AdminDashboard user={user} />
        </div>
      </>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="text-center">
        <h1 className="text-2xl mb-4" style={{ color: '#f5ede4' }}>Acceso Restringido</h1>
        <p className="mb-4" style={{ color: '#a8a8a8' }}>Necesitas iniciar sesión como administrador</p>
        <Button 
          onClick={onLoginClick}
          style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
        >
          Iniciar Sesión
        </Button>
      </div>
    </div>
  );
};

// App Router component
function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('es');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage
    const saved = localStorage.getItem('avenue_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const { user, loading, login, logout } = useAuth();
  const t = translations[language];

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('avenue_cart', JSON.stringify(cart));
  }, [cart]);

  // Handle login redirect from other pages (e.g., creator onboarding)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    // Check for redirect parameter from email links
    const redirectParam = params.get('redirect');
    if (redirectParam) {
      // Always save the redirect path
      sessionStorage.setItem('redirect_after_login', redirectParam);
      
      if (!user) {
        // If not logged in, show auth modal
        setShowAuthModal(true);
      } else {
        // If already logged in, redirect immediately
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectParam, { replace: true });
        return;
      }
    }
    
    // Legacy: creator login parameter
    if (params.get('login') === 'creator' && !user) {
      setShowAuthModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, user, navigate, location.pathname]);

  // Redirect to intended page after login (but NOT during OAuth callback)
  // The OAuth callback handles its own redirect to avoid race conditions
  useEffect(() => {
    // Skip if we're in the middle of Google OAuth callback
    if (location.hash?.includes('session_id=')) {
      return;
    }
    
    if (user) {
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectPath);
      }
    }
  }, [user, navigate, location.hash]);

  // Check URL fragment for session_id (Google OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback onAuthComplete={(userData) => {
      // First get the redirect path BEFORE calling login
      // This avoids race condition with the useEffect
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      sessionStorage.removeItem('redirect_after_login');
      
      // Now login (which will trigger useEffect, but redirect is already removed)
      login(userData);
      
      // Navigate to the saved path or home
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    }} />
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
    
    // Check if there's a redirect path saved
    const redirectPath = sessionStorage.getItem('redirect_after_login');
    if (redirectPath) {
      sessionStorage.removeItem('redirect_after_login');
      navigate(redirectPath);
    }
  };

  return (
    <>
      {showAuthModal && (
        <AuthForms 
          onLogin={handleAuthSuccess} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
      
      <div className="App">
        <Routes>
          {/* New Main Landing - Entry Point */}
          <Route path="/" element={
            <MainLanding 
              t={t} 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
            />
          } />

          {/* Brands Page (Former Landing) */}
          <Route path="/marcas" element={
            <>
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
                        className="h-10 cursor-pointer"
                        style={{
                          transform: 'scale(2.5)',
                          transformOrigin: 'left center',
                          filter: 'brightness(1.2) drop-shadow(0 2px 8px rgba(212, 169, 104, 0.3))'
                        }}
                      />
                    </a>
                  </div>

                  <div className="hidden md:flex items-center gap-6">
                    <button onClick={() => scrollToSection('value')} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.about}
                    </button>
                    <button onClick={() => scrollToSection('benefits')} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.benefits}
                    </button>
                    <button onClick={() => scrollToSection('categories')} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.categories}
                    </button>
                    <button onClick={() => scrollToSection('contact-form')} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.contact}
                    </button>
                    <a href="/studio" className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#d4a968' }}>
                      {t.nav.studio}
                    </a>
                    <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
                  </div>

                  <div className="md:hidden flex items-center gap-2">
                    <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ color: '#d4a968' }}>
                      {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                  </div>
                </div>

                {mobileMenuOpen && (
                  <div className="md:hidden mt-4 pb-4 space-y-3">
                    <button onClick={() => scrollToSection('value')} className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.about}
                    </button>
                    <button onClick={() => scrollToSection('benefits')} className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.benefits}
                    </button>
                    <button onClick={() => scrollToSection('categories')} className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.categories}
                    </button>
                    <button onClick={() => scrollToSection('contact-form')} className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70" style={{ color: '#f5ede4' }}>
                      {t.nav.contact}
                    </button>
                    <a href="/studio" className="block w-full text-left text-sm font-medium py-2 transition-colors hover:opacity-70" style={{ color: '#d4a968' }}>
                      {t.nav.studio}
                    </a>
                  </div>
                )}
              </nav>

              <main>
                <HomeSEO />
                <Hero t={t} onBrandsClick={handleBrandsClick} onDeliveryClick={handleDeliveryClick} />
                <div id="value"><ValueProposition t={t} /></div>
                <div id="benefits"><Benefits t={t} /></div>
                <div id="categories"><Categories t={t} /></div>
                <DesignShowcase t={t} />
                <Brands t={t} />
                <Location t={t} />
                <ContactForm t={t} />
              </main>
              <Footer t={t} />
            </>
          } />
          
          {/* Studio Landing - Options Page */}
          <Route path="/studio" element={
            <>
              <StudioSEO />
              <StudioLanding 
                t={t} 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
              />
              <Footer t={t} />
            </>
          } />

          {/* Studio Rental Page */}
          <Route path="/studio/alquiler" element={
            <>
              <StudioSEO />
              <Navbar 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
              <div style={{ paddingTop: '64px' }}>
                <AvenueStudio t={t} />
              </div>
              <Footer t={t} />
            </>
          } />

          {/* UGC Landing Page */}
          <Route path="/ugc" element={
            <UGCLanding 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />
          <Route path="/studio/ugc" element={
            <UGCLanding 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />

          {/* Individual Campaign Page */}
          <Route path="/studio/ugc/:campaignId" element={
            <UGCCampaignPage 
              t={t}
              language={language}
              setLanguage={setLanguage}
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
            />
          } />

          {/* Terms and Conditions */}
          <Route path="/studio/ugc/terms" element={<TerminosCondiciones />} />

          {/* Studio Terms and Conditions */}
          <Route path="/studio/terminos-condiciones" element={
            <>
              <StudioTermsSEO />
              <TerminosStudio />
            </>
          } />

          {/* Tu Marca en Avenue - For Brands */}
          <Route path="/tu-marca" element={
            <>
              <BrandsSEO />
              <TuMarca 
                t={t} 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
              />
              <Footer t={t} />
            </>
          } />

          {/* Booking Page */}
          <Route path="/studio/reservar" element={
            <>
              <StudioBookingSEO />
              <Navbar 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
              <div style={{ paddingTop: '80px', minHeight: '100vh', backgroundColor: '#0d0d0d' }}>
                <div className="max-w-4xl mx-auto px-4 pb-8">
                  <h1 className="text-3xl md:text-4xl font-light italic text-center mb-2" style={{ color: '#f5ede4' }}>
                    Reservar Avenue Studio
                  </h1>
                  <p className="text-center mb-8" style={{ color: '#a8a8a8' }}>
                    Selecciona fecha, horario y completa tu reserva
                  </p>
                  <BookingCalendar t={t} user={user} />
                </div>
              </div>
              <Footer t={t} />
            </>
          } />

          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <AdminRoute 
              user={user} 
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />
          
          {/* Admin Campaign Applications Page */}
          <Route path="/admin/campaigns/:campaignId/applications" element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <CampaignApplicationsPage />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
          
          {/* Admin Deliverables Management */}
          <Route path="/admin/ugc/deliverables/:campaignId" element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <AdminDeliverables />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Admin Creator Deliverables */}
          <Route path="/admin/creators/:creatorId/deliverables" element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <AdminCreatorDeliverables />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Admin Terms Management */}
          <Route path="/admin/terms" element={
            user?.role === 'admin' || user?.role === 'superadmin' ? (
              <AdminTermsManagement />
            ) : (
              <Navigate to="/login" replace />
            )
          } />

          {/* Auth Callback Route */}
          <Route path="/auth/callback" element={
            <AuthCallback onAuthComplete={(userData) => {
              login(userData);
              navigate('/studio/reservar');
            }} />
          } />

          {/* Login Route - Shows auth modal */}
          <Route path="/login" element={
            <LoginPage 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
            />
          } />

          {/* E-commerce Routes */}
          <Route path="/shop" element={
            <>
              <ShopSEO />
              <ShopPage 
                cart={cart} 
                setCart={setCart} 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </>
          } />

          <Route path="/shop/cart" element={
            <>
              <CartSEO />
              <CartPage 
                cart={cart} 
                setCart={setCart}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </>
          } />

          <Route path="/shop/checkout" element={
            <>
              <CheckoutSEO />
              <CheckoutPage 
                cart={cart} 
                setCart={setCart} 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </>
          } />

          <Route path="/shop/order-success" element={
            <OrderSuccessPage 
              setCart={setCart}
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />

          <Route path="/shop/terminos-condiciones" element={
            <>
              <TermsSEO />
              <TerminosEcommerce 
                cart={cart}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
                language={language}
                setLanguage={setLanguage}
                t={t}
              />
            </>
          } />

          <Route path="/politica-privacidad" element={
            <>
              <PrivacySEO />
              <PoliticaPrivacidad />
            </>
          } />

          {/* My Profile Route */}
          <Route path="/mi-perfil" element={
            <MyProfile 
              user={user}
              onLogout={logout}
            />
          } />

          {/* UGC Platform Routes */}
          <Route path="/ugc/marcas" element={
            <UGCMarcas 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />
          <Route path="/ugc/creators" element={
            <CreatorsPage 
              user={user}
              onLoginClick={() => setShowAuthModal(true)}
              onLogout={logout}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          } />
          {/* Redirect old select-role to creators page */}
          <Route path="/ugc/select-role" element={<Navigate to="/ugc/creators" replace />} />
          <Route path="/ugc/creator/onboarding" element={<CreatorOnboarding />} />
          <Route path="/ugc/creator/dashboard" element={<CreatorDashboard />} />
          <Route path="/ugc/creator/profile" element={<CreatorProfileEdit />} />
          <Route path="/ugc/creator/workspace" element={<CreatorWorkspace />} />
          <Route path="/ugc/creator/applications" element={<CreatorApplications />} />
          <Route path="/ugc/creator/feedback" element={<CreatorFeedback />} />
          <Route path="/ugc/creator/campaigns" element={<CreatorCampaigns />} />
          <Route path="/ugc/creator/reports" element={<CreatorReports />} />
          <Route path="/ugc/creator/deliverables" element={<CreatorDeliverables />} />
          <Route path="/ugc/creator/deliverable/:id" element={<DeliverableDetail />} />
          <Route path="/ugc/creator/metrics/:deliverableId" element={<MetricsSubmit />} />
          <Route path="/ugc/creator/:creatorId" element={<CreatorProfile />} />
          <Route path="/ugc/leaderboard" element={<Leaderboard />} />
          <Route path="/ugc/brand/onboarding" element={<BrandOnboarding user={user} onLoginClick={() => setShowAuthModal(true)} />} />
          <Route path="/ugc/brand/dashboard" element={<BrandDashboard />} />
          <Route path="/ugc/brand/packages" element={<PackagePricing />} />
          <Route path="/ugc/brand/campaigns/new" element={<CampaignBuilder />} />
          <Route path="/ugc/brand/campaigns" element={<BrandCampaigns />} />
          <Route path="/ugc/brand/deliverables/:campaignId" element={<BrandDeliverables />} />
          <Route path="/ugc/brand/campaigns/:campaignId/reports" element={<BrandCampaignReports />} />
          <Route path="/ugc/brand/campaigns/:campaignId/applications" element={<CampaignApplications />} />
          <Route path="/ugc/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/ugc/campaigns" element={<CampaignsCatalog />} />
        </Routes>
      </div>
      
      {/* Cookie Banner - Global */}
      <CookieBanner />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
