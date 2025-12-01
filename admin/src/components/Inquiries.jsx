import { useState, useEffect } from 'react'
import { Search, Filter, Trash2, Eye, Clock, Mail, CheckCircle, RefreshCw, X, Phone, Building, User, MessageSquare, Calendar } from 'lucide-react'
import api from '../utils/api'

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedInquiries, setSelectedInquiries] = useState([])
  const [metadata, setMetadata] = useState({ inquiryTypes: [], statuses: [], priorities: [] })
  const [viewingInquiry, setViewingInquiry] = useState(null)

  useEffect(() => {
    loadMetadata()
    loadInquiries()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInquiries()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, typeFilter, priorityFilter])

  const loadMetadata = async () => {
    try {
      const result = await api.getInquiryMetadata()
      setMetadata(result)
    } catch (err) {
      console.error('Failed to load metadata:', err)
      // Set default metadata if API fails
      setMetadata({
        inquiryTypes: [
          'Inquiry Before Buying',
          'Request for Sample',
          'Talk to Analyst/Expert',
          'Buy Now',
          'Contact Us',
          'Submit Your Profile',
          'Download White Paper',
          'Individual Service Page',
          'Other'
        ],
        statuses: ['new', 'open', 'in_progress', 'resolved', 'closed'],
        priorities: ['low', 'medium', 'high', 'urgent']
      })
    }
  }

  const loadInquiries = async () => {
    try {
      setLoading(true)
      setError('') // Clear previous errors

      // Clean up parameters - remove undefined values
      const params = {}
      if (searchTerm && searchTerm.trim()) {
        params.q = searchTerm.trim()
      }
      if (typeFilter && typeFilter !== 'all') {
        params.inquiryType = typeFilter
      }
      if (priorityFilter && priorityFilter !== 'all') {
        params.priority = priorityFilter
      }

      console.log('Loading inquiries with params:', params)
      const result = await api.getInquiries(params)
      console.log('API response:', result)

      if (result && result.items) {
        setInquiries(result.items)
        console.log(`Loaded ${result.items.length} inquiries`)
      } else if (Array.isArray(result)) {
        // Handle case where API returns array directly
        setInquiries(result)
        console.log(`Loaded ${result.length} inquiries (direct array)`)
      } else {
        console.warn('Unexpected API response format:', result)
        setInquiries([])
      }
    } catch (err) {
      console.error('Error loading inquiries:', err)
      setError(err.message || 'Failed to load inquiries')
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked) => {
    setSelectedInquiries(checked ? inquiries.map(i => i._id) : [])
  }

  const handleSelectInquiry = (id, checked) => {
    setSelectedInquiries(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    )
  }

  const updateStatus = async (id, status) => {
    try {
      await api.updateInquiry(id, { status })
      loadInquiries()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleViewInquiry = (inquiry) => {
    setViewingInquiry(inquiry)
  }

  const closeModal = () => {
    setViewingInquiry(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      open: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800'
    }
    return styles[status] || styles.new
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('Manual refresh clicked')
              loadInquiries()
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={async () => {
              console.log('Testing API directly...')
              try {
                const response = await fetch('/api/inquiries', {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  }
                })
                const data = await response.json()
                console.log('Direct API test result:', data)
                alert(`API Test: ${response.status} - Found ${data.items?.length || 0} inquiries`)
              } catch (err) {
                console.error('Direct API test failed:', err)
                alert(`API Test Failed: ${err.message}`)
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Test API
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {metadata.inquiryTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-2" />
            {inquiries.length} inquiries {loading && '(Loading...)'} {error && '(Error!)'}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
          Error: {error}
          <button onClick={loadInquiries} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInquiries.length === inquiries.length && inquiries.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiry Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiry Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page/Report Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading inquiries...</p>
                  </td>
                </tr>
              ) : inquiries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    No inquiries found
                  </td>
                </tr>
              ) : (
                inquiries.map(inquiry => (
                  <tr key={inquiry._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedInquiries.includes(inquiry._id)}
                        onChange={(e) => handleSelectInquiry(inquiry._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {inquiry.inquiryNumber || `INQ-${inquiry._id.slice(-6)}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inquiry.inquiryType || 'General Inquiry'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inquiry.pageReportTitle || inquiry.subject || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {inquiry.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inquiry.company || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:text-blue-800">
                        {inquiry.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(inquiry.status)}`}>
                        {inquiry.status?.replace('_', ' ').toUpperCase() || 'NEW'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInquiry(inquiry)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View Full Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStatus(inquiry._id, inquiry.status === 'resolved' ? 'open' : 'resolved')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Toggle Status"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Inquiry Modal */}
      {viewingInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Inquiry Details - {viewingInquiry.inquiryNumber || `INQ-${viewingInquiry._id.slice(-6)}`}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Inquiry Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Inquiry Type</label>
                  <p className="text-gray-900 font-medium">{viewingInquiry.inquiryType || 'General Inquiry'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusBadge(viewingInquiry.status)}`}>
                    {viewingInquiry.status?.replace('_', ' ').toUpperCase() || 'NEW'}
                  </span>
                </div>
              </div>

              {/* Page/Report Title */}
              {viewingInquiry.pageReportTitle && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Page/Report Title</label>
                  <p className="text-gray-900">{viewingInquiry.pageReportTitle}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{viewingInquiry.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <a href={`mailto:${viewingInquiry.email}`} className="text-blue-600 hover:text-blue-800">
                        {viewingInquiry.email}
                      </a>
                    </div>
                  </div>

                  {viewingInquiry.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                        <a href={`tel:${viewingInquiry.phone}`} className="text-blue-600 hover:text-blue-800">
                          {viewingInquiry.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {viewingInquiry.company && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Company</label>
                        <p className="text-gray-900">{viewingInquiry.company}</p>
                      </div>
                    </div>
                  )}

                  {viewingInquiry.country && (
                    <div className="flex items-start gap-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Country</label>
                        <p className="text-gray-900">{viewingInquiry.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {viewingInquiry.message && (
                <div className="border-t pt-4">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-500 mb-2">Message</label>
                      <div className="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
                        {viewingInquiry.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {viewingInquiry.jobTitle && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Job Title</label>
                  <p className="text-gray-900">{viewingInquiry.jobTitle}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Submitted On</label>
                    <p className="text-gray-900">{formatDate(viewingInquiry.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  updateStatus(viewingInquiry._id, viewingInquiry.status === 'resolved' ? 'open' : 'resolved')
                  closeModal()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark as {viewingInquiry.status === 'resolved' ? 'Open' : 'Resolved'}
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inquiries
