import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, Eye, Filter, Download, X, Calendar, User, Globe, FileText, Tag, Image, Link as LinkIcon, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { Link, useNavigate } from 'react-router-dom'

const CaseStudies = () => {
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
  const [caseStudies, setCaseStudies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  
  // Selection States
  const [selectedCaseStudies, setSelectedCaseStudies] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  
  useEffect(() => {
    loadCaseStudies()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCaseStudies()
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

  const loadCaseStudies = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      }
      
      const response = await api.getCaseStudies(params)
      setCaseStudies(response.data || [])
      setTotalItems(response.total || 0)
      
      // Reset selections when data changes
      setSelectedCaseStudies([])
      setSelectAll(false)
    } catch (err) {
      setError(err.message || 'Failed to load case studies')
    } finally {
      setLoading(false)
    }
  }

  
  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)
  
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const openNew = () => {
    navigate('/admin/case-studies/create')
  }

  const openEdit = (caseStudy) => {
    navigate(`/admin/case-studies/${caseStudy._id}/edit`)
  }

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCaseStudies([])
      setSelectAll(false)
    } else {
      setSelectedCaseStudies(caseStudies.map(cs => cs._id))
      setSelectAll(true)
    }
  }

  const handleSelectCaseStudy = (caseStudyId) => {
    setSelectedCaseStudies(prev => {
      const newSelected = prev.includes(caseStudyId)
        ? prev.filter(id => id !== caseStudyId)
        : [...prev, caseStudyId]
      
      setSelectAll(newSelected.length === caseStudies.length && caseStudies.length > 0)
      return newSelected
    })
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCaseStudies.length} case studies?`)) return
    
    try {
      setBulkOperating(true)
      await Promise.all(selectedCaseStudies.map(id => api.deleteCaseStudy(id)))
      setSuccess(`${selectedCaseStudies.length} case studies deleted successfully!`)
      setSelectedCaseStudies([])
      setSelectAll(false)
      loadCaseStudies()
    } catch (err) {
      setError('Failed to delete case studies: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    try {
      setBulkOperating(true)
      await Promise.all(selectedCaseStudies.map(id => 
        api.updateCaseStudy(id, { status: newStatus })
      ))
      setSuccess(`${selectedCaseStudies.length} case studies updated successfully!`)
      setSelectedCaseStudies([])
      setSelectAll(false)
      loadCaseStudies()
    } catch (err) {
      setError('Failed to update case studies: ' + err.message)
    } finally {
      setBulkOperating(false)
    }
  }

  const deleteCaseStudy = async (id) => {
    if (!confirm('Are you sure you want to delete this case study?')) return
    
    try {
      await api.deleteCaseStudy(id)
      setSuccess('Case study deleted successfully!')
      loadCaseStudies()
    } catch (err) {
      setError('Failed to delete case study: ' + err.message)
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Case Studies</h1>
        <button 
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Case Study
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
              placeholder="Search case studies, authors, keywords..."
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
      {selectedCaseStudies.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedCaseStudies.length} case studies selected
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
                  setSelectedCaseStudies([])
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
                  Case Study Title
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
                      <p className="text-gray-600">Loading case studies...</p>
                    </div>
                  </td>
                </tr>
              ) : caseStudies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No case studies found
                  </td>
                </tr>
              ) : (
                caseStudies.map((caseStudy) => (
                  <tr key={caseStudy._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCaseStudies.includes(caseStudy._id)}
                        onChange={() => handleSelectCaseStudy(caseStudy._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {caseStudy.mainImage && (
                          <img
                            src={caseStudy.mainImage}
                            alt={caseStudy.title}
                            className="w-12 h-12 rounded-lg object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {caseStudy.title}
                          </div>
                          {caseStudy.subTitle && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {caseStudy.subTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseStudy.authorName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseStudy.publishDate ? new Date(caseStudy.publishDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {caseStudy.updatedAt ? new Date(caseStudy.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        caseStudy.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : caseStudy.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {caseStudy.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(caseStudy)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCaseStudy(caseStudy._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {caseStudy.url && (
                          <button
                            onClick={() => navigator.clipboard.writeText(caseStudy.url)}
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

export default CaseStudies
