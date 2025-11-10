import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Filter, Download, X, Calendar, User, Globe, FileText, Tag, Image, Link as LinkIcon, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { Link, useNavigate } from 'react-router-dom'

const Megatrends = () => {
  const navigate = useNavigate()
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: '',
    status: '',
    author: ''
  })
  
  // Data States
  const [megatrends, setMegatrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  
  // Selection States
  const [selectedMegatrends, setSelectedMegatrends] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  

  useEffect(() => {
    loadMegatrends()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMegatrends()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, filters, currentPage, itemsPerPage])

  // Auto-hide success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const loadMegatrends = async () => {
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
      
      const result = await api.getMegatrends(params)
      setMegatrends(result.data || result.items || [])
      setTotalItems(result.total || result.count || 0)
      
      // Reset selections when data changes
      setSelectedMegatrends([])
      setSelectAll(false)
    } catch (err) {
      setError(err.message || 'Failed to load megatrends')
    } finally {
      setLoading(false)
    }
  }

  
  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMegatrends([])
      setSelectAll(false)
    } else {
      setSelectedMegatrends(megatrends.map(m => m._id))
      setSelectAll(true)
    }
  }
  
  const handleSelectMegatrend = (megatrendId) => {
    setSelectedMegatrends(prev => {
      const newSelected = prev.includes(megatrendId)
        ? prev.filter(id => id !== megatrendId)
        : [...prev, megatrendId]
      
      setSelectAll(newSelected.length === megatrends.length && megatrends.length > 0)
      return newSelected
    })
  }
  
  // Bulk operations
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedMegatrends.length} megatrends?`)) return
    
    setBulkOperating(true)
    try {
      const deletePromises = selectedMegatrends.map(id => api.deleteMegatrend(id))
      await Promise.all(deletePromises)
      
      setSuccess(`Successfully deleted ${selectedMegatrends.length} megatrends`)
      setSelectedMegatrends([])
      setSelectAll(false)
      loadMegatrends()
    } catch (err) {
      setError('Failed to delete some megatrends: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }
  
  const handleBulkStatusChange = async (newStatus) => {
    setBulkOperating(true)
    try {
      const updatePromises = selectedMegatrends.map(id => 
        api.updateMegatrend(id, { status: newStatus })
      )
      await Promise.all(updatePromises)
      
      setSuccess(`Successfully updated ${selectedMegatrends.length} megatrends to ${newStatus}`)
      setSelectedMegatrends([])
      setSelectAll(false)
      loadMegatrends()
    } catch (err) {
      setError('Failed to update some megatrends: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }
  
  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const openNew = () => {
    navigate('/admin/megatrends/create')
  }

  const openEdit = (megatrend) => {
    navigate(`/admin/megatrends/${megatrend._id}/edit`)
  }


  const deleteMegatrend = async (id) => {
    if (!confirm('Are you sure you want to delete this megatrend?')) return
    
    try {
      await api.deleteMegatrend(id)
      setSuccess('Megatrend deleted successfully!')
      loadMegatrends()
    } catch (err) {
      setError('Failed to delete megatrend: ' + err.message)
    }
  }


  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Megatrends</h1>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Megatrend
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search megatrends, authors, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                placeholder="Filter by author"
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="md:col-span-3 flex gap-2">
              <button
                onClick={() => setFilters({ dateRange: '', status: '', author: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedMegatrends.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedMegatrends.length} megatrends selected
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
                onClick={() => {
                  setSelectedMegatrends([])
                  setSelectAll(false)
                }}
                className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-green-800">{success}</div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-red-800">{error}</div>
            <button
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Megatrend Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publish Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Loading megatrends...</p>
                    </div>
                  </td>
                </tr>
              ) : megatrends.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No megatrends found
                  </td>
                </tr>
              ) : (
                megatrends.map((megatrend) => (
                  <tr key={megatrend._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedMegatrends.includes(megatrend._id)}
                        onChange={() => handleSelectMegatrend(megatrend._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(megatrend.mainImage || megatrend.heroImage?.url) ? (
                          <img
                            src={(megatrend.mainImage || megatrend.heroImage?.url).startsWith('http') 
                              ? (megatrend.mainImage || megatrend.heroImage?.url)
                              : `http://localhost:4000${megatrend.mainImage || megatrend.heroImage?.url}`}
                            alt={megatrend.title}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        {/* Fallback placeholder when no image or image fails to load */}
                        <div 
                          className={`w-12 h-12 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 mr-3 flex items-center justify-center ${(megatrend.mainImage || megatrend.heroImage?.url) ? 'hidden' : 'flex'}`}
                        >
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {megatrend.title}
                          </div>
                          {megatrend.subTitle && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {megatrend.subTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {megatrend.author || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {megatrend.publishedAt ? new Date(megatrend.publishedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {megatrend.updatedAt ? new Date(megatrend.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        megatrend.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : megatrend.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {megatrend.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(megatrend)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMegatrend(megatrend._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {megatrend.url && (
                          <button
                            onClick={() => navigator.clipboard.writeText(megatrend.url)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Copy URL"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startItem}</span> to{' '}
                  <span className="font-medium">{endItem}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
                <div className="ml-4">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default Megatrends
