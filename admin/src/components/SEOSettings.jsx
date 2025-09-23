import { useState, useEffect } from 'react'
import { 
  Globe
} from 'lucide-react'

const SEOSettings = ({ formData, onUpdate }) => {
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    slug: '',
    canonicalUrl: '',
    focusKeyword: '',
    altText: '',
    schema: 'Article',
    noIndex: false,
    noFollow: false
  })


  // Initialize SEO data from formData
  useEffect(() => {
    if (formData) {
      setSeoData(prev => ({
        ...prev,
        metaTitle: formData.metaTitle || formData.title || '',
        metaDescription: formData.metaDescription || '',
        metaKeywords: formData.metaKeywords || '',
        slug: formData.slug || generateSlug(formData.title || ''),
        canonicalUrl: formData.canonicalUrl || '',
        focusKeyword: formData.focusKeyword || '',
        altText: formData.altText || '',
        schema: formData.schema || 'Article',
        noIndex: formData.noIndex || false,
        noFollow: formData.noFollow || false
      }))
    }
  }, [formData])


  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  const handleInputChange = (field, value) => {
    const newSeoData = { ...seoData, [field]: value }
    setSeoData(newSeoData)
    
    // Update parent component
    if (onUpdate) {
      onUpdate(newSeoData)
    }
  }


  return (
    <div className="space-y-6">

      {/* Basic SEO Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Basic SEO Settings
        </h3>
        
        <div className="space-y-4">
          {/* Focus Keyword */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Focus Keyword
            </label>
            <input
              type="text"
              value={seoData.focusKeyword}
              onChange={(e) => handleInputChange('focusKeyword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your main keyword"
            />
            <p className="text-xs text-gray-500 mt-1">The main keyword you want this page to rank for</p>
          </div>

          {/* Meta Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={seoData.metaTitle}
              onChange={(e) => handleInputChange('metaTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meta title"
              maxLength="60"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 30-60 characters</p>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={seoData.metaDescription}
              onChange={(e) => handleInputChange('metaDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter meta description"
              rows="3"
              maxLength="160"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 120-160 characters</p>
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Keywords
            </label>
            <input
              type="text"
              value={seoData.metaKeywords}
              onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="keyword1, keyword2, keyword3"
            />
            <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
          </div>

          {/* URL Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                /reports/
              </span>
              <input
                type="text"
                value={seoData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="url-slug"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">URL-friendly version of the title</p>
          </div>

          {/* Canonical URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canonical URL
            </label>
            <input
              type="url"
              value={seoData.canonicalUrl}
              onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/canonical-url"
            />
            <p className="text-xs text-gray-500 mt-1">Preferred URL for this content</p>
          </div>
        </div>
      </div>




    </div>
  )
}

export default SEOSettings
