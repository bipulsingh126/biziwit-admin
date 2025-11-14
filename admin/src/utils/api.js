// API client for backend communication
import { getApiBaseUrl } from './environmentUtils.js'

// Get environment-aware API base URL
const API_BASE = getApiBaseUrl()

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const isFormData = options.body instanceof FormData;
    const config = {
      headers: { ...options.headers },
      credentials: 'include', // Include credentials for CORS requests
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (isFormData) {
      // Let the browser set the Content-Type for FormData
    } else if (config.body && typeof config.body === 'object') {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(config.body);
    }

    // Debug logging for API requests
    console.log('🌐 API Request Debug:', {
      endpoint,
      fullUrl: url,
      apiBase: API_BASE,
      method: config.method || 'GET',
      hasAuth: !!this.token,
      headers: config.headers
    });

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid - clear auth state
          this.setToken(null)
          window.location.reload()
          throw new Error('Session expired. Please login again.')
        }
        
        // Handle 404 errors for trending endpoints gracefully
        if (response.status === 404 && endpoint.includes('trending')) {
          console.warn(`Trending endpoint not found: ${endpoint}`)
          throw new Error('404')
        }
        
        throw new Error(error.error || error.message || `HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const jsonResponse = await response.json()
        
        // Debug logging for API responses (only for report endpoints)
        if (endpoint.includes('/reports/')) {
          console.log('🔍 API Response Debug:', {
            endpoint,
            fullUrl: url,
            status: response.status,
            contentType,
            responseKeys: Object.keys(jsonResponse),
            hasData: !!jsonResponse.data,
            dataKeys: jsonResponse.data ? Object.keys(jsonResponse.data) : null,
            slugInResponse: jsonResponse.data ? ('slug' in jsonResponse.data) : false,
            slugValue: jsonResponse.data?.slug,
            urlValue: jsonResponse.data?.url,
            environment: window.location.hostname,
            isServerEnv: !window.location.hostname.includes('localhost')
          });
        }
        
        return jsonResponse
      }
      return response
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  // Auth
  async login(email, password) {
    const result = await this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    if (result.token) {
      this.setToken(result.token)
    }
    return result
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' })
    this.setToken(null)
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/users${query ? `?${query}` : ''}`)
  }

  async createUser(data) {
    return this.request('/api/users', { method: 'POST', body: data })
  }

  async updateUser(id, data) {
    return this.request(`/api/users/${id}`, { method: 'PATCH', body: data })
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, { method: 'DELETE' })
  }

  // Posts (Blog/News)
  async getPosts(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/posts${query ? `?${query}` : ''}`)
  }

  async createPost(data) {
    return this.request('/api/posts', { method: 'POST', body: data })
  }

  async updatePost(id, data) {
    return this.request(`/api/posts/${id}`, { method: 'PATCH', body: data })
  }

  async deletePost(id) {
    return this.request(`/api/posts/${id}`, { method: 'DELETE' })
  }

  // Reports
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/reports${query ? `?${query}` : ''}`)
  }

  async getReport(id) {
    return this.request(`/api/reports/${id}`)
  }

  async createReport(data) {
    return this.request('/api/reports', { method: 'POST', body: data })
  }

  async updateReport(id, data) {
    return this.request(`/api/reports/${id}`, { method: 'PATCH', body: data })
  }

  async deleteReport(id) {
    return this.request(`/api/reports/${id}`, { method: 'DELETE' })
  }

  async importReports(data) {
    // New streamlined import for processed Excel data
    return this.request('/api/reports/import', {
      method: 'POST',
      body: data
    })
  }

  async bulkUploadReports(formData) {
    // Legacy bulk upload with file
    return this.request('/api/reports/bulk-upload', {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async checkImportDuplicates(formData) {
    return this.request('/api/reports/check-duplicates', {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async syncReportsWithCategories() {
    return this.request('/api/reports/sync-categories', {
      method: 'POST'
    })
  }

  async migrateReportSlugs() {
    return this.request('/api/reports/migrate-slugs', {
      method: 'POST'
    })
  }

  async exportReports(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await this.request(`/api/reports/export${query ? `?${query}` : ''}`)
    return response
  }

  async uploadReportCover(id, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/reports/${id}/cover`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async uploadPostCover(id, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/posts/${id}/cover`, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  // Upload image for rich text editor
  async uploadImageForEditor(file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request('/api/posts/upload-image', {
      method: 'POST', 
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })
  }

  // Megatrends
  async getMegatrends(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/megatrends${query ? `?${query}` : ''}`)
  }

  async getMegatrend(id) {
    return this.request(`/api/megatrends/${id}`)
  }

  async createMegatrend(data) {
    return this.request('/api/megatrends', { method: 'POST', body: data })
  }

  async updateMegatrend(id, data) {
    return this.request(`/api/megatrends/${id}`, { method: 'PATCH', body: data })
  }

  async deleteMegatrend(id) {
    return this.request(`/api/megatrends/${id}`, { method: 'DELETE' })
  }

  async uploadMegatrendHero(id, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/megatrends/${id}/hero`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async uploadMegatrendWhitepaper(id, file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request(`/api/megatrends/${id}/whitepaper`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async requestWhitepaper(megatrendId, requestData) {
    return this.request(`/api/megatrends/${megatrendId}/whitepaper-request`, {
      method: 'POST',
      body: requestData
    })
  }

  // Custom Report Requests
  async getCustomReportRequests(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/custom-report-requests${query ? `?${query}` : ''}`)
  }

  async createCustomReportRequest(data) {
    return this.request('/api/custom-report-requests/submit', { method: 'POST', body: data })
  }

  async updateCustomReportRequest(id, data) {
    return this.request(`/api/custom-report-requests/${id}`, { method: 'PATCH', body: data })
  }

  async deleteCustomReportRequest(id) {
    return this.request(`/api/custom-report-requests/${id}`, { method: 'DELETE' })
  }

  // Case Studies
  async getCaseStudies(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/case-studies${query ? `?${query}` : ''}`)
  }

  async getCaseStudy(id) {
    return this.request(`/api/case-studies/${id}`)
  }

  async createCaseStudy(data) {
    return this.request('/api/case-studies', { method: 'POST', body: data })
  }

  async updateCaseStudy(id, data) {
    return this.request(`/api/case-studies/${id}`, { method: 'PATCH', body: data })
  }

  async deleteCaseStudy(id) {
    return this.request(`/api/case-studies/${id}`, { method: 'DELETE' })
  }

  async uploadCaseStudyImage(id, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/case-studies/${id}/image`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  // Service Pages
  async getServicePages(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/service-pages${query ? `?${query}` : ''}`)
  }

  async respondToCustomReportRequest(id, subject, message, status) {
    return this.request(`/api/custom-report-requests/${id}/respond`, {
      method: 'POST',
      body: { subject, message, status }
    })
  }

  


  // Inquiries
  async getInquiries(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/inquiries${query ? `?${query}` : ''}`)
  }

  async getInquiry(id) {
    return this.request(`/api/inquiries/${id}`)
  }

  async createInquiry(data) {
    return this.request('/api/inquiries/submit', { method: 'POST', body: data })
  }

  async updateInquiry(id, data) {
    return this.request(`/api/inquiries/${id}`, { method: 'PATCH', body: data })
  }

  async deleteInquiry(id) {
    return this.request(`/api/inquiries/${id}`, { method: 'DELETE' })
  }

  async bulkUpdateInquiries(action, ids, data = {}) {
    return this.request('/api/inquiries/bulk', {
      method: 'POST',
      body: { action, ids, data }
    })
  }

  async exportInquiries(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await this.request(`/api/inquiries/export/csv${query ? `?${query}` : ''}`, {
      headers: { 'Accept': 'text/csv' }
    })
    return response
  }

  async getInquiryMetadata() {
    return this.request('/api/inquiries/metadata')
  }

  // Analytics
  async getAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/analytics${query ? `?${query}` : ''}`)
  }

  // SEO Pages
  async getSeoPages(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/seo-pages${query ? `?${query}` : ''}`)
  }

  async getSeoPage(id) {
    return this.request(`/api/seo-pages/${id}`)
  }

  async createSeoPage(data) {
    return this.request('/api/seo-pages', { method: 'POST', body: data })
  }

  async updateSeoPage(id, data) {
    return this.request(`/api/seo-pages/${id}`, { method: 'PATCH', body: data })
  }

  async deleteSeoPage(id) {
    return this.request(`/api/seo-pages/${id}`, { method: 'DELETE' })
  }

  async uploadSeoImage(id, file) {
    const formData = new FormData()
    formData.append('image', file)
    return this.request(`/api/seo-pages/${id}/upload-image`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  }

  async auditSeoPage(id) {
    return this.request(`/api/seo-pages/${id}/audit`, { method: 'POST' })
  }

  async getSeoAnalytics() {
    return this.request('/api/seo-pages/analytics/summary')
  }

  // Categories API
  async getCategories(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/categories${query ? `?${query}` : ''}`)
  }

  async getCategory(id) {
    return this.request(`/api/categories/${id}`)
  }

  async createCategory(data) {
    return this.request('/api/categories', { method: 'POST', body: data })
  }

  async updateCategory(id, data) {
    return this.request(`/api/categories/${id}`, { method: 'PUT', body: data })
  }

  async deleteCategory(id) {
    return this.request(`/api/categories/${id}`, { method: 'DELETE' })
  }

  async addSubcategory(categoryId, data) {
    return this.request(`/api/categories/${categoryId}/subcategories`, { method: 'POST', body: data })
  }

  async deleteSubcategory(categoryId, subcategoryId) {
    return this.request(`/api/categories/${categoryId}/subcategories/${subcategoryId}`, { method: 'DELETE' })
  }

  async seedCategories() {
    return this.request('/api/categories/seed', { method: 'POST' })
  }

  async getTrendingIndustries() {
    return this.request('/api/categories/trending')
  }

  async getTrendingSubcategories(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/categories/subcategories/trending${query ? `?${query}` : ''}`)
  }

  async getCategoryBySlug(slug, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/categories/by-slug/${slug}${query ? `?${query}` : ''}`)
  }

  async getSubcategoryBySlug(categorySlug, subcategorySlug) {
    return this.request(`/api/categories/${categorySlug}/subcategories/${subcategorySlug}`)
  }

  async updateSubcategoryTrending(categoryId, subcategoryId, isTopTrending) {
    return this.request(`/api/categories/${categoryId}/subcategories/${subcategoryId}/trending`, {
      method: 'PUT',
      body: { isTopTrending }
    })
  }

  async bulkUpdateSubcategoriesTrending(subcategoryUpdates, isTopTrending) {
    return this.request('/api/categories/subcategories/bulk-trending', {
      method: 'POST',
      body: { subcategoryUpdates, isTopTrending }
    })
  }

  // Reports API - Slug-based methods
  async getReportBySlug(slug) {
    return this.request(`/api/reports/by-slug/${slug}`)
  }

  async updateReportBySlug(slug, data) {
    return this.request(`/api/reports/by-slug/${slug}`, { method: 'PATCH', body: data })
  }

  async deleteReportBySlug(slug) {
    return this.request(`/api/reports/by-slug/${slug}`, { method: 'DELETE' })
  }

  async uploadReportCoverBySlug(slug, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/reports/by-slug/${slug}/cover`, { method: 'POST', body: formData })
  }


  // Blog API methods
  async getBlogs(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/api/blogs${queryString ? `?${queryString}` : ''}`)
  }

  async getBlog(id) {
    return this.request(`/api/blogs/${id}`)
  }

  async getBlogBySlug(slug) {
    return this.request(`/api/blogs/by-slug/${slug}`)
  }

  async createBlog(blogData) {
    return this.request('/api/blogs', {
      method: 'POST',
      body: blogData
    })
  }

  async updateBlog(id, blogData) {
    return this.request(`/api/blogs/${id}`, {
      method: 'PUT',
      body: blogData
    })
  }

  async deleteBlog(id) {
    return this.request(`/api/blogs/${id}`, { method: 'DELETE' })
  }

  async uploadBlogCover(id, file, alt = '') {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    return this.request(`/api/blogs/${id}/cover`, {
      method: 'POST',
      body: formData
    })
  }

  async exportBlogs(format) {
    const response = await fetch(`${API_BASE}/api/blogs/export/${format}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Export failed')
    }
    
    return response.blob()
  }

  async getBlogStats() {
    return this.request('/api/blogs/stats/overview')
  }

  // Homepage Management
  async getHomePage() {
    return this.request('/api/homepage')
  }

  async updateHomePage(data) {
    return this.request('/api/homepage', {
      method: 'PUT',
      body: data
    })
  }

  // Banner Management with Slug Operations
  async updateBannerBySlug(slug, data) {
    return this.request(`/api/homepage/banner/${slug}`, {
      method: 'PUT',
      body: data
    })
  }

  async uploadBannerImageBySlug(slug, file) {
    const formData = new FormData()
    formData.append('image', file)
    
    return this.request(`/api/homepage/banner/${slug}/image`, {
      method: 'POST',
      body: formData
    })
  }

  async deleteBannerImageBySlug(slug) {
    return this.request(`/api/homepage/banner/${slug}/image`, {
      method: 'DELETE'
    })
  }

  // Megatrend Management with Slug Operations
  async updateMegatrendBySlug(slug, data) {
    return this.request(`/api/homepage/megatrend/${slug}`, {
      method: 'PUT',
      body: data
    })
  }

  async uploadMegatrendImageBySlug(slug, file) {
    const formData = new FormData()
    formData.append('image', file)
    
    return this.request(`/api/homepage/megatrend/${slug}/image`, {
      method: 'POST',
      body: formData
    })
  }

  async deleteMegatrendImageBySlug(slug) {
    return this.request(`/api/homepage/megatrend/${slug}/image`, {
      method: 'DELETE'
    })
  }

  async getHomePageAnalytics() {
    return this.request('/api/homepage/analytics')
  }
}

export default new ApiClient()
