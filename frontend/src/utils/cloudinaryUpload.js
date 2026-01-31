/**
 * Cloudinary Upload Helper
 * 
 * Usage:
 * 
 * // For images:
 * const result = await uploadToCloudinary(file, 'avenue/creators');
 * console.log(result.url); // https://res.cloudinary.com/...
 * 
 * // For videos:
 * const result = await uploadToCloudinary(file, 'avenue/campaigns', 'video');
 * 
 * // With progress callback:
 * const result = await uploadToCloudinary(file, 'avenue/creators', 'image', (progress) => {
 *   console.log(`Upload progress: ${progress}%`);
 * });
 */

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Allowed folders (must match backend ALLOWED_FOLDERS)
export const CLOUDINARY_FOLDERS = {
  BRANDS: 'avenue/brands',
  CREATORS: 'avenue/creators',
  CAMPAIGNS: 'avenue/campaigns',
  METRICS: 'avenue/metrics',
  RECEIPTS: 'avenue/receipts',  // Private folder for sensitive files
  PRODUCTS: 'avenue/products',
  GENERAL: 'avenue/general',
};

/**
 * Upload file directly to Cloudinary using signed upload
 * This is the preferred method for large files as it doesn't go through our backend
 */
export async function uploadToCloudinary(
  file,
  folder = CLOUDINARY_FOLDERS.GENERAL,
  resourceType = 'image',
  onProgress = null
) {
  try {
    // Step 1: Get signature from backend
    const token = localStorage.getItem('auth_token');
    const sigResponse = await fetch(
      `${API_URL}/api/cloudinary/signature?folder=${folder}&resource_type=${resourceType}`,
      {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }
    );
    
    if (!sigResponse.ok) {
      const error = await sigResponse.json();
      throw new Error(error.detail || 'Failed to get upload signature');
    }
    
    const sig = await sigResponse.json();
    
    // Step 2: Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sig.api_key);
    formData.append('timestamp', sig.timestamp);
    formData.append('signature', sig.signature);
    formData.append('folder', sig.folder);
    
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`;
    
    // Use XMLHttpRequest for progress support
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Upload failed'));
      
      xhr.open('POST', cloudinaryUrl);
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload file through backend (for small files or when validation is needed)
 */
export async function uploadThroughBackend(file, folder = CLOUDINARY_FOLDERS.GENERAL, isPublic = true) {
  try {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(
      `${API_URL}/api/cloudinary/upload?folder=${folder}&public=${isPublic}`,
      {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Backend upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get optimized/transformed image URL
 */
export function getOptimizedUrl(publicId, options = {}) {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options;
  
  let transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);
  
  const transformString = transforms.join(',');
  
  // Note: This assumes the cloud_name is known. For dynamic usage, call the backend endpoint
  return `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/${transformString}/${publicId}`;
}

/**
 * Check if Cloudinary is configured
 */
export async function checkCloudinaryStatus() {
  try {
    const response = await fetch(`${API_URL}/api/cloudinary/status`);
    return await response.json();
  } catch (error) {
    return { configured: false, error: error.message };
  }
}
