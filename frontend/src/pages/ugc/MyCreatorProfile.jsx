import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Instagram, Music2, Camera, Edit2, 
  Check, MapPin, Tag, Shield, Loader2, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getApiUrl } from '../../utils/api';
import SocialVerification from '../../components/SocialVerification';

const API_URL = getApiUrl();

const MyCreatorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({});

  useEffect(() => {
    fetchProfile();
    fetchVerificationStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/ugc/creators/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      console.error(err);
    }
  };

  const handleVerificationComplete = (platform, data) => {
    setVerificationStatus(prev => ({
      ...prev,
      [platform]: data
    }));
    fetchProfile(); // Refresh profile data
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/ugc/creator/dashboard')} 
            className="text-gray-400 hover:text-white flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Dashboard
          </button>
          <h1 className="text-lg font-medium">Mi Perfil</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#d4a968] to-amber-600 flex items-center justify-center text-3xl font-light">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-medium mb-1">{profile?.name}</h2>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              {profile?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {profile?.categories?.slice(0, 3).join(', ') || 'Sin categorías'}
              </span>
            </div>
            {profile?.bio && (
              <p className="text-gray-400 mt-3 text-sm">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Social Accounts Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#d4a968]" />
              Redes Sociales Verificadas
            </h3>
            <button
              onClick={() => setShowVerification(!showVerification)}
              className="px-4 py-2 text-sm bg-[#d4a968] text-black rounded-lg hover:bg-[#c49958] transition-colors"
            >
              {showVerification ? 'Cerrar' : 'Verificar Redes'}
            </button>
          </div>

          {/* Verification Component */}
          {showVerification && (
            <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
              <SocialVerification 
                onVerificationComplete={handleVerificationComplete}
                initialData={verificationStatus}
              />
            </div>
          )}

          {/* Connected Accounts Display */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Instagram */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                  <Instagram className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">Instagram</p>
                  {verificationStatus.instagram ? (
                    <p className="text-sm text-green-400 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verificado
                    </p>
                  ) : profile?.instagram_handle ? (
                    <p className="text-sm text-yellow-400">Sin verificar</p>
                  ) : (
                    <p className="text-sm text-gray-500">No conectado</p>
                  )}
                </div>
              </div>
              
              {verificationStatus.instagram ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Usuario</span>
                    <span className="text-white">@{verificationStatus.instagram.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seguidores</span>
                    <span className="text-[#d4a968] font-medium">
                      {formatNumber(verificationStatus.instagram.follower_count)}
                    </span>
                  </div>
                  {verificationStatus.instagram.verified_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Verificado el {new Date(verificationStatus.instagram.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : profile?.instagram_handle ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Usuario</span>
                    <span className="text-white">@{profile.instagram_handle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seguidores</span>
                    <span className="text-gray-400">
                      {formatNumber(profile.instagram_followers)} (sin verificar)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowVerification(true)}
                    className="mt-2 w-full py-2 text-sm bg-[#d4a968]/20 text-[#d4a968] rounded-lg hover:bg-[#d4a968]/30 transition-colors"
                  >
                    Verificar ahora
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowVerification(true)}
                  className="w-full py-2 text-sm bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Conectar Instagram
                </button>
              )}
            </div>

            {/* TikTok */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-black border border-white/20 flex items-center justify-center">
                  <Music2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">TikTok</p>
                  {verificationStatus.tiktok ? (
                    <p className="text-sm text-green-400 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verificado
                    </p>
                  ) : profile?.tiktok_handle ? (
                    <p className="text-sm text-yellow-400">Sin verificar</p>
                  ) : (
                    <p className="text-sm text-gray-500">No conectado</p>
                  )}
                </div>
              </div>
              
              {verificationStatus.tiktok ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Usuario</span>
                    <span className="text-white">@{verificationStatus.tiktok.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seguidores</span>
                    <span className="text-[#d4a968] font-medium">
                      {formatNumber(verificationStatus.tiktok.follower_count)}
                    </span>
                  </div>
                  {verificationStatus.tiktok.likes_count && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Likes totales</span>
                      <span className="text-white">
                        {formatNumber(verificationStatus.tiktok.likes_count)}
                      </span>
                    </div>
                  )}
                  {verificationStatus.tiktok.verified_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Verificado el {new Date(verificationStatus.tiktok.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : profile?.tiktok_handle ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Usuario</span>
                    <span className="text-white">@{profile.tiktok_handle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Seguidores</span>
                    <span className="text-gray-400">
                      {formatNumber(profile.tiktok_followers)} (sin verificar)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowVerification(true)}
                    className="mt-2 w-full py-2 text-sm bg-[#d4a968]/20 text-[#d4a968] rounded-lg hover:bg-[#d4a968]/30 transition-colors"
                  >
                    Verificar ahora
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowVerification(true)}
                  className="w-full py-2 text-sm bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Conectar TikTok
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-gray-500 text-xs mt-4">
            💡 Los seguidores verificados dan más confianza a las marcas y aumentan tus chances de ser seleccionado
          </p>
        </div>

        {/* Profile Info Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#d4a968]" />
            Información del Perfil
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Nombre</p>
              <p className="text-white">{profile?.name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Email</p>
              <p className="text-white">{user?.email || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Ciudad</p>
              <p className="text-white">{profile?.city || '-'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Teléfono</p>
              <p className="text-white">{profile?.phone || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-gray-400 text-sm mb-1">Categorías</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile?.categories?.map((cat, i) => (
                  <span key={i} className="px-3 py-1 bg-[#d4a968]/10 text-[#d4a968] rounded-full text-sm">
                    {cat}
                  </span>
                )) || <span className="text-gray-500">Sin categorías</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCreatorProfile;
