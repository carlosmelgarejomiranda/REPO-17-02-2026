import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Hook para manejar el timeout de sesión por inactividad
 * @param {number} timeoutMinutes - Minutos de inactividad antes de cerrar sesión (default: 30)
 * @param {number} warningMinutes - Minutos antes del timeout para mostrar advertencia (default: 5)
 * @param {function} onLogout - Función a ejecutar al cerrar sesión
 */
export const useSessionTimeout = ({ 
  timeoutMinutes = 30, 
  warningMinutes = 5,
  onLogout 
}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const countdownRef = useRef(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

  const handleLogout = useCallback(() => {
    console.log('[SessionTimeout] Logging out due to inactivity');
    
    // Clear token
    localStorage.removeItem('auth_token');
    
    // Clear any timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    setShowWarning(false);
    
    // Call custom logout handler if provided
    if (onLogout) {
      onLogout();
    }
    
    // Redirect to home with message
    navigate('/?session_expired=true');
  }, [navigate, onLogout]);

  const resetTimers = useCallback(() => {
    // Don't reset if no token (not logged in)
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Hide warning if shown
    setShowWarning(false);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      console.log('[SessionTimeout] Warning: Session will expire in', warningMinutes, 'minutes');
      setShowWarning(true);
      setRemainingSeconds(warningMinutes * 60);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    // Set logout timeout
    timeoutRef.current = setTimeout(handleLogout, timeoutMs);
  }, [timeoutMs, warningMs, warningMinutes, handleLogout]);

  const extendSession = useCallback(() => {
    console.log('[SessionTimeout] Session extended by user');
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    // Activity events to track
    const events = [
      'mousedown',
      'mousemove', 
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle to avoid too many resets
    let lastActivity = Date.now();
    const throttleMs = 1000; // Only reset every 1 second max

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > throttleMs) {
        lastActivity = now;
        // Only reset if warning is not shown (user must click "Continuar" to extend)
        if (!showWarning) {
          resetTimers();
        }
      }
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timer setup
    resetTimers();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetTimers, showWarning]);

  return {
    showWarning,
    remainingSeconds,
    extendSession,
    logout: handleLogout
  };
};

export default useSessionTimeout;
