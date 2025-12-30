import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Button } from "./components/ui/button";
import { Menu, X } from "lucide-react";

function App() {
  const [language, setLanguage] = useState('es');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

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

  return (
    <BrowserRouter>
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
                    <LanguageSwitcher currentLang={language} onLanguageChange={setLanguage} />
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

export default App;
