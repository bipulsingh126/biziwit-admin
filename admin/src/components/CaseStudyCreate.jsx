import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, FileText, Globe, Tag } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import api from '../utils/api'
import { getImageUrl } from '../utils/imageUtils'

const CaseStudyCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',

    mainImage: '',
    homePageVisibility: false,
    titleTag: '',
    url: '',
    metaDescription: '',
    keywords: '',
    content: '',
    status: 'draft',
    category: 'Market Intelligence'
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [servicePages, setServicePages] = useState([])

  // Load case study data if editing
  useEffect(() => {
    if (isEditing) {
      loadCaseStudy()
    }
    loadServicePages()
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

  const loadCaseStudy = async () => {
    try {
      setLoading(true)
      const caseStudy = await api.getCaseStudy(id)
      setFormData({
        title: caseStudy.title || '',
        subTitle: caseStudy.subTitle || '',

        mainImage: caseStudy.mainImage || '',
        homePageVisibility: caseStudy.homePageVisibility || false,
        titleTag: caseStudy.titleTag || '',
        url: caseStudy.url || '',
        metaDescription: caseStudy.metaDescription || '',
        keywords: caseStudy.keywords || '',
        content: caseStudy.content || '',
        status: caseStudy.status || 'draft',
        category: caseStudy.category || 'Market Intelligence'
      })

      // Set image preview if mainImage exists
      if (caseStudy.mainImage) {
        const fullUrl = getImageUrl(caseStudy.mainImage)
        setImagePreview(fullUrl)
      }
    } catch (err) {
      setError('Failed to load case study: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadServicePages = async () => {
    try {
      const response = await api.getServicePages()
      setServicePages(response.data || [])
    } catch (err) {
      console.error('Failed to load service pages:', err)
    }
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
  const uploadImage = async (caseStudyId) => {
    try {
      setUploadingImage(true)

      const result = await api.uploadCaseStudyImage(caseStudyId, imageFile, `${formData.title || 'Case Study'} - Main Image`)

      // Update form data with the image URL
      const imageUrl = result.imageUrl
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

  // Save case study
  const saveCaseStudy = async () => {
    try {
      setSaving(true)
      setError('')

      // Validate required fields
      if (!formData.title.trim()) {
        setError('Case study title is required')
        return
      }



      let savedCaseStudy
      let finalFormData = { ...formData }

      // First save the case study
      if (isEditing) {
        savedCaseStudy = await api.updateCaseStudy(id, finalFormData)
        setSuccess('Case study updated successfully!')
      } else {
        savedCaseStudy = await api.createCaseStudy(finalFormData)
        setSuccess('Case study created successfully!')
      }

      // Upload image if selected and update the case study with image URL
      if (imageFile && savedCaseStudy._id) {
        try {
          const imageUrl = await uploadImage(savedCaseStudy._id)
          // Update the saved case study with the image URL
          await api.updateCaseStudy(savedCaseStudy._id, { mainImage: imageUrl })
        } catch (imageErr) {
          console.error('Image upload failed:', imageErr)
          // Don't fail the entire save if just image upload fails
        }
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigate('/admin/case-studies')
      }, 1500)

    } catch (err) {
      setError(err.message || 'Failed to save case study')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading case study...</span>
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
                onClick={() => navigate('/admin/case-studies')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Case Studies
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Edit Case Study' : 'Create New Case Study'}
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
                onClick={saveCaseStudy}
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
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              <a href="#basic" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                <FileText className="w-4 h-4" />
                Basic Information
              </a>
              <a href="#seo" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Globe className="w-4 h-4" />
                SEO Settings
              </a>
              <a href="#content" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                <Tag className="w-4 h-4" />
                Content
              </a>
            </nav>
          </div>
        </div>

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
                    Case Study Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter case study title"
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
                    Category (Service Page) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Market Intelligence">Market Intelligence</option>
                    <option value="Competitive Intelligence">Competitive Intelligence</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="India Market Entry">India Market Entry</option>
                    <option value="Voice of Customer">Voice of Customer</option>
                    <option value="Market Share Gain">Market Share Gain</option>
                    <option value="FTE">FTE</option>
                    <option value="Content Lead">Content Lead</option>
                    <option value="Home Page">Home Page</option>
                  </select>
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
                      Home Page Visibility (Show on homepage)
                    </span>
                  </label>
                </div>
              </div>

              {/* Main Image Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Case Study Image</h3>
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
                          alt="Case study preview"
                          className="w-full h-48 object-cover"
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
                        <span className="text-sm text-gray-500 font-medium">Upload Case Study Image</span>
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
                            setError('Please save the case study first, then upload the image')
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
                        <li>Upload one main image for your case study</li>
                        <li>Image will be displayed prominently on the case study page</li>
                        <li>Recommended size: 800x600 pixels or larger</li>
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
                placeholder="Start writing your case study content..."
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CaseStudyCreate
