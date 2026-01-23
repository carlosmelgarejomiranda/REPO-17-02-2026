import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ user, onLoginClick, onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to saved path or home
    if (user) {
      const redirectPath = sessionStorage.getItem('redirect_after_login');
      if (redirectPath) {
        sessionStorage.removeItem('redirect_after_login');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    } else {
      // Show login modal
      onLoginClick();
    }
  }, [user, navigate, onLoginClick]);

  // Show a minimal loading state while auth modal opens
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <img 
          src="https://storage.googleapis.com/cluvi/avenue-logo-light.png" 
          alt="Avenue" 
          className="h-12 mx-auto mb-6"
        />
        <p className="text-gray-400">Iniciando sesión...</p>
      </div>
    </div>
  );
};

export default LoginPage;
