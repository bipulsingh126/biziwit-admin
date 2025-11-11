// Environment utilities for handling different deployment scenarios

/**
 * Detect the current environment and return appropriate API configuration
 * @returns {Object} - Environment configuration
 */
export const getEnvironmentConfig = () => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const isDevelopment = import.meta.env.MODE === 'development'
  
  // Production admin panel
  if (hostname === 'admin.bizwitresearch.com') {
    return {
      apiBase: 'https://api.bizwitresearch.com',
      environment: 'production',
      allowMixedContent: false
    }
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      apiBase: import.meta.env.VITE_API_BASE || '',
      environment: 'development',
      allowMixedContent: true
    }
  }
  
  // Fallback
  return {
    apiBase: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
    environment: isDevelopment ? 'development' : 'production',
    allowMixedContent: isDevelopment
  }
}

/**
 * Get the appropriate API base URL for the current environment
 * @returns {string} - API base URL
 */
export const getApiBaseUrl = () => {
  const config = getEnvironmentConfig()
  return config.apiBase
}

/**
 * Check if mixed content (HTTPS -> HTTP) is allowed in current environment
 * @returns {boolean} - Whether mixed content is allowed
 */
export const isMixedContentAllowed = () => {
  const config = getEnvironmentConfig()
  return config.allowMixedContent
}

/**
 * Get environment-aware image URL
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export const getEnvironmentImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return ''
  
  const trimmedUrl = imageUrl.trim()
  if (!trimmedUrl) return ''
  
  // If it's already a full URL or data URL, return as is
  if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('data:')) {
    return trimmedUrl
  }
  
  const apiBase = getApiBaseUrl()
  const cleanUrl = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`
  
  return `${apiBase}${cleanUrl}`
}
