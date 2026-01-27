import React from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

/**
 * Modal de advertencia de timeout de sesión
 */
const SessionTimeoutWarning = ({ 
  show, 
  remainingSeconds, 
  onExtend, 
  onLogout 
}) => {
  if (!show) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-fadeIn">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-yellow-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-light text-white text-center mb-2">
          Tu sesión está por <span className="text-yellow-400">expirar</span>
        </h2>

        {/* Message */}
        <p className="text-gray-400 text-center mb-6">
          Por seguridad, cerraremos tu sesión por inactividad.
        </p>

        {/* Countdown */}
        <div className="bg-black/50 rounded-xl p-4 mb-6">
          <div className="text-center">
            <span className="text-4xl font-mono text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <p className="text-gray-500 text-sm mt-1">minutos restantes</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <button
            onClick={onExtend}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#d4a968] hover:bg-[#c49958] text-black font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Continuar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SessionTimeoutWarning;
