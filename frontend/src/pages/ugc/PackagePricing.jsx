import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Calculator, Loader2, Crown, Star, Building2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const PackagePricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [hasBrandProfile, setHasBrandProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  // Enterprise calculator
  const [enterpriseForm, setEnterpriseForm] = useState({
    duration_months: 6,
    deliveries_per_month: 16
  });
  const [enterpriseQuote, setEnterpriseQuote] = useState(null);

  useEffect(() => {
    fetchPackages();
    checkBrandProfile();
  }, []);

  useEffect(() => {
    fetchEnterpriseQuote();
  }, [enterpriseForm]);

  const checkBrandProfile = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/brands/me`, {
        credentials: 'include'
      });
      setHasBrandProfile(res.ok);
    } catch (err) {
      setHasBrandProfile(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/pricing`);
      const data = await res.json();
      // Include all packages including enterprise
      setPackages(data.packages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnterpriseQuote = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/enterprise/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enterpriseForm)
      });
      const data = await res.json();
      setEnterpriseQuote(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPackage = (packageType) => {
    // If user doesn't have brand profile, redirect to onboarding with package selection
    if (!hasBrandProfile) {
      navigate(`/ugc/brand/onboarding?package=${packageType}`);
      return;
    }
    
    // If has profile, proceed to purchase
    handlePurchase(packageType);
  };

  const handlePurchase = async (packageType, usePromo = true) => {
    setPurchasing(true);
    try {
      const body = {
        package_type: packageType,
        use_promo: usePromo
      };

      if (packageType === 'enterprise') {
        body.enterprise_quote = enterpriseForm;
      }

      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Error al procesar');
      }

      // Redirect to payment/confirmation
      navigate(`/ugc/brand/payment/${data.package_id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  // Separate standard packages from enterprise
  const standardPackages = packages.filter(p => p.type !== 'enterprise');
  const enterprisePackage = packages.find(p => p.type === 'enterprise');

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <a href="/" className="text-2xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </a>
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="bg-gradient-to-r from-[#d4a968]/20 to-transparent border-b border-[#d4a968]/30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#d4a968]" />
          <span className="text-[#d4a968] font-medium">¡Promoción de Lanzamiento!</span>
          <span className="text-gray-400">Precios especiales por tiempo limitado</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light mb-4">
            Elegí tu <span className="text-[#d4a968] italic">paquete</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Cada paquete incluye un número de entregas de contenido UGC. 
            Una entrega = un creator publicando contenido para tu marca.
          </p>
        </div>

        {/* Packages Grid - 4 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {standardPackages.map((pkg, idx) => {
            const isPopular = pkg.type === 'standard';
            const hasSavings = pkg.promo_price && pkg.promo_price < pkg.price;
            
            return (
              <div 
                key={pkg.type}
                className={`relative bg-white/5 border rounded-2xl p-6 transition-all hover:border-[#d4a968]/50 ${
                  isPopular ? 'border-[#d4a968] ring-1 ring-[#d4a968]/30' : 'border-white/10'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#d4a968] text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> MÁS POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-1">{pkg.name}</h3>
                  <p className="text-gray-500 text-sm">{pkg.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {hasSavings ? (
                      <>
                        <span className="text-gray-500 line-through text-lg">{formatPrice(pkg.price)}</span>
                        <span className="text-2xl font-light text-white">{formatPrice(pkg.promo_price)}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-light text-white">{formatPrice(pkg.price)}</span>
                    )}
                  </div>
                  {hasSavings && (
                    <p className="text-green-400 text-sm mt-1">
                      Ahorrás {formatPrice(pkg.price - pkg.promo_price)}
                    </p>
                  )}
                  <p className="text-[#d4a968] font-medium mt-2">
                    {pkg.deliveries} entregas
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {pkg.features?.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#d4a968] mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPackage(pkg.type)}
                  disabled={purchasing}
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    isPopular
                      ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {purchasing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Elegir {pkg.name}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {/* Enterprise Package */}
          {enterprisePackage && (
            <div className="relative bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-2xl p-6 transition-all hover:border-purple-500/50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> ENTERPRISE
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-white mb-1">{enterprisePackage.name}</h3>
                <p className="text-gray-500 text-sm">{enterprisePackage.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-400 text-sm">Calculá tu plan</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Duración (meses)</label>
                    <select
                      value={enterpriseForm.duration_months}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, duration_months: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    >
                      {[3, 6, 9, 12].map(m => (
                        <option key={m} value={m} className="bg-black">{m} meses</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entregas/mes</label>
                    <select
                      value={enterpriseForm.deliveries_per_month}
                      onChange={(e) => setEnterpriseForm({...enterpriseForm, deliveries_per_month: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                    >
                      {[16, 24, 30].map(d => (
                        <option key={d} value={d} className="bg-black">{d} entregas</option>
                      ))}
                    </select>
                  </div>
                </div>

                {enterpriseQuote && (
                  <div className="mt-4 p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-purple-400 text-xs mb-1">Total estimado:</p>
                    <p className="text-white font-medium">{formatPrice(enterpriseQuote.total_price)}</p>
                    <p className="text-gray-500 text-xs">{enterpriseQuote.total_deliveries} entregas totales</p>
                    <p className="text-gray-500 text-xs">{formatPrice(enterpriseQuote.monthly_payment)}/mes</p>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {enterprisePackage.features?.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPackage('enterprise')}
                disabled={purchasing}
                className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700"
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Solicitar Enterprise
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-light mb-4">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-[#d4a968] font-bold">1</span>
              </div>
              <h3 className="text-white font-medium mb-2">Elegí tu paquete</h3>
              <p className="text-gray-500 text-sm">Seleccioná el plan que mejor se ajuste a tus necesidades</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-[#d4a968] font-bold">2</span>
              </div>
              <h3 className="text-white font-medium mb-2">Creá campañas</h3>
              <p className="text-gray-500 text-sm">Definí qué tipo de contenido buscás y publicá tu campaña</p>
            </div>
            <div className="p-4">
              <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-[#d4a968] font-bold">3</span>
              </div>
              <h3 className="text-white font-medium mb-2">Recibí contenido</h3>
              <p className="text-gray-500 text-sm">Creators aplicarán y publicarán contenido para tu marca</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackagePricing;
