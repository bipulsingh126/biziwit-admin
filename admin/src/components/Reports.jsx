import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Search, Filter, Download, Upload, FileText, Table, Plus, Eye, Edit, Trash2, MoreVertical, Share, X, Camera, Image, ExternalLink, CheckCircle, AlertCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
// Removed sanitize-html import (not browser compatible)
import api from '../utils/api'
import { getImageUrl } from '../utils/imageUtils'

// Professional browser-compatible HTML sanitization function with excellent formatting
const sanitizeHtml = (html, options = {}) => {
  const allowedTags = options.allowedTags || ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div', 'span', 'a', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'code', 'pre']
  const allowedAttributes = options.allowedAttributes || {
    'a': ['href', 'title'],
    'img': ['src', 'alt', 'title'],
    'table': ['border', 'cellpadding', 'cellspacing'],
    'td': ['colspan', 'rowspan'],
    'th': ['colspan', 'rowspan']
  }
  
  // If input is empty or null, return empty string
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  // Normalize the HTML first
  html = html
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n\s*\n/g, '\n\n')
  
  // Use DOMParser for better HTML parsing
  let doc
  try {
    const parser = new DOMParser()
    doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  } catch (e) {
    // Fallback to innerHTML method
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    doc = { body: { firstChild: tempDiv } }
  }
  
  const container = doc.body.firstChild
  
  // Function to recursively clean and format elements
  const cleanElement = (element) => {
    if (!element) return
    
    // Remove dangerous tags completely
    const dangerousTags = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'meta', 'base', 'title']
    dangerousTags.forEach(tag => {
      const elements = element.querySelectorAll(tag)
      elements.forEach(el => el.remove())
    })
    
    // Process all elements in reverse order to avoid issues with DOM manipulation
    const allElements = Array.from(element.querySelectorAll('*')).reverse()
    allElements.forEach(el => {
      const tagName = el.tagName.toLowerCase()
      
      // Handle disallowed tags
      if (!allowedTags.includes(tagName)) {
        // Smart tag conversion
        let replacement = null
        
        switch (tagName) {
          case 'b':
          case 'bold':
            replacement = document.createElement('strong')
            break
          case 'i':
          case 'italic':
            replacement = document.createElement('em')
            break
          case 'u':
            replacement = document.createElement('span')
            replacement.style.textDecoration = 'underline'
            break
          case 'center':
            replacement = document.createElement('div')
            replacement.style.textAlign = 'center'
            break
          case 'font':
            replacement = document.createElement('span')
            break
          case 'big':
            replacement = document.createElement('span')
            replacement.style.fontSize = 'larger'
            break
          case 'small':
            replacement = document.createElement('span')
            replacement.style.fontSize = 'smaller'
            break
          default:
            // For unknown tags, preserve content but remove tag
            const isBlock = window.getComputedStyle ? 
              (el.offsetWidth !== undefined && el.offsetHeight !== undefined) :
              ['div', 'p', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav'].includes(tagName)
            replacement = document.createElement(isBlock ? 'div' : 'span')
        }
        
        if (replacement) {
          replacement.innerHTML = el.innerHTML
          el.parentNode.replaceChild(replacement, el)
        }
      } else {
        // Clean attributes for allowed tags
        const allowedAttrs = allowedAttributes[tagName] || []
        const attrs = Array.from(el.attributes)
        
        attrs.forEach(attr => {
          if (!allowedAttrs.includes(attr.name)) {
            el.removeAttribute(attr.name)
          } else {
            // Sanitize attribute values
            if (attr.name === 'href' && attr.value) {
              // Only allow safe protocols
              if (!/^(https?:|mailto:|tel:|#)/.test(attr.value)) {
                el.removeAttribute(attr.name)
              }
            }
          }
        })
      }
    })
  }
  
  // Clean the content
  cleanElement(container)
  
  // Get the cleaned HTML
  let cleanedHtml = container.innerHTML
  
  // Advanced post-processing for professional formatting
  cleanedHtml = cleanedHtml
    // Remove empty elements
    .replace(/<(p|div|span|h[1-6])[^>]*>\s*<\/\1>/gi, '')
    // Fix multiple consecutive line breaks
    .replace(/(<br\s*\/?>){4,}/gi, '<br><br><br>')
    .replace(/(<br\s*\/?>){2,}(?=\s*<(?:p|div|h[1-6]|ul|ol))/gi, '<br>')
    // Ensure proper spacing around block elements
    .replace(/(<\/(?:p|div|h[1-6]|ul|ol|li|blockquote)>)(?!\s*<(?:\/|p|div|h[1-6]|ul|ol|li|blockquote))/gi, '$1\n')
    .replace(/(<(?:p|div|h[1-6]|ul|ol|li|blockquote)[^>]*>)/gi, '\n$1')
    // Clean up list formatting
    .replace(/(<\/li>)(?!\s*<(?:li|\/[uo]l))/gi, '$1\n')
    .replace(/(<li[^>]*>)/gi, '\n  $1')
    // Fix table formatting
    .replace(/(<\/tr>)/gi, '$1\n')
    .replace(/(<tr[^>]*>)/gi, '\n$1')
    .replace(/(<\/t[hd]>)/gi, '$1 ')
    // Clean up extra whitespace but preserve intentional formatting
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    // Ensure proper paragraph spacing
    .replace(/(<\/p>)\s*(<p[^>]*>)/gi, '$1\n\n$2')
    
  return cleanedHtml
}

