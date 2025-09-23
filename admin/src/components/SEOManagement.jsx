import { useState, useEffect } from 'react'
import { 
  Search, 
  Edit, 
  Save, 
  X, 
  Upload, 
  Eye, 
  Globe,
  FileText,
  Image as ImageIcon,
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

  // Sample data matching the image structure
  const initialSeoPages = [
    {
      id: 1,
      pageName: 'Home Page',
      titleMetaTag: 'BiziWit - Market Research & Business Intelligence',
      url: '/',
      featuredImage: '/images/home-banner.jpg',
      metaDescription: 'Leading market research and business intelligence platform providing comprehensive industry analysis and insights.',
      keywords: 'market research, business intelligence, industry analysis, market insights'
    },
    {
      id: 2,
      pageName: 'Report Store',
      titleMetaTag: 'Market Research Reports - BiziWit Report Store',
      url: '/reports',
      featuredImage: '/images/report-store-banner.jpg',
      metaDescription: 'Browse our extensive collection of market research reports covering various industries and market segments.',
      keywords: 'market reports, industry reports, research reports, market analysis'
    },
    {
      id: 3,
      pageName: 'Voice of Customer',
      titleMetaTag: 'Voice of Customer Solutions - BiziWit',
      url: '/voice-of-customer',
      featuredImage: '/images/voc-banner.jpg',
      metaDescription: 'Understand your customers better with our comprehensive voice of customer research and analysis solutions.',
      keywords: 'voice of customer, customer feedback, customer insights, customer research'
    },
    {
      id: 4,
      pageName: 'Market Share Gain',
      titleMetaTag: 'Market Share Analysis & Growth Strategies - BiziWit',
      url: '/market-share-gain',
      featuredImage: '/images/market-share-banner.jpg',
      metaDescription: 'Strategic market share analysis and growth strategies to help businesses expand their market presence.',
      keywords: 'market share, market growth, competitive analysis, market expansion'
    },
    {
      id: 5,
      pageName: 'Sustainability',
      titleMetaTag: 'Sustainability Research & ESG Analysis - BiziWit',
      url: '/sustainability',
      featuredImage: '/images/sustainability-banner.jpg',
      metaDescription: 'Comprehensive sustainability research and ESG analysis for responsible business practices.',
      keywords: 'sustainability, ESG, environmental research, sustainable business'
    },
    {
      id: 6,
      pageName: 'Full Time Equivalent (FTE)',
      titleMetaTag: 'FTE Analysis & Workforce Planning - BiziWit',
      url: '/fte-analysis',
      featuredImage: '/images/fte-banner.jpg',
      metaDescription: 'Full-time equivalent analysis and workforce planning solutions for optimal resource allocation.',
      keywords: 'FTE, workforce planning, resource allocation, human resources'
    },
    {
      id: 7,
      pageName: 'Content Lead Demand Generation',
      titleMetaTag: 'Content Marketing & Lead Generation - BiziWit',
      url: '/content-lead-generation',
      featuredImage: '/images/content-marketing-banner.jpg',
      metaDescription: 'Strategic content marketing and lead generation services to drive business growth.',
      keywords: 'content marketing, lead generation, demand generation, digital marketing'
    },
    {
      id: 8,
      pageName: 'Market Analysis',
      titleMetaTag: 'Market Analysis & Industry Insights - BiziWit',
      url: '/market-analysis',
      featuredImage: '/images/market-analysis-banner.jpg',
      metaDescription: 'In-depth market analysis and industry insights to inform strategic business decisions.',
      keywords: 'market analysis, industry insights, market trends, business intelligence'
    },
    {
      id: 9,
      pageName: 'Market Intelligence',
      titleMetaTag: 'Market Intelligence & Competitive Analysis - BiziWit',
      url: '/market-intelligence',
      featuredImage: '/images/market-intelligence-banner.jpg',
      metaDescription: 'Advanced market intelligence and competitive analysis for strategic advantage.',
      keywords: 'market intelligence, competitive analysis, market research, business strategy'
    },
    {
      id: 10,
      pageName: 'Bizwit India (GTM) Entry Strategy',
      titleMetaTag: 'India Market Entry Strategy - BiziWit GTM',
      url: '/india-gtm-strategy',
      featuredImage: '/images/india-gtm-banner.jpg',
      metaDescription: 'Comprehensive go-to-market strategy for entering the Indian market successfully.',
      keywords: 'India market entry, GTM strategy, market entry strategy, India business'
    },
    {
      id: 11,
      pageName: 'Career',
      titleMetaTag: 'Careers at BiziWit - Join Our Team',
      url: '/career',
      featuredImage: '/images/career-banner.jpg',
      metaDescription: 'Explore exciting career opportunities at BiziWit and join our dynamic team of market research professionals.',
      keywords: 'careers, jobs, employment, market research careers, BiziWit jobs'
    },
    {
      id: 12,
      pageName: 'Testimonial',
      titleMetaTag: 'Client Testimonials - BiziWit Success Stories',
      url: '/testimonial',
      featuredImage: '/images/testimonial-banner.jpg',
      metaDescription: 'Read success stories and testimonials from our satisfied clients across various industries.',
      keywords: 'testimonials, client reviews, success stories, client feedback'
    },
    {
      id: 13,
      pageName: 'Contact Us',
      titleMetaTag: 'Contact BiziWit - Get in Touch',
      url: '/contact-us',
      featuredImage: '/images/contact-banner.jpg',
      metaDescription: 'Get in touch with BiziWit for your market research and business intelligence needs.',
      keywords: 'contact, get in touch, support, inquiry, business contact'
    }
  ]

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
      
      // Try to load from API first
      try {
        const result = await api.getSeoPages()
        setSeoPages(result.items || [])
        
        // If no data exists, seed with initial data
        if (!result.items || result.items.length === 0) {
          console.log('No SEO pages found, seeding with initial data...')
          await seedInitialData()
        }
      } catch (apiError) {
        console.warn('API call failed, seeding with initial data:', apiError.message)
        await seedInitialData()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const seedInitialData = async () => {
    try {
      // Create initial SEO pages in the backend
      const createdPages = []
      for (const pageData of initialSeoPages) {
        try {
          const { id, ...dataWithoutId } = pageData // Remove the local ID
          const createdPage = await api.createSeoPage(dataWithoutId)
          createdPages.push(createdPage)
        } catch (createError) {
          console.warn('Failed to create page:', pageData.pageName, createError.message)
        }
      }
      setSeoPages(createdPages)
    } catch (seedError) {
      console.error('Failed to seed initial data:', seedError.message)
      // Fallback to local data if seeding fails
      setSeoPages(initialSeoPages)
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

  const handleImageUpload = async (pageId, file) => {
    try {
      setError('')
      const result = await api.uploadSeoImage(pageId, file)
      
      setSeoPages(prev => prev.map(page => 
        page._id === pageId ? { ...page, featuredImage: result.imageUrl } : page
      ))
    } catch (err) {
      setError(`Failed to upload image: ${err.message}`)
      console.error('Image upload error:', err)
    }
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
                  <input
                    type="text"
                    value={newPage.pageName}
                    onChange={(e) => setNewPage(prev => ({ ...prev, pageName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter page name"
                    required
                  />
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
                <th className="px-4 py-3 text-left text-sm font-medium">Featured Image</th>
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
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                  onImageUpload={handleImageUpload}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No SEO pages found matching your search.</p>
        </div>
      )}
    </div>
  )
}

// Individual row component for better organization
const SEOPageRow = ({ page, index, isEditing, onEdit, onSave, onCancel, onDelete, onImageUpload }) => {
  const [editData, setEditData] = useState(page)

  useEffect(() => {
    setEditData(page)
  }, [page])

  const handleSave = () => {
    onSave(page._id || page.id, editData)
  }

  const handleImageUploadClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        onImageUpload(page._id || page.id, file)
      }
    }
    input.click()
  }

  const rowBgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
  const featuredImageBg = page.pageName === 'Voice of Customer' ? 'bg-red-500' : 'bg-orange-400'

  return (
    <tr className={rowBgColor}>
      {/* Page Name */}
      <td className="px-4 py-3 text-sm">
        {isEditing ? (
          <input
            type="text"
            value={editData.pageName}
            onChange={(e) => setEditData(prev => ({ ...prev, pageName: e.target.value }))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
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

      {/* Featured Image */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-6 rounded ${featuredImageBg} flex items-center justify-center`}>
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          {isEditing && (
            <button
              onClick={handleImageUploadClick}
              className="text-blue-600 hover:text-blue-800 text-xs"
              title="Upload new image"
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
        </div>
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
                onClick={() => window.open(page.url, '_blank')}
                className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                title="View Page"
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
