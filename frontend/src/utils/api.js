/**
 * API URL utility for handling different environments
 * 
 * In production (deployed site), uses current origin to avoid CORS issues
 * In development/preview, uses REACT_APP_BACKEND_URL env variable
 */

export const getApiUrl = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // In production (deployed site with custom domain or non-localhost)
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      return window.location.origin;
    }
  }
  // In development or server-side rendering, use env variable
  return process.env.REACT_APP_BACKEND_URL || '';
};

// Export a singleton instance for convenience
export const API_URL = getApiUrl();

export default API_URL;
