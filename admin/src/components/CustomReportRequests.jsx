import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Eye, MessageSquare, Trash2 } from 'lucide-react'
import api from '../utils/api'

const STORAGE_KEY = 'custom_report_requests'

const toCSV = (rows) => {
  const headers = ['id','createdAt','name','email','company','industry','requirements','deadline','status','notes']
  const escape = (v='') => (`${v}`.replaceAll('"','""'))
  const lines = [headers.join(',')]
  rows.forEach(r => {
    lines.push([
      r.id, r.createdAt, r.name, r.email, r.company, r.industry, r.requirements, r.deadline || '', r.status, r.notes || ''
    ].map(v => `"${escape(v)}"`).join(','))
  })
  return lines.join('\n')
}

const CustomReportRequests = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequests()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const params = { q: searchTerm }
      if (statusFilter !== 'all') params.status = statusFilter
      const result = await api.getCustomReportRequests(params)
      setRequests(result.items || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests

  const updateStatus = async (id, status) => {
    try {
      await api.updateCustomReportRequest(id, { status })
      loadRequests()
    } catch (err) {
      setError(err.message)
    }
  }

  const updateNotes = async (id, notes) => {
    try {
      await api.updateCustomReportRequest(id, { notes })
      loadRequests()
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteRequest = async (id) => {
    if (!confirm('Delete this request?')) return
    try {
      await api.deleteCustomReportRequest(id)
      loadRequests()
    } catch (err) {
      setError(err.message)
    }
  }

  const exportCSV = () => {
    const csv = toCSV(filteredRequests)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'custom_report_requests.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Report Requests</h1>
        <div className="flex gap-2">
          <button onClick={loadRequests} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search name, email, company, industry, text..." className="px-3 py-2 border rounded" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="awaiting_customer">Awaiting Customer</option>
          <option value="completed">Completed</option>
        </select>
        <a href="/request-report" className="px-3 py-2 border rounded text-center hover:bg-gray-50">Open Public Form</a>
      </div>

      <div className="space-y-4">
        {filteredRequests.map(r => (
          <div key={r._id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{r.name} <span className="text-gray-500 text-sm">({r.company})</span></h3>
                <p className="text-sm text-gray-600">{r.email} • {r.industry || '—'} • {new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <select value={r.status} onChange={e=>updateStatus(r._id, e.target.value)} className="px-2 py-1 border rounded text-sm">
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_customer">Awaiting Customer</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <p className="mt-3 text-gray-700 whitespace-pre-wrap">{r.requirements}</p>
            <div className="mt-3 grid md:grid-cols-2 gap-3 items-center">
              <div className="text-sm text-gray-600">Preferred deadline: {r.deadline || '—'}</div>
              <div className="text-right">
                <a href={`mailto:${r.email}?subject=Re:%20Custom%20Report%20Request&body=Hi%20${encodeURIComponent(r.name)},%0D%0A`} className="text-blue-600 hover:text-blue-800 text-sm">Reply via Email</a>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Internal Notes</label>
              <textarea value={r.notes || ''} onChange={e=>updateNotes(r._id, e.target.value)} rows={2} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
        ))}
        {filteredRequests.length === 0 && (
          <div className="text-center text-gray-500 py-12 border rounded bg-white">No requests found.</div>
        )}
      </div>
    </div>
  )
}

export default CustomReportRequests
