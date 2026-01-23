import React, { useState, useRef, useCallback } from 'react';
import { getApiUrl } from '../utils/api';
import { 
  Instagram, 
  Music2, 
  Upload, 
  Camera, 
  Check, 
  Loader2, 
  AlertCircle,
  X,
  RefreshCw,
  Shield,
  Users,
  BadgeCheck
} from 'lucide-react';

const API_URL = getApiUrl();

const SocialVerification = ({ onVerificationComplete, initialData = {} }) => {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [verifiedAccounts, setVerifiedAccounts] = useState(initialData);
  const [step, setStep] = useState('select'); // 'select', 'upload', 'review', 'success'
  
  const fileInputRef = useRef(null);

  const platforms = [
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram,
      color: 'from-purple-500 via-pink-500 to-orange-500',
      instructions: 'Captura tu perfil mostrando seguidores, publicaciones y nombre de usuario'
    },
    { 
      id: 'tiktok', 
      name: 'TikTok', 
      icon: Music2,
      color: 'from-black to-gray-800',
      instructions: 'Captura tu perfil mostrando seguidores, likes totales y nombre de usuario'
    }
  ];

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setStep('upload');
    setError(null);
    setExtractedData(null);
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 10MB');
      return;
    }

    setError(null);
    setImagePreview(null);
    setImageBase64(null);

    // Crear preview con manejo de errores
    const reader = new FileReader();
    
    reader.onloadend = () => {
      try {
        const result = reader.result;
        if (!result || typeof result !== 'string') {
          setError('Error al leer la imagen. Intentá con otra.');
          return;
        }
        setImagePreview(result);
        // Extraer solo el base64 sin el prefijo
        const base64Parts = result.split(',');
        if (base64Parts.length !== 2) {
          setError('Formato de imagen no válido. Intentá con otra.');
          return;
        }
        const base64 = base64Parts[1];
        if (!base64 || base64.length < 100) {
          setError('La imagen parece estar vacía o corrupta.');
          return;
        }
        setImageBase64(base64);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Error al procesar la imagen. Intentá con otra.');
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      setError('Error al leer el archivo. Intentá de nuevo.');
    };
    
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    if (!imageBase64 || !selectedPlatform) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/social-verification/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          platform: selectedPlatform.id
        })
      });

      // Read response body as text first to avoid stream issues
      let responseText;
      try {
        responseText = await response.text();
      } catch (readError) {
        console.error('Failed to read response:', readError);
        throw new Error('Error de conexión con el servidor. Por favor, intentá de nuevo.');
      }
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Response text:', responseText);
        // Check if it's an HTML error page
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error('Error de conexión con el servidor. Por favor, intentá de nuevo.');
        }
        throw new Error('Error al procesar la respuesta del servidor.');
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Error al analizar la imagen');
      }

      setExtractedData(data.extracted_data);
      setStep('review');

    } catch (err) {
      // Improve error messages for common issues
      let errorMessage = err.message || 'Error al procesar la imagen';
      if (errorMessage.toLowerCase().includes('disturbed') || 
          errorMessage.toLowerCase().includes('locked') ||
          errorMessage.toLowerCase().includes('stream') ||
          errorMessage.toLowerCase().includes('clone') ||
          errorMessage.toLowerCase().includes('body is already used')) {
        errorMessage = 'Error al procesar la imagen. Por favor, intentá con otro screenshot.';
      } else if (errorMessage.toLowerCase().includes('network') || 
                 errorMessage.toLowerCase().includes('fetch')) {
        errorMessage = 'Error de conexión. Verificá tu internet e intentá de nuevo.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        platform: selectedPlatform.id,
        username: extractedData.username || '',
        follower_count: String(extractedData.follower_count || 0)
      });
      
      // Add optional params only if they have values
      if (extractedData.following_count) {
        params.append('following_count', String(extractedData.following_count));
      }
      if (extractedData.posts_count) {
        params.append('posts_count', String(extractedData.posts_count));
      }
      if (extractedData.likes_count) {
        params.append('likes_count', String(extractedData.likes_count));
      }
      params.append('is_verified', String(extractedData.is_verified || false));

      const response = await fetch(`${API_URL}/api/social-verification/confirm?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      // Clone response before reading to avoid "body stream already read" error
      const responseClone = response.clone();
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, try to get text
        const text = await responseClone.text();
        console.error('Response text:', text);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Error al guardar verificación');
      }

      // Actualizar estado local
      setVerifiedAccounts(prev => ({
        ...prev,
        [selectedPlatform.id]: data.data
      }));

      setStep('success');
      
      // Notificar al componente padre
      onVerificationComplete?.(selectedPlatform.id, data.data);

    } catch (err) {
      console.error('Confirm error:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setSelectedPlatform(null);
    setStep('select');
    setImagePreview(null);
    setImageBase64(null);
    setExtractedData(null);
    setError(null);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || '0';
  };

  // Render: Platform Selection
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#d4a968]/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#d4a968]" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Verificar Redes Sociales</h3>
          <p className="text-gray-400 text-sm">
            Sube un screenshot de tu perfil y nuestra IA verificará tus seguidores automáticamente
          </p>
        </div>

        <div className="space-y-3">
          {platforms.map((platform) => {
            const isVerified = verifiedAccounts[platform.id];
            const Icon = platform.icon;
            
            return (
              <div
                key={platform.id}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isVerified 
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-white/5 border-white/10 hover:border-[#d4a968]/50 hover:bg-white/10 cursor-pointer'
                }`}
                onClick={() => !isVerified && handlePlatformSelect(platform)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{platform.name}</p>
                    {isVerified ? (
                      <div>
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <BadgeCheck className="w-4 h-4" />
                          <span>@{isVerified.username}</span>
                          <span className="text-green-300">• {formatNumber(isVerified.follower_count)} seguidores</span>
                        </div>
                        {isVerified.verified_at && (
                          <p className="text-gray-500 text-xs mt-1">
                            Verificado: {new Date(isVerified.verified_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Click para verificar</p>
                    )}
                  </div>
                </div>
                
                {isVerified ? (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlatformSelect(platform);
                      }}
                      className="px-3 py-1 text-xs bg-[#d4a968]/20 text-[#d4a968] rounded-lg hover:bg-[#d4a968]/30 transition-colors"
                    >
                      Actualizar
                    </button>
                  </div>
                ) : (
                  <div className="text-[#d4a968]">
                    <Upload className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-gray-500 text-xs mt-4">
          🔒 Tus screenshots solo se usan para verificación y no se almacenan
        </p>
      </div>
    );
  }

  // Render: Upload Screenshot
  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={resetFlow} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <selectedPlatform.icon className="w-5 h-5" />
            Verificar {selectedPlatform.name}
          </h3>
          <div className="w-5" />
        </div>

        {/* Instructions */}
        <div className="bg-[#d4a968]/10 border border-[#d4a968]/20 rounded-xl p-4">
          <p className="text-[#d4a968] text-sm">
            <strong>📸 Instrucciones:</strong> {selectedPlatform.instructions}
          </p>
        </div>

        {/* Upload Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            imagePreview 
              ? 'border-[#d4a968]/50 bg-[#d4a968]/5' 
              : 'border-white/20 hover:border-[#d4a968]/50 hover:bg-white/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {imagePreview ? (
            <div className="space-y-4">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded-lg shadow-lg"
              />
              <p className="text-gray-400 text-sm">Click para cambiar imagen</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-white font-medium">Subir screenshot</p>
                <p className="text-gray-500 text-sm">PNG, JPG hasta 10MB</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!imageBase64 || loading}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            imageBase64 && !loading
              ? 'bg-[#d4a968] text-black hover:bg-[#c49958]'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando con IA...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Verificar Screenshot
            </>
          )}
        </button>
      </div>
    );
  }

  // Render: Review Extracted Data
  if (step === 'review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setStep('upload')} className="text-gray-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium text-white">Confirmar Datos</h3>
          <div className="w-5" />
        </div>

        {/* Extracted Data Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${selectedPlatform.color} flex items-center justify-center`}>
              <selectedPlatform.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-medium flex items-center gap-2">
                @{extractedData?.username || 'usuario'}
                {extractedData?.is_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-400" />
                )}
              </p>
              <p className="text-gray-500 text-sm">{selectedPlatform.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <Users className="w-5 h-5 mx-auto text-[#d4a968] mb-1" />
              <p className="text-2xl font-bold text-white">
                {formatNumber(extractedData?.follower_count)}
              </p>
              <p className="text-gray-500 text-xs">Seguidores</p>
            </div>
            
            {extractedData?.following_count && (
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-white">
                  {formatNumber(extractedData.following_count)}
                </p>
                <p className="text-gray-500 text-xs">Siguiendo</p>
              </div>
            )}
            
            {extractedData?.posts_count && (
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-white">
                  {formatNumber(extractedData.posts_count)}
                </p>
                <p className="text-gray-500 text-xs">Publicaciones</p>
              </div>
            )}
            
            {extractedData?.likes_count && (
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <p className="text-2xl font-bold text-white">
                  {formatNumber(extractedData.likes_count)}
                </p>
                <p className="text-gray-500 text-xs">Likes totales</p>
              </div>
            )}
          </div>

          {extractedData?.confidence && (
            <div className={`text-center text-xs py-2 rounded-lg ${
              extractedData.confidence === 'high' 
                ? 'bg-green-500/10 text-green-400'
                : extractedData.confidence === 'medium'
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-orange-500/10 text-orange-400'
            }`}>
              Confianza de extracción: {
                extractedData.confidence === 'high' ? 'Alta' :
                extractedData.confidence === 'medium' ? 'Media' : 'Baja'
              }
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep('upload')}
            className="flex-1 py-3 rounded-xl font-medium border border-white/20 text-white hover:bg-white/5 transition-colors"
          >
            Subir otra imagen
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-medium bg-[#d4a968] text-black hover:bg-[#c49958] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Render: Success
  if (step === 'success') {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-medium text-white mb-2">
            ¡{selectedPlatform.name} Verificado!
          </h3>
          <p className="text-gray-400">
            Tu cuenta @{extractedData?.username} ha sido verificada con {formatNumber(extractedData?.follower_count)} seguidores
          </p>
        </div>

        <button
          onClick={resetFlow}
          className="px-6 py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Verificar otra red social
        </button>
      </div>
    );
  }

  return null;
};

export default SocialVerification;
