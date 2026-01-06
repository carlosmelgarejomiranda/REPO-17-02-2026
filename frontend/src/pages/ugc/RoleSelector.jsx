import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, ArrowRight, Sparkles, TrendingUp, Gift, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RoleSelector = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'creator',
      title: 'Soy Creador UGC',
      subtitle: 'Quiero crear contenido para marcas',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      benefits: [
        { icon: Gift, text: 'Acceso a canjes exclusivos' },
        { icon: TrendingUp, text: 'Construí tu reputación' },
        { icon: Sparkles, text: 'Colaborá con marcas premium' }
      ],
      path: '/ugc/creator/onboarding'
    },
    {
      id: 'brand',
      title: 'Soy Marca',
      subtitle: 'Quiero trabajar con creadores UGC',
      icon: Building2,
      color: 'from-[#d4a968] to-amber-600',
      benefits: [
        { icon: Users, text: 'Red de creadores verificados' },
        { icon: BarChart3, text: 'Métricas y reportes' },
        { icon: Sparkles, text: 'Contenido auténtico' }
      ],
      path: '/ugc/brand/onboarding'
    }
  ];

  const handleContinue = () => {
    const role = roles.find(r => r.id === selectedRole);
    if (role) {
      navigate(role.path);
    }
  };

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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light mb-4">
            ¿Cómo querés <span className="text-[#d4a968] italic">participar</span>?
          </h1>
          <p className="text-gray-400 text-lg">
            Seleccioná tu rol para personalizar tu experiencia
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative p-8 rounded-2xl border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-[#d4a968] bg-[#d4a968]/10' 
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#d4a968] flex items-center justify-center">
                    <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-medium mb-2">{role.title}</h2>
                <p className="text-gray-400 mb-6">{role.subtitle}</p>

                {/* Benefits */}
                <div className="space-y-3">
                  {role.benefits.map((benefit, idx) => {
                    const BenefitIcon = benefit.icon;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <BenefitIcon className="w-5 h-5 text-[#d4a968]" />
                        <span className="text-sm text-gray-300">{benefit.text}</span>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`flex items-center gap-3 px-8 py-4 rounded-full text-lg font-medium transition-all ${
              selectedRole
                ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            Continuar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
