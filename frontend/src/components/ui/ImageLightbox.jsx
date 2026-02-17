import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ImageLightbox = ({ isOpen, onClose, src, alt }) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Image container */}
      <div 
        className="relative z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-br from-[#d4a968]/30 to-purple-500/30 rounded-2xl blur-xl" />
        
        {/* Image frame */}
        <div className="relative p-1 bg-gradient-to-br from-[#d4a968] to-purple-500 rounded-2xl">
          <div className="bg-black rounded-xl overflow-hidden">
            <img
              src={src}
              alt={alt || 'Profile'}
              className="max-w-[80vw] max-h-[80vh] min-w-[200px] min-h-[200px] object-contain"
            />
          </div>
        </div>
        
        {/* Name below image */}
        {alt && (
          <p className="text-center text-white/80 mt-4 text-lg font-light">
            {alt}
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageLightbox;
