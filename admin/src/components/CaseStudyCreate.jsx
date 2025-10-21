import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, ChevronDown, Image, Globe, FileText, Tag, Calendar, User } from 'lucide-react'
import api from '../utils/api'
import RichTextEditor from './RichTextEditor'

const CaseStudyCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',
    authorName: '',
    publishDate: new Date().toISOString().slice(0, 10),
    mainImage: '',
    homePageVisibility: false,
    titleTag: '',
    url: '',
    metaDescription: '',
    keywords: '',
    content: '',
    status: 'draft'
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
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
        authorName: caseStudy.authorName || '',
        publishDate: caseStudy.publishDate ? new Date(caseStudy.publishDate).toISOString().slice(0, 10) : '',
        mainImage: caseStudy.mainImage || '',
        homePageVisibility: caseStudy.homePageVisibility || false,
        titleTag: caseStudy.titleTag || '',
        url: caseStudy.url || '',
        metaDescription: caseStudy.metaDescription || '',
        keywords: caseStudy.keywords || '',
        content: caseStudy.content || '',
        status: caseStudy.status || 'draft'
      })
      setImagePreview(caseStudy.mainImage || '')
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
      
      if (!formData.authorName.trim()) {
        setError('Author name is required')
        return
      }
      
      let savedCaseStudy
      if (isEditing) {
        savedCaseStudy = await api.updateCaseStudy(id, formData)
        setSuccess('Case study updated successfully!')
      } else {
        savedCaseStudy = await api.createCaseStudy(formData)
        setSuccess('Case study created successfully!')
      }
      
      // Upload image if selected
      if (imageFile && savedCaseStudy._id) {
        await api.uploadCaseStudyImage(savedCaseStudy._id, imageFile, formData.title)
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

              {/* Main Image */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-32 w-48 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => {
                        setImagePreview('')
                        setImageFile(null)
                        handleInputChange('mainImage', '')
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove image
                    </button>
                  </div>
                )}
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
