import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowRight, Calculator, Loader2 } from 'lucide-react';

const PackagePricing = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [enterpriseForm, setEnterpriseForm] = useState({
    duration_months: 6,
    deliveries_per_month: 16
  });
  const [enterpriseQuote, setEnterpriseQuote] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ugc/packages/pricing`);
      const data = await res.json();
      setPackages(data.packages.filter(p => p.type !== 'enterprise'));
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

  useEffect(() => {
    if (showEnterprise) {
      fetchEnterpriseQuote();
    }
  }, [enterpriseForm, showEnterprise]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <a href="/" className="text-2xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </a>
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
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light mb-4">
            Elegí tu <span className="text-[#d4a968] italic">paquete</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Cada paquete incluye entregas de contenido UGC de creadores verificados, 
            con métricas y reportes incluidos.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {packages.map((pkg, idx) => {
            const isPopular = pkg.type === 'standard';
            const hasPromo = pkg.promo_price;
            
            return (
              <div
                key={pkg.type}
                className={`relative p-8 rounded-2xl border-2 transition-all ${
                  selectedPackage === pkg.type
                    ? 'border-[#d4a968] bg-[#d4a968]/5'
                    : isPopular
                    ? 'border-[#d4a968]/50 bg-[#d4a968]/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#d4a968] text-black text-xs font-medium px-3 py-1 rounded-full">
                      MÁS POPULAR
                    </span>
                  </div>
                )}

                {/* Package Name */}
                <h3 className="text-2xl font-medium mb-2">{pkg.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{pkg.description}</p>

                {/* Deliveries */}
                <div className="mb-6">
                  <span className="text-5xl font-light text-[#d4a968]">{pkg.deliveries}</span>
                  <span className="text-gray-400 ml-2">entregas</span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {hasPromo ? (
                    <>
                      <span className="text-gray-500 line-through text-lg">
                        {formatPrice(pkg.price)}
                      </span>
                      <div className="text-3xl font-medium text-white">
                        {formatPrice(pkg.promo_price)}
                      </div>
                      <span className="text-[#d4a968] text-sm">
                        Ahorro: {formatPrice(pkg.price - pkg.promo_price)}
                      </span>
                    </>
                  ) : (
                    <div className="text-3xl font-medium text-white">
                      {formatPrice(pkg.price)}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#d4a968] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handlePurchase(pkg.type, hasPromo)}
                  disabled={purchasing}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isPopular
                      ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {purchasing ? 'Procesando...' : 'Seleccionar'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise Section */}
        <div className="border-t border-white/10 pt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light mb-2">
              ¿Necesitás más <span className="text-[#d4a968] italic">volumen</span>?
            </h2>
            <p className="text-gray-400">Armá tu paquete Enterprise a medida</p>
          </div>

          {!showEnterprise ? (
            <div className="flex justify-center">
              <button
                onClick={() => setShowEnterprise(true)}
                className="flex items-center gap-2 px-6 py-3 border border-[#d4a968]/50 rounded-lg text-[#d4a968] hover:bg-[#d4a968]/10 transition-all"
              >
                <Calculator className="w-5 h-5" />
                Calcular cotización
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto p-8 bg-white/5 border border-white/10 rounded-2xl">
              <h3 className="text-xl font-medium mb-6 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#d4a968]" />
                Cotizador Enterprise
              </h3>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duración del contrato</label>
                  <select
                    value={enterpriseForm.duration_months}
                    onChange={(e) => setEnterpriseForm({...enterpriseForm, duration_months: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>{m} meses</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Entregas por mes</label>
                  <select
                    value={enterpriseForm.deliveries_per_month}
                    onChange={(e) => setEnterpriseForm({...enterpriseForm, deliveries_per_month: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  >
                    <option value={16}>16 entregas/mes</option>
                    <option value={24}>24 entregas/mes</option>
                    <option value={30}>30 entregas/mes</option>
                  </select>
                </div>
              </div>

              {enterpriseQuote && (
                <div className="p-6 bg-[#d4a968]/10 border border-[#d4a968]/30 rounded-xl mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Total entregas:</span>
                      <span className="text-white ml-2 font-medium">{enterpriseQuote.total_deliveries}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Precio/entrega:</span>
                      <span className="text-white ml-2">{formatPrice(enterpriseQuote.price_per_delivery)}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#d4a968]/30 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Valor total:</span>
                      <span className="text-2xl font-medium text-white">{formatPrice(enterpriseQuote.total_price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Cuota mensual:</span>
                      <span className="text-[#d4a968] font-medium">{formatPrice(enterpriseQuote.monthly_payment)}/mes</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handlePurchase('enterprise')}
                disabled={purchasing}
                className="w-full py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-all flex items-center justify-center gap-2"
              >
                {purchasing ? 'Procesando...' : <><span>Solicitar Enterprise</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            ¿Tenés preguntas? <a href="mailto:ugc@avenue.com.py" className="text-[#d4a968] hover:underline">Contactános</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PackagePricing;
