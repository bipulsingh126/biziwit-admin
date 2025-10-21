import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle, AlertCircle, Upload, Image, X } from 'lucide-react'
import api from '../utils/api'
import RichTextEditor from './RichTextEditor'

const ReportCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',
    summary: '',
    content: '',
    tableOfContents: '',
    segmentationContent: '',
    // Backend-compatible fields
    reportDescription: '',
    segment: '',
    // SEO fields
    titleTag: '',
    url: '',
    metaDescription: '',
    keywords: '',
    // Legacy category fields
    category: '',
    subCategory: '',
    // New region field
    region: '',
    // Report details
    author: '',
    publishDate: new Date().toISOString().split('T')[0],
    reportCode: '',
    numberOfPages: '',
    // Pricing fields
    excelDatapackPrice: '',
    singleUserPrice: '',
    enterprisePrice: '',
    internetHandlingCharges: '',
    // Legacy license fields (keeping for compatibility)
    excelDataPackLicense: '',
    singleUserLicense: '',
    enterpriseLicensePrice: '',
    // Status and checkboxes
    status: 'draft',
    trendingReportForHomePage: false
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)

  const categories = [
    'Life Sciences', 'Food and Beverages', 'ICT and Media',
    'Consumer Goods', 'Energy and Power', 'Construction and Manufacturing'
  ]

  const subCategories = {
    'Life Sciences': ['Diagnostics and Biotech', 'Medical Devices and Supplies', 'Pharmaceuticals'],
    'Food and Beverages': ['Food Ingredients', 'Beverages', 'Food Processing'],
    'ICT and Media': ['Software and Services', 'Hardware', 'Telecommunications'],
    'Consumer Goods': ['Home Products', 'Personal Care', 'Apparel'],
    'Energy and Power': ['Equipment and Devices', 'Renewable Energy', 'Oil and Gas'],
    'Construction and Manufacturing': ['Engineering, Equipment and Machinery', 'HVAC', 'Building Materials']
  }

  const regions = [
    'Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America', 
    'Middle East & Africa', 'United States', 'China', 'India', 'Japan'
  ]

  useEffect(() => {
    if (isEdit && id) loadReport()
  }, [id, isEdit])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.getReport(id)
      const report = response.data || response
      
      setFormData({
        title: report.title || '',
        subTitle: report.subTitle || '',
        summary: report.summary || '',
        content: report.content || '',
        tableOfContents: report.tableOfContents || '',
        // Backend-compatible fields
        reportDescription: report.reportDescription || report.content || '',
        segment: report.segment || '',
        segmentationContent: report.segment || report.segmentationContent || '',
        // SEO fields
        titleTag: report.titleTag || '',
        url: report.url || '',
        metaDescription: report.metaDescription || '',
        keywords: report.keywords || '',
        // Legacy category fields
        category: report.category || '',
        subCategory: report.subCategory || '',
        // New region field
        region: report.region || '',
        // Report details
        author: report.author || '',
        publishDate: report.publishDate ? new Date(report.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reportCode: report.reportCode || '',
        numberOfPages: report.numberOfPages || '',
        // Pricing fields
        excelDatapackPrice: report.excelDatapackPrice || '',
        singleUserPrice: report.singleUserPrice || '',
        enterprisePrice: report.enterprisePrice || '',
        internetHandlingCharges: report.internetHandlingCharges || '',
        // Legacy license fields
        excelDataPackLicense: report.excelDataPackLicense || '',
        singleUserLicense: report.singleUserLicense || '',
        enterpriseLicensePrice: report.enterpriseLicensePrice || '',
        // Status and checkboxes
        status: report.status || 'draft',
        trendingReportForHomePage: report.trendingReportForHomePage || false
      })
    } catch (err) {
      setError(err.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    if (error) setError('')
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.category) errors.category = 'Report Category is required'
    if (!formData.subCategory) errors.subCategory = 'Report Sub Category is required'
    if (!formData.region) errors.region = 'Region is required'
    if (!formData.author.trim()) errors.author = 'Author Name is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (status = null) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      const finalStatus = status || formData.status
      
      if (!validateForm()) {
        setError('Please fill in all required fields')
        return
      }
      
      const submitData = {
        title: formData.title.trim(),
        subTitle: formData.subTitle.trim(),
        summary: formData.summary.trim(),
        content: formData.content,
        tableOfContents: formData.tableOfContents,
        // Backend-compatible fields
        reportDescription: formData.reportDescription || formData.content,
        segment: formData.segment || formData.segmentationContent,
        segmentationContent: formData.segment || formData.segmentationContent,
        // SEO fields
        titleTag: formData.titleTag.trim(),
        url: formData.url.trim(),
        metaDescription: formData.metaDescription.trim(),
        keywords: formData.keywords.trim(),
        // Legacy category fields
        category: formData.category,
        subCategory: formData.subCategory,
        // New region field
        region: formData.region,
        // Report details
        author: formData.author.trim(),
        publishDate: formData.publishDate,
        reportCode: formData.reportCode.trim(),
        numberOfPages: formData.numberOfPages ? parseInt(formData.numberOfPages) : 1,
        // Pricing fields
        excelDatapackPrice: formData.excelDatapackPrice.trim(),
        singleUserPrice: formData.singleUserPrice.trim(),
        enterprisePrice: formData.enterprisePrice.trim(),
        internetHandlingCharges: formData.internetHandlingCharges.trim(),
        // Legacy license fields
        excelDataPackLicense: formData.excelDataPackLicense.trim(),
        singleUserLicense: formData.singleUserLicense.trim(),
        enterpriseLicensePrice: formData.enterpriseLicensePrice.trim(),
        // Status and checkboxes
        status: finalStatus,
        trendingReportForHomePage: formData.trendingReportForHomePage
      }
      
      if (isEdit) {
        await api.updateReport(id, submitData)
      } else {
        await api.createReport(submitData)
      }
      
      setSuccess(`Report ${isEdit ? 'updated' : 'created'} successfully!`)
      setTimeout(() => navigate('/reports'), 1500)
      
    } catch (err) {
      if (err.message.includes('Validation Error')) {
        setError('Please check your input data and try again')
      } else if (err.message.includes('Duplicate')) {
        setError('A report with this title already exists')
      } else {
        setError(err.message || 'Failed to save report')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryChange = (selectedCategory) => {
    setFormData(prev => ({
      ...prev,
      category: selectedCategory,
      subCategory: '' // Reset subcategory when category changes
    }))
  }

  // Cover Image Functions
  const handleCoverImageSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      
      setCoverImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCoverImageUpload = async () => {
    if (!coverImage || !id) {
      setError('Please select an image and save the report first')
      return
    }

    try {
      setUploadingCover(true)
      await api.uploadReportCover(id, coverImage)
      setSuccess('Cover image uploaded successfully!')
      setCoverImage(null)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to upload cover image')
    } finally {
      setUploadingCover(false)
    }
  }

  const removeCoverImage = () => {
    setCoverImage(null)
    setCoverImagePreview('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Edit Report' : 'Create New Report'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Form Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Report Details</h2>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter report title"
                  disabled={saving}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
              </div>

              {/* Sub Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Sub Title</label>
                <input
                  type="text"
                  value={formData.subTitle}
                  onChange={(e) => handleInputChange('subTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter report sub title"
                  disabled={saving}
                />
              </div>

              {/* SEO Fields Section */}
              <div className="border-t pt-6">
                <h3 className="text-md font-semibold text-gray-900 mb-4">SEO Settings</h3>
                
                {/* Title Tag */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title Tag
                  </label>
                  <input
                    type="text"
                    value={formData.titleTag}
                    onChange={(e) => handleInputChange('titleTag', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter SEO title tag (recommended: 50-60 characters)"
                    disabled={saving}
                    maxLength="60"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.titleTag.length}/60 characters
                  </p>
                </div>

                {/* URL */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter URL slug (e.g., my-report-title)"
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL-friendly version of the title (lowercase, hyphens instead of spaces)
                  </p>
                </div>

                {/* Meta Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter meta description for search engines (recommended: 150-160 characters)"
                    disabled={saving}
                    maxLength="160"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>

                {/* Keywords */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter keywords separated by commas (e.g., market research, technology, analysis)"
                    disabled={saving}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate keywords with commas for better SEO
                  </p>
                </div>
              </div>


              {/* Categories Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {validationErrors.category && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Report Sub Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.subCategory ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={!formData.category || saving}
                  >
                    <option value="">Select sub category</option>
                    {formData.category && subCategories[formData.category]?.map(subCategory => (
                      <option key={subCategory} value={subCategory}>{subCategory}</option>
                    ))}
                  </select>
                  {validationErrors.subCategory && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.subCategory}</p>
                  )}
                </div>
              </div>

              {/* Region and Author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.region ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={saving}
                  >
                    <option value="">Select region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                  {validationErrors.region && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.region}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Author Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.author ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter author name"
                    disabled={saving}
                  />
                  {validationErrors.author && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.author}</p>
                  )}
                </div>
              </div>

              {/* Publish Date, Report Code, Number of Pages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Publish Date</label>
                  <input
                    type="date"
                    value={formData.publishDate}
                    onChange={(e) => handleInputChange('publishDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Code</label>
                  <input
                    type="text"
                    value={formData.reportCode}
                    onChange={(e) => handleInputChange('reportCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated if empty"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pages</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfPages}
                    onChange={(e) => handleInputChange('numberOfPages', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter number of pages"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Pricing Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excel Datapack Price</label>
                  <input
                    type="text"
                    value={formData.excelDatapackPrice}
                    onChange={(e) => handleInputChange('excelDatapackPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$2,999"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Single User Price</label>
                  <input
                    type="text"
                    value={formData.singleUserPrice}
                    onChange={(e) => handleInputChange('singleUserPrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$4,999"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enterprise Price</label>
                  <input
                    type="text"
                    value={formData.enterprisePrice}
                    onChange={(e) => handleInputChange('enterprisePrice', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$9,999"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internet Handling Charges</label>
                  <input
                    type="text"
                    value={formData.internetHandlingCharges}
                    onChange={(e) => handleInputChange('internetHandlingCharges', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$99"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Trending Report Checkbox with Yes/No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Trending Report Check Box for Home Page
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trendingReport"
                      value="yes"
                      checked={formData.trendingReportForHomePage === true}
                      onChange={(e) => handleInputChange('trendingReportForHomePage', true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="trendingReport"
                      value="no"
                      checked={formData.trendingReportForHomePage === false}
                      onChange={(e) => handleInputChange('trendingReportForHomePage', false)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                      disabled={saving}
                    />
                    <span className="text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {formData.trendingReportForHomePage 
                    ? "✓ This report will be displayed as trending on the home page" 
                    : "○ This report will not be displayed as trending on the home page"
                  }
                </div>
              </div>

              {/* Cover Image Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Report Cover Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {coverImagePreview ? (
                    <div className="relative">
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-4 flex items-center gap-3">
                        {isEdit && (
                          <button
                            onClick={handleCoverImageUpload}
                            disabled={uploadingCover}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {uploadingCover ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                Upload Cover
                              </>
                            )}
                          </button>
                        )}
                        <p className="text-sm text-gray-500">
                          {isEdit ? 'Save the report first, then upload cover image' : 'Cover image will be uploaded after saving'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <div className="mb-4">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <Upload className="w-4 h-4" />
                            Choose Cover Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverImageSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">
                        Upload a cover image for your report (Max 5MB, JPG/PNG)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Editor Section */}
          <div className="p-6">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                disabled={saving}
              >
                REPORT OVERVIEW
              </button>
              <button
                onClick={() => setActiveTab('contents')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'contents'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                disabled={saving}
              >
                TABLE OF CONTENTS
              </button>
              <button
                onClick={() => setActiveTab('segmentation')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'segmentation'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                disabled={saving}
              >
                SEGMENTATION
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <RichTextEditor
                  value={formData.reportDescription}
                  onChange={(value) => {
                    handleInputChange('reportDescription', value)
                    handleInputChange('content', value) // Keep backward compatibility
                  }}
                  placeholder="Write your report overview here..."
                  disabled={saving}
                />
              </div>
            )}

            {activeTab === 'contents' && (
              <div>
                <RichTextEditor
                  value={formData.tableOfContents}
                  onChange={(value) => handleInputChange('tableOfContents', value)}
                  placeholder="1. Introduction\n2. Market Analysis\n3. Key Findings\n4. Conclusion"
                  disabled={saving}
                />
              </div>
            )}

            {activeTab === 'segmentation' && (
              <div>
                <RichTextEditor
                  value={formData.segment || formData.segmentationContent}
                  onChange={(value) => {
                    handleInputChange('segment', value)
                    handleInputChange('segmentationContent', value) // Keep backward compatibility
                  }}
                  placeholder="Describe market segments here..."
                  disabled={saving}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportCreate
