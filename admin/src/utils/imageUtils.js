// Image URL utilities for handling different environments
import { getEnvironmentImageUrl, getApiBaseUrl } from './environmentUtils.js'

/**
 * Get the full image URL, handling both absolute and relative paths
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export const getImageUrl = (imageUrl) => {
  return getEnvironmentImageUrl(imageUrl)
}

/**
 * Get the API base URL for the current environment
 * @returns {string} - The API base URL
 */
export const getApiBase = () => {
  return getApiBaseUrl()
}
