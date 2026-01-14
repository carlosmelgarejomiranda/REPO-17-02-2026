import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, AlertTriangle, Check, Copy, RefreshCw, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = getApiUrl();

// MFA Setup Component - Initial configuration
export const MFASetup = ({ onComplete, onSkip, token }) => {
  const [step, setStep] = useState(1); // 1: intro, 2: qr, 3: verify, 4: recovery
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al iniciar configuración');
      }
      
      const data = await response.json();
      setSetupData(data);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (verificationCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/verify-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Código inválido');
      }
      
      setStep(4); // Show recovery codes
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setupData?.secret || '');
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyRecoveryCodes = () => {
    const codes = setupData?.recovery_codes?.join('\n') || '';
    navigator.clipboard.writeText(codes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-8 border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#d4a968]/20 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#d4a968]" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">Autenticación de dos factores</h2>
            <p className="text-sm text-gray-400">Protege tu cuenta de administrador</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Introduction */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-[#d4a968] mt-0.5" />
                <div>
                  <p className="text-white font-medium">¿Qué necesitas?</p>
                  <p className="text-sm text-gray-400">Una app de autenticación como Google Authenticator, Authy o 1Password</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-[#d4a968] mt-0.5" />
                <div>
                  <p className="text-white font-medium">¿Por qué es importante?</p>
                  <p className="text-sm text-gray-400">Agrega una capa extra de seguridad para acceder al panel de administración</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>Obligatorio:</strong> Como administrador, debes configurar MFA para acceder al panel.
              </p>
            </div>

            <Button
              onClick={startSetup}
              disabled={loading}
              className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Comenzar configuración'
              )}
            </Button>
          </div>
        )}

        {/* Step 2: QR Code */}
        {step === 2 && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Escanea este código QR con tu app de autenticación</p>
              <div className="bg-white p-4 rounded-xl inline-block mx-auto">
                <img 
                  src={`data:image/png;base64,${setupData.qr_code}`} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">¿No puedes escanear? Ingresa esta clave manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 px-3 py-2 rounded text-sm text-[#d4a968] font-mono break-all">
                  {setupData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
            >
              Ya lo escaneé, continuar
            </Button>
          </div>
        )}

        {/* Step 3: Verify Code */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Ingresa el código de 6 dígitos que aparece en tu app</p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white focus:border-[#d4a968] focus:outline-none"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Volver
              </Button>
              <Button
                onClick={verifySetup}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Recovery Codes */}
        {step === 4 && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">¡MFA Activado!</h3>
              <p className="text-gray-400">Guarda estos códigos de recuperación en un lugar seguro</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm text-yellow-400 mb-3">
                <strong>Importante:</strong> Estos códigos son tu respaldo si pierdes acceso a tu app de autenticación. Cada código solo se puede usar una vez.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {setupData.recovery_codes?.map((code, i) => (
                  <code key={i} className="bg-black/30 px-3 py-2 rounded text-sm text-white font-mono text-center">
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={copyRecoveryCodes}
                className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar códigos
              </Button>
            </div>

            <Button
              onClick={onComplete}
              className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
            >
              Continuar al panel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// MFA Verification Component - During login
export const MFAVerification = ({ onVerified, onCancel, partialToken }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${partialToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Código inválido');
      }
      
      onVerified(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useRecoveryCode = async () => {
    if (!recoveryCode.trim()) {
      setError('Ingresa un código de recuperación');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/recovery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${partialToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recovery_code: recoveryCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Código inválido');
      }
      
      onVerified(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-8 border border-white/10 relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#d4a968]/20 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#d4a968]" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">Verificación MFA</h2>
            <p className="text-sm text-gray-400">Ingresa el código de tu app</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!showRecovery ? (
          <div className="space-y-6">
            <div className="text-center">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white focus:border-[#d4a968] focus:outline-none"
                maxLength={6}
                autoFocus
              />
            </div>

            <Button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
            </Button>

            <button
              onClick={() => setShowRecovery(true)}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              ¿No tenés acceso a tu app? Usar código de recuperación
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Código de recuperación</label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white font-mono focus:border-[#d4a968] focus:outline-none"
                autoFocus
              />
            </div>

            <Button
              onClick={useRecoveryCode}
              disabled={loading || !recoveryCode.trim()}
              className="w-full py-4 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Usar código de recuperación'}
            </Button>

            <button
              onClick={() => setShowRecovery(false)}
              className="w-full text-sm text-gray-400 hover:text-white transition-colors"
            >
              Volver a código MFA
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// MFA Settings Component - For admin panel
export const MFASettings = ({ user, token, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newRecoveryCodes, setNewRecoveryCodes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching MFA status:', err);
    }
  };

  const regenerateRecoveryCodes = async () => {
    if (regenerateCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/mfa/regenerate-recovery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: regenerateCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Error al regenerar códigos');
      }
      
      setNewRecoveryCodes(data.recovery_codes);
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    const codes = newRecoveryCodes?.join('\n') || '';
    navigator.clipboard.writeText(codes);
  };

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-[#d4a968]" />
        <h3 className="text-lg font-medium text-white">Autenticación de dos factores (MFA)</h3>
      </div>

      {status ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              {status.mfa_enabled ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {status.mfa_enabled ? 'MFA Activado' : 'MFA No configurado'}
                </p>
                {status.mfa_enabled && (
                  <p className="text-sm text-gray-400">
                    Activado el {new Date(status.mfa_enabled_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {!status.mfa_enabled && (
              <Button
                onClick={() => setShowSetup(true)}
                className="bg-[#d4a968] hover:bg-[#c49958] text-black"
              >
                Configurar
              </Button>
            )}
          </div>

          {status.mfa_enabled && (
            <>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Códigos de recuperación</p>
                    <p className="text-sm text-gray-400">
                      {status.recovery_codes_remaining} códigos disponibles
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowRegenerateModal(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerar
                  </Button>
                </div>
              </div>

              {status.recovery_codes_remaining <= 3 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-400">
                    <strong>Atención:</strong> Te quedan pocos códigos de recuperación. Considera regenerarlos.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Setup Modal */}
      {showSetup && (
        <MFASetup
          token={token}
          onComplete={() => {
            setShowSetup(false);
            fetchStatus();
            if (onUpdate) onUpdate();
          }}
        />
      )}

      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-md w-full p-8 border border-white/10">
            <h3 className="text-xl font-medium text-white mb-4">Regenerar códigos de recuperación</h3>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {!newRecoveryCodes ? (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Ingresa tu código MFA actual para generar nuevos códigos de recuperación. Los códigos anteriores quedarán inválidos.
                </p>
                <input
                  type="text"
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-[#d4a968] focus:outline-none"
                  maxLength={6}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRegenerateModal(false);
                      setRegenerateCode('');
                      setError('');
                    }}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={regenerateRecoveryCodes}
                    disabled={loading || regenerateCode.length !== 6}
                    className="flex-1 bg-[#d4a968] hover:bg-[#c49958] text-black"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 mb-3">
                    <strong>¡Códigos regenerados!</strong> Guarda estos nuevos códigos en un lugar seguro.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {newRecoveryCodes.map((code, i) => (
                      <code key={i} className="bg-black/30 px-3 py-2 rounded text-sm text-white font-mono text-center">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={copyRecoveryCodes}
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar códigos
                </Button>
                <Button
                  onClick={() => {
                    setShowRegenerateModal(false);
                    setNewRecoveryCodes(null);
                    setRegenerateCode('');
                  }}
                  className="w-full bg-[#d4a968] hover:bg-[#c49958] text-black"
                >
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default { MFASetup, MFAVerification, MFASettings };
