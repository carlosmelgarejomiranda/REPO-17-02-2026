import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, SlidersHorizontal, MapPin, Users, Star, ChevronRight,
  Filter, X, Loader2 
} from 'lucide-react';

const API_URL = getApiUrl();

const CampaignsList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    category: '',
    platform: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCampaigns();
    fetchFilters();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.category) params.append('category', filters.category);
      if (filters.platform) params.append('platform', filters.platform);

      const res = await fetch(
        `${API_URL}/api/ugc/campaigns/available?${params}`
      );
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [citiesRes, catsRes] = await Promise.all([
        fetch(`${API_URL}/api/ugc/campaigns/filters/cities`),
        fetch(`${API_URL}/api/ugc/campaigns/filters/categories`)
      ]);
      const citiesData = await citiesRes.json();
      const catsData = await catsRes.json();
      setCities(citiesData.cities || []);
      setCategories(catsData.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [filters]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-PY').format(price) + ' Gs';
  };

  const getCanjeTypeLabel = (type) => {
    return type === 'product' ? 'Producto' : 'Experiencia';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light">
              <span className="text-[#d4a968] italic">Campañas</span> Disponibles
            </h1>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">Filtrar por:</span>
                <button
                  onClick={() => setFilters({ city: '', category: '', platform: '' })}
                  className="text-sm text-[#d4a968] hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({...filters, city: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#d4a968] focus:outline-none"
                >
                  <option value="">Todas las ciudades</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#d4a968] focus:outline-none"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={filters.platform}
                  onChange={(e) => setFilters({...filters, platform: e.target.value})}
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#d4a968] focus:outline-none"
                >
                  <option value="">Todas las plataformas</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#d4a968] animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-medium mb-2">No hay campañas disponibles</h2>
            <p className="text-gray-400">Volvé pronto, siempre hay nuevas oportunidades</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/ugc/campaigns/${campaign.id}`}
                className="group p-6 bg-white/5 border border-white/10 rounded-xl hover:border-[#d4a968]/50 transition-all"
              >
                {/* Brand */}
                <div className="flex items-center gap-3 mb-4">
                  {campaign.brand?.logo_url ? (
                    <img
                      src={campaign.brand.logo_url}
                      alt={campaign.brand.company_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
                      <span className="text-[#d4a968] font-medium">
                        {campaign.brand?.company_name?.charAt(0) || 'M'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">{campaign.brand?.company_name}</span>
                    <p className="text-xs text-gray-500">{campaign.category}</p>
                  </div>
                </div>

                {/* Campaign Name */}
                <h3 className="text-lg font-medium mb-2 group-hover:text-[#d4a968] transition-colors">
                  {campaign.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {campaign.description}
                </p>

                {/* Canje Info */}
                <div className="p-3 bg-[#d4a968]/10 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Canje:</span>
                    <span className="text-[#d4a968] font-medium">
                      {getCanjeTypeLabel(campaign.canje?.type)}
                    </span>
                  </div>
                  <p className="text-sm text-white mt-1">{campaign.canje?.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Valor: {formatPrice(campaign.canje?.value)}</p>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {campaign.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {campaign.slots_available}/{campaign.slots}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4a968] transition-colors" />
                </div>

                {/* Requirements Badge */}
                {campaign.requirements?.min_followers && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs text-gray-500">
                      Mínimo {campaign.requirements.min_followers.toLocaleString()} seguidores
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsList;
