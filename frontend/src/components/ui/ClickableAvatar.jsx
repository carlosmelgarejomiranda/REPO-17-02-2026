import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

// Función para obtener URL de imagen en alta resolución (para Google Photos)
const getHighResImageUrl = (url, size = 400) => {
  if (!url) return url;
  // Google Photos URLs tienen formato: ...=s96-c (donde 96 es el tamaño)
  // Reemplazamos por un tamaño mayor
  if (size === 'original') {
    // Remover el parámetro de tamaño para obtener la imagen original
    return url.replace(/=s\d+-c/, '=s0');
  }
  return url.replace(/=s\d+-c/, `=s${size}-c`);
};

const ClickableAvatar = ({ 
  src, 
  alt, 
  fallback, 
  size = 'md',
  className = '',
  showBorder = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };
  
  const hasImage = src && src !== '' && !imageError;
  
  // URL de calidad máxima para el lightbox (imagen original)
  const highResSrc = getHighResImageUrl(src, 'original');
  // URL de resolución media para el avatar
  const mediumResSrc = getHighResImageUrl(src, 400);

  // Get initials from name
  const initials = fallback || alt?.charAt(0) || '?';
  
  return (
    <>
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          overflow-hidden 
          flex items-center justify-center
          ${hasImage ? 'cursor-pointer hover:ring-2 hover:ring-[#d4a968]/50 transition-all duration-200' : ''}
          ${showBorder ? 'ring-2 ring-[#d4a968]/30' : ''}
          ${className}
        `}
        onClick={() => hasImage && setIsOpen(true)}
        title={hasImage ? 'Click para ampliar' : undefined}
      >
        {src && !imageError ? (
          <img 
            src={mediumResSrc} 
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-medium">
            {initials}
          </div>
        )}
      </div>
      
      {hasImage && (
        <ImageLightbox
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          src={highResSrc}
          alt={alt}
        />
      )}
    </>
  );
};

export default ClickableAvatar;
