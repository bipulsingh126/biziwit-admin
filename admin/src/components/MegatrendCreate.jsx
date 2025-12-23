import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, FileText, Globe, Tag } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import api from '../utils/api'
import { getImageUrl } from '../utils/imageUtils'

const MegatrendCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',
    author: '',
    publishedAt: new Date().toISOString().slice(0, 10),
    mainImage: '',
    whitePaperUrl: '',
    homePageVisibility: false,
    titleTag: '',
    url: '',
    metaDescription: '',
    keywords: '',
    content: '',
    status: 'draft',
    category: '',
    subCategory: ''
  })

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load megatrend data if editing
  useEffect(() => {
    loadCategories()
    if (isEditing) {
      loadMegatrend()
    }
  }, [id, isEditing])

  // Auto-hide messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('')
        setError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const loadMegatrend = async () => {
    try {
      setLoading(true)
      const megatrend = await api.getMegatrend(id)
      setFormData({
        title: megatrend.title || '',
        subTitle: megatrend.subTitle || '',
        author: megatrend.author || '',
        publishedAt: megatrend.publishedAt ? new Date(megatrend.publishedAt).toISOString().slice(0, 10) : '',
        mainImage: megatrend.mainImage || megatrend.heroImage?.url || '',
        whitePaperUrl: megatrend.whitePaperUrl || '',
        homePageVisibility: megatrend.homePageVisibility || false,
        titleTag: megatrend.titleTag || '',
        url: megatrend.url || '',
        metaDescription: megatrend.metaDescription || '',
        keywords: megatrend.keywords || '',
        content: megatrend.content || '',
        status: megatrend.status || 'draft',
        category: megatrend.category || '',
        subCategory: megatrend.subCategory || ''
      })

      // If there's a category, set subcategories
      if (megatrend.category) {
        // We need wait for categories to load or do this after loading categories
        // But since we load categories in parallel, we can try to set it here
        // or effectively the handleCategoryChange logic needs to run.
        // Actually, we can just set the subCategory, and when categories load, the user can change it.
        // But to populate the subcategory dropdown correctly *if the user opens the dropdown*, 
        // we need the list.
        // Let's rely on loadCategories completing or add a useEffect dependency.
      }

      // Set image preview if mainImage or heroImage exists
      const imageUrl = megatrend.mainImage || megatrend.heroImage?.url
      if (imageUrl) {
        const fullUrl = getImageUrl(imageUrl)
        setImagePreview(fullUrl)
      }
    } catch (err) {
      setError('Failed to load megatrend: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await api.getCategories()
      setCategories(result.data || [])

      // If editing and we have a category, we need to populate subcategories
      // This might happen after loadMegatrend sets formData
    } catch (err) {
      console.error('Failed to load categories:', err)
      setError('Failed to load categories')
    }
  }

  // Update subcategories when category changes or when data loads
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const category = categories.find(cat => cat.name === formData.category)
      setSubcategories(category?.subcategories || [])
    } else {
      setSubcategories([])
    }
  }, [formData.category, categories])

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value
    setFormData(prev => ({
      ...prev,
      category: selectedCategory,
      subCategory: '' // Reset subcategory when category changes
    }))
  }

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-generate URL from title
    if (field === 'title' && !isEditing) {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
      setFormData(prev => ({ ...prev, url: slug }))
    }
  }

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  // Remove image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, mainImage: '' }))
  }

  // Upload image to server
  const uploadImage = async (megatrendId) => {
    try {
      setUploadingImage(true)

      const result = await api.uploadMegatrendHero(megatrendId, imageFile, `${formData.title || 'Megatrend'} - Hero Image`)

      // Update form data with the image URL
      const imageUrl = result.heroImage?.url || result.imageUrl
      setFormData(prev => ({ ...prev, mainImage: imageUrl }))

      // Update preview with full URL so it persists after reload
      const fullUrl = getImageUrl(imageUrl)

      setImagePreview(fullUrl)
      setImageFile(null) // Clear file input after successful upload
      setSuccess('Image uploaded successfully!')

      return imageUrl
    } catch (err) {
      setError('Failed to upload image: ' + err.message)
      throw err
    } finally {
      setUploadingImage(false)
    }
  }

  // Save megatrend
  const saveMegatrend = async () => {
    try {
      setSaving(true)
      setError('')

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Megatrend title is required')
        return
      }

      if (!formData.author.trim()) {
        setError('Author name is required')
        return
      }

      let savedMegatrend
      let finalFormData = { ...formData }

      // First save the megatrend
      if (isEditing) {
        savedMegatrend = await api.updateMegatrend(id, finalFormData)
        setSuccess('Megatrend updated successfully!')
      } else {
        savedMegatrend = await api.createMegatrend(finalFormData)
        setSuccess('Megatrend created successfully!')
      }

      // Upload image if selected and update the megatrend with image URL
      if (imageFile && savedMegatrend._id) {
        try {
          const imageUrl = await uploadImage(savedMegatrend._id)
          // Update the saved megatrend with the image URL
          await api.updateMegatrend(savedMegatrend._id, { mainImage: imageUrl })
        } catch (imageErr) {
          console.error('Image upload failed:', imageErr)
          // Don't fail the entire save if just image upload fails
        }
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/admin/megatrends')
      }, 1500)

    } catch (err) {
      setError(err.message || 'Failed to save megatrend')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading megatrend...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/megatrends')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Megatrends
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Megatrend' : 'Create New Megatrend'}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <button
                onClick={saveMegatrend}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">


        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-green-800">{success}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="max-w-4xl space-y-8">
            {/* Basic Information */}
            <section id="basic" className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Megatrend Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter megatrend title"
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
                    placeholder="Enter sub title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter author name"
                    required
                  />
                </div>

                {/* Category Dropdowns */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sub Category
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.category}
                  >
                    <option value="">Select Sub Category</option>
                    {subcategories.map((sub, index) => (
                      <option key={sub._id || index} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) => handleInputChange('publishedAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    White Paper URL
                  </label>
                  <input
                    type="url"
                    value={formData.whitePaperUrl}
                    onChange={(e) => handleInputChange('whitePaperUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/whitepaper.pdf"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.homePageVisibility}
                      onChange={(e) => handleInputChange('homePageVisibility', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show on Homepage
                    </span>
                  </label>
                </div>
              </div>

              {/* Main Image Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Megatrend Hero Image</h3>
                  {uploadingImage && (
                    <span className="text-sm text-blue-600 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Uploading image...
                    </span>
                  )}
                </div>

                <div className="max-w-md">
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden hover:border-blue-400 transition-all">
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Megatrend hero preview"
                          className="w-full h-48 object-contain"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={handleRemoveImage}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 shadow-lg"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 cursor-pointer hover:bg-gray-50 transition-colors">
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Upload Megatrend Hero Image</span>
                        <span className="text-xs text-gray-400 mt-1">Max 5MB • JPG, PNG, GIF, WebP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Upload button for selected image */}
                  {imageFile && !uploadingImage && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          if (isEditing && id) {
                            uploadImage(id)
                          } else {
                            setError('Please save the megatrend first, then upload the image')
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Upload Image Now
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Image Tips:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Upload one hero image for your megatrend</li>
                        <li>Image will be displayed prominently on the megatrend page</li>
                        <li>Recommended size: 1200x600 pixels or larger</li>
                        <li>Image will be saved when you click Save/Update</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            {/* SEO Settings */}
            <section id="seo" className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">SEO Settings</h2>

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
                    maxLength="60"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.titleTag.length}/60 characters
                  </p>
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
                    placeholder="url-slug"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Meta description for search engines"
                    maxLength="160"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.metaDescription.length}/160 characters
                  </p>
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
            </section>

            {/* Content */}
            <section id="content" className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Content</h2>

              <RichTextEditor
                value={formData.content}
                onChange={(content) => handleInputChange('content', content)}
                placeholder="Start writing your megatrend content..."
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MegatrendCreate
