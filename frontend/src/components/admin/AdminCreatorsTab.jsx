import React from 'react';
import { Users, Star, Award, RefreshCw } from 'lucide-react';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const StatusBadge = ({ status, type }) => {
  const configs = {
    creator: {
      rookie: { color: 'text-gray-400 bg-gray-500/20', label: '🌱 Rookie' },
      trusted: { color: 'text-blue-400 bg-blue-500/20', label: '✅ Trusted' },
      pro: { color: 'text-purple-400 bg-purple-500/20', label: '💼 Pro' },
      elite: { color: 'text-yellow-400 bg-yellow-500/20', label: '👑 Elite' }
    }
  };

  const config = configs[type]?.[status] || { color: 'text-gray-400 bg-gray-500/20', label: status };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>
      {config.label}
    </span>
  );
};

const AdminCreatorsTab = ({
  creators,
  creatorFilter,
  setCreatorFilter,
  fetchCreators,
  handleVerifyCreator,
  handleToggleCreatorStatus
}) => {
  return (
    <div className="space-y-6" data-testid="admin-creators-tab">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={creatorFilter.level}
            onChange={(e) => { setCreatorFilter({...creatorFilter, level: e.target.value}); fetchCreators(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos los niveles</option>
            <option value="rookie">🌱 Rookie</option>
            <option value="trusted">✅ Trusted</option>
            <option value="pro">💼 Pro</option>
            <option value="elite">👑 Elite</option>
          </select>
          <select
            value={creatorFilter.verified}
            onChange={(e) => { setCreatorFilter({...creatorFilter, verified: e.target.value}); fetchCreators(); }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
          >
            <option value="">Todos</option>
            <option value="true">Verificados</option>
            <option value="false">No verificados</option>
          </select>
        </div>
        <button 
          onClick={fetchCreators}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Creators Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Creator</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Nivel</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Rating</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Entregas</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Verificado</th>
              <th className="text-left p-4 text-[#d4a968] text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {creators.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  No hay creators registrados
                </td>
              </tr>
            ) : (
              creators.map((creator) => (
                <tr key={creator.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {creator.profile_pic ? (
                        <img 
                          src={creator.profile_pic} 
                          alt={creator.name} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-purple-400 font-medium">
                            {creator.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{creator.name}</p>
                        <p className="text-gray-500 text-xs">{creator.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={creator.level} type="creator" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{(creator.stats?.avg_rating || 0).toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{creator.stats?.total_completed || 0}</td>
                  <td className="p-4">
                    {creator.is_verified ? (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <Award className="w-4 h-4" /> Verificado
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">No verificado</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {!creator.is_verified && (
                        <button
                          onClick={() => handleVerifyCreator(creator.id)}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs hover:bg-green-500/30"
                        >
                          Verificar
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleCreatorStatus(creator.id, !creator.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs ${
                          creator.is_active 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                            : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                        }`}
                      >
                        {creator.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCreatorsTab;
