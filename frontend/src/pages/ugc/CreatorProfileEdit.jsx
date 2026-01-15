import { getApiUrl } from '../../utils/api';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, MapPin, Instagram, Music2, Plus, Save, Loader2,
  Camera, Trash2, CheckCircle, AlertCircle, Edit3, X, Shield, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import SocialVerification from '../../components/SocialVerification';

const API_URL = getApiUrl();

const CreatorProfileEdit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    bio: '',
    categories: []
  });
  
  // Add social network modal
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState('instagram');
  const [newSocialUsername, setNewSocialUsername] = useState('');
  const [addingSocial, setAddingSocial] = useState(false);

  // Update followers modal
  const [showUpdateFollowers, setShowUpdateFollowers] = useState(null);
  const [newFollowers, setNewFollowers] = useState('');
  const [updatingFollowers, setUpdatingFollowers] = useState(false);

  // AI Verification modal
  const [showAIVerification, setShowAIVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});

  const categories = [
    'Moda', 'Belleza', 'Lifestyle', 'Fitness', 'Gastronomía', 
    'Tecnología', 'Viajes', 'Arte', 'Música', 'Deportes'
  ];

  useEffect(() => {
    fetchProfile();
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/social-verification/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const handleVerificationComplete = (platform, data) => {
    setVerificationStatus(prev => ({ ...prev, [platform]: data }));
    setShowAIVerification(false);
    fetchProfile();
    setSuccess(`¡${platform.charAt(0).toUpperCase() + platform.slice(1)} verificado correctamente!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ugc/creators/me`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        // Handle both social_networks and social_media (legacy)
        const socialNetworks = data.social_networks || data.social_media || [];
        setProfile({ ...data, social_networks: socialNetworks });
        setFormData({
          name: data.name || '',
          city: data.city || '',
          bio: data.bio || '',
          categories: data.categories || []
        });
      } else if (res.status === 404) {
        // No creator profile, redirect to onboarding
        navigate('/ugc/creator/onboarding');
      } else {
        setError('Error al cargar el perfil');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/api/ugc/creators/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al guardar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialNetwork = async () => {
    if (!newSocialUsername.trim()) return;
    
    setAddingSocial(true);
    setError('');

    try {
      const res = await fetch(
        `${API_URL}/api/ugc/creators/me/social?platform=${newSocialPlatform}&username=${newSocialUsername.replace('@', '')}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (res.ok) {
        setShowAddSocial(false);
        setNewSocialUsername('');
        fetchProfile();
        setSuccess('Red social agregada');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al agregar red social');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setAddingSocial(false);
    }
  };

  const handleUpdateFollowers = async (platform) => {
    if (!newFollowers || isNaN(parseInt(newFollowers))) return;
    
    setUpdatingFollowers(true);
    setError('');

    try {
      const res = await fetch(
        `${API_URL}/api/ugc/creators/me/social/${platform}/followers?followers=${parseInt(newFollowers)}`,
        {
          method: 'PUT',
          credentials: 'include'
        }
      );

      if (res.ok) {
        setShowUpdateFollowers(null);
        setNewFollowers('');
        fetchProfile();
        setSuccess('Seguidores actualizados');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.detail || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setUpdatingFollowers(false);
    }
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
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
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/ugc/creator/dashboard" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </Link>
          <span className="text-xl font-light">
            <span className="text-[#d4a968] italic">Avenue</span> UGC
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2">Mi Perfil de Creator</h1>
          <p className="text-gray-400">Editá tu información y redes sociales</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#d4a968]" />
            Foto de Perfil
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                {profile?.profile_picture ? (
                  <img 
                    src={profile.profile_picture} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-light">{formData.name?.charAt(0) || '?'}</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">
                Tu foto de perfil viene de tu cuenta de Google
              </p>
              <p className="text-gray-500 text-xs">
                Para cambiarla, actualizá tu foto en Google
              </p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#d4a968]" />
            Información Básica
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-[#d4a968] focus:outline-none transition-colors"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Ciudad</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-[#d4a968] focus:outline-none transition-colors"
                  placeholder="Ej: Asunción"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-[#d4a968] focus:outline-none transition-colors resize-none"
                placeholder="Contá un poco sobre vos y tu contenido..."
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#d4a968]" />
            Categorías de Contenido
          </h2>
          <p className="text-gray-400 text-sm mb-4">Seleccioná las categorías en las que creás contenido</p>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  formData.categories.includes(category)
                    ? 'bg-[#d4a968] text-black font-medium'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Social Networks */}
        <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#d4a968]" />
              Mis Redes Sociales
            </h2>
            <button
              onClick={() => setShowAddSocial(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#d4a968]/20 text-[#d4a968] rounded-lg text-sm hover:bg-[#d4a968]/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          {profile?.social_networks?.length > 0 ? (
            <div className="space-y-3">
              {profile.social_networks.map((sn, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-black/50 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sn.platform === 'tiktok' ? (
                        <div className="w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center">
                          <Music2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{sn.username?.startsWith('@') ? sn.username : `@${sn.username}`}</p>
                        <p className="text-sm text-gray-500 capitalize">{sn.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium">
                        {sn.followers ? sn.followers.toLocaleString() : '—'}
                      </p>
                      <button
                        onClick={() => {
                          setShowUpdateFollowers(sn.platform);
                          setNewFollowers(sn.followers?.toString() || '');
                        }}
                        className="text-xs text-[#d4a968] hover:underline"
                      >
                        {sn.followers ? 'Actualizar' : 'Agregar'} seguidores
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Instagram className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 mb-4">No tenés redes sociales agregadas</p>
              <button
                onClick={() => setShowAddSocial(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4a968] text-black rounded-lg text-sm font-medium hover:bg-[#c49958] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar red social
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
          <Link
            to="/ugc/creator/dashboard"
            className="px-6 py-3 border border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </div>

      {/* Add Social Network Modal */}
      {showAddSocial && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-medium mb-6">Agregar Red Social</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Plataforma</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewSocialPlatform('instagram')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      newSocialPlatform === 'instagram'
                        ? 'border-pink-500 bg-pink-500/10 text-pink-400'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Instagram className="w-5 h-5" />
                    Instagram
                  </button>
                  <button
                    onClick={() => setNewSocialPlatform('tiktok')}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                      newSocialPlatform === 'tiktok'
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Music2 className="w-5 h-5" />
                    TikTok
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Usuario</label>
                <input
                  type="text"
                  value={newSocialUsername}
                  onChange={(e) => setNewSocialUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                  placeholder="@tu_usuario"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddSocialNetwork}
                disabled={addingSocial || !newSocialUsername.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] disabled:opacity-50"
              >
                {addingSocial ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Agregar
              </button>
              <button
                onClick={() => {
                  setShowAddSocial(false);
                  setNewSocialUsername('');
                }}
                className="px-4 py-3 border border-white/20 rounded-lg text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Followers Modal */}
      {showUpdateFollowers && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-medium mb-2">Actualizar Seguidores</h3>
            <p className="text-gray-400 text-sm mb-6">
              Ingresá la cantidad actual de seguidores en {showUpdateFollowers}
            </p>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cantidad de seguidores</label>
              <input
                type="number"
                value={newFollowers}
                onChange={(e) => setNewFollowers(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-[#d4a968] focus:outline-none"
                placeholder="Ej: 5000"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleUpdateFollowers(showUpdateFollowers)}
                disabled={updatingFollowers || !newFollowers}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#d4a968] text-black rounded-lg font-medium hover:bg-[#c49958] disabled:opacity-50"
              >
                {updatingFollowers ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowUpdateFollowers(null);
                  setNewFollowers('');
                }}
                className="px-4 py-3 border border-white/20 rounded-lg text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfileEdit;
