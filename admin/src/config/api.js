// API configuration based on environment
import { getEnvironmentConfig } from '../utils/environmentUtils.js'

const getApiConfig = () => {
  const envConfig = getEnvironmentConfig()
  
  return {
    baseURL: envConfig.apiBase,
    uploadsURL: `${envConfig.apiBase}/uploads`,
    imagesURL: `${envConfig.apiBase}/images`,
    environment: envConfig.environment,
    allowMixedContent: envConfig.allowMixedContent
  }
}

export const API_CONFIG = getApiConfig()
export const { baseURL, uploadsURL, imagesURL, environment, allowMixedContent } = API_CONFIG

// Export individual functions for convenience
export const getApiBaseUrl = () => API_CONFIG.baseURL
export const getUploadsUrl = () => API_CONFIG.uploadsURL
export const getImagesUrl = () => API_CONFIG.imagesURL
export const isProduction = () => API_CONFIG.environment === 'production'
export const isDevelopment = () => API_CONFIG.environment === 'development'

// Helper function to construct full URLs
export const buildApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_CONFIG.baseURL}${cleanEndpoint}`
}

export const buildUploadUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.uploadsURL}${cleanPath}`
}

export const buildImageUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_CONFIG.imagesURL}${cleanPath}`
}

export default API_CONFIG
