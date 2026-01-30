import React, { useState } from 'react';
import { Building2, RefreshCw, Mail, Phone, Globe, Instagram, ChevronDown, ChevronUp, MapPin, Calendar } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const AdminBrandsTab = ({
  brands,
  fetchBrands
}) => {
  const [expandedBrand, setExpandedBrand] = useState(null);

  const toggleExpand = (brandId) => {
    setExpandedBrand(expandedBrand === brandId ? null : brandId);
  };

  return (
    <div className="space-y-6" data-testid="admin-brands-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Marcas Registradas ({brands.length})</h3>
        <button 
          onClick={fetchBrands}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {brands.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            No hay marcas registradas
          </div>
        ) : (
          brands.map((brand) => (
            <div 
              key={brand.id} 
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
            >
              {/* Header row - clickable */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(brand.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-[#d4a968]/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-[#d4a968]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{brand.company_name}</p>
                    <p className="text-gray-400 text-sm">{brand.industry} • {brand.city}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {brand.active_package ? (
                      <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        {brand.active_package.type}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                        Sin paquete
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">{formatDate(brand.created_at)}</span>
                    {expandedBrand === brand.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedBrand === brand.id && (
                <div className="border-t border-white/10 p-4 bg-black/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Contacto */}
                    <div className="space-y-3">
                      <h4 className="text-[#d4a968] text-xs font-medium uppercase tracking-wider">Contacto</h4>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">
                          {brand.email || brand.contact_email || '-'}
                        </span>
                        {(brand.email || brand.contact_email) && (
                          <a 
                            href={`mailto:${brand.email || brand.contact_email}`}
                            className="text-[#d4a968] hover:underline text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Enviar
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">
                          {brand.contact_phone ? `${brand.phone_country_code || '+595'} ${brand.contact_phone}` : '-'}
                        </span>
                        {brand.contact_phone && (
                          <a 
                            href={`https://wa.me/${(brand.phone_country_code || '+595').replace('+', '')}${brand.contact_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 text-xs">Responsable:</span>
                        <span className="text-gray-300">
                          {brand.contact_first_name || brand.contact_name || '-'} {brand.contact_last_name || ''}
                        </span>
                      </div>
                    </div>

                    {/* Redes y Web */}
                    <div className="space-y-3">
                      <h4 className="text-[#d4a968] text-xs font-medium uppercase tracking-wider">Redes & Web</h4>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Instagram className="w-4 h-4 text-gray-500" />
                        {brand.instagram ? (
                          <a 
                            href={`https://instagram.com/${brand.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d4a968] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            @{brand.instagram.replace('@', '')}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-500" />
                        {brand.website ? (
                          <a 
                            href={brand.website.startsWith('http') ? brand.website : `https://${brand.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d4a968] hover:underline truncate max-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {brand.website}
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>

                    {/* Info adicional */}
                    <div className="space-y-3">
                      <h4 className="text-[#d4a968] text-xs font-medium uppercase tracking-wider">Info Adicional</h4>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{brand.city}, {brand.country || 'PY'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">Registrado: {formatDate(brand.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Créditos:</span>
                        <span className="text-white font-medium">{brand.remaining_credits || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  {brand.description && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-[#d4a968] text-xs font-medium uppercase tracking-wider mb-2">Descripción</h4>
                      <p className="text-gray-400 text-sm">{brand.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBrandsTab;
