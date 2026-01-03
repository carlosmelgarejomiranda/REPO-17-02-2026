import React from 'react';

/**
 * MediaRenderer - Renders image or video based on URL
 * Detects if URL is a video and renders appropriate element
 */
export const MediaRenderer = ({ 
  src, 
  alt = '', 
  className = '', 
  style = {},
  autoPlay = true,
  muted = true,
  loop = true,
  playsInline = true,
  controls = false,
  objectFit = 'cover',
  objectPosition = '50% 50%',
  ...props 
}) => {
  // Check if source is a video
  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
    const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const lowerUrl = url.toLowerCase();
    
    // Check for data URLs with video mime types
    if (url.startsWith('data:')) {
      return videoMimeTypes.some(type => url.includes(type));
    }
    
    // Check for video extensions
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const isVideoSrc = isVideo(src);

  const baseStyle = {
    objectFit,
    objectPosition,
    ...style
  };

  if (isVideoSrc) {
    return (
      <video
        src={src}
        className={className}
        style={baseStyle}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        controls={controls}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={baseStyle}
      {...props}
    />
  );
};

/**
 * BackgroundMedia - Renders a background image or video
 * For use in hero sections and similar components
 */
export const BackgroundMedia = ({
  src,
  className = '',
  overlayClassName = '',
  children,
  videoProps = {}
}) => {
  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
    const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const lowerUrl = url.toLowerCase();
    
    if (url.startsWith('data:')) {
      return videoMimeTypes.some(type => url.includes(type));
    }
    
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const isVideoSrc = isVideo(src);

  return (
    <div className={`relative ${className}`}>
      {isVideoSrc ? (
        <video
          src={src}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          {...videoProps}
        />
      ) : (
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Helper function to check if URL is video (can be imported separately)
export const isVideoUrl = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'];
  const videoMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
  const lowerUrl = url.toLowerCase();
  
  if (url.startsWith('data:')) {
    return videoMimeTypes.some(type => url.includes(type));
  }
  
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};
