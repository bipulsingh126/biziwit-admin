import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Upload, Download, Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import api from '../utils/api'

const Reports = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    subCategory: '',
    status: '',
    author: ''
  })
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [lastExportTime, setLastExportTime] = useState(0)
  const [importProgress, setImportProgress] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [selectedReports, setSelectedReports] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  const searchTimeoutRef = useRef(null)


  useEffect(() => {
    loadReports()
    loadCategories()
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1)
      loadReports()
    }, 1000) // Reduced debounce time for better responsiveness
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
    loadReports()
  }, [filters])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const loadReports = async () => {
    try {
      setLoading(true)
      setError('') // Clear any previous errors
      
      // Try to load from API first, fallback to sample data if API fails
      try {
        const params = {
          q: searchTerm.trim(),
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          ...filters
        }
        
        // Remove empty filter values
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
        })
        const result = await api.getReports(params)
        
        // Debug: Log the first report to see what data we're getting
        if (result.items && result.items.length > 0) {
          console.log('🔍 FRONTEND DEBUG - First report from API:', result.items[0]);
          console.log('🔍 Available fields:', Object.keys(result.items[0]));
          console.log('🔍 CRITICAL FIELDS CHECK:', {
            'reportDescription': result.items[0].reportDescription,
            'segment': result.items[0].segment,
            'companies': result.items[0].companies,
            'reportCategories': result.items[0].reportCategories,
            'category': result.items[0].category
          });
        }
        
        // Transform API data to match our UI structure
        const transformedReports = result.items?.map(report => ({
          _id: report._id,
          title: report.title,
          subTitle: report.subTitle && report.subTitle.trim() ? report.subTitle : 'N/A',
          summary: report.summary && report.summary.trim() ? report.summary : 'N/A',
          reportDescription: (report.reportDescription && report.reportDescription.trim() !== '') ? report.reportDescription : 
                           (report.description && report.description.trim() !== '') ? report.description : 
                           (report.summary && report.summary.trim() !== '') ? report.summary : 'N/A',
          segment: (report.segment && report.segment.trim() !== '') ? report.segment : 'N/A',
          companies: (report.companies && report.companies.trim() !== '') ? report.companies : 'N/A',
          reportCategories: (report.reportCategories && report.reportCategories.trim() !== '') ? report.reportCategories : 
                           (report.category && report.category.trim() !== '') ? report.category : 'N/A',
          domain: report.category || report.domain || report.industry || 'General',
          subDomain: report.subCategory || report.subdomain || report.reportType || 'Research',
          reportDate: report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A',
          publishDate: report.publishDate ? new Date(report.publishDate).toLocaleString() : 'N/A',
          lastUpdated: report.lastUpdated ? new Date(report.lastUpdated).toLocaleString() : new Date(report.updatedAt).toLocaleString(),
          status: report.status === 'published' ? 'Active' : (report.status || 'draft'),
          author: report.author || 'N/A',
          reportCode: report.reportCode || 'N/A',
          region: report.region || 'Global',
          pages: report.numberOfPages || 'N/A',
          price: report.price || 'N/A',
          excelPrice: report.excelDatapackPrice || 'N/A',
          singleUserPrice: report.singleUserPrice || 'N/A',
          enterprisePrice: report.enterprisePrice || 'N/A'
        })) || []
        
        // Debug: Log the transformed data
        if (transformedReports.length > 0) {
          console.log('🔍 TRANSFORMED DATA - First report:', transformedReports[0]);
          console.log('🔍 TRANSFORMED CRITICAL FIELDS:', {
            'reportDescription': transformedReports[0].reportDescription,
            'segment': transformedReports[0].segment,
            'companies': transformedReports[0].companies,
            'reportCategories': transformedReports[0].reportCategories
          });
          console.log('🔍 WHY N/A CHECK - Raw vs Transformed:', {
            'Raw reportDescription': result.items[0].reportDescription,
            'Raw segment': result.items[0].segment,
            'Raw companies': result.items[0].companies,
            'Raw reportCategories': result.items[0].reportCategories,
            'Raw category': result.items[0].category,
            '---TRANSFORMED---': '---',
            'Transformed reportDescription': transformedReports[0].reportDescription,
            'Transformed segment': transformedReports[0].segment,
            'Transformed companies': transformedReports[0].companies,
            'Transformed reportCategories': transformedReports[0].reportCategories
          });
        }
        
        setReports(transformedReports)
        setTotalItems(result.total || 0)
      } catch (apiError) {
        console.error('API call failed:', apiError.message)
        setError(`Failed to load reports: ${apiError.message}`)
        setReports([])
        setTotalItems(0)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const result = await api.getCategories()
      setCategories(result.data || [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleCategoryChange = (selectedCategory) => {
    setFilters(prev => ({ 
      ...prev, 
      category: selectedCategory,
      subCategory: '' // Reset subcategory when category changes
    }))
    
    // Update subcategories based on selected category
    if (selectedCategory) {
      const category = categories.find(cat => cat.name === selectedCategory)
      setSubcategories(category?.subcategories || [])
    } else {
      setSubcategories([])
    }
  }

  const handleEdit = (reportId) => {
    // Navigate to edit page
    navigate(`/reports/${reportId}/edit`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await api.deleteReport(id)
        setSuccess('Report deleted successfully!')
        loadReports()
      } catch (err) {
        setError(err.message || 'Failed to delete report')
      }
    }
  }

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [reportId]: true }))
      
      // Convert display status to backend status
      const backendStatus = newStatus === 'Active' ? 'published' : 'draft'
      
      await api.updateReport(reportId, { status: backendStatus })
      
      // Update the local state immediately for better UX
      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId 
            ? { ...report, status: newStatus }
            : report
        )
      )
      
      setSuccess(`Report status updated to ${newStatus}!`)
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update report status')
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [reportId]: false }))
    }
  }

  const handleView = (reportId) => {
    // Navigate to edit page in view mode (same as edit for now)
    navigate(`/reports/${reportId}/edit`)
  }

  // Checkbox functionality
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([])
      setSelectAll(false)
    } else {
      setSelectedReports(reports.map(report => report._id))
      setSelectAll(true)
    }
  }

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => {
      const newSelected = prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
      
      // Update select all state
      setSelectAll(newSelected.length === reports.length && reports.length > 0)
      
      return newSelected
    })
  }

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      alert('Please select reports to delete')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReports.length} selected reports?`)) {
      return
    }

    setBulkOperating(true)
    try {
      const deletePromises = selectedReports.map(id => api.deleteReport(id))
      await Promise.all(deletePromises)
      
      setSuccess(`Successfully deleted ${selectedReports.length} reports`)
      setSelectedReports([])
      setSelectAll(false)
      loadReports() // Refresh the list
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(`Failed to delete some reports: ${error.message}`)
    } finally {
      setBulkOperating(false)
    }
  }

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedReports.length === 0) {
      alert('Please select reports to update')
      return
    }

    setBulkOperating(true)
    try {
      const updatePromises = selectedReports.map(id => 
        api.updateReport(id, { status: newStatus })
      )
      await Promise.all(updatePromises)
      
      setSuccess(`Successfully updated ${selectedReports.length} reports to ${newStatus}`)
      setSelectedReports([])
      setSelectAll(false)
      loadReports() // Refresh the list
      
      // Auto-dismiss success message
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(`Failed to update some reports: ${error.message}`)
    } finally {
      setBulkOperating(false)
    }
  }

  // Clear selections when reports change
  useEffect(() => {
    setSelectedReports([])
    setSelectAll(false)
  }, [reports])

  const handleExport = async (format = 'csv') => {
    try {
      // Add 5 second delay between exports
      const now = Date.now()
      const timeSinceLastExport = now - lastExportTime
      const minDelay = 5000 // 5 seconds
      
      if (timeSinceLastExport < minDelay) {
        const remainingTime = Math.ceil((minDelay - timeSinceLastExport) / 1000)
        alert(`Please wait ${remainingTime} more seconds before exporting again.`)
        return
      }
      
      setLastExportTime(now)
      setLoading(true)
      
      // Always use backend API to get ALL reports
      const response = await fetch(`/api/reports/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      // Get the blob data
      const blob = await response.blob()
      
      // Create and download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      
      const fileExtension = format === 'excel' ? 'xlsx' : 'csv'
      const mimeType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv'
      
      link.setAttribute('download', `reports_export_all_${new Date().toISOString().split('T')[0]}.${fileExtension}`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
      
      // Show success message
      alert(`Successfully exported all reports in ${format.toUpperCase()} format!`)
      
    } catch (error) {
      setError(`Failed to export reports: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      {
        'Report Title': 'Sample Report Title',
        'Title Meta Tag': 'Sample Sub Title',
        'REPORT OVERVIEW': 'Detailed report description and overview',
        'Table of Contents': 'Chapter 1, Chapter 2, Chapter 3',
        'Summary': 'Sample summary description',
        'Report Category': 'ICT and Media',
        'Report Sub Category': 'Software and Services',
        'CATEGORIES': 'ICT and Media',
        'Category': 'ICT and Media',
        'Sub Category': 'Software and Services',
        'SEGMENTATION': 'Enterprise Software Companies',
        'COMPANIES': 'Microsoft, Apple, Google, Amazon',
        'Region': 'Global',
        'Author Name': 'John Doe',
        'Report Code': 'RPT001',
        'Number of Page': '150',
        'Price': '2500',
        'Excel Datapack Prices': '3500',
        'Single User Prices': '2500',
        'Enterprise License Prices': '5000',
        'Internet Handling Charges': '100',
        'Currency': 'USD',
        'Format': 'PDF',
        'Language': 'English',
        'Industry': 'Information Technology',
        'Report Type': 'Market Research',
        // SEO Fields
        'Title Tag': 'Sample SEO Title Tag for Search Engines',
        'URL Slug': 'sample-report-title',
        'Meta Description': 'This is a sample meta description for SEO purposes, describing the report content.',
        'Keywords': 'market research, technology, analysis, business intelligence'
      }
    ]
    
    const csvHeaders = Object.keys(templateData[0])
    const csvRows = templateData.map(row => 
      csvHeaders.map(header => `"${row[header]}"`).join(',')
    )
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'reports_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = () => {
    // Create file input for bulk import
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // Validate file size (warn for files > 5MB)
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File size (${fileSizeMB}MB) is too large. Please use files smaller than 10MB.`)
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB warning
        const proceed = confirm(`Large file detected (${fileSizeMB}MB). This may take several minutes to process. Continue?`)
        if (!proceed) return
      }
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        setIsImporting(true)
        setImportProgress({ status: 'uploading', message: `Uploading ${file.name} (${fileSizeMB}MB)...` })
        
        const startTime = Date.now()
        const result = await api.importReports(formData)
        const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
        
        setImportProgress({ status: 'completed', message: 'Processing complete!' })
        
        if (result.success) {
          const { stats } = result
          
          if (stats && stats.failed > 0) {
            // Mixed results - show detailed summary
            let message = `Import Summary (${processingTime}s):\n\n`
            message += `📊 Total Records: ${stats.total}\n`
            message += `✅ Successfully Processed: ${stats.inserted + stats.updated}\n`
            message += `  📝 New Records: ${stats.inserted}\n`
            message += `  🔄 Updated Records: ${stats.updated}\n`
            message += `❌ Failed: ${stats.failed}\n`
            message += `⚡ Processing Speed: ${stats.recordsPerSecond} records/sec\n`
            message += `📈 Success Rate: ${stats.successRate}%`
            
            if (result.errors && result.errors.length > 0) {
              console.log('Import errors:', result.errors)
              message += '\n\n🔍 Sample Errors:'
              result.errors.slice(0, 3).forEach((error, index) => {
                message += `\n${index + 1}. Row ${error.row}: ${error.error}`
              })
              
              if (result.errors.length > 3) {
                message += `\n... and ${result.errors.length - 3} more errors (check console)`
              }
            }
            
            alert(message)
          } else {
            // All successful - show success summary
            const message = `🎉 Import Successful! (${processingTime}s)\n\n` +
              `📊 Processed: ${stats?.total || result.inserted} records\n` +
              `📝 New: ${stats?.inserted || result.inserted}\n` +
              `🔄 Updated: ${stats?.updated || 0}\n` +
              `⚡ Speed: ${stats?.recordsPerSecond || 'N/A'} records/sec`
            
            alert(message)
          }
          
          loadReports() // Refresh the list
        } else {
          throw new Error(result.message || 'Import failed')
        }
      } catch (error) {
        console.error('Import error:', error)
        setImportProgress({ status: 'error', message: error.message })
        setError(`Failed to import reports: ${error.message}`)
      } finally {
        setIsImporting(false)
        // Clear progress after 3 seconds
        setTimeout(() => setImportProgress(null), 3000)
      }
    }
    input.click()
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (loading && !isImporting) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error: {error}
          <button onClick={loadReports} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded p-4 text-green-700">
          {success}
          <button 
            onClick={() => setSuccess('')} 
            className="ml-4 text-green-600 hover:text-green-800 font-medium"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              loading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search reports, categories, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80 transition-all ${
                searchTerm ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
              } ${loading ? 'opacity-75' : ''}`}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                ×
              </button>
            )}
            {loading && searchTerm && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Filter Button */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            FILTER
          </button>
          
          {/* Import Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isImporting}
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                isImporting 
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </div>
          
          {/* Export Button */}
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              EXPORT
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleExport('csv')
                      setShowExportMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      handleExport('excel')
                      setShowExportMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as Excel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Add New Report Button */}
          <button 
            onClick={() => navigate('/reports/create')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ADD NEW REPORT
          </button>
        </div>
      </div>

      {/* Import Progress Indicator */}
      {importProgress && (
        <div className="mx-6 mb-4">
          <div className={`p-4 rounded-lg border ${
            importProgress.status === 'error' 
              ? 'bg-red-50 border-red-200 text-red-700'
              : importProgress.status === 'completed'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-3">
              {importProgress.status === 'uploading' && (
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              )}
              {importProgress.status === 'completed' && (
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              {importProgress.status === 'error' && (
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              <span className="font-medium">{importProgress.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="mx-6 mb-4 bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={filters.subCategory}
                onChange={(e) => setFilters(prev => ({ ...prev, subCategory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!filters.category}
              >
                <option value="">All Subcategories</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory._id} value={subcategory.name}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="published">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Filter by author..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setFilters({ category: '', subCategory: '', status: '', author: '' })
                setSubcategories([])
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {(searchTerm || Object.values(filters).some(f => f)) && (
        <div className="mx-6 mb-4 text-sm text-gray-600">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Searching...
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span>
                Found {totalItems} result{totalItems !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
                {Object.values(filters).some(f => f) && ' with filters applied'}
              </span>
              {(searchTerm || Object.values(filters).some(f => f)) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilters({ category: '', subCategory: '', status: '', author: '' })
                    setSubcategories([])
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Operations Toolbar */}
      {selectedReports.length > 0 && (
        <div className="mx-6 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedReports.length} report{selectedReports.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusChange('published')}
                  disabled={bulkOperating}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperating ? 'Updating...' : 'Mark Active'}
                </button>
                <button
                  onClick={() => handleBulkStatusChange('draft')}
                  disabled={bulkOperating}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperating ? 'Updating...' : 'Mark Draft'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkOperating}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkOperating ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedReports([])
                setSelectAll(false)
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={report._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report._id)}
                      onChange={() => handleSelectReport(report._id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={report.title}>
                      {report.title}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {report.reportCode}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {report.author}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {report.reportDate}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={report.reportCategories}>
                      {report.reportCategories}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                        disabled={updatingStatus[report._id]}
                        className={`appearance-none bg-transparent border-0 text-xs font-medium rounded-full px-2.5 py-0.5 pr-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          report.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        } ${updatingStatus[report._id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="Active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        {updatingStatus[report._id] ? (
                          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(report._id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleView(report._id)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                        title="View"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-700">
                Rows per page{' '}
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </p>
              <p className="text-sm text-gray-700">
                {startItem}-{endItem} of {totalItems}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
