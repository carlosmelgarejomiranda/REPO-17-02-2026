import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

const ClickableAvatar = ({ 
  src, 
  alt, 
  fallback, 
  size = 'md',
  className = '',
  showBorder = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const sizeClasses = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };
  
  const hasImage = src && src !== '';
  
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
        {hasImage ? (
          <img 
            src={src} 
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d4a968] to-[#b08848] flex items-center justify-center text-black font-medium">
            {fallback || alt?.charAt(0) || '?'}
          </div>
        )}
      </div>
      
      <ImageLightbox
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        src={src}
        alt={alt}
      />
    </>
  );
};

export default ClickableAvatar;
