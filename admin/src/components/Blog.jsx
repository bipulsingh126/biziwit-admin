import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit, Trash2, Eye, ChevronDown, ChevronUp, Filter, Download, Calendar, Share, X, Check } from 'lucide-react'
import api from '../utils/api'
import RichTextEditor from './RichTextEditor'

const Blog = () => {
  // Helper function to get proper image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl
    if (imageUrl.startsWith('data:')) return imageUrl // Base64 images
    // Handle relative URLs from uploads
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'
    return imageUrl.startsWith('/') ? `${API_BASE}${imageUrl}` : `${API_BASE}/${imageUrl}`
  }

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalBlogs, setTotalBlogs] = useState(0)
  const totalPages = Math.ceil(totalBlogs / itemsPerPage)
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: '',
    author: '',
    status: ''
  })
  
  // Bulk operations
  const [selectedBlogs, setSelectedBlogs] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  
  // Export functionality
  const [exporting, setExporting] = useState(false)
  const [exportCooldown, setExportCooldown] = useState(0)

  // Load blogs with pagination and filters
  useEffect(() => {
    loadBlogs()
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      loadBlogs()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, filters])

  useEffect(() => {
    if (exportCooldown > 0) {
      const timer = setTimeout(() => setExportCooldown(exportCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [exportCooldown])

  const loadBlogs = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = {
        q: searchTerm.trim(),
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        ...filters
      }
      
      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })
      
      const result = await api.getBlogs(params)
      setBlogs(result.data || [])
      setTotalBlogs(result.total || 0)
      
      // Update select all state
      setSelectAll(false)
      setSelectedBlogs([])
    } catch (err) {
      console.error('Error loading blogs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',
    publishDate: new Date().toISOString().slice(0,10),
    authorName: '',
    content: '',
    mainImage: '',
    titleTag: '',
    url: '',
    metaDescription: '',
    keywords: '',
    status: 'draft'
  })
  const [mainImageFile, setMainImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Form handlers
  const openNew = () => {
    setEditingId(null)
    setFormData({
      title: '',
      subTitle: '',
      publishDate: new Date().toISOString().slice(0,10),
      authorName: '',
      content: '',
      mainImage: '',
      titleTag: '',
      url: '',
      metaDescription: '',
      keywords: '',
      status: 'draft'
    })
    setMainImageFile(null)
    setModalOpen(true)
  }

  const openEdit = (blog) => {
    setEditingId(blog._id)
    setFormData({
      title: blog.title || '',
      subTitle: blog.subTitle || '',
      publishDate: blog.publishDate ? new Date(blog.publishDate).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
      authorName: blog.authorName || '',
      content: blog.content || '',
      mainImage: blog.mainImage || '',
      titleTag: blog.titleTag || '',
      url: blog.url || '',
      metaDescription: blog.metaDescription || '',
      keywords: blog.keywords || '',
      status: blog.status || 'draft'
    })
    setMainImageFile(null)
    setModalOpen(true)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const onImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }
    
    setMainImageFile(file)
    
    // Show preview
    const reader = new FileReader()
    reader.onload = () => handleInputChange('mainImage', reader.result)
    reader.readAsDataURL(file)
  }

  const saveBlog = async () => {
    try {
      setUploading(true)
      setError('')
      
      // Generate URL slug from title if not provided
      if (!formData.url && formData.title) {
        const slug = formData.title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
        handleInputChange('url', slug)
      }
      
      let savedBlog
      if (editingId) {
        savedBlog = await api.updateBlog(editingId, formData)
      } else {
        savedBlog = await api.createBlog(formData)
      }
      
      // Upload main image if selected
      if (mainImageFile && savedBlog._id) {
        await api.uploadBlogCover(savedBlog._id, mainImageFile, formData.title)
      }
      
      setModalOpen(false)
      setSuccess(`Blog ${editingId ? 'updated' : 'created'} successfully!`)
      setTimeout(() => setSuccess(''), 3000)
      loadBlogs()
    } catch (err) {
      console.error('Error saving blog:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const deleteBlog = async (id) => {
    if (!confirm('Are you sure you want to delete this blog?')) return
    try {
      await api.deleteBlog(id)
      setBlogs(prev => prev.filter(b => b._id !== id))
      setSuccess('Blog deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  // Bulk operations and selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedBlogs([])
      setSelectAll(false)
    } else {
      setSelectedBlogs(blogs.map(blog => blog._id))
      setSelectAll(true)
    }
  }

  const handleSelectBlog = (blogId) => {
    setSelectedBlogs(prev => {
      const newSelected = prev.includes(blogId)
        ? prev.filter(id => id !== blogId)
        : [...prev, blogId]
      
      // Auto-update select all state
      setSelectAll(newSelected.length === blogs.length && blogs.length > 0)
      return newSelected
    })
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBlogs.length} selected blogs?`)) return
    
    setBulkOperating(true)
    try {
      const deletePromises = selectedBlogs.map(id => api.deleteBlog(id))
      await Promise.all(deletePromises)
      
      setBlogs(prev => prev.filter(blog => !selectedBlogs.includes(blog._id)))
      setSelectedBlogs([])
      setSelectAll(false)
      setSuccess(`${selectedBlogs.length} blogs deleted successfully!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete some blogs: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    setBulkOperating(true)
    try {
      const updatePromises = selectedBlogs.map(id => 
        api.updateBlog(id, { status: newStatus })
      )
      await Promise.all(updatePromises)
      
      // Update local state
      setBlogs(prev => prev.map(blog => 
        selectedBlogs.includes(blog._id) 
          ? { ...blog, status: newStatus }
          : blog
      ))
      
      setSelectedBlogs([])
      setSelectAll(false)
      setSuccess(`${selectedBlogs.length} blogs updated to ${newStatus}!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update some blogs: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }

  // Export functionality
  const handleExport = async (format) => {
    if (exportCooldown > 0) {
      setError(`Please wait ${exportCooldown} seconds before exporting again.`)
      return
    }
    
    setExporting(true)
    try {
      const result = await api.exportBlogs(format)
      
      // Create download link
      const blob = new Blob([result], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blogs-export-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setSuccess(`Blogs exported to ${format.toUpperCase()} successfully!`)
      setTimeout(() => setSuccess(''), 3000)
      setExportCooldown(5)
    } catch (err) {
      setError('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  // Clear all filters and search
  const clearAll = () => {
    setSearchTerm('')
    setFilters({ dateRange: '', author: '', status: '' })
    setSelectedBlogs([])
    setSelectAll(false)
  }

  return (
    <>
      <style>{`
        .rich-content {
          line-height: 1.6;
          color: #374151;
        }
        .rich-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1.5em 0 0.5em 0;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5em;
        }
        .rich-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1.3em 0 0.4em 0;
          color: #1f2937;
        }
        .rich-content h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1.2em 0 0.3em 0;
          color: #1f2937;
        }
        .rich-content p {
          margin: 1em 0;
        }
        .rich-content ul, .rich-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        .rich-content li {
          margin: 0.5em 0;
        }
        .rich-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .rich-content th {
          background-color: #f9fafb;
          font-weight: bold;
          padding: 12px;
          border: 1px solid #d1d5db;
          text-align: left;
        }
        .rich-content td {
          padding: 12px;
          border: 1px solid #d1d5db;
        }
        .rich-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .rich-content a {
          color: #2563eb;
          text-decoration: underline;
        }
        .rich-content a:hover {
          color: #1d4ed8;
        }
        .rich-content blockquote {
          border-left: 4px solid #e5e7eb;
          margin: 1.5em 0;
          padding: 1em 1.5em;
          background-color: #f9fafb;
          font-style: italic;
        }
        .rich-content hr {
          margin: 2em 0;
          border: none;
          border-top: 1px solid #d1d5db;
        }
        .rich-content pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1.5em 0;
          font-family: 'Monaco', 'Consolas', monospace;
        }
      `}</style>
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Management</h1>
        <button 
          onClick={openNew} 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Blog
        </button>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        {/* Top Row - Search, Filter, Export */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
              loading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search blogs, titles, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className={`pl-10 pr-10 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                searchTerm ? 'bg-blue-50 border-blue-300' : 'bg-white'
              } ${loading ? 'opacity-50' : ''}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            FILTER
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(false)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={exporting || exportCooldown > 0}
            >
              <Download className="w-4 h-4" />
              {exporting ? 'EXPORTING...' : exportCooldown > 0 ? `WAIT ${exportCooldown}s` : 'EXPORT'}
            </button>
          </div>

          {/* Clear All */}
          {(searchTerm || Object.values(filters).some(f => f)) && (
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input
                  type="text"
                  placeholder="Filter by author..."
                  value={filters.author}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setFilters({ dateRange: '', author: '', status: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Info */}
        {(searchTerm || Object.values(filters).some(f => f)) && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                Searching...
              </span>
            ) : (
              <span>
                Found <strong>{totalBlogs}</strong> results
                {searchTerm && <span> for "<strong>{searchTerm}</strong>"</span>}
                {Object.values(filters).some(f => f) && <span> with filters applied</span>}
              </span>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 mb-4 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4 flex items-center justify-between">
          <span>Error: {error}</span>
          <div className="flex gap-2">
            <button onClick={loadBlogs} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Retry</button>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedBlogs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium">
              {selectedBlogs.length} blog{selectedBlogs.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('published')}
                disabled={bulkOperating}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {bulkOperating ? 'Updating...' : 'Mark Published'}
              </button>
              <button
                onClick={() => handleBulkStatusChange('draft')}
                disabled={bulkOperating}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                {bulkOperating ? 'Updating...' : 'Mark Draft'}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkOperating}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {bulkOperating ? 'Deleting...' : 'Delete Selected'}
              </button>
              <button
                onClick={() => { setSelectedBlogs([]); setSelectAll(false) }}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blogs...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publish Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modify Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog, index) => (
                  <tr key={blog._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBlogs.includes(blog._id)}
                        onChange={() => handleSelectBlog(blog._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Blog Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {blog.mainImage && (
                          <img 
                            src={getImageUrl(blog.mainImage)} 
                            alt={blog.title}
                            className="w-10 h-10 rounded object-cover mr-3"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={blog.title}>
                            {blog.title || 'Untitled'}
                          </div>
                          {blog.subTitle && (
                            <div className="text-sm text-gray-500 truncate max-w-xs" title={blog.subTitle}>
                              {blog.subTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Author Name */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{blog.authorName || 'Unknown'}</div>
                    </td>
                    
                    {/* Publish Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {blog.publishDate ? new Date(blog.publishDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Not set'}
                      </div>
                    </td>
                    
                    {/* Modify Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Never'}
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        blog.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : blog.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {blog.status === 'published' ? 'Published' : blog.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEdit(blog)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit blog"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBlog(blog._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete blog"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {blog.url && (
                          <button
                            onClick={() => window.open(`/blog/${blog.url}`, '_blank')}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="View blog"
                          >
                            <Share className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Empty State */}
                {blogs.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">No blogs found</div>
                        <div className="text-sm">
                          {searchTerm || Object.values(filters).some(f => f) 
                            ? 'Try adjusting your search or filters' 
                            : 'Get started by creating your first blog post'
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalBlogs > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
          <div className="flex-1 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalBlogs)}
                </span> of{' '}
                <span className="font-medium">{totalBlogs}</span> results
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl rounded-lg shadow-lg max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Blog' : 'Add New Blog'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blog Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.title} 
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Title
                  </label>
                  <input 
                    type="text"
                    value={formData.subTitle} 
                    onChange={(e) => handleInputChange('subTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter blog subtitle"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input 
                    type="date"
                    value={formData.publishDate} 
                    onChange={(e) => handleInputChange('publishDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formData.authorName} 
                    onChange={(e) => handleInputChange('authorName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter author name"
                    required
                  />
                </div>
              </div>
              
              
              {/* SEO Fields */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title Tag
                    </label>
                    <input 
                      type="text"
                      value={formData.titleTag} 
                      onChange={(e) => handleInputChange('titleTag', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="SEO title tag"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug
                    </label>
                    <input 
                      type="text"
                      value={formData.url} 
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="blog-url-slug"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea 
                      value={formData.metaDescription} 
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="SEO meta description"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input 
                      type="text"
                      value={formData.keywords} 
                      onChange={(e) => handleInputChange('keywords', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Write your blog content here. Use the rich text editor to format your content with professional styling."
                  disabled={uploading}
                />
              </div>
              
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button 
                  onClick={() => setModalOpen(false)} 
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" 
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveBlog} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={uploading || !formData.title || !formData.authorName}
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingId ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    editingId ? 'Update Blog' : 'Create Blog'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

export default Blog
