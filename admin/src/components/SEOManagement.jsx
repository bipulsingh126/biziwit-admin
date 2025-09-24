import { useState, useEffect } from 'react'
import { 
  Search, 
  Edit, 
  Save, 
  X, 
  Eye, 
  Globe,
  FileText,
  Link as LinkIcon,
  Hash,
  Plus,
  Trash2
} from 'lucide-react'
import api from '../utils/api'

const SEOManagement = () => {
  const [seoPages, setSeoPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Predefined page names for dropdown
  const pageNameOptions = [
    'Home Page',
    'Report Store',
    'Voice of Customer',
    'Market Share Gain',
    'Sustainability',
    'Full Time Equivalent (FTE)',
    'Content Lead Demand Generation',
    'Market Analysis',
    'Market Intelligence',
    'Bizwit India (GTM) Entry Strategy',
    'Career',
    'Testimonial',
    'Contact Us'
  ]

  // Remove dummy data - use only real database data

  const [newPage, setNewPage] = useState({
    pageName: '',
    titleMetaTag: '',
    url: '',
    metaDescription: '',
    keywords: ''
  })

  useEffect(() => {
    loadSeoPages()
  }, [])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && showAddForm) {
        closeModal()
      }
    }

    if (showAddForm) {
      document.addEventListener('keydown', handleEscKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'unset'
    }
  }, [showAddForm])

  const loadSeoPages = async () => {
    try {
      setLoading(true)
      const result = await api.getSeoPages({ q: searchTerm })
      setSeoPages(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  const filteredPages = seoPages.filter(page =>
    page.pageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.titleMetaTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (id) => {
    setEditingId(id)
  }

  const handleViewPage = (page) => {
    try {
      if (!page.url) {
        setError('No URL specified for this page')
        return
      }

      let url = page.url.trim()
      
      // If URL doesn't start with http/https, assume it's a relative path
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // You can customize this base URL based on your website
        const baseUrl = process.env.REACT_APP_WEBSITE_URL || 'https://biziwit.com'
        url = baseUrl + (url.startsWith('/') ? url : '/' + url)
      }
      
      // Validate URL format
      try {
        new URL(url)
      } catch (urlError) {
        setError('Invalid URL format')
        return
      }
      
      window.open(url, '_blank', 'noopener,noreferrer')
      
      // Clear any previous errors
      if (error) {
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError(`Failed to open page: ${err.message}`)
      console.error('View page error:', err)
    }
  }

  const handleSave = async (id, updatedData) => {
    try {
      setError('')
      setSuccess('')
      const updatedPage = await api.updateSeoPage(id, updatedData)
      
      setSeoPages(prev => prev.map(page => 
        page._id === id ? updatedPage : page
      ))
      setEditingId(null)
      setSuccess('SEO page updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to update SEO page: ${err.message}`)
      console.error('Update error:', err)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this SEO page configuration?')) {
      try {
        setError('')
        setSuccess('')
        await api.deleteSeoPage(id)
        
        setSeoPages(prev => prev.filter(page => page._id !== id))
        setSuccess('SEO page deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } catch (err) {
        setError(`Failed to delete SEO page: ${err.message}`)
        console.error('Delete error:', err)
      }
    }
  }

  const handleAddPage = async () => {
    try {
      setError('')
      setSuccess('')
      
      // Validate required fields
      if (!newPage.pageName || !newPage.titleMetaTag || !newPage.url) {
        setError('Page Name, Title Meta Tag, and URL are required')
        return
      }
      
      const createdPage = await api.createSeoPage(newPage)
      
      setSeoPages(prev => [...prev, createdPage])
      closeModal()
      setSuccess('SEO page created successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Failed to create SEO page: ${err.message}`)
      console.error('Create error:', err)
    }
  }

  const resetForm = () => {
    setNewPage({
      pageName: '',
      titleMetaTag: '',
      url: '',
      metaDescription: '',
      keywords: ''
    })
    setError('')
  }

  const closeModal = () => {
    setShowAddForm(false)
    resetForm()
  }


  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SEO management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error: {error}
          <button onClick={loadSeoPages} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Management</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          {/* Add New Page Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Page
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Add New Page Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Add New SEO Page</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newPage.pageName}
                    onChange={(e) => setNewPage(prev => ({ ...prev, pageName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a page name</option>
                    {pageNameOptions.map((pageName) => (
                      <option key={pageName} value={pageName}>
                        {pageName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPage.url}
                    onChange={(e) => setNewPage(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="/page-url"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Meta Tag <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPage.titleMetaTag}
                    onChange={(e) => setNewPage(prev => ({ ...prev, titleMetaTag: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter page title (30-60 characters recommended)"
                    maxLength="60"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newPage.titleMetaTag.length}/60 characters
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    value={newPage.metaDescription}
                    onChange={(e) => setNewPage(prev => ({ ...prev, metaDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter meta description (120-160 characters recommended)"
                    rows="3"
                    maxLength="160"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newPage.metaDescription.length}/160 characters
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                  <input
                    type="text"
                    value={newPage.keywords}
                    onChange={(e) => setNewPage(prev => ({ ...prev, keywords: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Separate keywords with commas
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPage}
                disabled={!newPage.pageName || !newPage.titleMetaTag || !newPage.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add SEO Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Management Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">SEO Management</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Title Meta Tag</th>
                <th className="px-4 py-3 text-left text-sm font-medium">URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Meta Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Keywords</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPages.map((page, index) => (
                <SEOPageRow
                  key={page._id || page.id}
                  page={page}
                  index={index}
                  isEditing={editingId === (page._id || page.id)}
                  onEdit={() => setEditingId(page._id || page.id)}
                  onSave={(updatedPage) => handleSave(page._id || page.id, updatedPage)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(page._id || page.id)}
                  pageNameOptions={pageNameOptions}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredPages.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No SEO pages found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual row component for better organization
const SEOPageRow = ({ page, index, isEditing, onEdit, onSave, onCancel, onDelete, pageNameOptions }) => {
  const [editData, setEditData] = useState(page)

  useEffect(() => {
    setEditData(page)
  }, [page])

  const handleSave = () => {
    onSave(page._id || page.id, editData)
  }


  const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'

  return (
    <tr className={rowBgColor}>
      {/* Page Name */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <select
            value={editData.pageName}
            onChange={(e) => setEditData(prev => ({ ...prev, pageName: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a page name</option>
            {pageNameOptions.map((pageName) => (
              <option key={pageName} value={pageName}>
                {pageName}
              </option>
            ))}
          </select>
        ) : (
          <div className="font-medium text-gray-900">{page.pageName}</div>
        )}
      </td>

      {/* Title Meta Tag */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <input
            type="text"
            value={editData.titleMetaTag}
            onChange={(e) => setEditData(prev => ({ ...prev, titleMetaTag: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div className="text-gray-700 max-w-xs truncate" title={page.titleMetaTag}>
            {page.titleMetaTag}
          </div>
        )}
      </td>

      {/* URL */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <input
            type="text"
            value={editData.url}
            onChange={(e) => setEditData(prev => ({ ...prev, url: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div className="text-blue-600 hover:underline cursor-pointer" title={page.url}>
            {page.url}
          </div>
        )}
      </td>

      {/* Meta Description */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <textarea
            value={editData.metaDescription}
            onChange={(e) => setEditData(prev => ({ ...prev, metaDescription: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows="2"
          />
        ) : (
          <div className="text-gray-700 max-w-xs truncate" title={page.metaDescription}>
            {page.metaDescription}
          </div>
        )}
      </td>

      {/* Keywords */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <input
            type="text"
            value={editData.keywords}
            onChange={(e) => setEditData(prev => ({ ...prev, keywords: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <div className="text-gray-700 max-w-xs truncate" title={page.keywords}>
            {page.keywords}
          </div>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(page._id || page.id)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewPage(page)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                title={`View Page: ${page.url || 'No URL'}`}
                disabled={!page.url}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(page._id || page.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

export default SEOManagement
