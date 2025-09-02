// API client for backend communication
const API_BASE = import.meta.env.VITE_API_BASE || ''

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
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`
    }

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    return response
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

  // Megatrends
  async getMegatrends(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/megatrends${query ? `?${query}` : ''}`)
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

  // Custom Report Requests
  async getCustomReportRequests(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/custom-report-requests${query ? `?${query}` : ''}`)
  }

  async updateCustomReportRequest(id, data) {
    return this.request(`/api/custom-report-requests/${id}`, { method: 'PATCH', body: data })
  }

  async deleteCustomReportRequest(id) {
    return this.request(`/api/custom-report-requests/${id}`, { method: 'DELETE' })
  }

  async respondToCustomReportRequest(id, subject, message, status) {
    return this.request(`/api/custom-report-requests/${id}/respond`, {
      method: 'POST',
      body: { subject, message, status }
    })
  }

  // Newsletter
  async getSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/newsletter${query ? `?${query}` : ''}`)
  }

  async addSubscriber(data) {
    return this.request('/api/newsletter', { method: 'POST', body: data })
  }

  async deleteSubscriber(id) {
    return this.request(`/api/newsletter/${id}`, { method: 'DELETE' })
  }

  // Orders
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/orders${query ? `?${query}` : ''}`)
  }

  async createOrder(data) {
    return this.request('/api/orders', { method: 'POST', body: data })
  }

  async updateOrder(id, data) {
    return this.request(`/api/orders/${id}`, { method: 'PATCH', body: data })
  }

  // Inquiries
  async getInquiries(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/inquiries${query ? `?${query}` : ''}`)
  }

  async updateInquiry(id, data) {
    return this.request(`/api/inquiries/${id}`, { method: 'PATCH', body: data })
  }

  async deleteInquiry(id) {
    return this.request(`/api/inquiries/${id}`, { method: 'DELETE' })
  }
}

export default new ApiClient()
