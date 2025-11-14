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
  
  // Server deployment (check for common server hostnames)
  if (hostname.includes('api.bizwitresearch.com') || 
      hostname.includes('biziwit.com') || 
      hostname.includes('herokuapp.com') || 
      hostname.includes('vercel.app') || 
      hostname.includes('netlify.app')) {
    return {
      apiBase: `${protocol}//${hostname.replace('admin.', 'api.')}`,
      environment: 'production',
      allowMixedContent: false
    }
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      apiBase: import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
      environment: 'development',
      allowMixedContent: true
    }
  }
  
  // Fallback for any other deployment
  return {
    apiBase: import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || `${protocol}//${hostname}:4000`,
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
  
  // Priority: Environment variable > Config > Default
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || config.apiBase
  
  console.log('🌐 API Base URL Resolution:', {
    hostname: window.location.hostname,
    configApiBase: config.apiBase,
    envApiBase: import.meta.env.VITE_API_BASE_URL,
    envApiBase2: import.meta.env.VITE_API_BASE,
    finalApiBase: apiBase,
    environment: config.environment,
    mode: import.meta.env.MODE,
    allEnvVars: import.meta.env
  })
  
  return apiBase
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
  
  // Get the appropriate API base URL for current environment
  const apiBase = getApiBaseUrl()
  
  // Handle both relative paths and absolute paths
  let cleanUrl = trimmedUrl
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = `/${cleanUrl}`
  }
  
  // For deployment: ensure we use the correct domain
  const fullUrl = `${apiBase}${cleanUrl}`
  
  console.log('🖼️ Image URL Resolution:', {
    input: imageUrl,
    apiBase,
    cleanUrl,
    output: fullUrl,
    environment: import.meta.env.MODE
  })
  
  return fullUrl
}
