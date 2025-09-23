import { useState, useEffect } from 'react'
import { Search, Eye, MessageSquare, Trash2, CheckCircle, Filter, Mail } from 'lucide-react'
import api from '../utils/api'

const Inquiries = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInquiries()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInquiries()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadInquiries = async () => {
    try {
      setLoading(true)
      const params = { q: searchTerm }
      if (statusFilter !== 'all') params.status = statusFilter
      const result = await api.getInquiries(params)
      setInquiries(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredInquiries = inquiries

  const markResolved = async (id) => {
    try {
      await api.updateInquiry(id, { status: 'resolved' })
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: 'resolved' } : i))
    } catch (err) {
      setError(err.message)
    }
  }

  const markOpen = async (id) => {
    try {
      await api.updateInquiry(id, { status: 'open' })
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: 'open' } : i))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Search className="w-6 h-6 mr-2"/>Inquiries</h1>
        <button onClick={loadInquiries} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm inline-flex items-center"><CheckCircle className="w-4 h-4 mr-2"/>Refresh</button>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search name, email, subject, message" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
          <select className="px-3 py-2 border rounded" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
          <div className="text-sm text-gray-500 flex items-center"><Filter className="w-4 h-4 mr-1"/> {filteredInquiries.length} of {inquiries.length} inquiries</div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 mb-4">
          Error: {error}
          <button onClick={loadInquiries} className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm">Retry</button>
        </div>
      )}

      <div className="bg-white border rounded divide-y">
        {filteredInquiries.map(inquiry => (
          <div key={inquiry._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-3 sm:mb-0">
              <div className="font-medium">{inquiry.subject}</div>
              <div className="text-sm text-gray-600">{inquiry.name} • {inquiry.email}</div>
              <div className="mt-2 text-gray-700 text-sm line-clamp-2">{inquiry.message}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${inquiry.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{inquiry.status}</span>
              {inquiry.status === 'open' ? (
                <button onClick={() => markResolved(inquiry._id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Mark Resolved</button>
              ) : (
                <button onClick={() => markOpen(inquiry._id)} className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700">Reopen</button>
              )}
              <a href={`mailto:${inquiry.email}`} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center"><Mail className="w-3.5 h-3.5 mr-1"/>Reply</a>
            </div>
          </div>
        ))}
      </div>

      {filteredInquiries.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No inquiries found</p>
        </div>
      )}
    </div>
  )
}

export default Inquiries
