import React from 'react';
import { Briefcase, RefreshCw } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
};

const StatusBadge = ({ status, type }) => {
  const configs = {
    campaign: {
      draft: { color: 'text-gray-400 bg-gray-500/20', label: 'Borrador' },
      live: { color: 'text-green-400 bg-green-500/20', label: 'Live' },
      in_production: { color: 'text-purple-400 bg-purple-500/20', label: 'En Producción' },
      completed: { color: 'text-blue-400 bg-blue-500/20', label: 'Completada' },
      paused: { color: 'text-yellow-400 bg-yellow-500/20', label: 'Pausada' }
    }
  };

  const config = configs[type]?.[status] || { color: 'text-gray-400 bg-gray-500/20', label: status };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
      {config.label}
    </span>
  );
};

const AdminCampaignsTab = ({
  campaigns,
  campaignFilter,
  setCampaignFilter,
  fetchCampaigns
}) => {
  return (
    <div className="space-y-6" data-testid="admin-campaigns-tab">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={campaignFilter.status}
            onChange={(e) => { setCampaignFilter({...campaignFilter, status: e.target.value}); fetchCampaigns(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="live">Live</option>
            <option value="in_production">En Producción</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
        <button 
          onClick={fetchCampaigns}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Campaña</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Marca</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Estado</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Slots</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Valor Canje</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creación</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No hay campañas creadas
                </td>
              </tr>
            ) : (
              campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="text-white font-medium">{campaign.name}</p>
                    <p className="text-gray-500 text-xs">{campaign.category}</p>
                  </td>
                  <td className="p-4 text-gray-300">{campaign.brand?.company_name}</td>
                  <td className="p-4">
                    <StatusBadge status={campaign.status} type="campaign" />
                  </td>
                  <td className="p-4">
                    <span className="text-white">{campaign.available_slots || 0}</span>
                    <span className="text-gray-500 text-xs ml-1">disponibles</span>
                  </td>
                  <td className="p-4 text-white">
                    {campaign.compensation?.type === 'exchange' 
                      ? formatPrice(campaign.compensation?.exchange_value || 0)
                      : formatPrice(campaign.compensation?.money_amount || 0)}
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{formatDate(campaign.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCampaignsTab;