const Reports = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [showImportModal, setShowImportModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importStats, setImportStats] = useState(null)
  const [importErrors, setImportErrors] = useState([])
  const [duplicateHandling, setDuplicateHandling] = useState('update')
  const [duplicatePreview, setDuplicatePreview] = useState(null)
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState({})
  const [selectedReports, setSelectedReports] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [bulkOperating, setBulkOperating] = useState(false)
  const [uploadingCover, setUploadingCover] = useState({})
  const [parsedData, setParsedData] = useState([])
  const [previewData, setPreviewData] = useState([])
  const [columns, setColumns] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [showPreview, setShowPreview] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const searchTimeoutRef = useRef(null)


  useEffect(() => {
    loadReports()
    loadCategories()
  }, [currentPage, itemsPerPage])

  // Refresh data when user returns to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReports()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

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

  // Handle URL parameters for category/subcategory filtering
  useEffect(() => {
    const category = searchParams.get('category')
    const subCategory = searchParams.get('subCategory')
    
    if (category || subCategory) {
      setFilters(prev => ({
        ...prev,
        category: category || '',
        subCategory: subCategory || ''
      }))
      
      // Show filter panel if filters are applied from URL
      if (category || subCategory) {
        setShowFilter(true)
      }
      
      // Show success message indicating the filter
      if (category && subCategory) {
        setSuccess(`Showing reports for category "${category}" > "${subCategory}"`)
      } else if (category) {
        setSuccess(`Showing reports for category "${category}"`)
      }
      
      // Auto-hide success message
      setTimeout(() => setSuccess(''), 5000)
    }
  }, [searchParams])

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
            'slug': result.items[0].slug,
            '_id': result.items[0]._id,
            'reportDescription': result.items[0].reportDescription,
            'segment': result.items[0].segment,
            'companies': result.items[0].companies,
            'reportCategories': result.items[0].reportCategories,
            'category': result.items[0].category,
            'coverImage': result.items[0].coverImage
          });
        }
        
        // Transform API data to match our UI structure
        const transformedReports = result.items?.map(report => ({
          _id: report._id,
          slug: report.slug || report._id, // Include slug for URL-friendly navigation
          title: report.title,
          subTitle: report.subTitle && report.subTitle.trim() ? report.subTitle : 'N/A',
          summary: report.summary && report.summary.trim() ? report.summary : 'N/A',
          reportDescription: (report.reportDescription && report.reportDescription.trim() !== '') ? report.reportDescription : 
                           (report.description && report.description.trim() !== '') ? report.description : 
                           (report.summary && report.summary.trim() !== '') ? report.summary : 'N/A',
          segment: (report.segmentCompanies && report.segmentCompanies.trim() !== '') ? report.segmentCompanies :
                   (report.segment && report.segment.trim() !== '') ? report.segment : 'N/A',
          companies: (report.companies && report.companies.trim() !== '') ? report.companies : 'N/A',
          reportCategories: (report.reportCategories && report.reportCategories.trim() !== '') ? report.reportCategories : 
                           (report.category && report.category.trim() !== '') ? report.category : 'N/A',
          category: report.category || 'No Category',
          subCategory: report.subCategory || 'No Subcategory',
          domain: report.category || report.domain || report.industry || 'General',
          subDomain: report.subCategory || report.subdomain || report.reportType || 'Research',
          reportDate: report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A',
          publishDate: report.publishDate ? new Date(report.publishDate).toLocaleString() : 'N/A',
          lastUpdated: report.lastUpdated ? new Date(report.lastUpdated).toLocaleString() : new Date(report.updatedAt).toLocaleString(),
          status: report.status === 'published' ? 'Active' : (report.status || 'draft'),
          author: report.author || 'N/A',
          reportCode: report.reportCode || 'N/A',
          region: report.region || 'Global',
          subRegions: report.subRegions || 'N/A',
          pages: report.numberOfPages || 'N/A',
          price: report.price || 'N/A',
          excelPrice: report.excelDatapackPrice || 'N/A',
          singleUserPrice: report.singleUserPrice || 'N/A',
          enterprisePrice: report.enterprisePrice || 'N/A',
          coverImage: report.coverImage || null
        })) || []
        
        // Debug: Log the transformed data
        if (transformedReports.length > 0) {
          console.log('🔍 TRANSFORMED DATA - First report:', transformedReports[0]);
          console.log('🔍 TRANSFORMED CRITICAL FIELDS:', {
            'slug': transformedReports[0].slug,
            '_id': transformedReports[0]._id,
            'reportDescription': transformedReports[0].reportDescription,
            'segment': transformedReports[0].segment,
            'companies': transformedReports[0].companies,
            'reportCategories': transformedReports[0].reportCategories,
            'coverImage': transformedReports[0].coverImage
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

  const handleEdit = (report) => {
    // Always use ID for edit navigation to ensure compatibility
    // The backend route /api/reports/:id handles both slug and ID lookup
    navigate(`/reports/${report._id}/edit`)
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

  const handleView = (report) => {
    // Always use ID for view navigation to ensure compatibility
    // The backend route /api/reports/:id handles both slug and ID lookup
    navigate(`/reports/${report._id}/edit`)
  }

  const handleCoverImageUpload = async (reportId, file) => {
    if (!file) return

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

    try {
      setUploadingCover(prev => ({ ...prev, [reportId]: true }))
      
      const uploadResult = await api.uploadReportCover(reportId, file)
      console.log('Upload result:', uploadResult)
      
      // Update the local state with the new cover image
      setReports(prevReports => 
        prevReports.map(report => 
          report._id === reportId 
            ? { ...report, coverImage: uploadResult.data.coverImage }
            : report
        )
      )
      
      setSuccess('Cover image uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to upload cover image')
    } finally {
      setUploadingCover(prev => ({ ...prev, [reportId]: false }))
    }
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
        'SEGMENT / COMPANIES': 'Enterprise Software Companies: Microsoft, Apple, Google, Amazon, IBM, Oracle, Salesforce',
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
    setShowImportModal(true)
  }

  const handleMigrateSlugs = async () => {
    if (!window.confirm('This will generate slugs for all reports that are missing them. Continue?')) {
      return
    }

    try {
      setIsMigrating(true)
      setError('')
      
      const result = await api.migrateReportSlugs()
      
      if (result.success) {
        setSuccess(`Slug migration completed: ${result.stats.updated} reports updated, ${result.stats.errors} errors`)
        loadReports() // Refresh the list
      } else {
        throw new Error(result.message || 'Migration failed')
      }
    } catch (error) {
      console.error('Migration error:', error)
      setError(`Failed to migrate slugs: ${error.message}`)
    } finally {
      setIsMigrating(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // Convert Excel text to HTML with proper formatting preservation
  const convertToHTML = (text) => {
    if (!text || typeof text !== 'string') return ''
    
    let html = text.trim()
    
    // Clean up Excel formatting
    html = html.replace(/\t/g, ' ') // Replace tabs with spaces
    html = html.replace(/\r/g, '') // Remove carriage returns
    
    // Handle different bullet point styles from Excel
    html = html.replace(/^[•·▪▫◦‣⁃]\s*/gm, '• ')
    html = html.replace(/^[-*]\s*/gm, '• ')
    html = html.replace(/^\u2022\s*/gm, '• ') // Unicode bullet
    html = html.replace(/^\s*•\s*/gm, '• ') // Clean up bullet spacing
    
    // Handle numbered lists from Excel
    html = html.replace(/^(\d+)[\.\)]\s*/gm, '$1. ')
    
    // Split into paragraphs by double line breaks first
    let paragraphs = html.split(/\n\s*\n/).filter(para => para.trim())
    
    // If no double line breaks, treat as single content block
    if (paragraphs.length === 1) {
      paragraphs = [html]
    }
    
    let allFormattedLines = []
    
    paragraphs.forEach((paragraph, paraIndex) => {
      const lines = paragraph.split(/\n/).filter(line => line.trim())
      let formattedLines = []
      let inList = false
      let inNumberedList = false
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim()
        
        if (!trimmedLine) return
        
        // Handle numbered lists (1. 2. 3.)
        if (trimmedLine.match(/^\d+\.\s/)) {
          if (inList && !inNumberedList) {
            formattedLines.push('</ul>')
            inList = false
          }
          if (!inNumberedList) {
            formattedLines.push('<ol>')
            inNumberedList = true
          }
          const content = trimmedLine.replace(/^\d+\.\s*/, '')
          formattedLines.push(`<li>${content}</li>`)
        }
        // Handle bullet points
        else if (trimmedLine.startsWith('•') || trimmedLine.match(/^[-*]\s/)) {
          if (inNumberedList) {
            formattedLines.push('</ol>')
            inNumberedList = false
          }
          if (!inList) {
            formattedLines.push('<ul>')
            inList = true
          }
          const content = trimmedLine.replace(/^[•\-*]\s*/, '')
          formattedLines.push(`<li>${content}</li>`)
        } else {
          // Close any open lists
          if (inList) {
            formattedLines.push('</ul>')
            inList = false
          }
          if (inNumberedList) {
            formattedLines.push('</ol>')
            inNumberedList = false
          }
          
          // Check if it looks like a heading
          const isHeading = (
            trimmedLine.length < 100 && 
            (
              trimmedLine === trimmedLine.toUpperCase() || // ALL CAPS
              trimmedLine.endsWith(':') || // Ends with colon
              (trimmedLine.split(' ').length <= 8 && // Short title
               trimmedLine.split(' ').every(word => word.length > 0 && word[0] === word[0].toUpperCase())) // Title Case
            )
          )
          
          if (isHeading) {
            formattedLines.push(`<h3>${trimmedLine.replace(/:$/, '')}</h3>`)
          } else {
            // For long content, combine multiple lines into paragraphs
            const isLongContent = trimmedLine.length > 50
            if (isLongContent || formattedLines.length === 0 || formattedLines[formattedLines.length - 1].startsWith('<')) {
              formattedLines.push(`<p>${trimmedLine}</p>`)
            } else {
              // Combine with previous paragraph
              const lastIndex = formattedLines.length - 1
              if (formattedLines[lastIndex].startsWith('<p>')) {
                formattedLines[lastIndex] = formattedLines[lastIndex].replace('</p>', ` ${trimmedLine}</p>`)
              } else {
                formattedLines.push(`<p>${trimmedLine}</p>`)
              }
            }
          }
        }
      })
      
      // Close any remaining open lists
      if (inList) {
        formattedLines.push('</ul>')
      }
      if (inNumberedList) {
        formattedLines.push('</ol>')
      }
      
      allFormattedLines.push(...formattedLines)
    })
    
    // Sanitize HTML to ensure safety
    const result = sanitizeHtml(allFormattedLines.join('\n'), {
      allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div'],
      allowedAttributes: {}
    })
    
    console.log('🔄 Converting Excel text to HTML:', {
      original: text.substring(0, 100) + '...',
      converted: result.substring(0, 200) + '...',
      hasHTML: result.includes('<')
    })
    
    return result
  }

  // Column mapping for Excel to database fields
  const fieldMappings = {
    'Report Title': 'title',
    'REPORT TITLE': 'title',
    'Title': 'title',
    'Sub Title': 'subTitle',
    'SUB TITLE': 'subTitle',
    'Subtitle': 'subTitle',
    'Report Overview': 'reportDescription',
    'REPORT OVERVIEW': 'reportDescription',
    'Overview': 'reportDescription',
    'Description': 'reportDescription',
    'Report Description': 'reportDescription',
    'REPORT DESCRIPTION': 'reportDescription',
    'Content': 'reportDescription',
    'CONTENT': 'reportDescription',
    'Summary': 'reportDescription',
    'SUMMARY': 'reportDescription',
    'Executive Summary': 'reportDescription',
    'EXECUTIVE SUMMARY': 'reportDescription',
    'Table of Contents': 'tableOfContents',
    'TABLE OF CONTENTS': 'tableOfContents',
    'TOC': 'tableOfContents',
    'Category': 'category',
    'CATEGORY': 'category',
    'Categories': 'category',
    'Sub Category': 'subCategory',
    'SUB CATEGORY': 'subCategory',
    'Subcategory': 'subCategory',
    'SEGMENT / COMPANIES': 'segmentCompanies',
    'Segment / Companies': 'segmentCompanies',
    'SEGMENT/COMPANIES': 'segmentCompanies',
    'Segment/Companies': 'segmentCompanies',
    // Legacy mappings for backward compatibility
    'Segmentation': 'segment',
    'SEGMENTATION': 'segment',
    'Market Segmentation': 'segment',
    'Companies': 'companies',
    'COMPANIES': 'companies',
    'Company': 'companies',
    'Author': 'author',
    'AUTHOR': 'author',
    'Author Name': 'author',
    'Report Code': 'reportCode',
    'REPORT CODE': 'reportCode',
    'Code': 'reportCode',
    'Pages': 'numberOfPages',
    'PAGES': 'numberOfPages',
    'Number of Pages': 'numberOfPages',
    'Date': 'reportDate',
    'DATE': 'reportDate',
    'Report Date': 'reportDate',
    'Region': 'region',
    'REGION': 'region',
    'Price': 'price',
    'PRICE': 'price',
    'Title Tag': 'titleTag',
    'TITLE TAG': 'titleTag',
    'Meta Title': 'titleTag',
    'URL': 'url',
    'URL SLUG': 'url',
    'Slug': 'url',
    'Meta Description': 'metaDescription',
    'META DESCRIPTION': 'metaDescription',
    'Keywords': 'keywords',
    'KEYWORDS': 'keywords'
  }

  const handleFileSelect = async (file) => {
    // Validate file type
    const validTypes = ['.xlsx', '.xls', '.csv']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!validTypes.includes(fileExtension)) {
      setError('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file')
      return
    }
    
    // Validate file size
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError(`File size (${fileSizeMB}MB) is too large. Please use files smaller than 10MB.`)
      return
    }
    
    setSelectedFile(file)
    setError('')
    
    // Parse the file immediately for preview
    await parseFileForPreview(file)
  }

  const parseFileForPreview = async (file) => {
    try {
      setImportProgress({ status: 'parsing', message: 'Parsing file...', progress: 25 })
      
      let parsedRows = []
      let headers = []
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`CSV parsing error: ${results.errors[0].message}`)
              return
            }
            
            parsedRows = results.data
            headers = Object.keys(parsedRows[0] || {})
            processParseResults(headers, parsedRows)
          },
          error: (error) => {
            setError(`Failed to parse CSV: ${error.message}`)
            setImportProgress(null)
          }
        })
      } else {
        // Parse Excel
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            
            // Convert to JSON with header row
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '',
              blankrows: false
            })
            
            if (jsonData.length < 2) {
              setError('Excel file must have at least a header row and one data row')
              setImportProgress(null)
              return
            }
            
            headers = jsonData[0]
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''))
            
            // Convert to object format
            parsedRows = rows.map(row => {
              const obj = {}
              headers.forEach((header, index) => {
                obj[header] = row[index] || ''
              })
              return obj
            })
            
            processParseResults(headers, parsedRows)
          } catch (err) {
            setError(`Failed to parse Excel file: ${err.message}`)
            setImportProgress(null)
          }
        }
        reader.readAsArrayBuffer(file)
      }
    } catch (err) {
      setError(`File processing error: ${err.message}`)
      setImportProgress(null)
    }
  }

  const processParseResults = (headers, rows) => {
    setColumns(headers)
    setParsedData(rows)
    setPreviewData(rows.slice(0, 5)) // Show first 5 rows for preview
    
    // Generate automatic column mapping
    const mapping = {}
    console.log('🔍 Excel Headers Found:', headers)
    
    headers.forEach(col => {
      const mappedField = fieldMappings[col] || fieldMappings[col.toUpperCase()]
      if (mappedField) {
        mapping[col] = mappedField
        
        // Debug REPORT OVERVIEW mapping
        if (col.toUpperCase().includes('REPORT OVERVIEW') || col.toUpperCase().includes('OVERVIEW')) {
          console.log('✅ REPORT OVERVIEW Column Mapped:', {
            excelColumn: col,
            mappedTo: mappedField,
            availableInFieldMappings: !!fieldMappings[col]
          })
        }
      } else {
        // Debug unmapped columns
        console.log('⚠️ Unmapped column:', col)
      }
    })
    
    console.log('🗺️ Final Column Mapping:', mapping)
    setColumnMapping(mapping)
    
    setImportProgress({ status: 'completed', message: 'File parsed successfully', progress: 100 })
    setShowPreview(true)
    
    // Auto-hide progress after 2 seconds
    setTimeout(() => {
      setImportProgress(null)
    }, 2000)
  }

  const checkForDuplicates = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('checkOnly', 'true')
      
      const result = await api.checkImportDuplicates(formData)
      
      if (result.duplicates && result.duplicates.length > 0) {
        setDuplicatePreview({
          count: result.duplicates.length,
          total: result.totalRecords,
          samples: result.duplicates.slice(0, 5)
        })
        setShowDuplicateOptions(true)
      } else {
        setDuplicatePreview(null)
        setShowDuplicateOptions(false)
      }
    } catch (error) {
      console.log('Duplicate check failed:', error)
      // Continue without duplicate check if API doesn't support it
      setDuplicatePreview(null)
      setShowDuplicateOptions(false)
    }
  }

  const processImport = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError('No data to import. Please select and parse a file first.')
      return
    }
    
    try {
      setIsImporting(true)
      setImportProgress({ 
        status: 'processing', 
        message: `Processing ${parsedData.length} reports...`,
        progress: 25
      })
      
      // Process data for import with HTML formatting
      const processedReports = parsedData.map(row => {
        const processedRow = {}
        
        Object.keys(columnMapping).forEach(excelCol => {
          const dbField = columnMapping[excelCol]
          let value = row[excelCol] || ''
          
          // Debug logging for REPORT OVERVIEW
          if (excelCol.toUpperCase().includes('REPORT OVERVIEW') || excelCol.toUpperCase().includes('OVERVIEW')) {
            console.log('🔍 Processing REPORT OVERVIEW:', {
              excelColumn: excelCol,
              dbField: dbField,
              originalValue: value,
              valueLength: value.length
            })
          }
          
          // Convert rich text fields to HTML
          if (['reportDescription', 'tableOfContents', 'segment', 'companies', 'content'].includes(dbField)) {
            const originalValue = value
            value = convertToHTML(value)
            
            // Debug for rich text conversion
            if (excelCol.toUpperCase().includes('REPORT OVERVIEW') || excelCol.toUpperCase().includes('OVERVIEW')) {
              console.log('🔄 HTML Conversion for REPORT OVERVIEW:', {
                original: originalValue.substring(0, 200),
                converted: value.substring(0, 200),
                dbField: dbField
              })
            }
          }
          
          // Handle special field conversions
          if (dbField === 'numberOfPages' && value) {
            value = parseInt(value) || 1
          }
          
          if (dbField === 'price' && value) {
            value = parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0
          }
          
          if (dbField === 'reportDate' && value) {
            try {
              value = new Date(value).toISOString()
            } catch {
              value = new Date().toISOString()
            }
          }
          
          processedRow[dbField] = value
          
          // Final debug for REPORT OVERVIEW
          if (excelCol.toUpperCase().includes('REPORT OVERVIEW') || excelCol.toUpperCase().includes('OVERVIEW')) {
            console.log('✅ Final REPORT OVERVIEW value:', {
              dbField: dbField,
              finalValue: value.substring(0, 200) + '...'
            })
          }
        })
        
        // Set default values
        processedRow.status = processedRow.status || 'draft'
        processedRow.visibility = processedRow.visibility || 'public'
        processedRow.reportType = processedRow.reportType || 'market-research'
        processedRow.currency = processedRow.currency || 'USD'
        processedRow.format = processedRow.format || 'pdf'
        
        return processedRow
      })
      
      setImportProgress({ 
        status: 'uploading', 
        message: 'Sending data to server...',
        progress: 50
      })
      
      const startTime = Date.now()
      
      // Use the bulk upload endpoint with the original file
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('duplicateHandling', duplicateHandling)
      
      const result = await api.bulkUploadReports(formData)
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)
      
      setImportProgress({ 
        status: 'completed', 
        message: 'Import completed!',
        progress: 100
      })
      
      if (result.success) {
        const { stats } = result
        setImportStats({
          ...stats,
          processingTime,
          fileName: selectedFile.name,
          duplicateHandling
        })
        setImportErrors(result.errorDetails || [])
        
        loadReports() // Refresh the list
        
        let successMessage = `Successfully processed ${stats?.total || 0} records: `
        if (stats?.inserted) successMessage += `${stats.inserted} new, `
        if (stats?.updated) successMessage += `${stats.updated} updated, `
        if (stats?.skipped) successMessage += `${stats.skipped} skipped, `
        if (stats?.duplicates) successMessage += `${stats.duplicates} duplicates handled`
        
        // Add category creation information
        if (result.categories) {
          const { created, subcategoriesCreated } = result.categories
          if (created > 0 || subcategoriesCreated > 0) {
            successMessage += `. Auto-created: ${created} categories, ${subcategoriesCreated} subcategories`
          }
        }
        
        setSuccess(successMessage)
      } else {
        throw new Error(result.message || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportProgress({ status: 'error', message: error.message, progress: 0 })
      setError(`Failed to import reports: ${error.message}`)
    } finally {
      setIsImporting(false)
      // Clear progress after 3 seconds if successful
      if (importProgress?.status === 'completed') {
        setTimeout(() => {
          setImportProgress(null)
          setShowImportModal(false)
          setSelectedFile(null)
          setDuplicatePreview(null)
          setShowDuplicateOptions(false)
        }, 3000)
      }
    }
  }

  const downloadErrorLog = () => {
    if (!importErrors.length) return
    
    const csvContent = [
      'Row,Error,Details',
      ...importErrors.map(error => `${error.row},"${error.error}","${error.details || ''}"`)
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `import_errors_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


  // Missing function: Parse uploaded file
  const parseFile = async (file) => {
    try {
      if (file.type === 'text/csv') {
        // Parse CSV
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors)
            }
            processParseResults(Object.keys(results.data[0] || {}), results.data)
          },
          error: (error) => {
            console.error('CSV parsing error:', error)
            setError('Failed to parse CSV file: ' + error.message)
            setImportProgress(null)
          }
        })
      } else {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          throw new Error('File must contain at least a header row and one data row')
        }
        
        const headers = jsonData[0]
        const rows = jsonData.slice(1).map(row => {
          const obj = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        }).filter(row => Object.values(row).some(val => val && val.toString().trim()))
        
        processParseResults(headers, rows)
      }
      
      // Check for duplicates after parsing
      if (file) {
        await checkForDuplicates(file)
      }
    } catch (error) {
      console.error('File parsing error:', error)
      setError('Failed to parse file: ' + error.message)
      setImportProgress(null)
    }
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          {/* Category Breadcrumb */}
          {(filters.category || filters.subCategory) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <span>Filtered by:</span>
              <div className="flex items-center gap-1">
                {filters.category && (
                  <>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      {filters.category}
                    </span>
                    {filters.subCategory && (
                      <>
                        <span className="text-gray-400">›</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                          {filters.subCategory}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Controls Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-shrink-0">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
              loading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search reports, categories, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80 transition-all ${
                searchTerm ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
              } ${loading ? 'opacity-75' : ''}`}
              disabled={loading}
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
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border rounded-md transition-colors whitespace-nowrap text-sm ${
                showFilter 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
             
            {/* Template & Import Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm"
                disabled={isImporting}
                title="Download Template"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Template</span>
              </button>
              
              <button
                onClick={handleImport}
                disabled={isImporting}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border rounded-md transition-colors whitespace-nowrap text-sm ${
                  isImporting 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                title="Import Excel File"
              >
                {isImporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Import</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Export Button */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap text-sm"
                title="Export Data"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleExport('csv')
                        setShowExportMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        handleExport('excel')
                        setShowExportMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
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
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors whitespace-nowrap font-medium text-sm"
            >
              <span className="text-base leading-none">+</span>
              <span className="hidden sm:inline">Add Report</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
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
                // Clear URL parameters
                setSearchParams({})
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
                    // Clear URL parameters
                    setSearchParams({})
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


      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Table className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Bulk Import Reports</h2>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setSelectedFile(null)
                  setImportProgress(null)
                  setImportStats(null)
                  setImportErrors([])
                  setParsedData([])
                  setPreviewData([])
                  setColumns([])
                  setColumnMapping({})
                  setShowPreview(false)
                  setError('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!importStats ? (
                <>
                  {/* Instructions */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Import Instructions:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Download the template to see the required format</li>
                      <li>• Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Duplicate handling options available below</li>
                    </ul>
                  </div>

                  {/* Duplicate Handling Options */}
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Duplicate Handling:</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          value="update"
                          checked={duplicateHandling === 'update'}
                          onChange={(e) => setDuplicateHandling(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Update Existing</span>
                          <p className="text-sm text-gray-600">Replace existing reports with new data (Recommended)</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          value="skip"
                          checked={duplicateHandling === 'skip'}
                          onChange={(e) => setDuplicateHandling(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Skip Duplicates</span>
                          <p className="text-sm text-gray-600">Keep existing reports, ignore duplicates from Excel</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="duplicateHandling"
                          value="create"
                          checked={duplicateHandling === 'create'}
                          onChange={(e) => setDuplicateHandling(e.target.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-medium text-gray-900">Create New</span>
                          <p className="text-sm text-gray-600">Create new reports even if duplicates exist</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Duplicate Preview */}
                  {duplicatePreview && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <h3 className="font-medium text-yellow-900">
                          {duplicatePreview.count} Potential Duplicate{duplicatePreview.count !== 1 ? 's' : ''} Found
                        </h3>
                      </div>
                      <p className="text-sm text-yellow-800 mb-3">
                        Found {duplicatePreview.count} duplicate{duplicatePreview.count !== 1 ? 's' : ''} out of {duplicatePreview.total} total records.
                      </p>
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium mb-2">Sample duplicates:</p>
                        <ul className="space-y-1 ml-4">
                          {duplicatePreview.samples.map((sample, index) => (
                            <li key={index} className="list-disc">
                              {sample.title || sample.reportCode || `Row ${sample.row}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Template Download */}
                  <div className="mb-6">
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>


                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive
                        ? 'border-blue-400 bg-blue-50'
                        : selectedFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="space-y-3">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-600">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className={`w-12 h-12 mx-auto ${
                          dragActive ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <div>
                          <p className="text-lg font-medium text-gray-900">
                            {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
                          </p>
                          <p className="text-sm text-gray-600">or</p>
                          <button
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = '.xlsx,.xls,.csv'
                              input.onchange = (e) => {
                                if (e.target.files[0]) {
                                  handleFileSelect(e.target.files[0])
                                }
                              }
                              input.click()
                            }}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Browse Files
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {importProgress && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {importProgress.message}
                        </span>
                        {importProgress.status === 'uploading' && (
                          <span className="text-sm text-gray-500">
                            {importProgress.progress || 0}%
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            importProgress.status === 'error'
                              ? 'bg-red-500'
                              : importProgress.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${importProgress.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        setSelectedFile(null)
                        setImportProgress(null)
                        setParsedData([])
                        setPreviewData([])
                        setColumns([])
                        setColumnMapping({})
                        setShowPreview(false)
                        setError('')
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={isImporting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processImport}
                      disabled={!parsedData || parsedData.length === 0 || isImporting || Object.keys(columnMapping).length === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import {parsedData.length || 0} Reports
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* Import Results */
                <div className="space-y-6">
                  {/* Success Summary */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <h3 className="font-medium text-green-900">Import Completed Successfully!</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-green-700 font-medium">Total Records</p>
                        <p className="text-green-900 text-lg font-semibold">{importStats.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">New Reports</p>
                        <p className="text-green-900 text-lg font-semibold">{importStats.inserted || 0}</p>
                      </div>
                      <div>
                        <p className="text-green-700 font-medium">Updated</p>
                        <p className="text-green-900 text-lg font-semibold">{importStats.updated || 0}</p>
                      </div>
                      {importStats.skipped > 0 && (
                        <div>
                          <p className="text-green-700 font-medium">Skipped</p>
                          <p className="text-green-900 text-lg font-semibold">{importStats.skipped}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-green-700 font-medium">Processing Time</p>
                        <p className="text-green-900 text-lg font-semibold">{importStats.processingTime}s</p>
                      </div>
                    </div>
                    {/* Duplicate Handling Summary */}
                    {importStats.duplicateHandling && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Duplicate Handling:</span> 
                          {importStats.duplicateHandling === 'update' && 'Updated existing reports with new data'}
                          {importStats.duplicateHandling === 'skip' && 'Skipped duplicate reports, kept existing data'}
                          {importStats.duplicateHandling === 'create' && 'Created new reports even for duplicates'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Error Summary */}
                  {importErrors.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-600" />
                          <h3 className="font-medium text-yellow-900">
                            {importErrors.length} Error{importErrors.length !== 1 ? 's' : ''} Found
                          </h3>
                        </div>
                        <button
                          onClick={downloadErrorLog}
                          className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          Download Error Log
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {importErrors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-sm text-yellow-800 mb-1">
                            <span className="font-medium">Row {error.row}:</span> {error.error}
                          </div>
                        ))}
                        {importErrors.length > 5 && (
                          <p className="text-sm text-yellow-700 font-medium">
                            ... and {importErrors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        setSelectedFile(null)
                        setImportProgress(null)
                        setImportStats(null)
                        setImportErrors([])
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  Cover Image
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
                  Report Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segment / Companies
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
                  <td className="px-4 py-4">
                    <div className="relative w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      {report.coverImage?.url ? (
                        <img
                          src={getImageUrl(report.coverImage.url)}
                          alt={report.coverImage.alt || report.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', getImageUrl(report.coverImage.url))
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', getImageUrl(report.coverImage.url))
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${report.coverImage?.url ? 'hidden' : 'flex'}`}>
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                        <label className="cursor-pointer p-1 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                          <Camera className="w-4 h-4 text-gray-700" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleCoverImageUpload(report._id, e.target.files[0])}
                            className="hidden"
                            disabled={uploadingCover[report._id]}
                          />
                        </label>
                      </div>
                      {uploadingCover[report._id] && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
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
                    <div className="truncate" title={report.category || 'No Category'}>
                      {report.category || 'No Category'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={report.segmentCompanies || report.segment || 'No Data'}>
                      {report.segmentCompanies || report.segment || 'No Data'}
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
                        onClick={() => handleEdit(report)}
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
                        onClick={() => handleView(report)}
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
