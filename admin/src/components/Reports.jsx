import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Upload, Download, Edit, Trash2, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import api from '../utils/api'

const Reports = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [showFilter, setShowFilter] = useState(false)

  // Sample data matching the image structure
  const sampleReports = [
    {
      _id: '1',
      title: 'Global Infectious Disease Molecular Diagnostics Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Life Sciences',
      subDomain: 'Diagnostics and Biotech',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '02:40PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '2',
      title: 'Global Glucose Syrup Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Food and Beverages',
      subDomain: 'Food Ingredients',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '08:36PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '3',
      title: 'Global Industrial Metaverse Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'ICT and Media',
      subDomain: 'Software and Services',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '03:31PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '4',
      title: 'Global Indoor Air Purification Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Consumer Goods',
      subDomain: 'Home Products',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '08:07PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '5',
      title: 'Global Implantable Neurostimulators Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Life Sciences',
      subDomain: 'Medical Devices and Supplies',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '02:06PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '6',
      title: 'Global Immersion Cooling Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Energy and Power',
      subDomain: 'Equipment and Devices',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '03:25PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '7',
      title: 'Global Hydraulic Pumps Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Construction and Manufacturing',
      subDomain: 'Engineering, Equipment and Machinery',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '01:56PM, 05/09/2025',
      status: 'Active'
    },
    {
      _id: '8',
      title: 'Global HVAC Accessories Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Construction and Manufacturing',
      subDomain: 'HVAC',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '04:52PM, 08/09/2025',
      status: 'Active'
    },
    {
      _id: '9',
      title: 'Global Household Hand Tools Market Size, Trend & Growth Forecast 2025-2030',
      domain: 'Consumer Goods',
      subDomain: 'Home Products',
      publishDate: '05:09AM 01/09/2025',
      lastUpdated: '05:30PM, 07/09/2025',
      status: 'Active'
    }
  ]

  useEffect(() => {
    loadReports()
  }, [currentPage, itemsPerPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      loadReports()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Try to load from API first, fallback to sample data if API fails
      try {
        const params = {
          q: searchTerm,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        }
        const result = await api.getReports(params)
        
        // Transform API data to match our UI structure
        const transformedReports = result.items?.map(report => ({
          _id: report._id,
          title: report.title,
          domain: report.category || 'N/A',
          subDomain: report.subCategory || 'N/A',
          publishDate: report.publishedAt ? new Date(report.publishedAt).toLocaleString() : 'N/A',
          lastUpdated: report.lastUpdated ? new Date(report.lastUpdated).toLocaleString() : new Date(report.updatedAt).toLocaleString(),
          status: report.status === 'published' ? 'Active' : report.status
        })) || []
        
        setReports(transformedReports)
        setTotalItems(result.total || 0)
      } catch (apiError) {
        console.warn('API call failed, using sample data:', apiError.message)
        
        // Fallback to sample data
        let filteredReports = sampleReports
        if (searchTerm) {
          filteredReports = sampleReports.filter(report => 
            report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.subDomain.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedReports = filteredReports.slice(startIndex, endIndex)
        
        setReports(paginatedReports)
        setTotalItems(filteredReports.length)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reportId) => {
    // Navigate to edit page
    navigate(`/reports/${reportId}/edit`)
  }

  const handleDelete = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await api.deleteReport(reportId)
        // Refresh the reports list
        loadReports()
        // Show success message (you could add a toast notification here)
        console.log('Report deleted successfully')
      } catch (error) {
        setError(`Failed to delete report: ${error.message}`)
      }
    }
  }

  const handleView = (reportId) => {
    // Open report in new tab
    window.open(`/reports/${reportId}`, '_blank')
  }

  const handleExport = () => {
    try {
      // Create CSV content from current reports
      const csvHeaders = ['Report Name', 'Domain', 'Sub Domain', 'Publish Date', 'Last Updated', 'Status']
      const csvRows = reports.map(report => [
        `"${report.title.replace(/"/g, '""')}"`,
        `"${report.domain}"`,
        `"${report.subDomain}"`,
        `"${report.publishDate}"`,
        `"${report.lastUpdated}"`,
        `"${report.status}"`
      ])
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `reports_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      setError(`Failed to export reports: ${error.message}`)
    }
  }

  const handleImport = () => {
    // Create file input for bulk import
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls,.csv'
    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/reports/bulk-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${api.token}`
          },
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('Import failed')
        }
        
        const result = await response.json()
        console.log(`Successfully imported ${result.inserted} reports`)
        loadReports() // Refresh the list
      } catch (error) {
        setError(`Failed to import reports: ${error.message}`)
      }
    }
    input.click()
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  if (loading) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
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
          
          {/* Import Button */}
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            IMPORT
          </button>
          
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            EXPORT
          </button>
          
          {/* Add New Report Button */}
          <button 
            onClick={() => navigate('/reports/create')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ADD NEW REPORT
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publish Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated ↑
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={report._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={report.title}>
                      {report.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.domain}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.subDomain}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.publishDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.lastUpdated}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {report.status}
                    </span>
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
