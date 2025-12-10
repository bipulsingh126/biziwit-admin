import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Calendar,
  User,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Clock,
  Tag,
  Star,
  TrendingUp,
  FileText,
  Image as ImageIcon,
  Download
} from 'lucide-react'

const ReportSettings = ({ formData, onUpdate }) => {
  const [settings, setSettings] = useState({
    status: 'draft',
    publishedAt: '',
    author: '',
    featured: false,
    popular: false,
    visibility: 'public',
    accessLevel: 'free',
    downloadable: true,
    commentsEnabled: true,
    socialSharing: true,
    printable: true,
    language: 'en',
    industry: '',
    reportType: 'market-research',
    pages: '',
    format: 'pdf',
    price: '',
    currency: 'USD',
    validUntil: '',
    version: '1.0',
    lastReviewed: '',
    reviewedBy: '',
    approvalRequired: false,
    autoPublish: false,
    notifySubscribers: false,
    trackAnalytics: true,
    allowIndexing: true
  })

  // Initialize settings from formData
  useEffect(() => {
    if (formData) {
      setSettings(prev => ({
        ...prev,
        status: formData.status || 'draft',
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString().split('T')[0] : '',
        author: formData.author || '',
        featured: formData.featured || false,
        popular: formData.popular || false,
        visibility: formData.visibility || 'public',
        accessLevel: formData.accessLevel || 'free',
        downloadable: formData.downloadable !== false,
        commentsEnabled: formData.commentsEnabled !== false,
        socialSharing: formData.socialSharing !== false,
        printable: formData.printable !== false,
        language: formData.language || 'en',
        industry: formData.industry || '',
        reportType: formData.reportType || 'market-research',
        pages: formData.pages || '',
        format: formData.format || 'pdf',
        price: formData.price || '',
        currency: formData.currency || 'USD',
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString().split('T')[0] : '',
        version: formData.version || '1.0',
        lastReviewed: formData.lastReviewed ? new Date(formData.lastReviewed).toISOString().split('T')[0] : '',
        reviewedBy: formData.reviewedBy || '',
        approvalRequired: formData.approvalRequired || false,
        autoPublish: formData.autoPublish || false,
        notifySubscribers: formData.notifySubscribers || false,
        trackAnalytics: formData.trackAnalytics !== false,
        allowIndexing: formData.allowIndexing !== false
      }))
    }
  }, [formData])

  const handleInputChange = (field, value) => {
    const newSettings = { ...settings, [field]: value }
    setSettings(newSettings)

    // Update parent component
    if (onUpdate) {
      onUpdate(newSettings)
    }
  }

  const reportTypes = [
    { value: 'market-research', label: 'Market Research' },
    { value: 'industry-analysis', label: 'Industry Analysis' },
    { value: 'trend-report', label: 'Trend Report' },
    { value: 'white-paper', label: 'White Paper' },
    { value: 'case-study', label: 'Case Study' },
    { value: 'technical-report', label: 'Technical Report' },
    { value: 'financial-report', label: 'Financial Report' },
    { value: 'survey-report', label: 'Survey Report' }
  ]

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
    'Energy', 'Automotive', 'Aerospace', 'Construction', 'Food & Beverage',
    'Telecommunications', 'Media & Entertainment', 'Education', 'Government',
    'Real Estate', 'Transportation', 'Agriculture', 'Mining', 'Utilities'
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' }
  ]



  return (
    <div className="space-y-6">
      {/* Publishing Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Publishing Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={settings.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publish Date
            </label>
            <input
              type="date"
              value={settings.publishedAt}
              onChange={(e) => handleInputChange('publishedAt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={settings.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Author name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version
            </label>
            <input
              type="text"
              value={settings.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1.0"
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Star className="w-4 h-4 ml-2 mr-1 text-yellow-500" />
            <span className="text-sm text-gray-700">Featured Report</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.popular}
              onChange={(e) => handleInputChange('popular', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <TrendingUp className="w-4 h-4 ml-2 mr-1 text-green-500" />
            <span className="text-sm text-gray-700">Popular Report</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.autoPublish}
              onChange={(e) => handleInputChange('autoPublish', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Clock className="w-4 h-4 ml-2 mr-1 text-blue-500" />
            <span className="text-sm text-gray-700">Auto-publish on scheduled date</span>
          </label>
        </div>
      </div>

      {/* Access & Visibility */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Access & Visibility
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <select
              value={settings.visibility}
              onChange={(e) => handleInputChange('visibility', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="members-only">Members Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Level
            </label>
            <select
              value={settings.accessLevel}
              onChange={(e) => handleInputChange('accessLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="subscription">Subscription</option>
              <option value="one-time-purchase">One-time Purchase</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <div className="flex">
              <select
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="px-3 py-2 border border-gray-300 border-r-0 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
              </select>
              <input
                type="number"
                value={settings.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <input
              type="date"
              value={settings.validUntil}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Report Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Report Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={settings.reportType}
              onChange={(e) => handleInputChange('reportType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={settings.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Pages
            </label>
            <input
              type="number"
              value={settings.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 150"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <select
              value={settings.format}
              onChange={(e) => handleInputChange('format', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="docx">DOCX</option>
              <option value="pptx">PPTX</option>
              <option value="xlsx">XLSX</option>
            </select>
          </div>
        </div>
      </div>

      {/* Features & Permissions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Features & Permissions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.downloadable}
                onChange={(e) => handleInputChange('downloadable', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <Download className="w-4 h-4 ml-2 mr-1" />
              <span className="text-sm text-gray-700">Downloadable</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.printable}
                onChange={(e) => handleInputChange('printable', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <FileText className="w-4 h-4 ml-2 mr-1" />
              <span className="text-sm text-gray-700">Printable</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.socialSharing}
                onChange={(e) => handleInputChange('socialSharing', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <Globe className="w-4 h-4 ml-2 mr-1" />
              <span className="text-sm text-gray-700">Social Sharing</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.commentsEnabled}
                onChange={(e) => handleInputChange('commentsEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700 ml-6">Comments Enabled</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.trackAnalytics}
                onChange={(e) => handleInputChange('trackAnalytics', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700 ml-6">Track Analytics</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowIndexing}
                onChange={(e) => handleInputChange('allowIndexing', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700 ml-6">Allow Search Engine Indexing</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifySubscribers}
                onChange={(e) => handleInputChange('notifySubscribers', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700 ml-6">Notify Subscribers</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.approvalRequired}
                onChange={(e) => handleInputChange('approvalRequired', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="text-sm text-gray-700 ml-6">Approval Required</span>
            </label>
          </div>
        </div>
      </div>

      {/* Review Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Review Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Reviewed
            </label>
            <input
              type="date"
              value={settings.lastReviewed}
              onChange={(e) => handleInputChange('lastReviewed', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reviewed By
            </label>
            <input
              type="text"
              value={settings.reviewedBy}
              onChange={(e) => handleInputChange('reviewedBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Reviewer name"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportSettings
