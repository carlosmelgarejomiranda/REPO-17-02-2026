import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
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
import { TerminosCondiciones } from "./components/TerminosCondiciones";
import { ShopPage } from "./components/ShopPage";
import { CartPage } from "./components/CartPage";
import { CheckoutPage } from "./components/CheckoutPage";
import { OrderSuccessPage } from "./components/OrderSuccessPage";
import { Button } from "./components/ui/button";
import { Menu, X, User, LogOut, Calendar, ShoppingBag } from "lucide-react";

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

// Studio Navigation Component
const StudioNav = ({ t, language, setLanguage, user, onLoginClick, onLogout }) => (
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
          {t.nav.home}
        </a>
        <a href="/studio/reservar" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70 flex items-center gap-1" style={{ color: '#d4a968' }}>
          <Calendar className="w-4 h-4" />
          <span className="hidden md:inline">Reservar</span>
        </a>
        <div className="h-4 w-px hidden md:block" style={{ backgroundColor: '#d4a968' }}></div>
        
        {user ? (
          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <a href="/admin" className="text-sm font-medium tracking-wide transition-colors hover:opacity-70" style={{ color: '#d4a968' }}>
                Admin
              </a>
            )}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: '#d4a968' }} />
              <span className="text-sm hidden md:inline" style={{ color: '#f5ede4' }}>{user.name?.split(' ')[0]}</span>
            </div>
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
            <span className="hidden md:inline">Iniciar Sesión</span>
          </button>
        )}
        
        <div className="h-4 w-px" style={{ backgroundColor: '#d4a968' }}></div>
        <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} isDark={true} />
      </div>
    </div>
  </nav>
);

// UGC Campaign Page wrapper component
const UGCCampaignPage = ({ t, language, setLanguage, user, onLoginClick, onLogout }) => {
  const { campaignId } = useParams();
  
  return (
    <>
      <StudioNav 
        t={t} 
        language={language} 
        setLanguage={setLanguage}
        user={user}
        onLoginClick={onLoginClick}
        onLogout={onLogout}
      />
      <div style={{ paddingTop: '80px' }}>
        <UGCCreators t={t} campaignId={campaignId} />
      </div>
      <Footer t={t} />
    </>
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
          <Route path="/" element={<MainLanding t={t} />} />

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
              <StudioNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <StudioLanding t={t} />
              </div>
              <Footer t={t} />
            </>
          } />

          {/* Studio Rental Page */}
          <Route path="/studio/alquiler" element={
            <>
              <StudioNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <AvenueStudio t={t} />
              </div>
              <Footer t={t} />
            </>
          } />

          {/* UGC Campaigns List */}
          <Route path="/studio/ugc" element={
            <>
              <StudioNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <UGCCampaignsList t={t} />
              </div>
              <Footer t={t} />
            </>
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

          {/* Booking Page */}
          <Route path="/studio/reservar" element={
            <>
              <StudioNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '100px', minHeight: '100vh', backgroundColor: '#0d0d0d' }}>
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
            user?.role === 'admin' ? (
              <>
                <StudioNav 
                  t={t} 
                  language={language} 
                  setLanguage={setLanguage}
                  user={user}
                  onLoginClick={() => setShowAuthModal(true)}
                  onLogout={logout}
                />
                <div style={{ paddingTop: '80px' }}>
                  <AdminDashboard user={user} />
                </div>
              </>
            ) : (
              <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0d0d0d' }}>
                <div className="text-center">
                  <h1 className="text-2xl mb-4" style={{ color: '#f5ede4' }}>Acceso Restringido</h1>
                  <p className="mb-4" style={{ color: '#a8a8a8' }}>Necesitas iniciar sesión como administrador</p>
                  <Button 
                    onClick={() => setShowAuthModal(true)}
                    style={{ backgroundColor: '#d4a968', color: '#0d0d0d' }}
                  >
                    Iniciar Sesión
                  </Button>
                </div>
              </div>
            )
          } />

          {/* Auth Callback Route */}
          <Route path="/auth/callback" element={
            <AuthCallback onAuthComplete={(userData) => {
              login(userData);
              navigate('/studio/reservar');
            }} />
          } />

          {/* E-commerce Routes */}
          <Route path="/shop" element={
            <>
              <ShopNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                cart={cart}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <ShopPage cart={cart} setCart={setCart} />
              </div>
            </>
          } />

          <Route path="/shop/cart" element={
            <>
              <ShopNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                cart={cart}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <CartPage cart={cart} setCart={setCart} />
              </div>
            </>
          } />

          <Route path="/shop/checkout" element={
            <>
              <ShopNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                cart={cart}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <CheckoutPage cart={cart} setCart={setCart} user={user} />
              </div>
            </>
          } />

          <Route path="/shop/order-success" element={
            <>
              <ShopNav 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                user={user}
                cart={cart}
                onLoginClick={() => setShowAuthModal(true)}
                onLogout={logout}
              />
              <div style={{ paddingTop: '80px' }}>
                <OrderSuccessPage setCart={setCart} />
              </div>
            </>
          } />
        </Routes>
      </div>
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
