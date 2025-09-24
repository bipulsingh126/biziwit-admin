import { useState, useEffect } from 'react'
import { Search, Filter, Download, Trash2, Edit3, Clock, Mail, CheckCircle, RefreshCw } from 'lucide-react'
import api from '../utils/api'

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedInquiries, setSelectedInquiries] = useState([])
  const [metadata, setMetadata] = useState({ inquiryTypes: [], statuses: [], priorities: [] })

  useEffect(() => {
    loadMetadata()
    loadInquiries()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInquiries()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, typeFilter, priorityFilter])

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
      const params = {
        q: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        inquiryType: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined
      }
      const result = await api.getInquiries(params)
      setInquiries(result.items || [])
    } catch (err) {
      setError(err.message)
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

  const handleExport = async () => {
    try {
      const params = {
        q: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        inquiryType: typeFilter !== 'all' ? typeFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined
      }
      
      const response = await api.exportInquiries(params)
      const blob = new Blob([response], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inquiries-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
    }
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
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={loadInquiries}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {metadata.statuses.map(status => (
              <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>

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
            {inquiries.length} inquiries
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
                          onClick={() => updateStatus(inquiry._id, inquiry.status === 'resolved' ? 'open' : 'resolved')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Toggle Status"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Clock className="w-4 h-4" />
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
    </div>
  )
}

export default Inquiries
