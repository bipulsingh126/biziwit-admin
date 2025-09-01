import { useEffect, useMemo, useState } from 'react'

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
  const [requests, setRequests] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setRequests(arr.sort((a,b)=> (b.id - a.id)))
    } catch (e) {
      setRequests([])
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return requests.filter(r => {
      const matches = `${r.name} ${r.email} ${r.company} ${r.industry} ${r.requirements}`.toLowerCase().includes(s)
      const statusOk = statusFilter === 'all' || r.status === statusFilter
      return matches && statusOk
    })
  }, [requests, search, statusFilter])

  const updateStatus = (id, status) => {
    const next = requests.map(r => r.id === id ? { ...r, status } : r)
    setRequests(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const updateNotes = (id, notes) => {
    const next = requests.map(r => r.id === id ? { ...r, notes } : r)
    setRequests(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const exportCSV = () => {
    const csv = toCSV(filtered)
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Report Requests</h1>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 border rounded">Refresh</button>
          <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded">Export CSV</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, company, industry, text..." className="px-3 py-2 border rounded" />
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
        {filtered.map(r => (
          <div key={r.id} className="bg-white border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{r.name} <span className="text-gray-500 text-sm">({r.company})</span></h3>
                <p className="text-sm text-gray-600">{r.email} • {r.industry || '—'} • {new Date(r.createdAt).toLocaleString()}</p>
              </div>
              <select value={r.status} onChange={e=>updateStatus(r.id, e.target.value)} className="px-2 py-1 border rounded text-sm">
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
              <textarea value={r.notes || ''} onChange={e=>updateNotes(r.id, e.target.value)} rows={2} className="w-full px-3 py-2 border rounded" />
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-12 border rounded bg-white">No requests found.</div>
        )}
      </div>
    </div>
  )
}

export default CustomReportRequests
