import { useState, useEffect } from 'react'
import { 
  Home, 
  Edit, 
  Save, 
  X, 
  Eye, 
  Image,
  FileText,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
  Settings,
  Camera,
  ExternalLink
} from 'lucide-react'
import api from '../utils/api'

const HomePageManagement = () => {
  const [homePageData, setHomePageData] = useState({
    pageTitle: '',
    pageSubtitle: '',
    featuredSections: [
      {
        id: 1,
        title: '',
        description: '',
        image: '',
        buttonText: '',
        buttonLink: '',
        layout: 'right'
      },
      {
        id: 2,
        title: '',
        description: '',
        image: '',
        buttonText: '',
        buttonLink: '',
        layout: 'left'
      },
      {
        id: 3,
        title: '',
        description: '',
        image: '',
        buttonText: '',
        buttonLink: '',
        layout: 'right'
      }
    ]
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadHomePageData()
  }, [])

  const loadHomePageData = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await api.getHomePage()
      
      if (response.success && response.data) {
        const data = response.data
        setHomePageData({
          pageTitle: data.pageTitle || '',
          pageSubtitle: data.pageSubtitle || '',
          featuredSections: data.featuredSections && data.featuredSections.length > 0 
            ? data.featuredSections.map((section, index) => ({
                id: section._id || index + 1,
                title: section.title || '',
                description: section.description || '',
                image: section.image || '',
                buttonText: section.buttonText || '',
                buttonLink: section.buttonLink || '',
                layout: section.layout || 'right'
              }))
            : [
                {
                  id: 1,
                  title: '',
                  description: '',
                  image: '',
                  buttonText: '',
                  buttonLink: '',
                  layout: 'right'
                },
                {
                  id: 2,
                  title: '',
                  description: '',
                  image: '',
                  buttonText: '',
                  buttonLink: '',
                  layout: 'left'
                },
                {
                  id: 3,
                  title: '',
                  description: '',
                  image: '',
                  buttonText: '',
                  buttonLink: '',
                  layout: 'right'
                }
              ]
        })
      }
      // Reset unsaved changes flag after loading
      setHasUnsavedChanges(false)
    } catch (err) {
      setError('Failed to load home page data: ' + (err.message || 'Unknown error'))
      console.error('Error loading home page data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      
      // Only validate page title and subtitle as required
      if (!homePageData.pageTitle.trim()) {
        setError('Page title is required')
        return
      }
      
      // Filter out completely empty sections (no title, description, or button text)
      const activeSections = homePageData.featuredSections.filter(section => 
        section.title.trim() || section.description.trim() || section.buttonText.trim() || section.image
      )
      
      console.log('Saving homepage data:', {
        pageTitle: homePageData.pageTitle,
        pageSubtitle: homePageData.pageSubtitle,
        activeSections: activeSections.length
      })
      
      const response = await api.updateHomePage({
        pageTitle: homePageData.pageTitle,
        pageSubtitle: homePageData.pageSubtitle,
        featuredSections: activeSections.map(section => ({
          title: section.title || '',
          description: section.description || '',
          image: section.image || '',
          buttonText: section.buttonText || '',
          buttonLink: section.buttonLink || '',
          layout: section.layout || 'right',
          isActive: true
        }))
      })
      
      if (response.success) {
        setSuccess('Home page data saved successfully!')
        setHasUnsavedChanges(false)
        setTimeout(() => setSuccess(''), 3000)
        // Reload data to get updated IDs
        await loadHomePageData()
      } else {
        setError(response.message || 'Failed to save home page data')
      }
    } catch (err) {
      setError('Failed to save home page data: ' + (err.message || 'Unknown error'))
      console.error('Error saving home page data:', err)
    } finally {
      setSaving(false)
    }
  }

  const updatePageData = (field, value) => {
    setHomePageData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear any previous success messages when user starts editing
    if (success) {
      setSuccess('')
    }
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
  }

  const updateSection = (sectionId, field, value) => {
    setHomePageData(prev => ({
      ...prev,
      featuredSections: prev.featuredSections.map(section => 
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    }))
    // Clear any previous success messages when user starts editing
    if (success) {
      setSuccess('')
    }
    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
  }

  const handleImageUpload = async (sectionId, file) => {
    try {
      setUploadingImage(sectionId)
      setError('')
      
      console.log('Starting image upload for section:', sectionId, 'File:', file.name)
      
      // Validate file
      if (!file) {
        setError('No file selected')
        return
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) must be less than 10MB`)
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError(`File type "${file.type}" not allowed. Only JPEG, PNG, GIF, and WebP images are allowed`)
        return
      }
      
      console.log('File validation passed, uploading...')
      const response = await api.uploadHomePageImage(file)
      console.log('Upload response:', response)
      
      if (response.success) {
        const imageUrl = response.imageUrl
        console.log('Image uploaded successfully:', imageUrl)
        updateSection(sectionId, 'image', imageUrl)
        setSuccess(`Image "${file.name}" uploaded successfully!`)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorMsg = response.message || 'Failed to upload image'
        console.error('Upload failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      const errorMsg = 'Failed to upload image: ' + (err.message || 'Unknown error')
      console.error('Upload error:', err)
      setError(errorMsg)
    } finally {
      setUploadingImage(null)
    }
  }

  const removeImage = async (sectionId) => {
    try {
      const section = homePageData.featuredSections.find(s => s.id === sectionId)
      console.log('Removing image for section:', sectionId, 'Current image:', section?.image)
      
      if (section && section.image) {
        // Extract filename from image URL
        const filename = section.image.split('/').pop()
        console.log('Extracted filename:', filename)
        
        if (filename && filename !== section.image) {
          // Only delete if it's a server-hosted image (has filename)
          try {
            console.log('Deleting image from server:', filename)
            await api.deleteHomePageImage(filename)
            console.log('Image deleted from server successfully')
          } catch (err) {
            console.warn('Failed to delete image from server:', err)
          }
        }
      }
      
      updateSection(sectionId, 'image', '')
      setSuccess('Image removed successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error removing image:', err)
      // Still update UI even if server deletion fails
      updateSection(sectionId, 'image', '')
      setError('Failed to remove image, but cleared from form')
      setTimeout(() => setError(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading home page data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Home className="mr-3 h-6 w-6 text-blue-600" />
                Home Page Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your website's home page content and layout
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && !saving && (
                <span className="text-orange-600 text-sm flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-lg disabled:opacity-50 flex items-center ${
                  hasUnsavedChanges 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>How it works:</strong> Only the page title is required. All other fields are optional. 
                Empty sections will be automatically filtered out when saving. You can fill in as much or as little content as you need.
              </p>
            </div>
          </div>
        </div>

        {/* Page Title Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Page Header</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={homePageData.pageTitle}
                onChange={(e) => updatePageData('pageTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter page title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Subtitle <span className="text-gray-400 text-sm">(optional)</span>
              </label>
              <textarea
                value={homePageData.pageSubtitle}
                onChange={(e) => updatePageData('pageSubtitle', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter page subtitle"
              />
            </div>
          </div>
        </div>

        {/* Featured Sections */}
        <div className="space-y-6">
          {homePageData.featuredSections.map((section, index) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Featured Section {index + 1}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    Layout: {section.layout === 'left' ? 'Image Left' : 'Image Right'}
                  </span>
                  <button
                    onClick={() => updateSection(section.id, 'layout', section.layout === 'left' ? 'right' : 'left')}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                  >
                    Switch Layout
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Upload Section */}
                <div className={`${section.layout === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {section.image ? (
                      <div className="relative">
                        <img
                          src={section.image.startsWith('http') ? section.image : `http://localhost:4000${section.image}`}
                          alt={section.title || 'Section image'}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Image failed to load:', section.image)
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
                          }}
                        />
                        <button
                          onClick={() => removeImage(section.id)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-lg"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {uploadingImage === section.id ? 'Uploading...' : 'Upload Image'}
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  console.log('File selected:', file.name, file.type, file.size)
                                  handleImageUpload(section.id, file)
                                }
                                // Reset the input so the same file can be selected again
                                e.target.value = ''
                              }}
                              disabled={uploadingImage === section.id}
                            />
                          </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG, GIF, WebP up to 10MB
                        </p>
                        {uploadingImage === section.id && (
                          <div className="mt-2 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm text-blue-600">Uploading...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className={`${section.layout === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Section Title <span className="text-gray-400 text-sm">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter section title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-gray-400 text-sm">(optional)</span>
                      </label>
                      <textarea
                        value={section.description}
                        onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter section description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Text <span className="text-gray-400 text-sm">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={section.buttonText}
                          onChange={(e) => updateSection(section.id, 'buttonText', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter button text"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Link <span className="text-gray-400 text-sm">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={section.buttonLink}
                          onChange={(e) => updateSection(section.id, 'buttonLink', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter button link"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 items-center`}>
                    {/* Preview Image */}
                    <div className={`${section.layout === 'right' ? 'lg:order-2' : 'lg:order-1'}`}>
                      {section.image ? (
                        <img
                          src={section.image.startsWith('http') ? section.image : `http://localhost:4000${section.image}`}
                          alt={section.title || 'Section image'}
                          className="w-full h-48 object-cover rounded-lg shadow-sm"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-gray-500 text-sm">No image uploaded</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Preview Content */}
                    <div className={`${section.layout === 'right' ? 'lg:order-1' : 'lg:order-2'}`}>
                      {section.title && (
                        <h4 className="text-xl font-bold text-blue-600 mb-3">
                          {section.title}
                        </h4>
                      )}
                      {section.description && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                      {section.buttonText && (
                        <button className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 flex items-center">
                          {section.buttonText}
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </button>
                      )}
                      {!section.title && !section.description && !section.buttonText && (
                        <div className="text-gray-400 text-center py-8">
                          <p>No content added yet</p>
                          <p className="text-sm">Add title, description, and button text above</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePageManagement
