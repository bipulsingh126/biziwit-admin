import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  ChevronDown, 
  FileText, 
  Globe, 
  Settings
} from 'lucide-react'
import api from '../utils/api'
import RichTextEditor from './RichTextEditor'
import SEOSettings from './SEOSettings'
import ReportSettings from './ReportSettings'

const ReportCreate = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subTitle: '',
    description: '',
    category: '',
    subCategory: '',
    excelDataPackLicense: '',
    singleUserLicense: '',
    enterpriseLicensePrice: '',
    content: '',
    status: 'draft',
    // SEO fields
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    focusKeyword: '',
    altText: '',
    schema: 'Article',
    noIndex: false,
    noFollow: false
  })

  // UI state
  const [activeTab, setActiveTab] = useState('overview')
  const [activeSidebarItem, setActiveSidebarItem] = useState('report')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Categories data (you can fetch this from API)
  const categories = [
    'Life Sciences',
    'Food and Beverages', 
    'ICT and Media',
    'Consumer Goods',
    'Energy and Power',
    'Construction and Manufacturing'
  ]

  const subCategories = {
    'Life Sciences': ['Diagnostics and Biotech', 'Medical Devices and Supplies', 'Pharmaceuticals'],
    'Food and Beverages': ['Food Ingredients', 'Beverages', 'Food Processing'],
    'ICT and Media': ['Software and Services', 'Hardware', 'Telecommunications'],
    'Consumer Goods': ['Home Products', 'Personal Care', 'Apparel'],
    'Energy and Power': ['Equipment and Devices', 'Renewable Energy', 'Oil and Gas'],
    'Construction and Manufacturing': ['Engineering, Equipment and Machinery', 'HVAC', 'Building Materials']
  }

  useEffect(() => {
    if (isEdit) {
      loadReport()
    }
  }, [id])

  const loadReport = async () => {
    try {
      setLoading(true)
      const report = await api.getReport(id)
      setFormData({
        title: report.title || '',
        subTitle: report.subTitle || '',
        description: report.summary || '',
        category: report.category || '',
        subCategory: report.subCategory || '',
        excelDataPackLicense: report.excelDataPackLicense || '',
        singleUserLicense: report.singleUserLicense || '',
        enterpriseLicensePrice: report.enterpriseLicensePrice || '',
        content: report.content || '',
        status: report.status || 'draft'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSEOUpdate = (seoData) => {
    setFormData(prev => ({
      ...prev,
      ...seoData
    }))
  }

  const handleSettingsUpdate = (settingsData) => {
    setFormData(prev => ({
      ...prev,
      ...settingsData
    }))
  }

  const handleSave = async (status = 'draft') => {
    try {
      setSaving(true)
      const dataToSave = {
        ...formData,
        status,
        summary: formData.description
      }

      if (isEdit) {
        await api.updateReport(id, dataToSave)
      } else {
        await api.createReport(dataToSave)
      }

      navigate('/reports')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }


  const sidebarItems = [
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'seo', label: 'SEO', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

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
            <button
              onClick={() => navigate('/reports')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Edit Report' : 'Reports Create'}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'SAVING...' : 'SAVE'}
            </button>
            
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Draft
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSidebarItem(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSidebarItem === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeSidebarItem === 'report' && (
            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter report title"
                      />
                    </div>

                    {/* Sub Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sub Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.subTitle}
                        onChange={(e) => handleInputChange('subTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter sub title"
                      />
                    </div>

                    {/* Report Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter report description"
                      />
                    </div>

                    {/* Categories */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categories <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => {
                            handleInputChange('category', e.target.value)
                            handleInputChange('subCategory', '') // Reset subcategory
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub Categories <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.subCategory}
                          onChange={(e) => handleInputChange('subCategory', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!formData.category}
                        >
                          <option value="">Select sub category</option>
                          {formData.category && subCategories[formData.category]?.map(subCat => (
                            <option key={subCat} value={subCat}>{subCat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* License Fields */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Excel Data Pack License <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.excelDataPackLicense}
                          onChange={(e) => handleInputChange('excelDataPackLicense', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Excel Data Pack License"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Single User License <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.singleUserLicense}
                          onChange={(e) => handleInputChange('singleUserLicense', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Single User License"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enterprise License Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.enterpriseLicensePrice}
                          onChange={(e) => handleInputChange('enterpriseLicensePrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Enterprise License Price"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Editor Section */}
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
                    >
                      TABLE OF CONTENTS
                    </button>
                  </div>

                  {/* Rich Text Editor */}
                  <RichTextEditor
                    value={formData.content}
                    onChange={(value) => handleInputChange('content', value)}
                    placeholder="Start writing your report content..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeSidebarItem === 'seo' && (
            <div className="p-6">
              <SEOSettings 
                formData={formData}
                onUpdate={handleSEOUpdate}
              />
            </div>
          )}

          {activeSidebarItem === 'settings' && (
            <div className="p-6">
              <ReportSettings 
                formData={formData}
                onUpdate={handleSettingsUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportCreate
