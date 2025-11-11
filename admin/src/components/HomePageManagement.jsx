import React, { useState, useEffect } from 'react'
import { Upload, Save, Image as ImageIcon, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import api from '../utils/api'
import { getImageUrl } from '../utils/imageUtils'

const HomePageManagement = () => {
  // State for homepage data from API
  const [homepageData, setHomepageData] = useState(null)
  const [banners, setBanners] = useState([])
  const [megatrends, setMegatrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Load homepage data from API
  const loadHomepageData = async () => {
    try {
      setLoading(true)
      const response = await api.getHomePage()
      if (response.success) {
        setHomepageData(response.data)
        setBanners(response.data.banners || [])
        setMegatrends(response.data.megatrends || [])
      } else {
        showMessage('error', 'Failed to load homepage data')
      }
    } catch (error) {
      console.error('Error loading homepage data:', error)
      showMessage('error', 'Failed to load homepage data')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    loadHomepageData()
  }, [])

  const updateBannerTitle = async (banner) => {
    try {
      setSaving(true)
      const response = await api.updateBannerBySlug(banner.slug, {
        title: banner.title,
        isActive: banner.isActive
      })
      
      if (response.success) {
        // Update local state
        setBanners(prev => prev.map(b => 
          b.slug === banner.slug ? { ...b, ...response.data } : b
        ))
        showMessage('success', 'Banner updated successfully')
      } else {
        showMessage('error', 'Failed to update banner')
      }
    } catch (error) {
      console.error('Error updating banner:', error)
      showMessage('error', 'Failed to update banner')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (banner, file) => {
    if (!file) return

    try {
      setUploading(prev => ({ ...prev, [banner.slug]: true }))
      const response = await api.uploadBannerImageBySlug(banner.slug, file)
      
      if (response.success) {
        // Update local state with new image URL
        setBanners(prev => prev.map(b => 
          b.slug === banner.slug ? { ...b, image: response.imageUrl } : b
        ))
        showMessage('success', 'Banner image uploaded successfully')
      } else {
        showMessage('error', 'Failed to upload banner image')
      }
    } catch (error) {
      console.error('Error uploading banner image:', error)
      showMessage('error', 'Failed to upload banner image')
    } finally {
      setUploading(prev => ({ ...prev, [banner.slug]: false }))
    }
  }

  const handleImageDelete = async (banner) => {
    if (!window.confirm('Are you sure you want to delete this banner image?')) {
      return
    }

    try {
      setUploading(prev => ({ ...prev, [banner.slug]: true }))
      const response = await api.deleteBannerImageBySlug(banner.slug)
      
      if (response.success) {
        // Update local state
        setBanners(prev => prev.map(b => 
          b.slug === banner.slug ? { ...b, image: '' } : b
        ))
        showMessage('success', 'Banner image deleted successfully')
      } else {
        showMessage('error', 'Failed to delete banner image')
      }
    } catch (error) {
      console.error('Error deleting banner image:', error)
      showMessage('error', 'Failed to delete banner image')
    } finally {
      setUploading(prev => ({ ...prev, [banner.slug]: false }))
    }
  }

  const toggleBannerStatus = async (banner) => {
    try {
      setSaving(true)
      const response = await api.updateBannerBySlug(banner.slug, {
        title: banner.title,
        isActive: !banner.isActive
      })
      
      if (response.success) {
        // Update local state
        setBanners(prev => prev.map(b => 
          b.slug === banner.slug ? { ...b, isActive: !b.isActive } : b
        ))
        showMessage('success', 'Banner status updated successfully')
      } else {
        showMessage('error', 'Failed to update banner status')
      }
    } catch (error) {
      console.error('Error updating banner status:', error)
      showMessage('error', 'Failed to update banner status')
    } finally {
      setSaving(false)
    }
  }

  // Megatrend management functions
  const updateMegatrendData = async (megatrend) => {
    try {
      setSaving(true)
      const response = await api.updateMegatrendBySlug(megatrend.slug, {
        heading: megatrend.heading,
        title: megatrend.title,
        isActive: megatrend.isActive
      })
      
      if (response.success) {
        // Update local state
        setMegatrends(prev => prev.map(m => 
          m.slug === megatrend.slug ? { ...m, ...response.data } : m
        ))
        showMessage('success', 'Megatrend updated successfully')
      } else {
        showMessage('error', 'Failed to update megatrend')
      }
    } catch (error) {
      console.error('Error updating megatrend:', error)
      showMessage('error', 'Failed to update megatrend')
    } finally {
      setSaving(false)
    }
  }

  const handleMegatrendImageUpload = async (megatrend, file) => {
    if (!file) return

    try {
      setUploading(prev => ({ ...prev, [megatrend.slug]: true }))
      const response = await api.uploadMegatrendImageBySlug(megatrend.slug, file)
      
      if (response.success) {
        // Update local state with new image URL
        setMegatrends(prev => prev.map(m => 
          m.slug === megatrend.slug ? { ...m, image: response.imageUrl } : m
        ))
        showMessage('success', 'Megatrend image uploaded successfully')
      } else {
        showMessage('error', 'Failed to upload megatrend image')
      }
    } catch (error) {
      console.error('Error uploading megatrend image:', error)
      showMessage('error', 'Failed to upload megatrend image')
    } finally {
      setUploading(prev => ({ ...prev, [megatrend.slug]: false }))
    }
  }

  const handleMegatrendImageDelete = async (megatrend) => {
    if (!window.confirm('Are you sure you want to delete this megatrend image?')) {
      return
    }

    try {
      setUploading(prev => ({ ...prev, [megatrend.slug]: true }))
      const response = await api.deleteMegatrendImageBySlug(megatrend.slug)
      
      if (response.success) {
        // Update local state
        setMegatrends(prev => prev.map(m => 
          m.slug === megatrend.slug ? { ...m, image: '' } : m
        ))
        showMessage('success', 'Megatrend image deleted successfully')
      } else {
        showMessage('error', 'Failed to delete megatrend image')
      }
    } catch (error) {
      console.error('Error deleting megatrend image:', error)
      showMessage('error', 'Failed to delete megatrend image')
    } finally {
      setUploading(prev => ({ ...prev, [megatrend.slug]: false }))
    }
  }

  const toggleMegatrendStatus = async (megatrend) => {
    try {
      setSaving(true)
      const response = await api.updateMegatrendBySlug(megatrend.slug, {
        heading: megatrend.heading,
        title: megatrend.title,
        isActive: !megatrend.isActive
      })
      
      if (response.success) {
        // Update local state
        setMegatrends(prev => prev.map(m => 
          m.slug === megatrend.slug ? { ...m, isActive: !m.isActive } : m
        ))
        showMessage('success', 'Megatrend status updated successfully')
      } else {
        showMessage('error', 'Failed to update megatrend status')
      }
    } catch (error) {
      console.error('Error updating megatrend status:', error)
      showMessage('error', 'Failed to update megatrend status')
    } finally {
      setSaving(false)
    }
  }

  // Show loading spinner while data is loading
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading homepage data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homepage Management</h1>
          <p className="text-gray-600 mt-1">Manage your website's homepage content and banners</p>
        </div>
        <button
          onClick={loadHomepageData}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Banner Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Banner Management</h2>
            <p className="text-gray-600 mt-1">Configure your homepage banners with images and titles</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {banners.filter(b => b.isActive).length} Active
              </span>
              <span className="mx-2">•</span>
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                {banners.filter(b => b.image).length} With Images
              </span>
            </div>
          </div>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {banners.map((banner, index) => (
            <div key={banner.slug || banner._id} className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
              banner.isActive 
                ? 'border-green-200 bg-green-50/30 shadow-sm' 
                : 'border-gray-200 bg-gray-50/30'
            }`}>
              {/* Banner Header */}
              <div className={`px-4 py-3 border-b ${
                banner.isActive ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Banner {index + 1}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      banner.isActive 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleBannerStatus(banner)}
                    disabled={saving}
                    className={`p-1.5 rounded-full transition-all duration-200 disabled:opacity-50 ${
                      banner.isActive 
                        ? 'text-green-600 hover:bg-green-200 bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-200 bg-gray-100'
                    }`}
                    title={banner.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : banner.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Banner Content */}
              <div className="p-5 space-y-4">
                {/* Image Upload/Display */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                  {uploading[banner.slug] ? (
                    <div className="border-2 border-dashed border-blue-300 rounded-lg h-36 flex items-center justify-center bg-blue-50">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-sm text-blue-600 font-medium">Uploading...</span>
                      </div>
                    </div>
                  ) : banner.image ? (
                    <div className="relative group">
                      <img
                        src={getImageUrl(banner.image)}
                        alt={banner.title}
                        className="w-full h-36 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="flex gap-3">
                          <label className="cursor-pointer p-3 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg">
                            <Upload className="w-5 h-5 text-gray-700" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading[banner.slug]}
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) handleImageUpload(banner, file)
                              }}
                            />
                          </label>
                          <button
                            onClick={() => handleImageDelete(banner)}
                            disabled={uploading[banner.slug]}
                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          Image Added
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-36 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200">
                      <label className="cursor-pointer flex flex-col items-center gap-3 text-gray-500 hover:text-blue-600 transition-colors">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium">Upload Banner Image</span>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading[banner.slug]}
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) handleImageUpload(banner, file)
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Banner Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Banner Title</label>
                  <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => {
                      setBanners(prev => prev.map(b => 
                        b.slug === banner.slug ? { ...b, title: e.target.value } : b
                      ))
                    }}
                    disabled={saving}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                    placeholder="Enter banner title..."
                  />
                </div>

                {/* Update Button */}
                <button
                  onClick={() => updateBannerTitle(banner)}
                  disabled={saving || uploading[banner.slug]}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Updating...' : 'Update Banner'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Megatrend Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Megatrend Management</h2>
            <p className="text-gray-600 mt-1">Configure your homepage megatrends with images, headings and titles</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {megatrends.filter(m => m.isActive).length} Active
              </span>
              <span className="mx-2">•</span>
              <span className="inline-flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                {megatrends.filter(m => m.image).length} With Images
              </span>
            </div>
          </div>
        </div>

        {/* Megatrends Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {megatrends.map((megatrend, index) => (
            <div key={megatrend.slug || megatrend._id} className={`border-2 rounded-xl overflow-hidden transition-all duration-200 ${
              megatrend.isActive 
                ? 'border-blue-200 bg-blue-50/30 shadow-sm' 
                : 'border-gray-200 bg-gray-50/30'
            }`}>
              {/* Megatrend Header */}
              <div className={`px-4 py-3 border-b ${
                megatrend.isActive ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">Megatrend {index + 1}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      megatrend.isActive 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {megatrend.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleMegatrendStatus(megatrend)}
                    disabled={saving}
                    className={`p-1.5 rounded-full transition-all duration-200 disabled:opacity-50 ${
                      megatrend.isActive 
                        ? 'text-blue-600 hover:bg-blue-200 bg-blue-100' 
                        : 'text-gray-400 hover:bg-gray-200 bg-gray-100'
                    }`}
                    title={megatrend.isActive ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : megatrend.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Megatrend Content */}
              <div className="p-5 space-y-4">
                {/* Image Upload/Display */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Megatrend Image</label>
                  {uploading[megatrend.slug] ? (
                    <div className="border-2 border-dashed border-orange-300 rounded-lg h-36 flex items-center justify-center bg-orange-50">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                        <span className="text-sm text-orange-600 font-medium">Uploading...</span>
                      </div>
                    </div>
                  ) : megatrend.image ? (
                    <div className="relative group">
                      <img
                        src={getImageUrl(megatrend.image)}
                        alt={megatrend.title}
                        className="w-full h-36 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <div className="flex gap-3">
                          <label className="cursor-pointer p-3 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg">
                            <Upload className="w-5 h-5 text-gray-700" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading[megatrend.slug]}
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) handleMegatrendImageUpload(megatrend, file)
                              }}
                            />
                          </label>
                          <button
                            onClick={() => handleMegatrendImageDelete(megatrend)}
                            disabled={uploading[megatrend.slug]}
                            className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                          Image Added
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg h-36 flex items-center justify-center hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200">
                      <label className="cursor-pointer flex flex-col items-center gap-3 text-gray-500 hover:text-orange-600 transition-colors">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <span className="text-sm font-medium">Upload Megatrend Image</span>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading[megatrend.slug]}
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) handleMegatrendImageUpload(megatrend, file)
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Megatrend Heading */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Heading</label>
                  <input
                    type="text"
                    value={megatrend.heading}
                    onChange={(e) => {
                      setMegatrends(prev => prev.map(m => 
                        m.slug === megatrend.slug ? { ...m, heading: e.target.value } : m
                      ))
                    }}
                    disabled={saving}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:opacity-50"
                    placeholder="Enter megatrend heading..."
                  />
                </div>

                {/* Megatrend Title */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={megatrend.title}
                    onChange={(e) => {
                      setMegatrends(prev => prev.map(m => 
                        m.slug === megatrend.slug ? { ...m, title: e.target.value } : m
                      ))
                    }}
                    disabled={saving}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:opacity-50"
                    placeholder="Enter megatrend title..."
                  />
                </div>

                {/* Update Button */}
                <button
                  onClick={() => updateMegatrendData(megatrend)}
                  disabled={saving || uploading[megatrend.slug]}
                  className="w-full px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Updating...' : 'Update Megatrend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default HomePageManagement