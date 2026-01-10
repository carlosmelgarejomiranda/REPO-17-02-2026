import React from 'react';
import { Building2, RefreshCw } from 'lucide-react';

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

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Marca</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Industria</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Ciudad</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Paquete</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Créditos</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Registro</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No hay marcas registradas
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d4a968]/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#d4a968]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{brand.company_name}</p>
                        <p className="text-gray-500 text-xs">{brand.contact_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{brand.industry}</td>
                  <td className="p-4 text-gray-300">{brand.city}</td>
                  <td className="p-4">
                    {brand.active_package ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        {brand.active_package.type}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">Sin paquete</span>
                    )}
                  </td>
                  <td className="p-4 text-white">{brand.remaining_credits || 0}</td>
                  <td className="p-4 text-gray-500 text-sm">{formatDate(brand.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBrandsTab;
